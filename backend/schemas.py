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

class userskill(BaseModel):
    name:str
    education:str
    university:str
    skill:str

class blogdata(BaseModel):
    title:str
    yourself:str
    detail:str
    skill:str
    youdo:str
    expectfrom:str
    whyjoin:str

