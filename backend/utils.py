from passlib.context import CryptContext

pwd_content=CryptContext(schemes=["bcrypt"],deprecated="auto")

def hashed_pass(password:str)->str:
    return pwd_content.hash(password)



def verify(plain:str,hash:str):
    return pwd_content.verify(plain,hash)