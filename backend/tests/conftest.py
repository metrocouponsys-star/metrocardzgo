"""
Metro Cardz Backend Tests Configuration
Set up test database and client fixtures.
"""
import os

# Inject dummy settings for testing before any app module imports and initializes settings
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["REDIS_URL"] = "redis://localhost:6379"
os.environ["SECRET_KEY"] = "test-secret-key-at-least-64-characters-long-for-testing"
os.environ["ENVIRONMENT"] = "testing"

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.core.database import Base
from app.core.deps import get_db
from app.main import app
from app.models.merchant import Merchant, MerchantUser
from app.models.member import MembershipType
from app.core.security import hash_password


# Use a local SQLite file for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    # Create the tables
    Base.metadata.create_all(bind=engine)
    yield
    # Drop the tables after the entire test session is complete
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def seeded_merchant(db_session):
    """Seed a test merchant and user."""
    merchant = Merchant(
        id="test-merchant-id",
        business_name="Test Merchant Business",
        category="Spa & Salon",
        plan_tier="Starter",
        whatsapp_number="919999999999",
        status="active",
        secret_salt="test-secret-salt",
    )
    db_session.add(merchant)
    db_session.flush()

    user = MerchantUser(
        id="test-user-id",
        merchant_id=merchant.id,
        name="Test Owner",
        phone="9999999999",
        role="owner",
        password_hash=hash_password("password123"),
    )
    db_session.add(user)

    membership_type = MembershipType(
        id="test-membership-type-id",
        merchant_id=merchant.id,
        name="Gold Card",
        description="Premium gold level membership",
    )
    db_session.add(membership_type)

    db_session.commit()
    return {
        "merchant": merchant,
        "user": user,
        "membership_type": membership_type,
    }
