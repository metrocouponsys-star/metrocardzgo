"""
Metro Cardz — API Integration Tests
"""
import pytest
from app.core.security import decode_token


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "Metro Cardz API"}


def test_auth_login_success(client, seeded_merchant):
    response = client.post(
        "/api/v1/auth/login",
        json={"phone": "9999999999", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["phone"] == "9999999999"
    assert data["user"]["merchant_id"] == "test-merchant-id"


def test_auth_login_invalid_password(client, seeded_merchant):
    response = client.post(
        "/api/v1/auth/login",
        json={"phone": "9999999999", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


def test_auth_login_user_not_found(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"phone": "1234567890", "password": "password123"},
    )
    assert response.status_code == 401


def test_member_crud(client, seeded_merchant):
    # Step 1: Login to get token
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"phone": "9999999999", "password": "password123"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Step 2: Create a member
    member_data = {
        "name": "John Doe",
        "phone": "9876543210",
        "membership_type_id": seeded_merchant["membership_type"].id,
    }
    create_resp = client.post(
        "/api/v1/members",
        json=member_data,
        headers=headers,
    )
    assert create_resp.status_code == 201
    member = create_resp.json()
    assert member["name"] == "John Doe"
    assert member["phone"] == "9876543210"
    assert member["member_code"].startswith("MC")

    # Step 3: Search members
    search_resp = client.get(
        "/api/v1/members/search?q=John",
        headers=headers,
    )
    assert search_resp.status_code == 200
    results = search_resp.json()
    assert len(results) >= 1
    assert results[0]["id"] == member["id"]

    # Step 4: Duplicate phone error
    dup_resp = client.post(
        "/api/v1/members",
        json=member_data,
        headers=headers,
    )
    assert dup_resp.status_code == 409
    assert dup_resp.json()["detail"] == "DUPLICATE_PHONE"


def test_suspended_merchant_access_block(client, db_session, seeded_merchant):
    # Step 1: Suspend the merchant in the database
    merchant = seeded_merchant["merchant"]
    merchant.status = "suspended"
    db_session.commit()

    # Step 2: Login should still succeed (returns token)
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"phone": "9999999999", "password": "password123"},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Step 3: Querying an active user endpoint (like GET /members) should return 403 Forbidden
    resp = client.get("/api/v1/members", headers=headers)
    assert resp.status_code == 403
    assert resp.json()["detail"] == "Merchant account is suspended"


def test_tenant_isolation(client, db_session, seeded_merchant):
    # Create another merchant & user (Merchant B)
    from app.models.merchant import Merchant, MerchantUser
    from app.core.security import hash_password

    m_b = Merchant(
        id="merchant-b-id",
        business_name="Merchant B Business",
        category="Gym",
        plan_tier="Starter",
        whatsapp_number="918888888888",
        status="active",
        secret_salt="salt-b",
    )
    db_session.add(m_b)
    db_session.flush()

    user_b = MerchantUser(
        id="user-b-id",
        merchant_id=m_b.id,
        name="Owner B",
        phone="8888888888",
        role="owner",
        password_hash=hash_password("password123"),
    )
    db_session.add(user_b)
    db_session.commit()

    # Login as User A (seeded_merchant)
    login_a = client.post(
        "/api/v1/auth/login",
        json={"phone": "9999999999", "password": "password123"},
    )
    assert login_a.status_code == 200, f"Login A failed: {login_a.text}"
    token_a = login_a.json()["access_token"]

    # Login as User B
    login_b = client.post(
        "/api/v1/auth/login",
        json={"phone": "8888888888", "password": "password123"},
    )
    assert login_b.status_code == 200, f"Login B failed: {login_b.text}"
    token_b = login_b.json()["access_token"]

    # Merchant A creates a member
    resp_create = client.post(
        "/api/v1/members",
        json={
            "name": "Merchant A Member",
            "phone": "7777777777",
            "membership_type_id": seeded_merchant["membership_type"].id,
        },
        headers={"Authorization": f"Bearer {token_a}"},
    )
    member_a_id = resp_create.json()["id"]

    # Merchant B tries to fetch Merchant A's member → should get 404 Not Found
    resp_fetch = client.get(
        f"/api/v1/members/{member_a_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert resp_fetch.status_code == 404


def test_offer_redemption(client, db_session, seeded_merchant):
    from app.models.offer import OfferTemplate
    from app.models.member import MembershipTypeOffer, Member, MemberOfferState
    from datetime import date, timedelta
    from decimal import Decimal

    # Login
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"phone": "9999999999", "password": "password123"},
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create an offer template
    offer = OfferTemplate(
        id="test-offer-id",
        merchant_id=seeded_merchant["merchant"].id,
        title="Free Haircut",
        offer_type="free_service",
        value=Decimal("1"),
        active=True,
    )
    db_session.add(offer)

    # Link offer to membership type
    link = MembershipTypeOffer(
        membership_type_id=seeded_merchant["membership_type"].id,
        offer_template_id=offer.id,
        default_qty=5,
    )
    db_session.add(link)
    db_session.commit()

    # 2. Enroll a member (should automatically get the 5 hair cuts offer)
    create_resp = client.post(
        "/api/v1/members",
        json={
            "name": "Jane Salon",
            "phone": "6666666666",
            "membership_type_id": seeded_merchant["membership_type"].id,
        },
        headers=headers,
    )
    member = create_resp.json()
    member_id = member["id"]

    # Check offer state was created with qty=5
    db_session.expire_all()
    states = db_session.query(MemberOfferState).filter(MemberOfferState.member_id == member_id).all()
    assert len(states) == 1
    assert states[0].remaining_qty == 5
    offer_state_id = states[0].id

    # 3. Redeem 1 haircut
    redeem_resp = client.post(
        "/api/v1/redemptions",
        json={"member_id": member_id, "offer_state_id": offer_state_id},
        headers=headers,
    )
    assert redeem_resp.status_code == 201
    assert redeem_resp.json()["staff_name"] == "Test Owner"

    # Check database remaining qty is now 4
    db_session.expire_all()
    state = db_session.query(MemberOfferState).filter(MemberOfferState.id == offer_state_id).first()
    assert state.remaining_qty == 4

    # 4. Expire the member's membership manually and test redemption failure
    m_row = db_session.query(Member).filter(Member.id == member_id).first()
    m_row.expiry_date = date.today() - timedelta(days=1)
    db_session.commit()

    fail_resp = client.post(
        "/api/v1/redemptions",
        json={"member_id": member_id, "offer_state_id": offer_state_id},
        headers=headers,
    )
    assert fail_resp.status_code == 400
    assert "expired" in fail_resp.json()["detail"].lower()


def test_loyalty_points_earn_and_redeem(client, db_session, seeded_merchant):
    from app.models.offer import OfferTemplate
    from app.models.member import MembershipTypeOffer, Member, MemberOfferState
    from app.models.loyalty import LoyaltyTransaction
    from decimal import Decimal

    # Login
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"phone": "9999999999", "password": "password123"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create offer templates: one standard that earns points, one points redemption reward
    earn_offer = OfferTemplate(
        id="earn-offer-id",
        merchant_id=seeded_merchant["merchant"].id,
        title="Points Earning Service",
        offer_type="free_service",
        value=Decimal("1"),
        active=True,
        loyalty_points_earn=Decimal("15"),
    )
    db_session.add(earn_offer)

    redeem_offer = OfferTemplate(
        id="redeem-offer-id",
        merchant_id=seeded_merchant["merchant"].id,
        title="Points Redemption Reward",
        offer_type="points_redemption",
        value=Decimal("1"),
        active=True,
        is_points_redemption=True,
        loyalty_points_cost=Decimal("10"),
    )
    db_session.add(redeem_offer)

    # Link both to membership type
    db_session.add(MembershipTypeOffer(
        membership_type_id=seeded_merchant["membership_type"].id,
        offer_template_id=earn_offer.id,
        default_qty=5,
    ))
    db_session.add(MembershipTypeOffer(
        membership_type_id=seeded_merchant["membership_type"].id,
        offer_template_id=redeem_offer.id,
        default_qty=1,
    ))
    db_session.commit()

    # 2. Enroll a member
    create_resp = client.post(
        "/api/v1/members",
        json={
            "name": "Arjun Points",
            "phone": "5555555555",
            "membership_type_id": seeded_merchant["membership_type"].id,
        },
        headers=headers,
    )
    member = create_resp.json()
    member_id = member["id"]

    db_session.expire_all()
    states = db_session.query(MemberOfferState).filter(MemberOfferState.member_id == member_id).all()
    earn_state = next(s for s in states if s.offer_template_id == "earn-offer-id")
    redeem_state = next(s for s in states if s.offer_template_id == "redeem-offer-id")

    # Member starts with 0 loyalty points
    db_session.expire_all()
    m_row = db_session.query(Member).filter(Member.id == member_id).first()
    assert m_row.loyalty_points == 0

    # 3. Redeem standard offer -> earns 15 points
    redeem_resp = client.post(
        "/api/v1/redemptions",
        json={"member_id": member_id, "offer_state_id": earn_state.id},
        headers=headers,
    )
    assert redeem_resp.status_code == 201

    # Verify points increased
    db_session.expire_all()
    m_row = db_session.query(Member).filter(Member.id == member_id).first()
    assert m_row.loyalty_points == 15

    # Verify loyalty transaction log
    tx = db_session.query(LoyaltyTransaction).filter(LoyaltyTransaction.member_id == member_id).first()
    assert tx is not None
    assert tx.type == "earn"
    assert tx.points == 15
    assert tx.balance_after == 15
    assert tx.source_offer_id == "earn-offer-id"

    # 4. Fetch loyalty history endpoint
    history_resp = client.get(
        f"/api/v1/redemptions/member/{member_id}/loyalty-history",
        headers=headers,
    )
    assert history_resp.status_code == 200
    history_data = history_resp.json()
    assert len(history_data) == 1
    assert float(history_data[0]["points"]) == 15
    assert history_data[0]["source_offer_title"] == "Points Earning Service"

    # 5. Redeem points -> spends 10 points
    redeem_points_resp = client.post(
        "/api/v1/redemptions/redeem-points",
        json={"member_id": member_id, "offer_state_id": redeem_state.id},
        headers=headers,
    )
    assert redeem_points_resp.status_code == 201

    # Verify points decreased to 5
    db_session.expire_all()
    m_row = db_session.query(Member).filter(Member.id == member_id).first()
    assert m_row.loyalty_points == 5

    txs = db_session.query(LoyaltyTransaction).filter(LoyaltyTransaction.member_id == member_id).all()
    assert len(txs) == 2
    tx_earn = next(t for t in txs if t.type == "earn")
    tx_redeem = next(t for t in txs if t.type == "redeem")
    assert tx_earn.points == 15
    assert tx_redeem.points == -10
    assert tx_redeem.balance_after == 5

    # 6. Try to redeem points again (insufficient balance, cost=10, balance=5)
    # Re-enable/add another state or use existing (remaining_qty was 1, so it's exhausted. Re-enable state for testing)
    redeem_state.status = "active"
    redeem_state.remaining_qty = 1
    db_session.commit()

    fail_points_resp = client.post(
        "/api/v1/redemptions/redeem-points",
        json={"member_id": member_id, "offer_state_id": redeem_state.id},
        headers=headers,
    )
    assert fail_points_resp.status_code == 400
    assert "insufficient" in fail_points_resp.json()["detail"].lower()


def test_reminder_rule_timing_fields(client, db_session, seeded_merchant):
    from app.models.campaign import ReminderRule

    # Login
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"phone": "9999999999", "password": "password123"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a reminder rule
    rule = ReminderRule(
        id="test-rule-id",
        merchant_id=seeded_merchant["merchant"].id,
        trigger_type="birthday",
        channel="sms",
        template_text="Happy birthday {name}!",
        active=True,
    )
    db_session.add(rule)
    db_session.commit()

    # 2. Update timing fields via PATCH endpoint
    update_data = {
        "send_time": "14:30:00",
        "days_before": 3,
        "timezone": "Asia/Kolkata",
    }
    resp = client.patch(
        f"/api/v1/reminders/{rule.id}",
        json=update_data,
        headers=headers,
    )
    assert resp.status_code == 200
    updated_rule = resp.json()
    assert updated_rule["send_time"] == "14:30:00"
    assert updated_rule["days_before"] == 3
    assert updated_rule["timezone"] == "Asia/Kolkata"

    # Verify in DB
    db_session.expire_all()
    db_rule = db_session.query(ReminderRule).filter(ReminderRule.id == rule.id).first()
    assert db_rule.send_time.hour == 14
    assert db_rule.send_time.minute == 30
    assert db_rule.days_before == 3
    assert db_rule.timezone == "Asia/Kolkata"


