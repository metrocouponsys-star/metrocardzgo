"""Service-layer exceptions — separate from HTTP exceptions.

Route handlers translate these to the correct HTTP status codes,
so service functions don't need to know about FastAPI.
"""


class ServiceError(Exception):
    """Raised by service functions when a business rule is violated."""

    def __init__(self, message: str, code: str = "BUSINESS_RULE_VIOLATION", status_hint: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code
        # Suggested HTTP status code for route handlers
        self.status_hint = status_hint
