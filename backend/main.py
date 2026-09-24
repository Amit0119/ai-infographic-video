import os
import json
import glob
import asyncio
from contextlib import asynccontextmanager
from typing import Any, Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator, ValidationError
import pandas as pd
from google import genai
import edge_tts
from dotenv import load_dotenv

# ── Environment Setup ─────────────────────────────────────────

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# New SDK: create a module-level client (replaces genai.configure)
GEMINI_CLIENT: Optional[genai.Client] = None
if GEMINI_API_KEY:
    GEMINI_CLIENT = genai.Client(api_key=GEMINI_API_KEY)

# ── Fix 3: Cache Gemini model name at startup ─────────────────

GEMINI_MODEL: Optional[str] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: discover and cache a valid Gemini model once."""
    global GEMINI_MODEL
    if GEMINI_CLIENT:
        try:
            # New SDK: iterate via client.models.list()
            for m in GEMINI_CLIENT.models.list():
                # Filter for models that support generateContent
                if hasattr(m, 'name') and 'gemini' in m.name:
                    GEMINI_MODEL = m.name
                    break
            if GEMINI_MODEL:
                print(f"✅ Gemini model cached at startup: {GEMINI_MODEL}")
            else:
                print("⚠️  No suitable Gemini model found.")
        except Exception as e:
            print(f"⚠️  Could not cache Gemini model: {e}")
    yield  # app runs here

app = FastAPI(lifespan=lifespan)

# ── CORS ──────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Fix 2: Pydantic Schema Validation ─────────────────────────

class SceneStyleModel(BaseModel):
    backgroundColor: str
    primaryColor: str
    secondaryColor: str
    accentColor: str
    textColor: str
    subtextColor: str
    fontFamily: str
    currencySymbol: Optional[str] = ""
    companyWatermark: Optional[str] = ""

class VideoMetaModel(BaseModel):
    title: str
    fps: int
    width: int
    height: int

class StoryboardModel(BaseModel):
    video: VideoMetaModel
    style: SceneStyleModel
    scenes: list[dict[str, Any]]

    @field_validator("scenes")
    @classmethod
    def scenes_must_have_required_fields(cls, scenes):
        for i, scene in enumerate(scenes):
            for key in ("id", "durationInSeconds", "type"):
                if key not in scene:
                    raise ValueError(f"Scene {i} missing required field: '{key}'")
            if scene["type"] not in (
                "title", "kpi", "bar_chart", "line_chart", "highlight", "comparison", "bullet_points", "numbered_steps", "pie_chart", "timeline"
            ):
                raise ValueError(f"Scene {i} has unknown type: '{scene['type']}'")
        return scenes

# ── Fix 2 Helper: Parse + Validate Gemini Output ──────────────

def _strip_markdown_fences(text: str) -> str:
    """Remove accidental ```json ... ``` code fences from Gemini output."""
    text = text.strip()
    if text.startswith("```"):
        parts = text.split("```")
        text = parts[1] if len(parts) > 1 else text
        if text.startswith("json"):
            text = text[4:].strip()
    if text.endswith("```"):
        text = text[:-3].strip()
    return text

def _call_gemini_with_retry(prompt: str, max_attempts: int = 3) -> str:
    """Call Gemini with up to max_attempts retries on JSON/validation failure."""
    if not GEMINI_CLIENT or not GEMINI_MODEL:
        raise HTTPException(
            status_code=500,
            detail="No Gemini client/model available. Check your API key and restart the server."
        )
    last_error = None

    for attempt in range(1, max_attempts + 1):
        try:
            # New SDK: client.models.generate_content()
            response = GEMINI_CLIENT.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
            )
            raw = _strip_markdown_fences(response.text)
            json.loads(raw)  # Quick sanity: must be parseable JSON
            return raw
        except Exception as e:
            last_error = e
            print(f"⚠️  Gemini attempt {attempt}/{max_attempts} failed: {e}")

    raise HTTPException(
        status_code=500,
        detail=f"Gemini returned unparseable JSON after {max_attempts} attempts: {last_error}"
    )

# ── Fix 5: Stale Audio Cleanup ────────────────────────────────

def _cleanup_old_audio(public_dir: str):
    """Delete all old scene_N.mp3 files before generating new ones."""
    pattern = os.path.join(public_dir, "scene_*.mp3")
    old_files = glob.glob(pattern)
    for f in old_files:
        try:
            os.remove(f)
        except OSError as e:
            print(f"⚠️  Could not delete {f}: {e}")
    if old_files:
        print(f"🧹 Cleaned up {len(old_files)} stale audio file(s).")

# ── TTS Helper ────────────────────────────────────────────────

async def generate_tts(text: str, output_path: str):
    """Generate TTS audio from text and save to output_path."""
    communicate = edge_tts.Communicate(text, "en-US-AriaNeural")
    await communicate.save(output_path)

# ── Default Style (unified keys matching SceneStyle) ──────────

DEFAULT_STYLE = {
    "backgroundColor": "#0f172a",
    "primaryColor": "#38bdf8",
    "secondaryColor": "#818cf8",
    "accentColor": "#34d399",
    "textColor": "#ffffff",
    "subtextColor": "#94a3b8",
    "fontFamily": "Inter",
    "currencySymbol": "",
    "companyWatermark": "",
}

# ── Endpoint: /generate-explainer ───────────────────────────

class ExplainerRequestModel(BaseModel):
    topic: str
    initial_prompt: Optional[str] = None

@app.post("/generate-explainer")
async def generate_explainer(payload: ExplainerRequestModel):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is missing.")
    if not GEMINI_CLIENT or not GEMINI_MODEL:
        raise HTTPException(status_code=500, detail="No Gemini client/model available. Restart the server.")

    topic = payload.topic
    initial_prompt = payload.initial_prompt
    video_title = topic.title()

    prompt = f"""
    You are an educational scriptwriter and expert video producer.
    I need you to create a storyboard explaining the topic: "{topic}".
    
    CRITICAL SCENE COUNT CONSTRAINT:
    You MUST generate a storyboard containing strictly between 6 to 8 scenes. DO NOT generate fewer than 6 scenes. Expand on the topic naturally to reach this count.
    """

    if initial_prompt:
        prompt += f"\n    The user has provided specific instructions: {initial_prompt}. You must prioritize this instruction while writing the script.\n"

    prompt += """
    VISUAL DATA & CHART GENERATION:
    The video must be a true infographic. Stop relying only on text and bullet points. You must use dynamic visual scene types like "bar_chart", "pie_chart", "kpi", "timeline", and "comparison".
    Whenever a chart or data-driven scene is selected (like bar_chart, pie_chart, timeline), you MUST output a `chart_data` array in the JSON structure containing `label` and `value` pairs (e.g., `"chart_data": [{"label": "Marketing", "value": 30}, {"label": "IT", "value": 20}]`).

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

    3. type: "bar_chart" or "pie_chart" or "timeline"
       - title (string)
       - chart_data (array of objects with `label` (string) and `value` (number))

    4. type: "comparison"
       - title (string)
       - items (array of objects with `name` (string), `actual` (number), `target` (number))

    5. type: "bullet_points" or "numbered_steps"
       - heading (string)
       - content_points (array of strings)
       (Use these sparingly, prioritize charts!)

    Return ONLY the valid JSON array of these scene objects, with no markdown formatting, no code blocks, and no extra text.
    """

    try:
        raw_text = _call_gemini_with_retry(prompt)
        generated_scenes = json.loads(raw_text)

        storyboard_data = {
            "video": {
                "title": video_title,
                "fps": 30,
                "width": 1920,
                "height": 1080,
            },
            "style": DEFAULT_STYLE.copy(),
            "scenes": generated_scenes,
        }

        StoryboardModel.model_validate(storyboard_data)
        return storyboard_data

    except HTTPException:
        raise
    except ValidationError as e:
        raise HTTPException(status_code=500, detail=f"AI returned invalid storyboard schema: {e}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Explainer pipeline error: {e}")

# ── Endpoint: /analyze ────────────────────────────────────────

@app.post("/analyze")
async def analyze_data(
    file: UploadFile = File(...),
    initial_prompt: Optional[str] = Form(None)
):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is missing.")
    if not GEMINI_CLIENT or not GEMINI_MODEL:
        raise HTTPException(status_code=500, detail="No Gemini client/model available. Restart the server.")

    # Fix 4: Derive video title from uploaded filename
    raw_filename = file.filename or "Sales Data"
    video_title = os.path.splitext(raw_filename)[0].replace("_", " ").replace("-", " ").title()

    try:
        contents = await file.read()
        import io
        df = pd.read_excel(io.BytesIO(contents))
        csv_data = df.to_csv(index=False)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read Excel file: {e}")

    prompt = f"""
    You are an expert data analyst and video producer. Analyze the following corporate data provided as CSV:
    {csv_data}
    
    CRITICAL SCENE COUNT CONSTRAINT:
    You MUST generate a storyboard containing strictly between 6 to 8 scenes. DO NOT generate fewer than 6 scenes. Expand on the topic naturally to reach this count.
"""

    if initial_prompt:
        prompt += f"\n    The user has provided specific instructions: {initial_prompt}. You must prioritize this instruction while analyzing the data and deciding the scenes.\n"

    prompt += """
    VISUAL DATA & CHART GENERATION:
    The video must be a true infographic. Stop relying only on text and bullet points. You must use dynamic visual scene types like "bar_chart", "pie_chart", "kpi", "timeline", and "comparison".
    Whenever a chart or data-driven scene is selected (like bar_chart, pie_chart, timeline), you MUST output a `chart_data` array in the JSON structure containing `label` and `value` pairs (e.g., `"chart_data": [{"label": "Marketing", "value": 30}, {"label": "IT", "value": 20}]`).

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

    3. type: "bar_chart" or "pie_chart" or "timeline"
       - title (string)
       - chart_data (array of objects with `label` (string) and `value` (number))

    4. type: "line_chart"
       - title (string)
       - chart_data (array of objects with `label` (string) and `value` (number))
       - targetItems (optional array of objects with `label` (string) and `value` (number))

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
        raw_text = _call_gemini_with_retry(prompt)
        generated_scenes = json.loads(raw_text)

        storyboard_data = {
            "video": {
                "title": video_title,
                "fps": 30,
                "width": 1920,
                "height": 1080,
            },
            "style": DEFAULT_STYLE.copy(),
            "scenes": generated_scenes,
        }

        # Fix 2: Validate full storyboard
        StoryboardModel.model_validate(storyboard_data)

        return storyboard_data

    except HTTPException:
        raise
    except ValidationError as e:
        raise HTTPException(status_code=500, detail=f"AI returned invalid storyboard schema: {e}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {e}")


# ── Endpoint: /approve ────────────────────────────────────────

@app.post("/approve")
async def approve_storyboard(storyboard_data: dict):
    # Fix 2: Validate before writing
    try:
        StoryboardModel.model_validate(storyboard_data)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=f"Invalid storyboard schema: {e}")

    try:
        absolute_storyboard_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "src", "data", "storyboard.json")
        )
        os.makedirs(os.path.dirname(absolute_storyboard_path), exist_ok=True)
        with open(absolute_storyboard_path, "w", encoding="utf-8") as f:
            json.dump(storyboard_data, f, indent=2)

        absolute_public_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "public")
        )
        os.makedirs(absolute_public_dir, exist_ok=True)

        # Fix 5: Clean stale audio before generating new
        _cleanup_old_audio(absolute_public_dir)

        tasks = []
        scenes = storyboard_data.get("scenes", [])
        for scene in scenes:
            scene_id = scene.get("id")
            narration = scene.get("narration")
            if scene_id is not None and narration:
                audio_path = os.path.join(absolute_public_dir, f"scene_{scene_id}.mp3")
                tasks.append(generate_tts(narration, audio_path))
            else:
                print(f"⚠️  Scene {scene_id} missing narration — skipping TTS.")

        if tasks:
            await asyncio.gather(*tasks)

        return {
            "status": "success",
            "message": f"Storyboard approved! {len(tasks)} audio track(s) generated successfully.",
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Approval pipeline error: {e}")


# ── Endpoint: /edit ───────────────────────────────────────────

@app.post("/edit")
async def edit_storyboard(payload: dict):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is missing.")
    if not GEMINI_CLIENT or not GEMINI_MODEL:
        raise HTTPException(status_code=500, detail="No Gemini client/model available. Restart the server.")

    storyboard_data = payload.get("storyboard")
    instruction = payload.get("instruction")

    if not storyboard_data or not instruction:
        raise HTTPException(status_code=400, detail="Both 'storyboard' and 'instruction' are required.")

    prompt = f"""
    You are an expert video producer. I am providing you with the current JSON state of a Remotion video storyboard.
    The user has requested the following natural language edit:
    "{instruction}"

    Current Storyboard JSON:
    {json.dumps(storyboard_data, indent=2)}

    Please apply the requested edits to the scenes.
    You MUST maintain the exact same strict Remotion-compatible JSON schema.
    Every scene MUST still have `id`, `durationInSeconds`, and `narration`, along with the specific properties for its type.
    Do not change the root structure (`video`, `style`, `scenes`).

    Return ONLY the completely updated full JSON object, with no markdown formatting, no code blocks, and no extra text.
    """

    try:
        raw_text = _call_gemini_with_retry(prompt)
        updated = json.loads(raw_text)

        # Robustness: if Gemini returned just the scenes array
        if isinstance(updated, list):
            storyboard_data["scenes"] = updated
            updated = storyboard_data
        elif "scenes" not in updated:
            raise Exception("AI returned an invalid JSON structure (missing 'scenes' array).")

        # Fix 2: Validate edited storyboard
        StoryboardModel.model_validate(updated)

        return updated

    except HTTPException:
        raise
    except ValidationError as e:
        raise HTTPException(status_code=500, detail=f"AI returned invalid storyboard schema: {e}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Editing pipeline error: {e}")


# ── Static Files (Control Panel) ─────────────────────────────

from fastapi.staticfiles import StaticFiles
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
