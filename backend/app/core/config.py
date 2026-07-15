"""
Metro Cardz — Application Settings
Loaded from environment variables. Works with .env file locally,
and Render.com environment variables in production.
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

    # ── Database ─────────────────────────────────────────────────────────
    database_url: str

    @field_validator("database_url", mode="before")
    @classmethod
    def assemble_db_url(cls, v: str) -> str:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+psycopg://", 1)
            elif v.startswith("postgresql://"):
                return v.replace("postgresql://", "postgresql+psycopg://", 1)
        return v

    # ── Redis ────────────────────────────────────────────────────────────
    redis_url: str

    # ── JWT / Security ───────────────────────────────────────────────────
    secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30

    # ── CORS ─────────────────────────────────────────────────────────────
    allowed_origins: str = "http://localhost:3000,http://localhost:5173"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    # ── Supabase Storage ─────────────────────────────────────────────────
    supabase_url: str = ""
    supabase_service_key: str = ""
    storage_bucket: str = "metrocardz-assets"

    # ── SMS (Msg91) ──────────────────────────────────────────────────────
    msg91_api_key: str = ""
    msg91_sender_id: str = "METRCZ"
    msg91_template_id_otp: str = ""

    # ── WhatsApp (AiSensy) ───────────────────────────────────────────────
    aisensy_api_key: str = ""
    aisensy_campaign_name: str = "metrocardz_reminder"

    # ── Email (SendGrid) ──────────────────────────────────────────────────
    sendgrid_api_key: str = ""
    sendgrid_from_email: str = "noreply@metrocardz.in"

    # ── Internal Cron Auth ────────────────────────────────────────────────
    internal_cron_key: str = ""   # secret key for /internal/* endpoints (set in Render env)

    # ── Sentry ───────────────────────────────────────────────────────────
    sentry_dsn: str = ""
    sentry_traces_sample_rate: float = 0.1

    # ── Google Wallet ─────────────────────────────────────────────────────────
    # Set these in production (Render env vars):
    #   GOOGLE_WALLET_ISSUER_ID = your numeric issuer ID from Google Pay & Wallet Console
    #   GOOGLE_WALLET_SA_JSON_PATH = /etc/secrets/google_wallet_sa.json (mounted as file secret)
    google_wallet_issuer_id: str = ""
    google_wallet_sa_json_path: str = ""

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
