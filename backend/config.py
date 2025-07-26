from pydantic_settings import BaseSettings,SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL:str
    algorithim:str
    secret_key:str
    MAIL_USERNAME:str
    MAIL_PASSWORD:str
    MAIL_FROM:str
    MAIL_PORT:int
    MAIL_SERVER :str
    Mail_FROM_NAME:str
    

    model_config=SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


Config=Settings()