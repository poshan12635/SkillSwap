from fastapi import FastAPI
from db import SessionLocal
from sqlalchemy.orm import Session
from fastapi import Depends,Form
from sqlalchemy import text
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from utils import hashed_pass,verify
from utils import create_access_token,decode_token
from datetime import timedelta
from fastapi.responses import JSONResponse
from dependency import accessTOkenBearer
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from schemas import RegisterRequest,Request
from schemas import passwordReset


refresh_token_expiry=2


async def get_db():
    async with SessionLocal() as db:
        yield db


app=FastAPI()



app.add_middleware(
    CORSMiddleware,
      allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],

)


@app.post("/register")
async def register(data:RegisterRequest,
    db: AsyncSession = Depends(get_db)
   
):
    
    query = text("SELECT * FROM admin WHERE username = :u")
    result = await db.execute(query, {"u": data.username})
    if result.fetchone():
        raise HTTPException(status_code=409, detail="User already registered")

    
    hashed_password=hashed_pass(data.password)
    query1 = text("INSERT INTO admin (username, password, email) VALUES (:u, :p, :e)")
    await db.execute(query1, {"u": data.username, "p": hashed_password, "e": data.email})
    await db.commit()

    return {"detail": "User successfully registered"}

    

@app.post("/login")
async def login(data:Request,db:AsyncSession=Depends(get_db)):
    query=text("SELECT * FROM admin WHERE username=:u")
    result= await db.execute(query,{"u":data.username})
    user= result.fetchone()

    if result:
        if(verify(data.password,user[1])):
            access_token=create_access_token(
                user_data={
                    'username':data.username,
                    'password':data.password
                }
            )
            refresh_token=create_access_token(
                user_data={
                    'username':data.username,
                    'password':data.password
                },
                refresh=True,
                expiry=timedelta(days=refresh_token_expiry)
            )
            return JSONResponse(
                content={"message":"login sucess",
                         "access_token":access_token,
                         "refresh_token":refresh_token,
                         "user":{
                             "username":data.username,
                             "password":user.password
                         }
                         })
        else:
            return HTTPException(status_code=400,detail="Invalid password")
    else:
        return HTTPException(status_code=400,detail="invalid username user is not registered")
    



@app.post('/passwordreset')
async def password_reser(data:passwordReset):
    pass
    