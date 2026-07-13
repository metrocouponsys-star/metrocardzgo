"""Sentry error tracking initialization for the FastAPI backend."""
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.celery import CeleryIntegration

from app.core.config import settings


def init_sentry() -> None:
    """Initialize Sentry SDK. Called once at application startup."""
    if not settings.sentry_dsn or not settings.is_production:
        return

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        traces_sample_rate=settings.sentry_traces_sample_rate,
        integrations=[
            FastApiIntegration(transaction_style="url"),
            SqlalchemyIntegration(),
            CeleryIntegration(),
        ],
        # Strip PII from error reports
        send_default_pii=False,
    )
