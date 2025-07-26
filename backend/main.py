from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, insert
from datetime import datetime, timedelta
from fastapi.responses import JSONResponse
import jwt
import json
import logging

from db import SessionLocal, MessageDetail  # your SQLAlchemy async session and model
from schemas import RegisterRequest, Request, userskill, blogdata
from utils import hashed_pass, verify, create_access_token, decode_token
from websock import manager  # your websocket manager instance

logger = logging.getLogger(__name__)

app = FastAPI()

# CORS setup for your React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

async def get_user_id(token: str = Depends(oauth2_scheme)):
    try:
        payload = decode_token(token)
        user = payload.get("user")
        if user is None or "id" not in user:
            raise HTTPException(status_code=401, detail="Invalid token: missing user id")
        return user["id"]
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_db():
    async with SessionLocal() as session:
        yield session

@app.post("/register")
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT * FROM admin WHERE username = :u"), {"u": data.username})
    if result.fetchone():
        raise HTTPException(status_code=409, detail="User already registered")

    hashed_password = hashed_pass(data.password)
    await db.execute(text("INSERT INTO admin (username, password, email) VALUES (:u, :p, :e)"),
                     {"u": data.username, "p": hashed_password, "e": data.email})
    await db.commit()
    return {"detail": "User successfully registered"}

@app.post("/login")
async def login(data: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT * FROM admin WHERE username = :u"), {"u": data.username})
    user = result.fetchone()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid username user is not registered")

    if not verify(data.password, user.password):  # Adjust index as per your tuple structure
        raise HTTPException(status_code=400, detail="Invalid password")

    access_token = create_access_token(user_data={"username": data.username, "id": user.id})
    refresh_token = create_access_token(
        user_data={"username": data.username, "id": user.id},
        refresh=True,
        expiry=timedelta(days=1)
    )
    return JSONResponse(content={
        "message": "login success",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {"username": data.username, "id": user.id}
    })

@app.post('/userskill')
async def user_skill(data: userskill, db: AsyncSession = Depends(get_db), user_id: int = Depends(get_user_id)):
    await db.execute(text("INSERT INTO userinfo (userid, name, education, university) VALUES (:uid, :n, :e, :u)"),
                     {"uid": user_id, "n": data.name, "e": data.education, "u": data.university})
    await db.execute(text("INSERT INTO userskill (userid, skill) VALUES (:u, :s)"),
                     {"u": user_id, "s": data.skill})
    await db.commit()
    return {"detail": "Your information has been successfully recorded"}

@app.get('/userinfo')
async def user_info(db: AsyncSession = Depends(get_db), user_id: int = Depends(get_user_id)):
    user_res = await db.execute(text("SELECT * FROM userinfo WHERE userid = :u"), {"u": user_id})
    user_row = user_res.fetchone()
    if not user_row:
        return JSONResponse(status_code=404, content={"detail": "User not found"})

    skill_res = await db.execute(text("SELECT skill FROM userskill WHERE userid = :u"), {"u": user_id})
    skills = [row.skill for row in skill_res.fetchall()]

    return {
        "name": user_row.name,
        "education": user_row.education,
        "university": user_row.university,
        "skills": skills
    }

@app.post('/blogpost')
async def post_blog(data: blogdata, db: AsyncSession = Depends(get_db), user_id: int = Depends(get_user_id)):
    await db.execute(text(
        "INSERT INTO blogpost (userid, title, yourself, projectdetail, skill, youdo, expectfrom, whyjoin) "
        "VALUES (:u, :t, :y, :p, :s, :ud, :ex, :wj)"),
        {
            "u": user_id,
            "t": data.title,
            "y": data.yourself,
            "p": data.detail,
            "s": data.skill,
            "ud": data.youdo,
            "ex": data.expectfrom,
            "wj": data.whyjoin
        })
    await db.commit()
    return {"detail": "Your information has been posted"}

@app.get("/getblog")
async def get_blog(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(text("SELECT * FROM blogpost ORDER BY id LIMIT :limit OFFSET :offset"),
                                  {"limit": 10, "offset": 0})
        blogs = result.fetchall()

        blog_list = []
        for blog in blogs:
            user_res = await db.execute(text("SELECT name FROM userinfo WHERE userid = :u1"), {"u1": blog.userid})
            name_row = user_res.fetchone()
            name = name_row[0] if name_row else "Unknown"

            blog_list.append({
                "user_id": blog.userid,
                "name": name,
                "title": blog.title,
                "projectdetail": blog.projectdetail,
                "skill": blog.skill,
                "yourself": blog.yourself,
                "expectform": blog.expectfrom,
                "whyjoin": blog.whyjoin,
                "youdo": blog.youdo,
            })

        return blog_list
    except Exception as e:
        logger.error(f"Error in /getblog: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Something went wrong")

@app.get("/chathistory")
async def get_chathistory(db: AsyncSession = Depends(get_db), user_id: int = Depends(get_user_id)):
    query_received = text("""
        SELECT md.message, md.messagedate, u.name AS sender_name
        FROM messagedetail md
        JOIN userinfo u ON md.messagesentby = u.userid
        WHERE md.messagesento = :uid
        ORDER BY md.messagedate ASC
    """)
    res_received = await db.execute(query_received, {"uid": user_id})
    received_messages = [
        {"message": row[0], "date": row[1], "sent_by_name": row[2]} for row in res_received.fetchall()
    ]

    query_sent = text("""
        SELECT md.message, md.messagedate, u.name AS recipient_name
        FROM messagedetail md
        JOIN userinfo u ON md.messagesento = u.userid
        WHERE md.messagesentby = :uid
        ORDER BY md.messagedate ASC
    """)
    res_sent = await db.execute(query_sent, {"uid": user_id})
    sent_messages = [
        {"message": row[0], "date": row[1], "sent_to_name": row[2]} for row in res_sent.fetchall()
    ]

    return {
        "received_messages": received_messages,
        "sent_messages": sent_messages
    }

@app.websocket("/ws/{user_id}")
async def chat_ws(websocket: WebSocket, user_id: int, db: AsyncSession = Depends(get_db)):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            msg = data.get("message")
            to_user = data.get("to_user")
            typing = data.get("typing")

            if typing:
                await manager.send_personal_message(to_user, json.dumps({
                    "type": "typing",
                    "from_user": user_id
                }))
                continue

            # Save message
            stmt = insert(MessageDetail).values(
                messagesentby=user_id,
                messagesento=to_user,
                message=msg,
                messagedate=datetime.utcnow()
            )
            await db.execute(stmt)
            await db.commit()

            # Send message to recipient
            await manager.send_personal_message(to_user, json.dumps({
                "type": "message",
                "from_user": user_id,
                "message": msg
            }))

    except WebSocketDisconnect:
        manager.disconnect(user_id)

@app.get("/contacts")
async def get_contacts(db: AsyncSession = Depends(get_db), user_id: int = Depends(get_user_id)):
    result = await db.execute(text("SELECT userid, name FROM userinfo WHERE userid != :uid"), {"uid": user_id})
    users = [{"id": row[0], "name": row[1]} for row in result.fetchall()]
    return users
