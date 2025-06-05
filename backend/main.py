from fastapi import FastAPI
from db import SessionLocal
from sqlalchemy.orm import Session
from fastapi import Depends,Form
from sqlalchemy import text
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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
    query1 = text("INSERT INTO admin (username, password, email) VALUES (:u, :p, :e)")
    await db.execute(query1, {"u": username, "p": password, "e": email})
    await db.commit()

    return {"detail": "User successfully registered"}

    
        