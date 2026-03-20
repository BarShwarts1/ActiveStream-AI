from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    # Added LOCAL_IP so the user can easily define their PC's IP network wide globally
    LOCAL_IP: str = "192.168.1.xxx"
    
    # Allows loading from a local .env file
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
