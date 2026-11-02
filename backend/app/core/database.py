"""Подготовка подключения к PostgreSQL.

Пока таблиц и моделей нет: engine создаётся лениво и только если задан
DATABASE_URL. Без базы приложение запускается и работает как обычно.
"""

from functools import lru_cache

from sqlalchemy import Engine, create_engine, text

from app.core.config import get_settings


def normalize_database_url(url: str) -> str:
    """Render выдаёт ссылки вида postgres://..., а драйверу psycopg 3
    нужен префикс postgresql+psycopg://."""
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


def is_database_configured() -> bool:
    return get_settings().database_url is not None


@lru_cache
def get_engine() -> Engine | None:
    url = get_settings().database_url
    if url is None:
        return None
    return create_engine(normalize_database_url(url), pool_pre_ping=True)


def check_database_connection() -> bool:
    """Пробует выполнить SELECT 1. Возвращает False при любой ошибке."""
    engine = get_engine()
    if engine is None:
        return False
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
