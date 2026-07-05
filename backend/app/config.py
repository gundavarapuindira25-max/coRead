from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    redis_url: str
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str
    frontend_url: str
    secret_key: str
    google_books_api_key: str = ""
    environment: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
