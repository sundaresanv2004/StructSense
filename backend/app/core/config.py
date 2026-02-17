from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, computed_field

class Settings(BaseSettings):
    PROJECT_NAME: str = "StructSense IoT Backend"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] | str = []

    @computed_field
    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from environment variable."""
        if isinstance(self.BACKEND_CORS_ORIGINS, str):
            # Handle comma-separated string
            return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]
        return [str(origin) for origin in self.BACKEND_CORS_ORIGINS]

    # Database
    DATABASE_URL: str

    # Security
    SECRET_KEY: str = "changethis"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore"
    )

settings = Settings()
