import logging
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import subprocess
from supabase import create_client, Client
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

class LessonUpload(BaseModel):
    title: str
    video_url: str
    course_id: str

class EnrollPayload(BaseModel):
    course_id: str
    user_id: str
    full_name: str = "Student"

def start_transcription_pipeline(lesson_id: str, video_url: str):
    logger.info(f"[{lesson_id}] Executing ingestion subprocess for URL: {video_url}")
    
    sb_url = os.getenv("SUPABASE_URL")
    sb_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not sb_url or not sb_key:
        logger.error("Supabase credentials missing for background task.")
        return
        
    supabase: Client = create_client(sb_url, sb_key)
    
    try:
        # Flag structural lock
        supabase.table("lessons").update({"transcription_status": "processing"}).eq("id", lesson_id).execute()
        
        # Resolve script path
        script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scripts", "ingest_transcript.py")
        
        logger.info(f"Executing: python {script_path} --lesson-id {lesson_id} --url {video_url}")
        
        # Block subprocess execution securely preventing memory leaks
        result = subprocess.run(
            ["python", script_path, "--lesson-id", lesson_id, "--url", video_url],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            logger.info(f"[{lesson_id}] Subprocess Result:\n{result.stdout}")
            supabase.table("lessons").update({"transcription_status": "completed"}).eq("id", lesson_id).execute()
        else:
            logger.error(f"[{lesson_id}] Subprocess Failure:\n{result.stderr}")
            supabase.table("lessons").update({"transcription_status": "failed"}).eq("id", lesson_id).execute()
            
    except Exception as e:
        logger.error(f"[{lesson_id}] Pipeline hard-crash: {str(e)}")
        supabase.table("lessons").update({"transcription_status": "failed"}).eq("id", lesson_id).execute()

@app.post("/api/lessons/upload")
async def upload_lesson(payload: LessonUpload, background_tasks: BackgroundTasks):
    sb_url = os.getenv("SUPABASE_URL")
    sb_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not sb_url or not sb_key:
        logger.error("Database configuration missing.")
        raise HTTPException(status_code=500, detail="Database configuration missing")
        
    supabase: Client = create_client(sb_url, sb_key)
    
    try:
        # Insert relational lesson record into Supabase PostgreSQL
        response = supabase.table("lessons").insert({
            "title": payload.title,
            "video_url": payload.video_url,
            "course_id": payload.course_id,
            "transcription_status": "pending"
        }).execute()
        
        if not response.data:
            raise Exception("Failed to insert record into Supabase.")
            
        new_lesson_id = response.data[0]["id"]
        
        # Dispatch transcription safely out of the immediate UI thread
        background_tasks.add_task(start_transcription_pipeline, new_lesson_id, payload.video_url)
        
        return {"status": "success", "lesson_id": new_lesson_id, "transcription": "queued"}
    except Exception as e:
        logger.error(f"Failed to create lesson: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/enroll", status_code=201)
async def enroll_user(payload: EnrollPayload):
    sb_url = os.getenv("SUPABASE_URL")
    sb_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not sb_url or not sb_key:
        logger.error("Database configuration missing.")
        raise HTTPException(status_code=500, detail="Database configuration missing")
        
    supabase: Client = create_client(sb_url, sb_key)
    
    try:
        # Check if already enrolled to prevent duplicates
        existing = supabase.table("enrollments").select("id").eq("user_id", payload.user_id).eq("course_id", payload.course_id).execute()
        if existing.data and len(existing.data) > 0:
            return {"status": "success", "message": "Already enrolled"}
            
        # Upsert user to solve foreign key constraint missing auth user trigger
        supabase.table("users").upsert({"id": payload.user_id, "role": "student", "name": payload.full_name}).execute()
        
        print(f"DEBUG: Enrolling User {payload.user_id} into Course {payload.course_id}")
        course_check = supabase.table("courses").select("id").eq("id", payload.course_id).execute()
        if not course_check.data:
            raise HTTPException(status_code=404, detail="Course ID does not exist in DB")
            
        # Simulate Purchase and execute Database overrides securely
        res = supabase.table("enrollments").insert({"user_id": payload.user_id, "course_id": payload.course_id}).execute()
        print(f"DEBUG: Supabase Insert Result: {res}")
        
        if not res.data:
            raise Exception("Failed to insert enrollment record into Supabase.")
            
        return {"status": "success", "message": "Enrollment completed successfully"}
    except Exception as e:
        logger.error(f"Failed to process enrollment. Full error: {repr(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

logger.info("ActiveStream AI backend started.")
