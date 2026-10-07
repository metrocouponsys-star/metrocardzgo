"""
Production-Level Financial Loss, Security, Concurrency, and Edge-Case Flow Tests.
Industry standard QA suite testing critical failure points where revenue or data loss occurs.
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta
from app.models.member import Member, MemberOfferState, MembershipTypeOffer
from app.models.offer import OfferTemplate
from app.models.rewards import RewardCatalog, CouponCode, GiftVoucher, PointsRule, LuckyDraw, LuckyDrawEntry
from app.models.card import CardInventoryItem
from app.models.merchant import Merchant, MerchantUser
from app.core.security import hash_password


def test_offer_exhaustion_cannot_double_redeem(client, seeded_merchant, db_session):
    """TEST: An offer with remaining_qty=1 can only be redeemed once. A second redemption must fail."""
    # Login
    login_resp = client.post("/api/v1/auth/login", json={"phone": "9999999999", "password": "password123"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Member
    m_resp = client.post(
        "/api/v1/members",
        json={"name": "Alice", "phone": "9811111111", "membership_type_id": seeded_merchant["membership_type"].id},
        headers=headers,
    )
    member_id = m_resp.json()["id"]

    # Create Offer Template with limit 1
    tmpl = OfferTemplate(
        id="offer-limited-1",
        merchant_id=seeded_merchant["merchant"].id,
        title="Single Use 50% Off",
        offer_type="percent_off",
        value=Decimal("50"),
        active=True,
    )
    db_session.add(tmpl)
    db_session.flush()

    # Link offer state with qty = 1
    state = MemberOfferState(
        id="state-limited-1",
        member_id=member_id,
        offer_template_id=tmpl.id,
        remaining_qty=Decimal("1"),
        initial_qty=Decimal("1"),
        status="active",
    )
    db_session.add(state)
    db_session.commit()

    # First redemption -> MUST SUCCEED (201)
    r1 = client.post(
        "/api/v1/redemptions",
        json={"member_id": member_id, "offer_state_id": state.id, "amount": 100},
        headers=headers,
    )
    assert r1.status_code == 201

    # Second redemption -> MUST FAIL (400) because state is exhausted
    r2 = client.post(
        "/api/v1/redemptions",
        json={"member_id": member_id, "offer_state_id": state.id, "amount": 100},
        headers=headers,
    )
    assert r2.status_code == 400
    detail = r2.json()["detail"].lower()
    assert "exhausted" in detail or "fully used" in detail


def test_purchase_with_offer_does_not_double_count_points(client, seeded_merchant, db_session):
    """TEST: Recording a purchase with an offer attached must NOT award double points or double visits."""
    login_resp = client.post("/api/v1/auth/login", json={"phone": "9999999999", "password": "password123"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Member starting with 0 points
    member = Member(
        id="mem-double-pts",
        merchant_id=seeded_merchant["merchant"].id,
        membership_type_id=seeded_merchant["membership_type"].id,
        member_code="MC9910",
        public_token="tok-double-pts",
        name="Double Points Test",
        phone="9877777777",
        joined_date=date.today(),
        expiry_date=date.today() + timedelta(days=365),
        loyalty_points=Decimal("0"),
        total_visits=0,
        status="active",
    )
    db_session.add(member)

    # Offer template with 0 loyalty points earn
    tmpl = OfferTemplate(
        id="offer-no-earn",
        merchant_id=seeded_merchant["merchant"].id,
        title="No Earn Offer",
        offer_type="flat_off",
        value=Decimal("50"),
        loyalty_points_earn=0,
        active=True,
    )
    db_session.add(tmpl)
    db_session.flush()

    state = MemberOfferState(
        id="state-no-earn",
        member_id=member.id,
        offer_template_id=tmpl.id,
        remaining_qty=Decimal("5"),
        initial_qty=Decimal("5"),
        status="active",
    )
    db_session.add(state)

    # Configure a points rule: 1 point per 100 spent
    rule = PointsRule(
        id="rule-test-1",
        merchant_id=seeded_merchant["merchant"].id,
        rule_type="per_rupee",
        points_value=Decimal("1"),
        spend_unit=Decimal("100"),
        is_active=True,
    )
    db_session.add(rule)
    db_session.commit()

    # Purchase of 1000 with offer state attached
    # Net amount = 1000. Expected points: (1000 / 100) * 1 = 10 points, visits = 1
    resp = client.post(
        f"/api/v1/members/{member.id}/purchase",
        json={"amount": 1000, "offer_state_id": state.id},
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()

    # Member loyalty points must be exactly 10, NOT 20!
    # Total visits must be exactly 1, NOT 2!
    db_session.refresh(member)
    assert member.total_visits == 1, f"Expected total_visits=1, got {member.total_visits} (DOUBLE COUNT BUG)"
    assert member.loyalty_points == Decimal("10"), f"Expected loyalty_points=10, got {member.loyalty_points} (DOUBLE POINTS BUG)"


def test_reward_claim_insufficient_points_rejected(client, seeded_merchant, db_session):
    """TEST: Member with 50 points cannot claim a reward costing 200 points (financial loss prevention)."""
    login_resp = client.post("/api/v1/auth/login", json={"phone": "9999999999", "password": "password123"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create member with only 50 points
    member = Member(
        id="member-low-pts",
        merchant_id=seeded_merchant["merchant"].id,
        membership_type_id=seeded_merchant["membership_type"].id,
        member_code="MC9901",
        public_token="token-low-pts",
        name="Bob Low Points",
        phone="9822222222",
        joined_date=date.today(),
        expiry_date=date.today() + timedelta(days=365),
        loyalty_points=Decimal("50"),
        status="active",
    )
    db_session.add(member)

    # Create expensive reward
    reward = RewardCatalog(
        id="reward-exp-1",
        merchant_id=seeded_merchant["merchant"].id,
        name="Free Full Body Massage",
        points_cost=Decimal("200"),
        quantity_available=10,
        is_active=True,
    )
    db_session.add(reward)
    db_session.commit()

    # Attempt claim -> MUST FAIL (400)
    claim_resp = client.post(
        f"/api/v1/rewards/{reward.id}/claim?member_id={member.id}",
        headers=headers,
    )
    assert claim_resp.status_code == 400
    assert "insufficient" in claim_resp.json()["detail"].lower()


def test_reward_claim_out_of_stock_rejected(client, seeded_merchant, db_session):
    """TEST: Member cannot claim an item when quantity_available is 0."""
    login_resp = client.post("/api/v1/auth/login", json={"phone": "9999999999", "password": "password123"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Member with plenty of points
    member = Member(
        id="member-rich",
        merchant_id=seeded_merchant["merchant"].id,
        membership_type_id=seeded_merchant["membership_type"].id,
        member_code="MC9902",
        public_token="token-rich",
        name="Charlie Rich",
        phone="9833333333",
        joined_date=date.today(),
        expiry_date=date.today() + timedelta(days=365),
        loyalty_points=Decimal("1000"),
        status="active",
    )
    db_session.add(member)

    # Out of stock reward
    reward = RewardCatalog(
        id="reward-oos-1",
        merchant_id=seeded_merchant["merchant"].id,
        name="Limited Merchandise",
        points_cost=Decimal("100"),
        quantity_available=0,
        is_active=True,
    )
    db_session.add(reward)
    db_session.commit()

    claim_resp = client.post(
        f"/api/v1/rewards/{reward.id}/claim?member_id={member.id}",
        headers=headers,
    )
    assert claim_resp.status_code == 400
    assert "out of stock" in claim_resp.json()["detail"].lower()


def test_expired_member_cannot_record_purchase(client, seeded_merchant, db_session):
    """TEST: Expired membership cannot record purchase or redeem perks."""
    login_resp = client.post("/api/v1/auth/login", json={"phone": "9999999999", "password": "password123"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    member = Member(
        id="member-expired-1",
        merchant_id=seeded_merchant["merchant"].id,
        membership_type_id=seeded_merchant["membership_type"].id,
        member_code="MC9903",
        public_token="token-expired",
        name="Dave Expired",
        phone="9844444444",
        joined_date=date.today() - timedelta(days=400),
        expiry_date=date.today() - timedelta(days=35),
        loyalty_points=Decimal("100"),
        status="expired",
    )
    db_session.add(member)
    db_session.commit()

    resp = client.post(
        f"/api/v1/members/{member.id}/purchase",
        json={"amount": 500},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "expired" in resp.json()["detail"].lower()


def test_tenant_cross_access_member_update_blocked(client, seeded_merchant, db_session):
    """TEST: Merchant B cannot update or manipulate Merchant A's members (Tenant Isolation)."""
    # Seed Merchant B
    merchant_b = Merchant(
        id="merchant-b-id",
        business_name="Competitor Store B",
        category="Retail",
        plan_tier="Starter",
        whatsapp_number="918888888888",
        status="active",
        secret_salt="salt-b",
    )
    user_b = MerchantUser(
        id="user-b-id",
        merchant_id=merchant_b.id,
        name="Owner B",
        phone="8888888888",
        role="owner",
        password_hash=hash_password("passwordB"),
    )
    db_session.add(merchant_b)
    db_session.add(user_b)

    # Member belonging to Merchant A
    member_a = Member(
        id="member-of-merchant-a",
        merchant_id=seeded_merchant["merchant"].id,
        membership_type_id=seeded_merchant["membership_type"].id,
        member_code="MC9904",
        public_token="token-mem-a",
        name="Protected Customer A",
        phone="9855555555",
        joined_date=date.today(),
        expiry_date=date.today() + timedelta(days=365),
        loyalty_points=Decimal("500"),
        status="active",
    )
    db_session.add(member_a)
    db_session.commit()

    # Login as User B
    login_b = client.post("/api/v1/auth/login", json={"phone": "8888888888", "password": "passwordB"})
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User B attempts to fetch Member A
    get_resp = client.get(f"/api/v1/members/{member_a.id}", headers=headers_b)
    assert get_resp.status_code == 404  # Must be 404 Not Found to prevent data enumeration

    # User B attempts to patch Member A
    patch_resp = client.patch(
        f"/api/v1/members/{member_a.id}",
        json={"name": "Hacked Customer Name"},
        headers=headers_b,
    )
    assert patch_resp.status_code == 404


def test_card_inventory_linking_and_duplicate_guard(client, seeded_merchant, db_session):
    """TEST: Card linking prevents linking the same physical card to two members."""
    login_resp = client.post("/api/v1/auth/login", json={"phone": "9999999999", "password": "password123"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Card allocated to merchant
    card = CardInventoryItem(
        id="card-item-1",
        card_number="1234 5678 9012 3456",
        status="merchant_allocated",
        allocated_merchant_id=seeded_merchant["merchant"].id,
    )
    db_session.add(card)

    m1 = Member(
        id="mem-card-1",
        merchant_id=seeded_merchant["merchant"].id,
        membership_type_id=seeded_merchant["membership_type"].id,
        member_code="MC9905",
        public_token="tok-card-1",
        name="Member One",
        phone="9866666661",
        joined_date=date.today(),
        expiry_date=date.today() + timedelta(days=365),
        status="active",
    )
    m2 = Member(
        id="mem-card-2",
        merchant_id=seeded_merchant["merchant"].id,
        membership_type_id=seeded_merchant["membership_type"].id,
        member_code="MC9906",
        public_token="tok-card-2",
        name="Member Two",
        phone="9866666662",
        joined_date=date.today(),
        expiry_date=date.today() + timedelta(days=365),
        status="active",
    )
    db_session.add_all([m1, m2])
    db_session.commit()

    # Link to member 1 -> Success
    link_resp1 = client.post(f"/api/v1/merchant/cards/{card.id}/link?member_id={m1.id}", headers=headers)
    assert link_resp1.status_code == 200
    assert link_resp1.json()["status"] == "member_linked"

    # Attempt to link same card to member 2 -> Must fail (400)
    link_resp2 = client.post(f"/api/v1/merchant/cards/{card.id}/link?member_id={m2.id}", headers=headers)
    assert link_resp2.status_code == 400
    assert "already linked" in link_resp2.json()["detail"].lower()
