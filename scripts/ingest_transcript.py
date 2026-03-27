import os
import argparse
from youtube_transcript_api import YouTubeTranscriptApi
from supabase import create_client, Client
from dotenv import load_dotenv

# Explicitly target the root .env file relative to this script's directory
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials not found in environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def extract_video_id(url: str) -> str:
    if "v=" in url:
        return url.split("v=")[1].split("&")[0]
    elif "youtu.be/" in url:
        return url.split("youtu.be/")[1].split("?")[0]
    return url

def ingest_transcript(lesson_id: str, video_url: str):
    video_id = extract_video_id(video_url)
    print(f"Fetching transcript for video ID: {video_id}")
    
    try:
        # שימוש במחלקת ה-API החדשה בגרסה 1.2.4 הדורשת אובייקט
        api = YouTubeTranscriptApi()
        transcript_list = api.list(video_id)
        
        # ניסיון למצוא תמלול בעברית (he/iw), ואם אין - באנגלית
        transcript = transcript_list.find_transcript(['he', 'iw', 'en'])
        transcript_data = transcript.fetch().to_raw_data()
        
    except Exception as e:
        print(f"Error fetching transcript: {e}")
        return

    print(f"Clearing existing transcripts for lesson {lesson_id}...")
    supabase.table("lesson_transcripts").delete().eq("lesson_id", lesson_id).execute()

    records = []
    current_chunk_text = ""
    chunk_start_time = 0.0
    CHUNK_DURATION = 30.0

    if transcript_data:
        chunk_start_time = float(transcript_data[0]["start"])

    for snippet in transcript_data:
        text = snippet["text"].replace("\n", " ").strip()
        start = float(snippet["start"])
        duration = float(snippet["duration"])

        if current_chunk_text:
            current_chunk_text += " " + text
        else:
            current_chunk_text = text

        # חלוקה לצ'אנקים של 30 שניות עבור ה-RAG
        if (start + duration - chunk_start_time) >= CHUNK_DURATION:
            records.append({
                "lesson_id": lesson_id,
                "content": current_chunk_text,
                "start_time": chunk_start_time,
                "end_time": start + duration
            })
            current_chunk_text = ""
            chunk_start_time = start + duration

    # הוספת השארית האחרונה
    if current_chunk_text:
        records.append({
            "lesson_id": lesson_id,
            "content": current_chunk_text,
            "start_time": chunk_start_time,
            "end_time": chunk_start_time + CHUNK_DURATION
        })

    print(f"Inserting {len(records)} segments into database...")
    
    batch_size = 100
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        supabase.table("lesson_transcripts").insert(batch).execute()
        
    print("Ingestion complete. The AI Tutor is now context-aware!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest YouTube transcript to Supabase")
    parser.add_argument("--lesson-id", required=True, help="Supabase UUID for the lesson")
    parser.add_argument("--url", required=True, help="YouTube Video URL")
    
    args = parser.parse_args()
    ingest_transcript(args.lesson_id, args.url)
