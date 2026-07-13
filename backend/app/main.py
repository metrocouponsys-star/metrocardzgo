"""
Metro Cardz — FastAPI Application Entrypoint
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
)

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

# ── CORS Middleware ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
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

# Health check at root level (no /api/v1 prefix — for UptimeRobot and Render)
app.include_router(health_router)


# ── Startup Event ─────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """Verify database connectivity on startup."""
    from app.core.database import engine
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Database connection OK")
    except Exception as e:
        print(f"❌ Database connection FAILED: {e}")
        # Don't crash on startup — let the app start and fail per-request
