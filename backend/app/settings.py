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
    jwt_secret: str = Field(default="change-me-in-prod")
    jwt_algorithm: str = Field(default="HS256")
    jwt_expires_minutes: int = Field(default=120)


settings = Settings()
