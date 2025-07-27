from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException,Query
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
from websock import manager

logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Remove duplicate function - keep only one get_db
async def get_db():
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

async def get_user_id(token: str = Depends(oauth2_scheme)):
    try:
        payload = decode_token(token)
        user = payload.get("user")
        if user is None or "id" not in user:
            raise HTTPException(status_code=401, detail="Invalid token: missing user id")
        return user["id"]
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/register")
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(text("SELECT * FROM admin WHERE username = :u"), {"u": data.username})
        if result.fetchone():
            raise HTTPException(status_code=409, detail="User already registered")

        hashed_password = hashed_pass(data.password)
        await db.execute(text("INSERT INTO admin (username, password, email) VALUES (:u, :p, :e)"),
                         {"u": data.username, "p": hashed_password, "e": data.email})
        await db.commit()
        return {"detail": "User successfully registered"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in register: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/login")
async def login(data: Request, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(text("SELECT * FROM admin WHERE username = :u"), {"u": data.username})
        user = result.fetchone()
        if not user:
            raise HTTPException(status_code=400, detail="Invalid username user is not registered")

        if not verify(data.password, user.password):
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in login: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.post('/userskill')
async def user_skill(data: userskill, db: AsyncSession = Depends(get_db), user_id: int = Depends(get_user_id)):
    try:
        # Check if user info already exists
        existing = await db.execute(text("SELECT userid FROM userinfo WHERE userid = :uid"), {"uid": user_id})
        if existing.fetchone():
            raise HTTPException(status_code=409, detail="User information already exists")

        await db.execute(text("INSERT INTO userinfo (userid, name, education, university) VALUES (:uid, :n, :e, :u)"),
                         {"uid": user_id, "n": data.name, "e": data.education, "u": data.university})
        await db.execute(text("INSERT INTO userskill (userid, skill) VALUES (:u, :s)"),
                         {"u": user_id, "s": data.skill})
        await db.commit()
        return {"detail": "Your information has been successfully recorded"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in user_skill: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save user information")

@app.get('/userinfo')
async def user_info(db: AsyncSession = Depends(get_db), user_id: int = Depends(get_user_id)):
    try:
        user_res = await db.execute(text("SELECT * FROM userinfo WHERE userid = :u"), {"u": user_id})
        user_row = user_res.fetchone()
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")

        skill_res = await db.execute(text("SELECT skill FROM userskill WHERE userid = :u"), {"u": user_id})
        skills = [row.skill for row in skill_res.fetchall()]

        return {
            "name": user_row.name,
            "education": user_row.education,
            "university": user_row.university,
            "skills": skills
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in user_info: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user information")

@app.post('/blogpost')
async def post_blog(data: blogdata, db: AsyncSession = Depends(get_db), user_id: int = Depends(get_user_id)):
    try:
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
    except Exception as e:
        logger.error(f"Error in post_blog: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to post blog")

@app.get("/getblog")
async def get_blog(limit: int = 10, offset: int = 0, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(text("SELECT * FROM blogpost ORDER BY id DESC LIMIT :limit OFFSET :offset"),
                                  {"limit": limit, "offset": offset})
        blogs = result.fetchall()

        blog_list = []
        for blog in blogs:
            user_res = await db.execute(text("SELECT name FROM userinfo WHERE userid = :u1"), {"u1": blog.userid})
            name_row = user_res.fetchone()
            name = name_row[0] if name_row else "Unknown"

            blog_list.append({
                "id": blog.id,
                "user_id": blog.userid,
                "name": name,
                "title": blog.title,
                "projectdetail": blog.projectdetail,
                "skill": blog.skill,
                "yourself": blog.yourself,
                "expectfrom": blog.expectfrom,  # Fixed typo: expectform -> expectfrom
                "whyjoin": blog.whyjoin,
                "youdo": blog.youdo,
                "created_at": blog.created_at if hasattr(blog, 'created_at') else None
            })

        return blog_list
    except Exception as e:
        logger.error(f"Error in /getblog: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch blogs")

@app.get("/chathistory")
async def get_chathistory(user_id_filter: int = None, db: AsyncSession = Depends(get_db), user_id: int = Depends(get_user_id)):
    try:
        if user_id_filter:
            # Get chat history with specific user
            query_received = text("""
                SELECT md.message, md.messagedate, u.name AS sender_name
                FROM messagedetail md
                JOIN userinfo u ON md.messagesentby = u.userid
                WHERE md.messagesento = :uid AND md.messagesentby = :filter_uid
                ORDER BY md.messagedate ASC
            """)
            res_received = await db.execute(query_received, {"uid": user_id, "filter_uid": user_id_filter})
            
            query_sent = text("""
                SELECT md.message, md.messagedate, u.name AS recipient_name
                FROM messagedetail md
                JOIN userinfo u ON md.messagesento = u.userid
                WHERE md.messagesentby = :uid AND md.messagesento = :filter_uid
                ORDER BY md.messagedate ASC
            """)
            res_sent = await db.execute(query_sent, {"uid": user_id, "filter_uid": user_id_filter})
        else:
            # Get all chat history
            query_received = text("""
                SELECT md.message, md.messagedate, u.name AS sender_name
                FROM messagedetail md
                JOIN userinfo u ON md.messagesentby = u.userid
                WHERE md.messagesento = :uid
                ORDER BY md.messagedate ASC
            """)
            res_received = await db.execute(query_received, {"uid": user_id})
            
            query_sent = text("""
                SELECT md.message, md.messagedate, u.name AS recipient_name
                FROM messagedetail md
                JOIN userinfo u ON md.messagesento = u.userid
                WHERE md.messagesentby = :uid
                ORDER BY md.messagedate ASC
            """)
            res_sent = await db.execute(query_sent, {"uid": user_id})

        received_messages = [
            {"message": row[0], "date": row[1].isoformat() if row[1] else None, "sent_by_name": row[2]} 
            for row in res_received.fetchall()
        ]

        sent_messages = [
            {"message": row[0], "date": row[1].isoformat() if row[1] else None, "sent_to_name": row[2]} 
            for row in res_sent.fetchall()
        ]

        return {
            "received_messages": received_messages,
            "sent_messages": sent_messages
        }
    except Exception as e:
        logger.error(f"Error in chathistory: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch chat history")

async def authenticate_websocket(token: str):
    """Authenticate WebSocket connection using token"""
    try:
        payload = decode_token(token)
        user = payload.get("user")
        if user is None or "id" not in user:
            return None
        return user["id"]
    except jwt.PyJWTError:
        return None

@app.websocket("/ws/{user_id}")
async def chat_ws(websocket: WebSocket, user_id: int, token: str = Query(...)):
    db = None
    authenticated_user_id = None
    
    try:
        # Authenticate the WebSocket connection
        authenticated_user_id = await authenticate_websocket(token)
        if not authenticated_user_id:
            await websocket.close(code=4001, reason="Authentication failed")
            return
        
        # Verify that the authenticated user ID matches the path parameter
        if authenticated_user_id != user_id:
            await websocket.close(code=4003, reason="User ID mismatch")
            return
        
        # Create database session
        db = SessionLocal()
        
        # Verify user exists in database
        user_check = await db.execute(
            text("SELECT userid FROM userinfo WHERE userid = :uid"), 
            {"uid": user_id}
        )
        if not user_check.fetchone():
            await websocket.close(code=4004, reason="User not found")
            return
        
        # Accept websocket connection
        await websocket.accept()
        await manager.connect(user_id, websocket)
        logger.info(f"WebSocket connected for user {user_id}")
        
        # Send connection confirmation
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        })

        while True:
            try:
                # Receive data from websocket
                data = await websocket.receive_json()
                logger.debug(f"Received data from user {user_id}: {data}")
                
                msg = data.get("message", "").strip()
                to_user = data.get("to_user")
                typing = data.get("typing", False)
                msg_type = data.get("type", "message")

                # Handle typing indicator
                if typing or msg_type == "typing":
                    if to_user:
                        await manager.send_personal_message(to_user, json.dumps({
                            "type": "typing",
                            "from_user": user_id,
                            "timestamp": datetime.utcnow().isoformat()
                        }))
                    continue

                # Validate message data for regular messages
                if msg_type == "message":
                    if not msg or not to_user:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Message and recipient are required",
                            "timestamp": datetime.utcnow().isoformat()
                        })
                        continue

                    # Verify recipient exists
                    recipient_check = await db.execute(
                        text("SELECT userid FROM userinfo WHERE userid = :uid"), 
                        {"uid": to_user}
                    )
                    if not recipient_check.fetchone():
                        await websocket.send_json({
                            "type": "error",
                            "message": "Recipient not found",
                            "timestamp": datetime.utcnow().isoformat()
                        })
                        continue

                    # Save message to database
                    try:
                        stmt = insert(MessageDetail).values(
                            messagesentby=user_id,
                            messagesento=to_user,
                            message=msg,
                            messagedate=datetime.utcnow()
                        )
                        await db.execute(stmt)
                        await db.commit()
                        logger.info(f"Message saved: {user_id} -> {to_user}: {msg[:50]}...")
                    except Exception as db_error:
                        logger.error(f"Database error saving message: {db_error}")
                        await db.rollback()
                        await websocket.send_json({
                            "type": "error",
                            "message": "Failed to save message",
                            "timestamp": datetime.utcnow().isoformat()
                        })
                        continue

                    # Send message to recipient
                    message_data = {
                        "type": "message",
                        "from_user": user_id,
                        "message": msg,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    
                    success = await manager.send_personal_message(to_user, json.dumps(message_data))
                    
                    # Send confirmation back to sender
                    await websocket.send_json({
                        "type": "message_sent",
                        "success": success,
                        "to_user": to_user,
                        "message": msg,
                        "timestamp": datetime.utcnow().isoformat()
                    })

            except json.JSONDecodeError as json_error:
                logger.error(f"Invalid JSON received from user {user_id}: {json_error}")
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format",
                    "timestamp": datetime.utcnow().isoformat()
                })
            except Exception as e:
                logger.error(f"Error processing message from user {user_id}: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": "Failed to process message",
                    "timestamp": datetime.utcnow().isoformat()
                })
                if db:
                    await db.rollback()

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected normally for user {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        try:
            await websocket.close(code=4000, reason=f"Server error: {str(e)}")
        except:
            pass
    finally:
        if authenticated_user_id:
            manager.disconnect(authenticated_user_id)
        if db:
            await db.close()
        logger.info(f"WebSocket cleanup completed for user {user_id}")

# Test endpoint to verify WebSocket authentication
@app.get("/ws-auth-test")
async def websocket_auth_test(token: str = Depends(oauth2_scheme)):
    try:
        user_id = await get_user_id(token)
        return {
            "message": "Token is valid for WebSocket connection",
            "user_id": user_id,
            "ws_url": f"ws://127.0.0.1:8000/ws/{user_id}?token={token}"
        }
    except HTTPException as e:
        raise e

# Add connection status endpoint
@app.get("/ws-status/{user_id}")
async def websocket_status(user_id: int):
    """Check if user is connected via WebSocket"""
    is_connected = manager.is_user_connected(user_id)  # You'll need to implement this in your manager
    return {
        "user_id": user_id,
        "connected": is_connected,
        "timestamp": datetime.utcnow().isoformat()
    }

# Health check with WebSocket info
@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "websocket_endpoint": "/ws/{user_id}?token=YOUR_TOKEN",
        "timestamp": datetime.utcnow().isoformat()
    }