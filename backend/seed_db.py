import sys
import os
import uuid

# Add backend directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.merchant import Merchant, MerchantUser
from app.core.security import hash_password

def seed():
    print("[RUNNING] Seeding database...")
    import os
    import sys
    custom_db_url = os.environ.get("DATABASE_URL")
    if len(sys.argv) > 1:
        custom_db_url = sys.argv[1]
    
    if custom_db_url:
        print(f"[INFO] Using custom database URL")
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        # Normalize postgres scheme
        if custom_db_url.startswith("postgres://"):
            custom_db_url = custom_db_url.replace("postgres://", "postgresql+psycopg://", 1)
        elif custom_db_url.startswith("postgresql://"):
            custom_db_url = custom_db_url.replace("postgresql://", "postgresql+psycopg://", 1)
        
        engine = create_engine(custom_db_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
    else:
        db = SessionLocal()
    try:
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

        else:
            print("ℹ️ Demo Merchant already exists.")

        db.commit()
        print("[SUCCESS] Database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"[FAILED] Seeding failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
