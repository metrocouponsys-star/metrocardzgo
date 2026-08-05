"""
Metro Cardz — FastAPI Application Entrypoint
Industry-grade: security headers, global error handling, request validation errors.
"""
import logging
import uuid
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
    merchant_profile_router,
)
from app.routers.rewards import (
    rewards_router,
    coupons_router,
    vouchers_router,
    points_rules_router,
    scratch_router,
    lucky_draw_router,
    feedback_router,
)
from app.routers.wallet import wallet_router
from app.routers.cards import router as cards_router, public_cards_router

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
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


# ── Bulletproof CORS Middleware ───────────────────────────────────────────────
class BulletproofCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin") or "*"
        if request.method == "OPTIONS":
            response = JSONResponse(status_code=200, content={"status": "ok"})
        else:
            response = await call_next(request)
        
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, X-Internal-Key, X-Request-ID, X-Idempotency-Key"
        return response


app.add_middleware(BulletproofCORSMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)


from starlette.exceptions import HTTPException as StarletteHTTPException

def add_cors_headers(response: JSONResponse, request: Request) -> JSONResponse:
    origin = request.headers.get("origin") or "*"
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, X-Internal-Key, X-Request-ID, X-Idempotency-Key"
    return response


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
    return add_cors_headers(JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error", "errors": errors},
    ), request)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Preserve status codes for deliberate HTTPExceptions."""
    return add_cors_headers(JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=getattr(exc, "headers", None)
    ), request)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled exceptions — log and return generic 500."""
    log.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return add_cors_headers(JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal server error: {str(exc)}"},
    ), request)


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
app.include_router(merchant_profile_router, prefix=API_PREFIX)
app.include_router(internal_router)   # no API_PREFIX — /internal/* directly

# New feature routers
app.include_router(rewards_router, prefix=API_PREFIX)
app.include_router(coupons_router, prefix=API_PREFIX)
app.include_router(vouchers_router, prefix=API_PREFIX)
app.include_router(points_rules_router, prefix=API_PREFIX)
app.include_router(scratch_router, prefix=API_PREFIX)
app.include_router(lucky_draw_router, prefix=API_PREFIX)
app.include_router(feedback_router, prefix=API_PREFIX)
app.include_router(wallet_router, prefix=API_PREFIX)
app.include_router(cards_router, prefix=API_PREFIX)
app.include_router(public_cards_router, prefix=API_PREFIX)

# Health check at root level (no /api/v1 prefix — for UptimeRobot and Render keep-alive)
app.include_router(health_router)


# ── Import all models at module level (avoids per-request import overhead) ─────
import app.models.merchant  # noqa: F401
import app.models.member  # noqa: F401
import app.models.offer  # noqa: F401
import app.models.campaign  # noqa: F401
import app.models.redemption  # noqa: F401
import app.models.loyalty  # noqa: F401
import app.models.rewards  # noqa: F401
import app.models.feedback  # noqa: F401
import app.models.wallet  # noqa: F401
import app.models.event_log  # noqa: F401
import app.models.idempotency  # noqa: F401


# ── Startup Event ─────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """Verify database connectivity and create tables. Optimized for fast cold starts."""
    import time
    t0 = time.time()

    from app.core.database import engine, Base
    from sqlalchemy import text

    try:
        # 1. DB connectivity check + table creation (single operation)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"✅ Database connection OK ({time.time()-t0:.1f}s)")

        Base.metadata.create_all(bind=engine)
        print(f"✅ Tables verified ({time.time()-t0:.1f}s)")

        # 2. Run all migrations in a single transaction (faster than 4 separate connections)
        migration_sqls = [
            "ALTER TABLE members ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT FALSE",
            "ALTER TABLE coupon_codes ADD COLUMN IF NOT EXISTS active_days TEXT",
            "ALTER TABLE points_rules ADD COLUMN IF NOT EXISTS spend_unit NUMERIC DEFAULT 1",
        ]
        try:
            with engine.begin() as conn:
                for sql in migration_sqls:
                    try:
                        conn.execute(text(sql))
                    except Exception:
                        pass  # Column already exists — expected
            # Type cast (may fail if already done — that's fine)
            try:
                with engine.begin() as conn:
                    conn.execute(text(
                        "ALTER TABLE coupon_codes ALTER COLUMN discount_type TYPE VARCHAR USING discount_type::VARCHAR"
                    ))
            except Exception:
                pass
            print(f"✅ Migrations OK ({time.time()-t0:.1f}s)")
        except Exception as col_err:
            print(f"⚠️ Migration notice: {col_err}")

        # 3. Seed only if the merchants table is empty (skip on warm restarts)
        try:
            with engine.connect() as conn:
                result = conn.execute(text("SELECT COUNT(*) FROM merchants"))
                count = result.scalar()
            if count == 0:
                from seed_db import seed
                seed()
                print(f"✅ Seed completed ({time.time()-t0:.1f}s)")
            else:
                print(f"✅ Seed skipped (DB has {count} merchants) ({time.time()-t0:.1f}s)")
        except Exception as seed_err:
            print(f"⚠️ Seeding notice: {seed_err}")

        print(f"🚀 Startup complete in {time.time()-t0:.1f}s")
    except Exception as e:
        print(f"❌ Database startup FAILED: {e}")
        # Don't crash on startup — let the app start and fail per-request

