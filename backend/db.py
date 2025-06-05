from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker,declarative_base
from config import Config
import asyncpg
from sqlalchemy.ext.asyncio import AsyncSession


username=Config.data_base_username
password=Config.data_base_password
database=Config.data_base_type
database_name=Config.data_base_name

database_url=f"{database}+asyncpg://{username}:{password}@localhost/{database_name}"

engine=create_async_engine(database_url,echo=True)
base=declarative_base()

SessionLocal=sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
