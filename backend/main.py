from fastapi import FastAPI,WebSocketDisconnect
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
from schemas import userskill
from fastapi.security import OAuth2PasswordBearer
from schemas import blogdata
from typing import List
from websock import manager
from fastapi import WebSocket
from datetime import datetime
import json
from sqlalchemy import insert
from sqlalchemy.future import select
from db import MessageDetail

from config import  Config
import jwt
from utils import decode_token
from fastapi import Query
import logging
logger = logging.getLogger(__name__)

refresh_token_expiry=1
out2_scheme=OAuth2PasswordBearer('login')

async def get_user_id(token:str=Depends(out2_scheme)):
    try:
        payload = decode_token(token)
        user_id = payload.get("user")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token: missing user id")
        return user_id["id"]
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
  




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
        if(verify(data.password,user[2])):
            access_token=create_access_token(
                user_data={
                    'username':data.username,
                    'id':user[0]
                }
            )
            refresh_token=create_access_token(
                user_data={
                    'username':data.username,
                    'id':user[0]
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
                             "id":user[0]
                         }
                         })
        else:
            return HTTPException(status_code=400,detail="Invalid password")
    else:
        return HTTPException(status_code=400,detail="invalid username user is not registered")
    



@app.post('/userskill')
async def user_skill(data:userskill,db:AsyncSession=Depends(get_db),user_id:int=Depends(get_user_id)):
    query=text("INSERT INTO userinfo (userid,name,education,university) VALUES (:uid,:n,:e,:u)")

    result1= await db.execute(query,{"uid":user_id,"n":data.name,"e":data.education,"u":data.university})
    query1=text("INSERT INTO userskill (userid,skill) values(:u,:s)")
    result2=await db.execute(query1,{"u":user_id,"s":data.skill})
    await db.commit()
    if result1 and result2:
        return {"detail":"your information has been sucessfully recorded"}
   
@app.get('/userinfo')
async def user_info(db:AsyncSession=Depends(get_db),user_id:int=Depends(get_user_id)):
    query1=text("SELECT * FROM userinfo where userid=:u")
    query2=text("SELECT skill from userskill where userid=:u")
    res=await db.execute(query1,{"u":user_id})
    user_row=res.fetchone()
    res1=await db.execute(query2,{"u":user_id})
    skillrow=res1.fetchall()
    if not user_row:
        return JSONResponse(status_code=404, content={"detail": "User not found"})

    
    skills = [row.skill for row in skillrow]

    return JSONResponse(
        content={
            "name": user_row.name,
            "education": user_row.education,
            "university": user_row.university,
            "skills": skills
        }
        )

@app.post('/blogpost')
async def postblog(data:blogdata,db:AsyncSession=Depends(get_db),user_id:int=Depends(get_user_id)):
    query1=text("INSERT INTO blogpost (userid,title,yourself,projectdetail,skill,youdo,expectfrom,whyjoin) values (:u,:t,:y,:p,:s,:ud,:ex,:wj)")
    result= await db.execute(query1,{"u":user_id,"t":data.title,"y":data.yourself,"p":data.detail,"s":data.skill,"ud":data.youdo,"ex":data.expectfrom,"wj":data.whyjoin})
    await db.commit()

    if result:
        return {"detail":"your information has been posted"}
    

from fastapi import Query

@app.get("/getblog")
async def get_blog(db: AsyncSession = Depends(get_db)):
    try:
        query = text("SELECT * FROM blogpost ORDER BY id LIMIT :limit OFFSET :offset")
        result = await db.execute(query, {"limit": 10, "offset": 0})
        blogs = result.fetchall()

        blog_list = []
        for blog in blogs:
            user_id = blog.userid 
            user_query = text("SELECT name FROM userinfo WHERE userid = :u1")
            user_result = await db.execute(user_query, {"u1": user_id})
            name_row = user_result.fetchone()

            if name_row:
                name = name_row[0]
            else:
                name = "Unknown"

            blog_list.append({
                "user_id": user_id,
                "name": name,
                "title": blog.title,
                "projectdetail": blog.projectdetail,
                "skill": blog.skill,
                "yourself":blog.yourself,
                "expectform":blog.expectfrom,
                "whyjoin":blog.whyjoin,
                "youdo":blog.youdo

            })

        return blog_list

    except Exception as e:
        logger.error(f"Error in /getblog: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Something went wrong")






    
@app.get("/chathistory")
async def get_chathistory(
    db: AsyncSession = Depends(get_db),
    id1: int = Depends(get_user_id)  # this is current logged-in user
):
    # Fe
    query_received = text("""
        SELECT md.message, md.messagedate, u.name AS sender_name
        FROM messagedetail md
        JOIN userinfo u ON md.messagesentby = u.id
        WHERE md.messagesentto = :uid
    """)
    res_received = await db.execute(query_received, {"uid": id1})
    received_messages = [
        {
            "message": row[0],
            "date": row[1],
            "sent_by_name": row[2]
        } for row in res_received.fetchall()
    ]

    
    query_sent = text("""
        SELECT md.message, md.messagedate, u.name AS recipient_name
        FROM messagedetail md
        JOIN userinfo u ON md.messagesentto = u.id
        WHERE md.messagesentby = :uid
    """)
    res_sent = await db.execute(query_sent, {"uid": id1})
    sent_messages = [
        {
            "message": row[0],
            "date": row[1],
            "sent_to_name": row[2]
        } for row in res_sent.fetchall()
    ]

    return {
        "received_messages": received_messages,
        "sent_messages": sent_messages
    }


# main.py or chat.py
@app.websocket("/ws/{user_id}")
async def chat_ws(websocket: WebSocket, user_id: int, db: AsyncSession = Depends(get_db)):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            msg = data.get("message")
            to_user = data.get("to_user")
            typing = data.get("typing")

            # Typing indicator
            if typing:
                await manager.send_personal_message(to_user, json.dumps({
                    "type": "typing",
                    "from_user": user_id
                }))
                continue

            # Save message
            stmt = insert(MessageDetail).values(
                messagesentby=user_id,
                messagesentto=to_user,
                message=msg,
                messagedate=datetime.utcnow()
            )
            await db.execute(stmt)
            await db.commit()

            # Push to recipient
            await manager.send_personal_message(to_user, json.dumps({
                "type": "message",
                "from_user": user_id,
                "message": msg
            }))

    except WebSocketDisconnect:
        manager.disconnect(user_id)

