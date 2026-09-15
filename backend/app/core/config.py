"""
Configuración central de la aplicación.
Lee variables de entorno desde el archivo .env
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Configuración de la aplicación con valores por defecto."""
    
    # Base de datos
    DATABASE_URL: str = "postgresql+psycopg2://clinica:clinica_secret_2026@db:5432/clinica_podologia"
    
    # Seguridad JWT
    SECRET_KEY: str = "cambiar-en-produccion-usar-uuid-aleatorio-de-32-caracteres"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 horas
    
    # Entorno
    ENVIRONMENT: str = "development"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()  # Cachea la configuración para no leer el archivo en cada petición
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
