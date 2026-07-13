"""
Metro Cardz — FastAPI Application Entrypoint
Industry-grade: security headers, global error handling, request validation errors.
"""
import logging
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.sentry_setup import init_sentry
from app.routers.auth import router as auth_router
from app.routers.members import router as members_router
from app.routers.redemptions import router as redemptions_router
from app.routers.admin import router as admin_router
from app.routers.misc import (
    offers_router,
    membership_types_router,
    campaigns_router,
    reminders_router,
    dashboard_router,
    public_router,
    health_router,
    reports_router,
    internal_router,
)

log = logging.getLogger(__name__)

# ── Initialize Sentry (no-op if DSN not set or not production) ────────────────
init_sentry()

# ── Create FastAPI App ────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs" if not settings.is_production else None,  # Disable Swagger in prod
    redoc_url="/redoc" if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else None,
)


# ── Security Headers Middleware ───────────────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


app.add_middleware(SecurityHeadersMiddleware)

# ── CORS Middleware ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Internal-Key"],
)


# ── Global Exception Handlers ─────────────────────────────────────────────────
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return structured 422 with field-level errors — never expose stack traces."""
    errors = []
    for err in exc.errors():
        errors.append({
            "field": " → ".join(str(loc) for loc in err["loc"]),
            "message": err["msg"],
            "type": err["type"],
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error", "errors": errors},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled exceptions — log and return generic 500."""
    log.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error. Please try again."},
    )


# ── API v1 Routes ─────────────────────────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(members_router, prefix=API_PREFIX)
app.include_router(redemptions_router, prefix=API_PREFIX)
app.include_router(offers_router, prefix=API_PREFIX)
app.include_router(membership_types_router, prefix=API_PREFIX)
app.include_router(campaigns_router, prefix=API_PREFIX)
app.include_router(reminders_router, prefix=API_PREFIX)
app.include_router(dashboard_router, prefix=API_PREFIX)
app.include_router(admin_router, prefix=API_PREFIX)
app.include_router(public_router, prefix=API_PREFIX)
app.include_router(reports_router, prefix=API_PREFIX)
app.include_router(internal_router)   # no API_PREFIX — /internal/* directly

# Health check at root level (no /api/v1 prefix — for UptimeRobot and Render keep-alive)
app.include_router(health_router)


# ── Startup Event ─────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """Verify database connectivity and automatically create base tables on startup."""
    from app.core.database import engine, Base
    from sqlalchemy import text
    # Import all models to register them on Base.metadata for table creation
    from app.models.merchant import Merchant, MerchantUser
    from app.models.member import Member, MembershipType, MembershipTypeOffer, MemberOfferState
    from app.models.offer import OfferTemplate
    from app.models.campaign import Campaign, ReminderRule, MessageLog
    from app.models.redemption import RedemptionLog
    from app.models.loyalty import LoyaltyTransaction

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Database connection OK")

        # Automatically create base tables (idempotent, safe to run repeatedly)
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables verified/created successfully")
    except Exception as e:
        print(f"❌ Database connection or schema creation FAILED: {e}")
        # Don't crash on startup — let the app start and fail per-request

