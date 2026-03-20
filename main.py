import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.websocket_tutor import router as tutor_router

# Setup global logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(title="ActiveStream AI", description="Backend for real-time AI Tutor.")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the WebSocket tutor router
app.include_router(tutor_router)

logger.info("ActiveStream AI backend started.")
