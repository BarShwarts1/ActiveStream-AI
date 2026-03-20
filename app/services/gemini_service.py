import base64
import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are a private tutor observing a student solving a problem. "
    "Analyze the steps in the provided image. If the steps are logical, "
    "return EXACTLY the word 'EMPTY_RESPONSE'. If there is a logical error, "
    "provide a very short, 1-sentence hint. Do NOT give the final answer."
)

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not set. Gemini API calls will likely fail.")
        
        self.system_prompt = SYSTEM_PROMPT
        
        # Pointing explicitly to v1beta and gemini-2.5-flash via REST 
        # to bypass your system's Python 3.8 SDK limitation.
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.api_key}"
        
        logging.info("Gemini Service initialized with model: gemini-2.5-flash")

    async def get_tutor_hint(self, base64_image: str) -> str:
        """
        Processes a Base64-encoded image and queries the Gemini model.
        Returns the specific hint text or EMPTY_RESPONSE.
        """
        try:
            # Base64 Cleaning
            if "," in base64_image:
                cleaned_base64 = base64_image.split(",", 1)[1]
            else:
                cleaned_base64 = base64_image
                
            # Error Logging: Print first 50 chars to verify prefix is gone
            print(f"Cleaned Base64 (first 50): {cleaned_base64[:50]}...")
            
            # Correct Content Format mapping
            # The user's Python pseudo-code maps perfectly to this raw JSON payload:
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": self.system_prompt},
                            {
                                "inlineData": {
                                    "mimeType": "image/jpeg",
                                    "data": cleaned_base64
                                }
                            }
                        ]
                    }
                ]
            }
            
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(self.url, json=payload, timeout=30.0)
                    response.raise_for_status()
                    
                    data = response.json()
                    
                    # Extract text from response
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "").strip()
                    
                    return "EMPTY_RESPONSE"
            
            except Exception as e:
                # User's explicitly requested error logging wrapper
                print(f"Gemini API Error: {e}")
                
                # Capture and log specific HTTP details to debug Bad Requests if they persist
                if hasattr(e, 'response') and e.response is not None:
                    print(f"Gemini API Error Details: {e.response.text}")
                
                # Check if it is a 404, specifically logging that the model name might be wrong
                if "404" in str(e):
                    logger.error("Model Not Found (404). The model name might be wrong or unauthorized.")
                
                raise e

        except Exception as e:
            logger.error(f"Error in Gemini inference preprocessing: {e}")
            raise e
