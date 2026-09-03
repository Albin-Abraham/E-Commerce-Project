class DomainValidationError(Exception):
    """
    Pure Python validation error.
    Can be caught by Django/FastAPI and mapped to 400 Bad Request.
    """

    def __init__(self, message: str, errors: dict = None):
        super().__init__(message)
        self.errors = errors or {}
