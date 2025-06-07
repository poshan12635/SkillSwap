from fastapi import FastAPI
from db import SessionLocal
from sqlalchemy.orm import Session
from fastapi import Depends,Form
from sqlalchemy import text
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from utils import hashed_pass,verify


async def get_db():
    async with SessionLocal() as db:
        yield db


app=FastAPI()


@app.post("/register")
async def register(
    db: AsyncSession = Depends(get_db),
    username: str = Form(...),
    password: str = Form(...),
    email: str = Form(...)
):
    # Check if user exists
    query = text("SELECT * FROM admin WHERE username = :u")
    result = await db.execute(query, {"u": username})
    if result.fetchone():
        raise HTTPException(status_code=409, detail="User already registered")

    # Insert new user
    hashed_password=hashed_pass(password)
    query1 = text("INSERT INTO admin (username, password, email) VALUES (:u, :p, :e)")
    await db.execute(query1, {"u": username, "p": hashed_password, "e": email})
    await db.commit()

    return {"detail": "User successfully registered"}

    

@app.post("/login")
async def login(db:AsyncSession=Depends(get_db),username:str=Form(...),password:str=Form(...)):
    query=text("SELECT * FROM admin WHERE username=:u")
    result= await db.execute(query,{"u":username})
    user=result.fetchone()

    if result:
        if(verify(password,user.password)):
            return {"detail":f"welcome {username} credential valid"}
        else:
            return HTTPException(status_code=400,detail="Invalid password")
    else:
        return HTTPException(status_code=400,detail="invalid username user is not registered")