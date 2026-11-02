from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.database import check_database_connection, is_database_configured

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str
    database: str


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Проверка работоспособности. Используется frontend и Render."""
    settings = get_settings()

    if not is_database_configured():
        database = "not_configured"
    elif check_database_connection():
        database = "connected"
    else:
        database = "unavailable"

    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
        database=database,
    )
