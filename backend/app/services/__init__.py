"""Metro Cardz — Services Package

Business logic lives here, not in route handlers.
Route handlers are thin: validate input → call service → return response.

Service functions raise ServiceError for business rule violations.
Route handlers catch ServiceError and convert to HTTPException.
"""
from .exceptions import ServiceError

__all__ = ["ServiceError"]
