from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = Field(
        default="postgresql+psycopg://dataroom:dataroom@db:5432/dataroom"
    )
    redis_url: str = Field(default="redis://redis:6379/0")
    storage_dir: str = Field(default="/app/storage")
    api_prefix: str = Field(default="/api")
    cors_origins: str = Field(default="http://localhost:5173")
    max_upload_mb: int = Field(default=25)
    auth_token: str = Field(default="acme-dev-token")
    auth_username: str = Field(default="acme")
    auth_password: str = Field(default="welcome123")


settings = Settings()
