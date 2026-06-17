from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    app_name: str = "Voltwise API"
    environment: str = "development"
    database_url: str = "sqlite:///./voltwise.db"
    secret_key: str = "voltwise-dev-secret-change-in-production"
    admin_api_key: str = "voltwise-admin-change-me"
    access_token_expire_minutes: int = 60 * 24 * 7
    cors_origins: list[str] = ["http://localhost:8000", "http://127.0.0.1:8000"]
    rate_day: float = 2.40
    rate_night: float = 1.45
    co2_per_kwh: float = 0.44
    ref_kwh: float = 520.0


settings = Settings()
