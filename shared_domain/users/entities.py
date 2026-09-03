from dataclasses import dataclass
from datetime import datetime


@dataclass
class UserEntity:
    """Pure Domain Entity for User."""

    email: str
    username: str
    id: str | None = None
    full_name: str | None = None
    password: str | None = None
    is_active: bool = True
    is_staff: bool = False
    is_superuser: bool = False
    date_joined: datetime | None = None

    def deactivate(self):
        self.is_active = False

    def activate(self):
        self.is_active = True
