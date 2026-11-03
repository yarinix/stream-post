from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Настройки приложения. Читаются из переменных окружения и файла .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Stream Post API"
    app_version: str = "0.1.0"
    environment: str = "development"

    # Адреса frontend через запятую (для CORS). Хранится строкой, потому что
    # pydantic-settings читает списки из переменных окружения только как JSON.
    cors_origins: str = "http://localhost:5173"

    # Строка подключения к PostgreSQL. Пусто — база не подключена.
    database_url: str | None = None

    @property
    def cors_origins_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @field_validator("database_url", mode="before")
    @classmethod
    def empty_database_url_is_none(cls, value):
        return value or None


@lru_cache
def get_settings() -> Settings:
    return Settings()
