from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENVIRONMENT: Literal["development", "production"] = "development"
    # Equivalente ao DEBUG do Django: use False em produção (validado em validate_production).
    DEBUG: bool = False
    DATABASE_URL: str
    SECRET_KEY: str = Field(
        ...,
        min_length=16,
        description="Chave JWT; em produção use 32+ caracteres aleatórios (ex.: openssl rand -hex 32).",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    # Origens CORS separadas por vírgula (ex.: https://app.exemplo.com,https://www.exemplo.com)
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    LOG_LEVEL: str = "INFO"

    @field_validator("LOG_LEVEL")
    @classmethod
    def normalize_log_level(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("CORS_ORIGINS")
    @classmethod
    def strip_cors(cls, v: str) -> str:
        return v.strip()

    @model_validator(mode="after")
    def validate_production(self):
        if self.ENVIRONMENT == "production":
            if self.DEBUG:
                raise ValueError("DEBUG não pode ser True quando ENVIRONMENT=production")
            if len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "SECRET_KEY deve ter ao menos 32 caracteres quando ENVIRONMENT=production"
                )
            if not self.CORS_ORIGINS or self.cors_origins_list() == []:
                raise ValueError(
                    "CORS_ORIGINS deve listar ao menos a origem HTTPS do frontend em produção"
                )
        return self

    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


settings = Settings()
