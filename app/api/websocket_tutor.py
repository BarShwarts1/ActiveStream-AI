import logging
import json
from typing import Dict, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

router = APIRouter()
gemini_service = GeminiService()

class ConnectionManager:
    def __init__(self):
        self.active_rooms: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_rooms:
            self.active_rooms[room_id] = []
        self.active_rooms[room_id].append(websocket)
        logger.info(f"Client joined room: {room_id}")
        
        # Notify existing clients that a new device connected
        try:
            await self.broadcast(json.dumps({"type": "device_connected", "role": "writer"}), room_id, exclude=websocket)
        except Exception as e:
            logger.error(f"Error broadcasting connection event: {e}")

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_rooms:
            if websocket in self.active_rooms[room_id]:
                self.active_rooms[room_id].remove(websocket)
            if not self.active_rooms[room_id]:
                del self.active_rooms[room_id]
        logger.info(f"Client disconnected from room: {room_id}")

    async def broadcast(self, message: str, room_id: str, exclude: WebSocket = None):
        if room_id in self.active_rooms:
            for connection in self.active_rooms[room_id]:
                if connection != exclude:
                    try:
                        await connection.send_text(message)
                    except Exception as e:
                        logger.error(f"Error sending message to client in room {room_id}: {e}")

manager = ConnectionManager()

@router.websocket("/ws/tutor/{lesson_id}")
async def websocket_tutor(websocket: WebSocket, lesson_id: str):
    await manager.connect(websocket, lesson_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            
            try:
                msg = json.loads(data)
                msg_type = msg.get("type")
                device_type = msg.get("device", "Unknown Node")
                
                logger.info(f"[{msg_type.upper()} UPDATE] | Received from: {device_type.upper()} | Room: {lesson_id}")
                
                if msg_type in ["paths", "stroke", "clear", "evaluate_canvas", "sync_prompt", "chat_message"]:
                    # Hybrid Multi-Node Relay Pattern
                    if msg_type in ["stroke", "paths", "sync_prompt", "clear"]:
                        await manager.broadcast(data, lesson_id, exclude=websocket)
                    
                    elif msg_type == "evaluate_canvas":
                        logger.info("Evaluating canvas with Gemini natively...")
                        await manager.broadcast(json.dumps({"type": "ai_evaluating"}), lesson_id)
                        
                        image_base64 = msg.get("image")
                        prompt_text = msg.get("prompt", "Analyze the drawing.")
                        reply_text = await gemini_service.evaluate(image_base64, prompt_text)
                        
                        if reply_text:
                            logger.info("Genuine AI JSON evaluated successfully.")
                            try:
                                parsed = json.loads(reply_text)
                                hint_msg = json.dumps({
                                    "type": "ai_feedback", 
                                    "status": parsed.get("status", "hint"), 
                                    "message": parsed.get("message", "Could not parse message.")
                                })
                                await manager.broadcast(hint_msg, lesson_id)
                            except json.JSONDecodeError:
                                logger.error(f"Gemini returned invalid JSON: {reply_text}")

                    elif msg_type == "chat_message":
                        text = msg.get("text", "")
                        timestamp = msg.get("timestamp", 0)
                        
                        logger.info(f"Processing chat message at {timestamp}s...")
                        print(f"DEBUG: Fetching context for lesson {lesson_id} at time {timestamp}")
                        
                        reply_text = await gemini_service.chat(text, lesson_id, float(timestamp))
                        
                        chat_res = json.dumps({
                            "type": "chat_response",
                            "text": reply_text
                        })
                        await websocket.send_text(chat_res)
                        
            except json.JSONDecodeError:
                logger.error(f"Received non-JSON message in room {lesson_id}, ignoring payload.")
            except Exception as e:
                logger.error(f"Failed to process generic WS payload for room {lesson_id}: {e}")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, lesson_id)
