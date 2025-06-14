from pydantic_settings import BaseSettings,SettingsConfigDict

class Settings(BaseSettings):
    data_base_username:str
    data_base_password:str
    data_base_type:str
    data_base_name:str
    algorithim:str
    secret_key:str

    model_config=SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


Config=Settings()