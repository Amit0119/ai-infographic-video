import os
import json
import asyncio
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import google.generativeai as genai
import edge_tts
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI()

# Enable CORS for Remotion frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def generate_tts(text: str, output_path: str):
    """Generate TTS audio from text and save to output_path."""
    communicate = edge_tts.Communicate(text, "en-US-AriaNeural")
    await communicate.save(output_path)

@app.post("/analyze")
async def analyze_data(file: UploadFile = File(...)):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is missing in environment variables.")
    
    try:
        # Read uploaded Excel file using pandas
        contents = await file.read()
        import io
        df = pd.read_excel(io.BytesIO(contents))
        csv_data = df.to_csv(index=False)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read Excel file: {e}")

    # Prompt Gemini to generate scenes according to the strict frontend schema
    prompt = f"""
    You are an expert data analyst and video producer. Analyze the following corporate sales data provided as CSV:
    {csv_data}

    Generate a strict JSON array of scene objects for a Remotion video storyboard.
    Every scene MUST have the following keys: `id` (number), `durationInSeconds` (number), and `narration` (string script to be spoken).
    
    Choose one of the following scene types for each scene and include its specific required keys:
    
    1. type: "title"
       - title (string)
       - subtitle (string, optional)
    
    2. type: "kpi"
       - metric (string, e.g., "Total Revenue")
       - value (number)
       - unit (string, e.g., "M", "%")
       - prefix (string, optional, e.g., "$")
       - growth (number)
       - growthLabel (string, optional, e.g., "vs last year")
       
    3. type: "bar_chart"
       - title (string)
       - items (array of objects with `name` (string) and `value` (number))
       
    4. type: "line_chart"
       - title (string)
       - items (array of objects with `name` (string) and `value` (number))
       - targetItems (optional array of objects with `name` (string) and `value` (number))
       
    5. type: "highlight"
       - metric (string)
       - value (number)
       - unit (string)
       - prefix (string, optional)
       - badge (string)
       - achievement (number)
       - variance (number)
       - sentiment (string, exactly "positive" or "negative")
       
    6. type: "comparison"
       - title (string)
       - items (array of objects with `name` (string), `actual` (number), `target` (number))

    Return ONLY the valid JSON array of these scene objects, with no markdown formatting, no code blocks, and no extra text.
    """

    try:
        valid_model_name = None
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                valid_model_name = m.name
                break
                
        if not valid_model_name:
            raise HTTPException(status_code=500, detail="The provided API key lacks access to generative models with 'generateContent' capability.")
            
        model = genai.GenerativeModel(valid_model_name)
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        
        # Strip markdown code blocks if Gemini accidentally includes them
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:].strip()
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3].strip()

        generated_scenes = json.loads(raw_text)
        
        # Wrap inside the global storyboard structure expected by Remotion
        storyboard_data = {
            "video": {
                "title": "FY2026 Sales Performance",
                "fps": 30,
                "width": 1920,
                "height": 1080
            },
            "style": {
                "background": "#0f172a",
                "primary": "#38bdf8",
                "secondary": "#818cf8",
                "textPrimary": "#ffffff",
                "textSecondary": "#94a3b8",
                "fontFamily": "Inter"
            },
            "scenes": generated_scenes
        }

        return storyboard_data

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {e}")

@app.post("/approve")
async def approve_storyboard(storyboard_data: dict):
    try:
        # Save storyboard.json to frontend src/data directory
        absolute_storyboard_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src", "data", "storyboard.json"))
        os.makedirs(os.path.dirname(absolute_storyboard_path), exist_ok=True)
        with open(absolute_storyboard_path, "w", encoding="utf-8") as f:
            json.dump(storyboard_data, f, indent=2)

        # Ensure public directory exists with a strict absolute path
        absolute_public_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public"))
        os.makedirs(absolute_public_dir, exist_ok=True)
        
        # Process TTS for each scene concurrently
        tasks = []
        scenes = storyboard_data.get('scenes', [])
        
        for scene in scenes:
            scene_id = scene.get('id')
            narration = scene.get('narration')
            
            if scene_id is not None and narration:
                audio_filename = f"scene_{scene_id}.mp3"
                audio_path = os.path.abspath(os.path.join(absolute_public_dir, audio_filename))
                tasks.append(generate_tts(narration, audio_path))
            else:
                print(f"Warning: Scene {scene_id} is missing narration or ID.")

        if tasks:
            await asyncio.gather(*tasks)

        return {"status": "success", "message": "Storyboard approved and scene audio tracks generated successfully!"}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Approval pipeline error: {e}")

@app.post("/edit")
async def edit_storyboard(payload: dict):
    storyboard_data = payload.get("storyboard")
    instruction = payload.get("instruction")
    
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is missing in environment variables.")
        
    prompt = f"""
    You are an expert video producer. I am providing you with the current JSON state of a Remotion video storyboard.
    The user has requested the following natural language edit:
    "{instruction}"
    
    Current Storyboard JSON:
    {json.dumps(storyboard_data, indent=2)}
    
    Please apply the requested edits to the scenes. 
    You MUST maintain the exact same strict Remotion-compatible JSON schema.
    Every scene MUST still have `id`, `durationInSeconds`, and `narration`, along with the specific properties for its type (e.g., `title`, `metric`, `items`, etc.).
    Do not change the root structure (`video`, `style`, `scenes`).
    
    Return ONLY the completely updated full JSON object, with no markdown formatting, no code blocks, and no extra text.
    """

    try:
        valid_model_name = None
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                valid_model_name = m.name
                break
                
        if not valid_model_name:
            raise HTTPException(status_code=500, detail="The provided API key lacks access to generative models with 'generateContent' capability.")
            
        model = genai.GenerativeModel(valid_model_name)
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        
        # Strip markdown code blocks if Gemini accidentally includes them
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:].strip()
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3].strip()

        updated_storyboard = json.loads(raw_text)
        
        # Robustness check: if it returned just the scenes array
        if isinstance(updated_storyboard, list):
            storyboard_data["scenes"] = updated_storyboard
            return storyboard_data
        elif "scenes" in updated_storyboard:
            return updated_storyboard
        else:
            raise Exception("AI returned an invalid JSON structure (missing 'scenes' array).")

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Editing pipeline error: {e}")

# Mount static files at the root
from fastapi.staticfiles import StaticFiles
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")