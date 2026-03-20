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

@router.websocket("/ws/tutor/{room_id}")
async def websocket_tutor(websocket: WebSocket, room_id: str):
    await manager.connect(websocket, room_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            
            try:
                msg = json.loads(data)
                msg_type = msg.get("type")
                device_type = msg.get("device", "Unknown Node")
                
                logger.info(f"[{msg_type.upper()} UPDATE] | Received from: {device_type.upper()} | Room: {room_id}")
                
                if msg_type in ["paths", "stroke", "clear", "image"]:
                    # Hybrid Multi-Node Relay Pattern safely resolving logic flawlessly 
                    if msg_type == "stroke" or msg_type == "paths":
                        await manager.broadcast(data, room_id, exclude=websocket)
                        
                    elif msg_type == "clear":
                        await manager.broadcast(data, room_id, exclude=websocket)
                    
                    elif msg_type == "image":
                        logger.info(f"Parsing Base64 snapshot explicitly handing over natively to Gemini APIs organically...")
                        
                        # Full Restoration: Gemini pipeline activated evaluating genuine Base64 image tokens securely
                        image_base64 = msg.get("data")
                        reply_text = await gemini_service.get_tutor_hint(image_base64)
                        
                        if reply_text != "EMPTY_RESPONSE":
                            logger.info(f"Genuine AI Hint evaluated successfully routing out correctly to active listeners.")
                            hint_msg = json.dumps({"type": "hint", "data": reply_text})
                            # Deliver natively synchronously identically cleanly functionally perfectly purely uniformly smoothly!
                            await manager.broadcast(hint_msg, room_id)
                        
            except json.JSONDecodeError:
                logger.error(f"Received non-JSON message in room {room_id}, ignoring payload.")
            except Exception as e:
                logger.error(f"Failed to process generic WS payload for room {room_id}: {e}")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
