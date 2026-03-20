import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

router = APIRouter()
gemini_service = GeminiService()

@router.websocket("/ws/tutor")
async def websocket_tutor(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection opened at /ws/tutor")
    
    try:
        while True:
            # Receive base64 image data
            data = await websocket.receive_text()
            logger.info("Image received over WebSocket")
            
            try:
                # Call the AI service
                reply_text = await gemini_service.get_tutor_hint(data)
                logger.info(f"Gemini replies: {reply_text}")
                
                # Check response logic and possibly send hint back
                if reply_text != "EMPTY_RESPONSE":
                    await websocket.send_text(reply_text)
                    logger.info(f"Hint sent back to client: {reply_text}")
                    
            except Exception as e:
                logger.error(f"Failed to process image and get hint: {e}")
                await websocket.send_text("Error: Could not process request from AI Tutor.")
                
    except WebSocketDisconnect:
        logger.info("WebSocket connection closed")
