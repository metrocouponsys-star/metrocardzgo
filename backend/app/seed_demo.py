"""
Metro Cardz — Database Seed Script for 10 Target Industry Verticals.
Populates SQLite/PostgreSQL with demo accounts, pre-configured membership tiers,
offers, dummy members, and passwords ("demo123").

Usage:
  cd c:\\work\\metrocard\\backend
  .\\venv\\Scripts\\Activate.ps1
  python -m app.seed_demo
"""

import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.database import Base
from app.core.security import hash_password

from app.models.merchant import Merchant, MerchantUser
from app.models.member import Member, MembershipType
from app.models.offer import OfferTemplate

def seed_database(override_url=None):
    db_url = override_url or settings.database_url or "sqlite:///test.db"
    print(f"Connecting to database: {db_url}")
    engine = create_engine(db_url)
    Base.metadata.create_all(bind=engine)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    default_password_hash = hash_password("demo123")

    demo_data = [
        {
            "merchant_id": "mer-ins",
            "business_name": "Metro Insurance Agency",
            "category": "Insurance",
            "address": "Suite 402, Financial District, Mumbai",
            "user_name": "Suresh Gupta",
            "phone": "9876500001",
            "email": "insurance@metrocardz.in",
            "tiers": [
                {"name": "Shield Elite", "description": "1.5x Safety Points + Free Annual Diagnostic Checkup"},
                {"name": "Heritage VIP", "description": "Dedicated claims manager + Zero convenience fee"}
            ],
            "offers": [
                {"title": "Early Renewal Cashback Pass", "type": "wallet_points", "value": 500},
                {"title": "Free Full Body Diagnostic Checkup", "type": "free_service", "value": 1},
                {"title": "Policy Referral Bonus (1,000 Pts)", "type": "referral", "value": 1000}
            ],
            "member": {"code": "INS001", "name": "Rajesh Sharma", "phone": "9811122334", "points": 1450}
        },
        {
            "merchant_id": "mer-re",
            "business_name": "Metro Realty & Advisory",
            "category": "Real Estate",
            "address": "Floor 12, World Trade Center, Gurugram",
            "user_name": "Vikram Malhotra",
            "phone": "9876500002",
            "email": "realestate@metrocardz.in",
            "tiers": [
                {"name": "Prestige Buyer VIP", "description": "Snagging inspection + Modular kitchen subsidy"},
                {"name": "Home Owner Preferred", "description": "Verified buyer legal agreement perks"}
            ],
            "offers": [
                {"title": "Home Buyer Referral Reward (₹25,000)", "type": "referral", "value": 25000},
                {"title": "Free Home Snagging Inspection", "type": "free_service", "value": 1},
                {"title": "₹30,000 Modular Kitchen Subsidy", "type": "percent_off", "value": 30000}
            ],
            "member": {"code": "RE001", "name": "Ananya Deshmukh", "phone": "9822233445", "points": 5000}
        },
        {
            "merchant_id": "mer-trv",
            "business_name": "Metro Travels & Global Vacations",
            "category": "Travels",
            "address": "Connaught Place, New Delhi 110001",
            "user_name": "Rohan Mehta",
            "phone": "9876500003",
            "email": "travels@metrocardz.in",
            "tiers": [
                {"name": "Globetrotter", "description": "5% Miles cashback + Free visa processing"},
                {"name": "Explorer", "description": "Standard travel package member"}
            ],
            "offers": [
                {"title": "₹5,000 Holiday Package Off", "type": "percent_off", "value": 5000},
                {"title": "Complimentary Visa Fee Waiver", "type": "free_service", "value": 1},
                {"title": "Free Airport Sedan Transfer", "type": "free_service", "value": 1}
            ],
            "member": {"code": "TRV001", "name": "Priya Mehta", "phone": "9833344556", "points": 4800}
        },
        {
            "merchant_id": "mer-ac",
            "business_name": "Metro AC Services & HVAC Solutions",
            "category": "AC Services",
            "address": "Industrial Estate, Phase II, Ahmedabad",
            "user_name": "Sunil Verma",
            "phone": "9876500004",
            "email": "acservices@metrocardz.in",
            "tiers": [
                {"name": "AMC Gold VIP", "description": "4 Free Servicings/Year + 20% Gas Top-up Discount"},
                {"name": "AMC Silver", "description": "2 Free Servicings/Year + 10% parts discount"}
            ],
            "offers": [
                {"title": "Pre-Summer Foam Jet Wash", "type": "free_service", "value": 1},
                {"title": "₹500 Gas Refill Coupon", "type": "percent_off", "value": 500}
            ],
            "member": {"code": "AC001", "name": "Sunil Verma Jr", "phone": "9844455667", "points": 1850}
        },
        {
            "merchant_id": "mer-sup",
            "business_name": "Metro Supermarket & Hypermart",
            "category": "Supermarket",
            "address": "Main Road, Koramangala, Bengaluru",
            "user_name": "Sangeeta Patel",
            "phone": "9876500005",
            "email": "supermarket@metrocardz.in",
            "tiers": [
                {"name": "Super Shopper", "description": "Monthly spend > ₹5,000 with 2x Kirana Cash"},
                {"name": "VIP Family Club", "description": "Monthly spend > ₹15,000 with express checkout"}
            ],
            "offers": [
                {"title": "Mid-Week 2x Kirana Points", "type": "wallet_points", "value": 2},
                {"title": "₹150 Off 5L Edible Oil Can", "type": "percent_off", "value": 150},
                {"title": "500 Points = ₹50 Cash Discount", "type": "points_redemption", "value": 50}
            ],
            "member": {"code": "SUP001", "name": "Sangeeta Patel", "phone": "9855566778", "points": 680}
        },
        {
            "merchant_id": "mer-gym",
            "business_name": "Metro Gym & Fitness Club",
            "category": "Gym",
            "address": "8th Main, Indiranagar, Bengaluru",
            "user_name": "Karan Malhotra",
            "phone": "9876500006",
            "email": "gym@metrocardz.in",
            "tiers": [
                {"name": "Pro Athlete", "description": "Annual access + 2 PT sessions + locker"},
                {"name": "Elite Champion VIP", "description": "Unlimited InBody scans + towel service"}
            ],
            "offers": [
                {"title": "12-Workout Monthly Streak Perk", "type": "wallet_points", "value": 200},
                {"title": "Complimentary PT Session", "type": "free_service", "value": 1},
                {"title": "Free InBody 3D Fat Scan", "type": "free_service", "value": 1}
            ],
            "member": {"code": "GYM001", "name": "Karan Malhotra", "phone": "9866677889", "points": 850}
        },
        {
            "merchant_id": "mer-sln",
            "business_name": "Glamour Salon & Spa",
            "category": "Salon",
            "address": "12, MG Road, Bengaluru, Karnataka 560001",
            "user_name": "Rajesh Kumar",
            "phone": "9876543210",
            "email": "salon@metrocardz.in",
            "tiers": [
                {"name": "Prime", "description": "Priority booking + free hair styling"},
                {"name": "Standard", "description": "Basic salon membership"}
            ],
            "offers": [
                {"title": "Free Hair Wash", "type": "free_service", "value": 1},
                {"title": "10% Off All Services", "type": "percent_off", "value": 10},
                {"title": "100 Points = ₹100 Off", "type": "points_redemption", "value": 100}
            ],
            "member": {"code": "SAL001", "name": "Arjun Sharma", "phone": "9845012345", "points": 350}
        },
        {
            "merchant_id": "mer-auto",
            "business_name": "Metro Auto Garage & Detailing",
            "category": "Automobile",
            "address": "GIDC Auto Hub, Pune, Maharashtra",
            "user_name": "Vikramaditya Rao",
            "phone": "9876500008",
            "email": "automobile@metrocardz.in",
            "tiers": [
                {"name": "Shield Ceramic VIP", "description": "Free quarterly hydrophobic boost"},
                {"name": "Drive Pro", "description": "Free wheel alignment + multi-car pass"}
            ],
            "offers": [
                {"title": "Complimentary Hydro-Foam Wash", "type": "free_service", "value": 1},
                {"title": "Free 3D Wheel Alignment", "type": "free_service", "value": 1},
                {"title": "₹2,500 Off Ceramic Boost Coat", "type": "percent_off", "value": 2500}
            ],
            "member": {"code": "AUT001", "name": "Vikramaditya Rao", "phone": "9877788990", "points": 2100}
        },
        {
            "merchant_id": "mer-caf",
            "business_name": "Metro Roasters & Artisan Cafe",
            "category": "Cafe",
            "address": "Bandra West, Mumbai 400050",
            "user_name": "Anish Giri",
            "phone": "9876500009",
            "email": "cafe@metrocardz.in",
            "tiers": [
                {"name": "Brew Master Club", "description": "10% off beans + digital punch card"},
                {"name": "Work-From-Cafe VIP", "description": "Free muffin on 5th visit"}
            ],
            "offers": [
                {"title": "Coffee Punch Card (Buy 5 Get 1 Free)", "type": "free_service", "value": 1},
                {"title": "Free Birthday Slice of Cake", "type": "birthday", "value": 1}
            ],
            "member": {"code": "CAF001", "name": "Anish Giri", "phone": "9888899001", "points": 420}
        },
        {
            "merchant_id": "mer-jwl",
            "business_name": "Metro Jewels & Diamond Heritage",
            "category": "Jewellery",
            "address": "Zaveri Bazaar, Mumbai 400002",
            "user_name": "Ramesh Agrawal",
            "phone": "9876500010",
            "email": "jewellery@metrocardz.in",
            "tiers": [
                {"name": "Gold Elite", "description": "Gold Savings Scheme subscriber with 30% off making charges"},
                {"name": "Solitaire Crown VIP", "description": "50% off making charges on diamonds"}
            ],
            "offers": [
                {"title": "30% Off Making Charges", "type": "percent_off", "value": 30},
                {"title": "Free Gold Polishing Pass", "type": "free_service", "value": 1},
                {"title": "₹10,000 Solitaire Upgrade Voucher", "type": "percent_off", "value": 10000}
            ],
            "member": {"code": "JWL001", "name": "Sunita Agrawal", "phone": "9899900112", "points": 14500}
        },
        {
            "merchant_id": "mer-grm",
            "business_name": "Metro Fashion & Garment Studio",
            "category": "Readymade Garments",
            "address": "Commercial Street, Bengaluru 560001",
            "user_name": "Manish Kapoor",
            "phone": "9876500011",
            "email": "garments@metrocardz.in",
            "tiers": [
                {"name": "Fashionista Elite", "description": "15% flat cashback + complimentary alterations"},
                {"name": "Style Club", "description": "Exclusive pre-sale access"}
            ],
            "offers": [
                {"title": "Flat ₹500 Off Men Suits", "type": "percent_off", "value": 500},
                {"title": "Free Alterations Pass", "type": "free_service", "value": 1}
            ],
            "member": {"code": "GRM001", "name": "Manish Kapoor Jr", "phone": "9812345678", "points": 920}
        },
        {
            "merchant_id": "mer-btq",
            "business_name": "Royal Bridal Boutique & Couture",
            "category": "Boutique",
            "address": "South Extension II, New Delhi 110049",
            "user_name": "Anita Singhania",
            "phone": "9876500012",
            "email": "boutique@metrocardz.in",
            "tiers": [
                {"name": "Royal Couture VIP", "description": "Custom fitting specialist + VIP Trial Lounge access"},
                {"name": "Bridal Privilege", "description": "10% off custom embroidery"}
            ],
            "offers": [
                {"title": "Complimentary Bridal Styling Consultation", "type": "free_service", "value": 1},
                {"title": "₹2,000 Off Heavy Lehengas", "type": "percent_off", "value": 2000}
            ],
            "member": {"code": "BTQ001", "name": "Anita Singhania", "phone": "9823456789", "points": 3200}
        },
        {
            "merchant_id": "mer-opt",
            "business_name": "Vision Craft Opticians & Eyewear",
            "category": "Optician",
            "address": "FC Road, Pune, Maharashtra 411004",
            "user_name": "Dr. Alok Verma",
            "phone": "9876500013",
            "email": "optician@metrocardz.in",
            "tiers": [
                {"name": "Vision Care VIP", "description": "Free annual computer eye exam + 20% off anti-glare lenses"},
                {"name": "Eyewear Club", "description": "Free lens cleaning spray kit"}
            ],
            "offers": [
                {"title": "Free 16-Point Computerized Eye Checkup", "type": "free_service", "value": 1},
                {"title": "Buy 1 Frame Get Blue-Cut Lens Free", "type": "free_service", "value": 1}
            ],
            "member": {"code": "OPT001", "name": "Dr. Alok Verma", "phone": "9834567890", "points": 1150}
        },
        {
            "merchant_id": "mer-ftw",
            "business_name": "Sole Comfort Footwear Lounge",
            "category": "Footwear",
            "address": "Park Street, Kolkata, West Bengal 700016",
            "user_name": "Deepak Chhabra",
            "phone": "9876500014",
            "email": "footwear@metrocardz.in",
            "tiers": [
                {"name": "Sole Club VIP", "description": "Free leather shoe conditioning + 15% cashback"},
                {"name": "Sneakerhead Pass", "description": "Priority access to limited drops"}
            ],
            "offers": [
                {"title": "Free Leather Shoe Polish & Conditioning Pass", "type": "free_service", "value": 1},
                {"title": "₹500 Off Premium Leather Shoes", "type": "percent_off", "value": 500}
            ],
            "member": {"code": "FTW001", "name": "Deepak Chhabra", "phone": "9845678901", "points": 780}
        },
        {
            "merchant_id": "mer-dnt",
            "business_name": "Apex Dental Studio & Smile Clinic",
            "category": "Dental",
            "address": "Banjara Hills, Hyderabad, Telangana 500034",
            "user_name": "Dr. Kavita Rao",
            "phone": "9876500015",
            "email": "dental@metrocardz.in",
            "tiers": [
                {"name": "Smile Care VIP", "description": "2 Free scaling & polishing sessions/year + 15% off Aligners"},
                {"name": "Family Preventive Club", "description": "Free kids fluoride varnish"}
            ],
            "offers": [
                {"title": "Complimentary Ultrasonic Scaling & Polishing", "type": "free_service", "value": 1},
                {"title": "₹1,000 Off Teeth Whitening Session", "type": "percent_off", "value": 1000}
            ],
            "member": {"code": "DNT001", "name": "Dr. Kavita Rao", "phone": "9856789012", "points": 1650}
        },
        {
            "merchant_id": "mer-mob",
            "business_name": "Metro Mobile & Tech Hub",
            "category": "Mobile",
            "address": "Nehru Place, New Delhi 110019",
            "user_name": "Sanjay Sharma",
            "phone": "9876500016",
            "email": "mobile@metrocardz.in",
            "tiers": [
                {"name": "Tech Elite", "description": "1-year free tempered glass replacement + 10% off accessories"},
                {"name": "Gadget Pro", "description": "Express screen repair priority"}
            ],
            "offers": [
                {"title": "Free 11D Tempered Glass Guard Installation", "type": "free_service", "value": 1},
                {"title": "₹500 Off Smartphone Repair", "type": "percent_off", "value": 500}
            ],
            "member": {"code": "MOB001", "name": "Sanjay Sharma", "phone": "9867890123", "points": 1280}
        }
    ]

    # Create Super Admin if missing
    existing_admin = db.query(MerchantUser).filter(MerchantUser.phone == "9000000000").first()
    if not existing_admin:
        admin_user = MerchantUser(
            name="Super Admin Platform",
            phone="9000000000",
            email="admin@metrocardz.in",
            role="super_admin",
            password_hash=default_password_hash
        )
        db.add(admin_user)
        print("  [+] Created Super Admin: 9000000000 / demo123")

    for item in demo_data:
        # Check merchant
        m = db.query(Merchant).filter(Merchant.id == item["merchant_id"]).first()
        if not m:
            m = Merchant(
                id=item["merchant_id"],
                business_name=item["business_name"],
                category=item["category"],
                address=item["address"],
                status="active",
                approval_status="approved"
            )
            db.add(m)
            db.commit()
            print(f"  [+] Created Merchant: {item['business_name']}")

        # Check user
        u = db.query(MerchantUser).filter(MerchantUser.phone == item["phone"]).first()
        if not u:
            u = MerchantUser(
                merchant_id=item["merchant_id"],
                name=item["user_name"],
                phone=item["phone"],
                email=item["email"],
                role="owner",
                password_hash=default_password_hash
            )
            db.add(u)
            db.commit()
            print(f"     -> Created Owner: {item['user_name']} ({item['phone']}) / demo123")

        # Create Tiers
        first_tier_id = None
        for t_info in item["tiers"]:
            existing_t = db.query(MembershipType).filter(
                MembershipType.merchant_id == m.id,
                MembershipType.name == t_info["name"]
            ).first()
            if not existing_t:
                new_t = MembershipType(
                    merchant_id=m.id,
                    name=t_info["name"],
                    description=t_info["description"]
                )
                db.add(new_t)
                db.commit()
                if not first_tier_id:
                    first_tier_id = new_t.id
            else:
                if not first_tier_id:
                    first_tier_id = existing_t.id

        # Create Offers
        for o_info in item["offers"]:
            existing_o = db.query(OfferTemplate).filter(
                OfferTemplate.merchant_id == m.id,
                OfferTemplate.title == o_info["title"]
            ).first()
            if not existing_o:
                new_o = OfferTemplate(
                    merchant_id=m.id,
                    title=o_info["title"],
                    offer_type=o_info["type"],
                    value=o_info["value"],
                    active=True
                )
                db.add(new_o)
                db.commit()

        # Create Member
        mem_info = item["member"]
        existing_mem = db.query(Member).filter(
            Member.merchant_id == m.id,
            Member.phone == mem_info["phone"]
        ).first()
        if not existing_mem:
            from datetime import date, timedelta
            new_mem = Member(
                merchant_id=m.id,
                member_code=mem_info["code"],
                public_token=f"tok-{mem_info['code'].lower()}",
                name=mem_info["name"],
                phone=mem_info["phone"],
                membership_type_id=first_tier_id,
                joined_date=date.today(),
                expiry_date=date.today() + timedelta(days=365),
                loyalty_points=mem_info["points"],
                status="active"
            )
            db.add(new_mem)
            db.commit()

    print("\n[SUCCESS] All 10 Target Vertical Demo Database Accounts seeded successfully!")
    db.close()

if __name__ == "__main__":
    seed_database()
