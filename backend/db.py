from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from config import Config
from sqlalchemy import Column,Integer,String,ForeignKey,DATETIME
from datetime import datetime




database_url = Config.DATABASE_URL


engine = create_async_engine(database_url, echo=True)


Base = declarative_base()



class MessageDetail(Base):
    __tablename__ = 'messagedetail'

    id = Column(Integer, primary_key=True, index=True)
    messagesentby = Column(Integer, ForeignKey("userinfo.id"))
    messagesentto = Column(Integer, ForeignKey("userinfo.id"))
    message = Column(String)
    messagedate = Column(DATETIME, default=datetime.utcnow)

SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)

