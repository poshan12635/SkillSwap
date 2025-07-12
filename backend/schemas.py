from pydantic import BaseModel

class Request(BaseModel):
    username:str
    password:str

class RegisterRequest(BaseModel):
    email:str
    username:str
    password:str


class JobCv(BaseModel):
    skills:str
    projectdiscrip:str

class passwordReset(BaseModel):
    email:str

    