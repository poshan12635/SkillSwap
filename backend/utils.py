from passlib.context import CryptContext
import jwt
from config import Config
from datetime import timedelta,datetime
import uuid
import logging



access_token_expiry=3600


pwd_content=CryptContext(schemes=["bcrypt"],deprecated="auto")

def hashed_pass(password:str)->str:
    return pwd_content.hash(password)



def verify(plain:str,hash:str):
    return pwd_content.verify(plain,hash)



def create_access_token(user_data:dict,expiry:timedelta=None,refresh:bool=False):
    payload={}
    payload['user']=user_data
    payload['exp']=datetime.now() +(expiry if expiry is not None else timedelta(seconds=access_token_expiry))
    payload['jti']=str(uuid.uuid4())
    payload['refresh']=refresh

    token=jwt.encode(payload=payload,
                     algorithm=Config.algorithim,
                     key=Config.secret_key)
    return token


def decode_token(token:str)->dict:
    try:
          token_data=jwt.decode(
        jwt=token,
        algorithms=Config.algorithim,
        key=Config.secret_key
    )
          return token_data
    except jwt.PyJWKError as e:
        logging.exception(e)
        return None
  