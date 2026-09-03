from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "CIVICAI"
    app_env: str = "development"
    database_url: str = "sqlite:///./civicai.db"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret_key: str = "civicai-secret-key-2026"
    access_token_expire_minutes: int = 60 * 24
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3080",
        "http://127.0.0.1:3080",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
    ]

    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    def model_post_init(self, __context) -> None:
        if self.database_url.startswith("sqlite:///./"):
            relative_path = self.database_url.removeprefix("sqlite:///./")
            database_path = (BACKEND_DIR / relative_path).resolve()
            self.database_url = f"sqlite:///{database_path.as_posix()}"


@lru_cache
def get_settings() -> Settings:
    return Settings()
