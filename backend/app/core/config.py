from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Настройки приложения. Читаются из переменных окружения и файла .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Stream Post API"
    app_version: str = "0.1.0"
    environment: str = "development"

    # Список адресов frontend через запятую (для CORS).
    cors_origins: list[str] = ["http://localhost:5173"]

    # Строка подключения к PostgreSQL. Пусто — база не подключена.
    database_url: str | None = None

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_origins(cls, value):
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("database_url", mode="before")
    @classmethod
    def empty_database_url_is_none(cls, value):
        return value or None


@lru_cache
def get_settings() -> Settings:
    return Settings()
