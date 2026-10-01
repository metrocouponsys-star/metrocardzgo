"""
Metro Cardz — Application Settings
Loaded from environment variables. Works with .env file locally,
and Hostinger hPanel → Web App → Environment Variables in production.

Hosting: Hostinger Web App (Node.js for Next.js) or VPS (for this Python API)
Database: Hostinger MySQL — shared with the Next.js frontend via Prisma
"""
from functools import lru_cache
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────────────────────
    app_name: str = "Metro Cardz API"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = False

    # ── Database — Hostinger MySQL ────────────────────────────────────────
    # Format: mysql+pymysql://USER:PASSWORD@localhost:3306/DATABASE_NAME
    # Find credentials in: hPanel → Databases → MySQL Databases
    # Host is ALWAYS 'localhost' on Hostinger servers
    database_url: str = "mysql+pymysql://root:@localhost:3306/metrocardz"

    @field_validator("database_url", mode="before")
    @classmethod
    def assemble_db_url(cls, v: str) -> str:
        if isinstance(v, str):
            v = v.strip()
            # Normalize MySQL URL to use PyMySQL driver
            if v.startswith("mysql://"):
                v = v.replace("mysql://", "mysql+pymysql://", 1)
            # Check PyMySQL is available
            if "pymysql" in v:
                try:
                    import pymysql  # noqa: F401
                except ImportError:
                    import logging
                    logging.getLogger(__name__).critical(
                        "PyMySQL driver NOT found. MySQL connection will fail. "
                        "Run: pip install PyMySQL"
                    )
        return v

    # ── JWT / Security ───────────────────────────────────────────────────
    secret_key: str = "dev-secret-key-change-in-production-12345"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 Hours
    refresh_token_expire_days: int = 30

    # ── CORS ─────────────────────────────────────────────────────────────
    # Add your Hostinger domain here
    allowed_origins: str = "https://metrocardz.com,https://www.metrocardz.com,http://localhost:3000,http://localhost:5173"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    # ── Local File Storage (Hostinger disk, served by web server) ────────
    # Production: set to /home/u446352478/public_html/uploads
    # Development: leave empty → defaults to backend/../uploads
    uploads_dir: str = ""

    # ── SMS (Msg91) ──────────────────────────────────────────────────────
    msg91_api_key: str = ""
    msg91_sender_id: str = "METRCZ"
    msg91_template_id_otp: str = ""

    # ── WhatsApp (AiSensy) ───────────────────────────────────────────────
    aisensy_api_key: str = ""
    aisensy_campaign_name: str = "metrocardz_reminder"

    # ── Email (SendGrid) ──────────────────────────────────────────────────
    sendgrid_api_key: str = ""
    sendgrid_from_email: str = "noreply@metrocardz.com"

    # ── Internal Cron Auth ────────────────────────────────────────────────
    # Used by /internal/* endpoints called by Hostinger Cron Jobs
    internal_cron_key: str = ""

    # ── Sentry (Error Tracking) ───────────────────────────────────────────
    sentry_dsn: str = ""
    sentry_traces_sample_rate: float = 0.1

    # ── Super Admin ──────────────────────────────────────────────────────
    super_admin_phone: str = "9000000000"
    super_admin_name: str = "Metro Cardz Admin"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton — loaded once at startup."""
    return Settings()


settings = get_settings()
