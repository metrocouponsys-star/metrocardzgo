import sys
import os
import uuid

# Add backend directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.merchant import Merchant, MerchantUser
from app.core.security import hash_password

def seed():
    print("[RUNNING] Seeding database...")
    import os
    import sys
    custom_db_url = os.environ.get("DATABASE_URL")
    if len(sys.argv) > 1:
        custom_db_url = sys.argv[1]
    
    from app.core.database import SessionLocal as DefaultSessionLocal
    if custom_db_url:
        print(f"[INFO] Using custom database URL")
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        if custom_db_url.startswith("postgres://"):
            custom_db_url = custom_db_url.replace("postgres://", "postgresql+psycopg://", 1)
        elif custom_db_url.startswith("postgresql://"):
            custom_db_url = custom_db_url.replace("postgresql://", "postgresql+psycopg://", 1)
        
        custom_engine = create_engine(custom_db_url)
        db_session_factory = sessionmaker(autocommit=False, autoflush=False, bind=custom_engine)
        db = db_session_factory()
    else:
        db = DefaultSessionLocal()
    try:
        from sqlalchemy import text
        for col_sql in [
            "ALTER TABLE coupon_codes ADD COLUMN active_days TEXT;",
            "ALTER TABLE points_rules ADD COLUMN spend_unit NUMERIC DEFAULT 1;",
            "ALTER TABLE members ADD COLUMN auto_renew BOOLEAN NOT NULL DEFAULT FALSE;",
        ]:
            try:
                with db.begin_nested():
                    db.execute(text(col_sql))
            except Exception:
                pass

        # 1. Create Super Admin if not exists
        super_admin_phone = "9029999614"
        super_admin_email = "metrocouponsys@gmail.com"
        
        admin = db.query(MerchantUser).filter(MerchantUser.role == "super_admin").first()
        if not admin:
            admin = MerchantUser(
                id=str(uuid.uuid4()),
                name="Metro Cardz Admin",
                phone=super_admin_phone,
                email=super_admin_email,
                role="super_admin",
                password_hash=hash_password("9029999614"), # password is the full phone number
            )
            db.add(admin)
            print(f"[INFO] Created Super Admin User:")
            print(f"   - Phone: {super_admin_phone}")
            print(f"   - Email: {super_admin_email}")
            print(f"   - Password: {super_admin_phone}")
        else:
            # Update existing super admin to match the requested credentials
            admin.phone = super_admin_phone
            admin.email = super_admin_email
            admin.password_hash = hash_password("9029999614")
            print("[INFO] Updated Super Admin User credentials.")

        # 2. Create Demo Merchant
        merchant = db.query(Merchant).filter(Merchant.business_name == "Demo Metro Cardz Merchant").first()
        if not merchant:
            merchant = Merchant(
                id=str(uuid.uuid4()),
                business_name="Demo Metro Cardz Merchant",
                category="Retail",
                plan_tier="Pro",
                whatsapp_number="919876543210",
                logo_url=None,
                address="123 Main Street, Bangalore",
                secret_salt=str(uuid.uuid4()),
                status="active",
                approval_status="approved",
                referral_bonus_points=50,
            )
            db.add(merchant)
            db.flush()
            print(f"[INFO] Created Demo Merchant: {merchant.business_name}")

            # Create Merchant Owner User
            owner = db.query(MerchantUser).filter(MerchantUser.phone == "9876543210").first()
            if not owner:
                owner = MerchantUser(
                    id=str(uuid.uuid4()),
                    merchant_id=merchant.id,
                    name="Demo Owner",
                    phone="9876543210",
                    email="owner@metrocardz.in",
                    role="owner",
                    password_hash=hash_password("owner123"), # password is owner123
                )
                db.add(owner)
                print(f"[INFO] Created Demo Merchant Owner User:")
                print(f"   - Phone: 9876543210")
                print(f"   - Email: owner@metrocardz.in")
                print(f"   - Password: owner123")

            # Create Merchant Staff User
            staff = db.query(MerchantUser).filter(MerchantUser.phone == "9876543211").first()
            if not staff:
                staff = MerchantUser(
                    id=str(uuid.uuid4()),
                    merchant_id=merchant.id,
                    name="Demo Staff",
                    phone="9876543211",
                    email="staff@metrocardz.in",
                    role="staff",
                    password_hash=hash_password("staff123"), # password is staff123
                )
                db.add(staff)
                print(f"[INFO] Created Demo Merchant Staff User:")
                print(f"   - Phone: 9876543211")
                print(f"   - Email: staff@metrocardz.in")
                print(f"   - Password: staff123")

            # Seed default membership types, offers, rewards, coupons, and points rules
            _seed_merchant_defaults(db, merchant)

        else:
            print("[INFO] Demo Merchant already exists.")
            _seed_merchant_defaults(db, merchant)

        db.commit()
        print("[SUCCESS] Database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"[FAILED] Seeding failed: {e}")
    finally:
        db.close()

def _seed_merchant_defaults(db, merchant):
    """Seed default membership types, offers, rewards catalog, coupons, points rules, and sample member if missing."""
    from datetime import date, timedelta
    from decimal import Decimal
    from app.models.member import MembershipType, Member, MemberOfferState, MembershipTypeOffer
    from app.models.offer import OfferTemplate
    from app.models.rewards import RewardCatalog, CouponCode, PointsRule

    # 1. Membership Types
    mtype = db.query(MembershipType).filter(MembershipType.merchant_id == merchant.id).first()
    if not mtype:
        mtype = MembershipType(
            id=str(uuid.uuid4()),
            merchant_id=merchant.id,
            name="Prime Tier",
            description="Premium salon membership with priority booking and 2x points",
        )
        db.add(mtype)
        db.flush()
        print(f"   [SEED] Created MembershipType: {mtype.name}")

    # 2. Offer Templates
    offer = db.query(OfferTemplate).filter(OfferTemplate.merchant_id == merchant.id).first()
    if not offer:
        offer = OfferTemplate(
            id=str(uuid.uuid4()),
            merchant_id=merchant.id,
            title="10% Off All Salon & Grooming Services",
            description="Get flat 10% discount on all salon styling, facial, and spa services",
            offer_type="percent_off",
            value=Decimal("10"),
            active=True,
        )
        db.add(offer)
        db.flush()
        print(f"   [SEED] Created OfferTemplate: {offer.title}")

        # Link to membership type
        db.add(MembershipTypeOffer(membership_type_id=mtype.id, offer_template_id=offer.id, default_qty=None))

    # 3. Reward Catalog
    reward_count = db.query(RewardCatalog).filter(RewardCatalog.merchant_id == merchant.id).count()
    if reward_count == 0:
        default_rewards = [
            ("Free Gourmet Cappuccino & Muffin", "One fresh artisanal cappuccino with a blueberry muffin", 150, 50),
            ("Complimentary Hair Wash & Styling Pass", "Deep hair wash, scalp massage & conditioning styling", 250, None),
            ("Rs. 500 Store Cash Credit Discount", "Flat Rs. 500 discount on your billing total", 500, 100),
            ("Silver Coin (10g 999 Fine Silver)", "Hallmarked pure silver coin with festive gift packaging", 1500, 10),
        ]
        for name, desc, cost, qty in default_rewards:
            db.add(RewardCatalog(
                merchant_id=merchant.id,
                name=name,
                description=desc,
                points_cost=Decimal(str(cost)),
                quantity_available=qty,
                is_active=True,
            ))
        print(f"   [SEED] Created {len(default_rewards)} default RewardCatalog items")

    # 4. Coupon Codes
    coupon_count = db.query(CouponCode).filter(CouponCode.merchant_id == merchant.id).count()
    if coupon_count == 0:
        default_coupons = [
            ("WELCOME10", "percent", 10, 0, None, "Daily"),
            ("SMILE500", "flat", 500, 1000, 50, "Mon,Wed,Fri"),
            ("FESTIVE20", "percent", 20, 2000, 100, "Daily"),
        ]
        for code, dtype, val, min_p, max_u, days in default_coupons:
            db.add(CouponCode(
                merchant_id=merchant.id,
                code=code,
                discount_type=dtype,
                value=Decimal(str(val)),
                min_purchase=Decimal(str(min_p)),
                max_uses=max_u,
                used_count=0,
                expires_at=date.today() + timedelta(days=365),
                active_days=days,
                is_active=True,
            ))
        print(f"   [SEED] Created {len(default_coupons)} default CouponCode items")

    # 5. Points Rules
    prule_count = db.query(PointsRule).filter(PointsRule.merchant_id == merchant.id).count()
    if prule_count == 0:
        db.add(PointsRule(
            merchant_id=merchant.id,
            rule_type="per_rupee",
            points_value=Decimal("1"),
            spend_unit=Decimal("10"),
            is_active=True,
        ))
        db.add(PointsRule(
            merchant_id=merchant.id,
            rule_type="per_visit",
            points_value=Decimal("10"),
            spend_unit=Decimal("1"),
            is_active=True,
        ))
        print("   [SEED] Created default PointsRule items (1 pt / Rs.10, 10 pts / visit)")

    # 6. Sample Member
    sample_member = db.query(Member).filter((Member.merchant_id == merchant.id) | (Member.public_token == "tok-sal001")).first()
    if not sample_member:
        sample_member = Member(
            id=str(uuid.uuid4()),
            merchant_id=merchant.id,
            member_code="SAL001",
            public_token="tok-sal001",
            name="Rahul Sharma",
            phone="9876543210",
            email="rahul@example.com",
            membership_type_id=mtype.id,
            joined_date=date.today() - timedelta(days=30),
            expiry_date=date.today() + timedelta(days=335),
            loyalty_points=Decimal("350"),
            status="active",
            total_visits=5,
            referral_code="RAHUL001",
        )
        db.add(sample_member)
        db.flush()

        if offer:
            db.add(MemberOfferState(
                id=str(uuid.uuid4()),
                member_id=sample_member.id,
                offer_template_id=offer.id,
                remaining_qty=5,
                initial_qty=5,
                status="active",
            ))
        print(f"   [SEED] Created sample Member: {sample_member.name} (#{sample_member.member_code})")


if __name__ == "__main__":
    seed()
