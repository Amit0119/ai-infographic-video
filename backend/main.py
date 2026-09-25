import os
import json
import glob
import asyncio
from contextlib import asynccontextmanager
from typing import Any, Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
import pandas as pd
import edge_tts
from dotenv import load_dotenv

import PyPDF2
import faiss
import numpy as np
import io

# LangChain Imports for Multi-Agent Workflow
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# ── Environment Setup ─────────────────────────────────────────

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

from google import genai
GEMINI_CLIENT: Optional[genai.Client] = None
if GEMINI_API_KEY:
    GEMINI_CLIENT = genai.Client(api_key=GEMINI_API_KEY)

PREFERRED_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.8-flash",
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
    "gemini-2.5-flash",
]
GEMINI_MODEL: str = "gemini-3.5-flash-lite"

# ── FAISS Vector Store Setup ──────────────────────────────────
EMBEDDING_DIM = 768
faiss_index = faiss.IndexFlatL2(EMBEDDING_DIM)
document_chunks = []

def _get_embedding(text: str) -> np.ndarray:
    if not GEMINI_CLIENT:
        return np.zeros(EMBEDDING_DIM, dtype=np.float32)
    response = GEMINI_CLIENT.models.embed_content(
        model="text-embedding-004",
        contents=text,
    )
    return np.array(response.embeddings[0].values, dtype=np.float32)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global GEMINI_MODEL
    if GEMINI_CLIENT:
        try:
            available_models = []
            for m in GEMINI_CLIENT.models.list():
                if hasattr(m, 'name') and m.name:
                    cleaned_name = m.name.split('models/')[-1]
                    available_models.append(cleaned_name)
            
            for pref in PREFERRED_MODELS:
                if pref in available_models:
                    GEMINI_MODEL = pref
                    break
            print(f"[SUCCESS] Gemini model cached at startup: {GEMINI_MODEL}")
        except Exception as e:
            print(f"[ERROR] Could not cache Gemini model: {e}")
    yield  # app runs here

app = FastAPI(lifespan=lifespan)

# ── CORS ──────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ── Pydantic Schema Validation ─────────────────────────

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

from pydantic import Field
from typing import Union, Literal, Annotated

class ChartDataModel(BaseModel):
    label: str = ""
    value: Union[float, str, None] = None

class ComparisonItemModel(BaseModel):
    name: str = ""
    actual: Union[float, str, None] = None
    target: Union[float, str, None] = None

class BaseSceneModel(BaseModel):
    id: int = 1
    durationInSeconds: float = 5.0
    type: str
    narration: str = ""
    captions: Optional[list[dict[str, Any]]] = None

class TitleSceneModel(BaseSceneModel):
    type: Literal["title"]
    title: str = ""
    subtitle: Optional[str] = ""

class KPISceneModel(BaseSceneModel):
    type: Literal["kpi"]
    metric: str = ""
    value: Union[float, str, None] = None
    unit: str = ""
    prefix: Optional[str] = ""
    growth: Union[float, str, None] = None
    growthLabel: Optional[str] = ""

class ChartSceneModel(BaseSceneModel):
    type: Literal["bar_chart", "pie_chart", "timeline", "line_chart"]
    title: str = ""
    chart_data: list[ChartDataModel] = []
    color: Optional[str] = None
    targetItems: Optional[list[ChartDataModel]] = None

class HighlightSceneModel(BaseSceneModel):
    type: Literal["highlight"]
    metric: str = ""
    value: Union[float, str, None] = None
    unit: str = ""
    prefix: Optional[str] = ""
    badge: str = ""
    achievement: Union[float, str, None] = None
    variance: Union[float, str, None] = None
    sentiment: Literal["positive", "negative"] = "positive"

class ComparisonSceneModel(BaseSceneModel):
    type: Literal["comparison"]
    title: str = ""
    items: list[ComparisonItemModel] = []

class ListSceneModel(BaseSceneModel):
    type: Literal["bullet_points", "numbered_steps"]
    heading: str = ""
    content_points: list[str] = []

SceneModel = Union[
    TitleSceneModel,
    KPISceneModel,
    ChartSceneModel,
    HighlightSceneModel,
    ComparisonSceneModel,
    ListSceneModel
]

class StoryboardModel(BaseModel):
    video: VideoMetaModel
    style: SceneStyleModel
    scenes: list[Annotated[SceneModel, Field(discriminator="type")]]

# ── Helper: Parse & Normalize JSON Output ──────────────

def _strip_markdown_fences(text: str) -> str:
    """Remove accidental ```json ... ``` code fences from output."""
    text = text.strip()
    if text.startswith("```"):
        parts = text.split("```")
        text = parts[1] if len(parts) > 1 else text
        if text.startswith("json"):
            text = text[4:].strip()
    if text.endswith("```"):
        text = text[:-3].strip()
    return text

def _normalize_scenes(raw_scenes: Any) -> list[dict[str, Any]]:
    """Sanitize and normalize scenes array from LLM output to prevent schema validation failures."""
    if not isinstance(raw_scenes, list):
        return []

    normalized = []
    for idx, scene in enumerate(raw_scenes):
        if not isinstance(scene, dict):
            continue
        
        cleaned = dict(scene)
        try:
            cleaned["id"] = int(cleaned.get("id") if cleaned.get("id") is not None else (idx + 1))
        except (ValueError, TypeError):
            cleaned["id"] = idx + 1
        
        try:
            cleaned["durationInSeconds"] = float(cleaned.get("durationInSeconds", 5.0))
        except (ValueError, TypeError):
            cleaned["durationInSeconds"] = 5.0
            
        if "narration" not in cleaned or cleaned["narration"] is None:
            cleaned["narration"] = str(
                cleaned.get("script") or cleaned.get("narration_text") or cleaned.get("voiceover") or ""
            )
        else:
            cleaned["narration"] = str(cleaned["narration"])

        stype = str(cleaned.get("type", "title")).lower().strip()
        valid_types = [
            "title", "kpi", "bar_chart", "pie_chart", "timeline",
            "line_chart", "highlight", "comparison", "bullet_points", "numbered_steps"
        ]
        if stype not in valid_types:
            stype = "bullet_points"
        cleaned["type"] = stype

        if stype == "title":
            cleaned["title"] = str(cleaned.get("title") or "Summary")
            cleaned["subtitle"] = str(cleaned.get("subtitle") or "")
        elif stype == "kpi":
            cleaned["metric"] = str(cleaned.get("metric") or "Metric")
            cleaned["unit"] = str(cleaned.get("unit") or "")
            cleaned["growthLabel"] = str(cleaned.get("growthLabel") or "")
        elif stype in ["bar_chart", "pie_chart", "timeline", "line_chart"]:
            cleaned["title"] = str(cleaned.get("title") or "Chart Overview")
            if not isinstance(cleaned.get("chart_data"), list):
                cleaned["chart_data"] = []
        elif stype == "highlight":
            cleaned["metric"] = str(cleaned.get("metric") or "Highlight")
            cleaned["badge"] = str(cleaned.get("badge") or "Key Insight")
        elif stype == "comparison":
            cleaned["title"] = str(cleaned.get("title") or "Comparison")
            if not isinstance(cleaned.get("items"), list):
                cleaned["items"] = []
        elif stype in ["bullet_points", "numbered_steps"]:
            cleaned["heading"] = str(cleaned.get("heading") or "Key Points")
            if not isinstance(cleaned.get("content_points"), list):
                if isinstance(cleaned.get("points"), list):
                    cleaned["content_points"] = cleaned["points"]
                else:
                    cleaned["content_points"] = []

        normalized.append(cleaned)

    return normalized

async def _invoke_with_retry(prompt_or_chain, inputs: dict, max_attempts: int = 3) -> str:
    """Robust async retry mechanism with exponential backoff and model fallback."""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is missing.")

    models_to_try = []
    for m in [GEMINI_MODEL] + PREFERRED_MODELS:
        if m and m not in models_to_try:
            models_to_try.append(m)
    last_error = None

    if isinstance(prompt_or_chain, PromptTemplate):
        for model_name in models_to_try:
            try:
                llm = ChatGoogleGenerativeAI(
                    model=model_name,
                    temperature=0.2,
                    api_key=GEMINI_API_KEY
                )
                chain = prompt_or_chain | llm | StrOutputParser()
                for attempt in range(1, max_attempts + 1):
                    try:
                        res = await chain.ainvoke(inputs)
                        if res:
                            return res
                    except Exception as e:
                        last_error = e
                        err_msg = str(e)
                        print(f"[WARNING] Model '{model_name}' attempt {attempt}/{max_attempts} failed: {e}")
                        if any(k in err_msg for k in ["429", "RESOURCE_EXHAUSTED", "404", "NOT_FOUND", "503", "UNAVAILABLE"]):
                            await asyncio.sleep(0.5)
                            break
                        if attempt < max_attempts:
                            await asyncio.sleep(1.5 ** attempt)
            except Exception as model_err:
                last_error = model_err
                print(f"[WARNING] Model '{model_name}' setup failed: {model_err}")
    else:
        for attempt in range(1, max_attempts + 1):
            try:
                return await prompt_or_chain.ainvoke(inputs)
            except Exception as e:
                last_error = e
                print(f"[WARNING] LLM attempt {attempt}/{max_attempts} failed: {e}")
                if attempt < max_attempts:
                    await asyncio.sleep(2 ** attempt)

    raise HTTPException(status_code=500, detail=f"LLM failed after attempts across models: {last_error}")

# ── Stale Audio Cleanup ────────────────────────────────

def _cleanup_old_audio(public_dir: str):
    pattern = os.path.join(public_dir, "scene_*.mp3")
    old_files = glob.glob(pattern)
    for f in old_files:
        try:
            os.remove(f)
        except OSError as e:
            print(f"[WARNING] Could not delete {f}: {e}")
    if old_files:
        print(f"[INFO] Cleaned up {len(old_files)} stale audio file(s).")

# ── TTS Helper ────────────────────────────────────────────────

async def generate_tts_with_words(scene: dict, text: str, output_path: str):
    communicate = edge_tts.Communicate(text, "en-US-AriaNeural")
    word_timestamps = []
    
    with open(output_path, "wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start_sec = chunk["offset"] / 10000000.0
                end_sec = (chunk["offset"] + chunk["duration"]) / 10000000.0
                word_timestamps.append({
                    "word": chunk["text"],
                    "start": start_sec,
                    "end": end_sec
                })
    
    scene["captions"] = word_timestamps

# ── Default Style ──────────

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

# ── Multi-Agent Prompts ──────────────────────────────────────────

RESEARCHER_PROMPT_TEMPLATE = """
You are the Researcher Agent. Your job is to analyze the input and write a complete, detailed educational script and narration for a video.

Input Topic/Data: {input_data}
Additional Instructions: {initial_prompt}

CRITICAL SCENE COUNT CONSTRAINT:
You MUST structure the script so that it naturally spans strictly between 6 to 8 distinct visual scenes. DO NOT generate a script that would result in fewer than 6 scenes or more than 8.

For each scene, outline:
1. The core point or data being presented.
2. The specific narration (what the voiceover will say).

Return only your detailed script.
"""

VISUAL_DIRECTOR_PROMPT_TEMPLATE = """
You are the Visual Director Agent. Your job is to take the script provided by the Researcher Agent and strictly format it into a JSON storyboard for our Remotion frontend.

Researcher Script:
{script}

CRITICAL SCENE COUNT CONSTRAINT:
You MUST generate a storyboard containing strictly between 6 to 8 scenes.

VISUAL DATA & CHART GENERATION:
You must assign dynamic visual scene types like "bar_chart", "pie_chart", "kpi", "timeline", and "comparison". Extract the actual data from the script into the JSON arrays (like `chart_data` or `items`).

Generate a strict JSON array of scene objects. EVERY SINGLE SCENE OBJECT MUST HAVE:
- `id` (number, starting at 1)
- `durationInSeconds` (number, e.g., 5.0)
- `type` (string)
- `narration` (string - MUST NOT BE OMITTED under any circumstances. Contains the exact voiceover text for this scene)

Available types and their specific required keys:
1. type: "title" (title: str, subtitle: str optional)
2. type: "kpi" (metric: str, value: number or str, unit: str, prefix: str optional, growth: number or str, growthLabel: str optional)
3. type: "bar_chart" or "pie_chart" or "timeline" or "line_chart" (title: str, chart_data: array of objects with `label` (str), `value` (number or str))
4. type: "comparison" (title: str, items: array of objects with `name` (str), `actual` (number or str), `target` (number or str))
5. type: "bullet_points" or "numbered_steps" (heading: str, content_points: array of strings)

Return ONLY the valid JSON array of these scene objects, with no markdown formatting, no code blocks, and no extra text.
"""

# ── Endpoint: /upload-document ──────────────────────────────

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

def _sanitize_filename(filename: str) -> str:
    import re
    safe_name = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', os.path.basename(filename))
    return safe_name

def _sanitize_text_for_llm(text: str) -> str:
    # Basic prompt injection sanitization
    forbidden_phrases = ["ignore previous", "system prompt", "forget instructions"]
    clean_text = text
    for phrase in forbidden_phrases:
        clean_text = re.sub(phrase, "[REDACTED]", clean_text, flags=re.IGNORECASE)
    return clean_text

@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    global faiss_index, document_chunks
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF.")
    
    try:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large. Max 10MB allowed.")
            
        reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
                
        # Basic Chunking (approx 200 words per chunk)
        text = _sanitize_text_for_llm(text)
        words = text.split()
        chunks = [' '.join(words[i:i+200]) for i in range(0, len(words), 200)]
        
        for chunk in chunks:
            if not chunk.strip():
                continue
            emb = _get_embedding(chunk)
            faiss_index.add(np.expand_dims(emb, axis=0))
            document_chunks.append(chunk)
            
        return {"status": "success", "chunks_added": len(chunks)}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        import logging
        logger = logging.getLogger("uvicorn.error")
        logger.error(f"PDF processing failed: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="An error occurred while processing the PDF.")

# ── Endpoint: /generate-explainer ───────────────────────────

class ExplainerRequestModel(BaseModel):
    topic: str
    initial_prompt: Optional[str] = None

@app.post("/generate-explainer")
async def generate_explainer(payload: ExplainerRequestModel):
    try:
        video_title = payload.topic.title()

        # RAG Retrieval
        context = ""
        if faiss_index.ntotal > 0:
            query_emb = _get_embedding(payload.topic)
            D, I = faiss_index.search(np.expand_dims(query_emb, axis=0), k=3)
            retrieved_chunks = [document_chunks[i] for i in I[0] if i < len(document_chunks)]
            context = "Extracted Document Context:\n" + "\n\n".join(retrieved_chunks)

        input_data_with_context = payload.topic
        if context:
            input_data_with_context = f"Topic: {payload.topic}\n\n{context}"

        # Agent 1: Researcher
        researcher_prompt = PromptTemplate(
            input_variables=["input_data", "initial_prompt"],
            template=RESEARCHER_PROMPT_TEMPLATE
        )
        script = await _invoke_with_retry(researcher_prompt, {
            "input_data": input_data_with_context,
            "initial_prompt": payload.initial_prompt or "None"
        })

        # Agent 2: Visual Director
        director_prompt = PromptTemplate(
            input_variables=["script"],
            template=VISUAL_DIRECTOR_PROMPT_TEMPLATE
        )
        raw_json = await _invoke_with_retry(director_prompt, {"script": script})

        cleaned_json = _strip_markdown_fences(raw_json)
        generated_scenes = _normalize_scenes(json.loads(cleaned_json))

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
    except ValidationError as e:
        raise HTTPException(status_code=500, detail=f"Visual Director returned invalid storyboard schema: {e}")
    except HTTPException:
        raise
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
    try:
        raw_filename = file.filename or "Sales Data"
        video_title = os.path.splitext(raw_filename)[0].replace("_", " ").replace("-", " ").title()

        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large. Max 10MB allowed.")
            
        df = pd.read_excel(io.BytesIO(contents))
        csv_data = df.to_csv(index=False)

        # Agent 1: Researcher
        researcher_prompt = PromptTemplate(
            input_variables=["input_data", "initial_prompt"],
            template=RESEARCHER_PROMPT_TEMPLATE
        )
        script = await _invoke_with_retry(researcher_prompt, {
            "input_data": f"Corporate Data CSV:\n{csv_data}",
            "initial_prompt": initial_prompt or "None"
        })

        # Agent 2: Visual Director
        director_prompt = PromptTemplate(
            input_variables=["script"],
            template=VISUAL_DIRECTOR_PROMPT_TEMPLATE
        )
        raw_json = await _invoke_with_retry(director_prompt, {"script": script})

        cleaned_json = _strip_markdown_fences(raw_json)
        generated_scenes = _normalize_scenes(json.loads(cleaned_json))

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
    except ValidationError as e:
        raise HTTPException(status_code=500, detail=f"Visual Director returned invalid storyboard schema: {e}")
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        import logging
        logger = logging.getLogger("uvicorn.error")
        logger.error(f"Analysis pipeline error: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="An internal server error occurred during analysis.")



# ── Endpoint: /approve ────────────────────────────────────────

@app.post("/approve")
async def approve_storyboard(storyboard_data: dict):
    import logging
    logger = logging.getLogger("uvicorn.error")
    
    try:
        # Validate schema before proceeding
        try:
            StoryboardModel.model_validate(storyboard_data)
        except ValidationError as e:
            logger.error(f"Storyboard validation failed: {e}")
            raise HTTPException(status_code=422, detail=f"Invalid storyboard schema: {e}")

        # Ensure public directory exists
        absolute_public_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "public")
        )
        os.makedirs(absolute_public_dir, exist_ok=True)

        _cleanup_old_audio(absolute_public_dir)

        # Generate TTS audio files
        tasks = []
        scenes = storyboard_data.get("scenes", [])
        for scene in scenes:
            scene_id = scene.get("id")
            narration = scene.get("narration")
            if scene_id is not None and narration:
                audio_path = os.path.join(absolute_public_dir, f"scene_{scene_id}.mp3")
                tasks.append(generate_tts_with_words(scene, narration, audio_path))
            else:
                logger.warning(f"Scene {scene_id} missing narration — skipping TTS.")

        if tasks:
            try:
                await asyncio.gather(*tasks)
                logger.info(f"Generated {len(tasks)} TTS audio files.")
            except Exception as tts_err:
                logger.error(f"TTS Generation failed: {tts_err}", exc_info=True)
                raise HTTPException(status_code=500, detail=f"TTS generation failed: {tts_err}")

        # ── B-Roll Fetching ───────────────────────────────────────
        pexels_key = os.getenv("PEXELS_API_KEY") or os.getenv("PEXEL_API_KEY")
        if pexels_key:
            logger.info("Fetching cinematic B-roll from Pexels...")
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    for scene in scenes:
                        # Build a cinematic search query from scene content
                        query_parts = []
                        if scene.get("title"):
                            query_parts.append(str(scene["title"]))
                        elif scene.get("metric"):
                            query_parts.append(str(scene["metric"]))
                        elif scene.get("heading"):
                            query_parts.append(str(scene["heading"]))
                        
                        if not query_parts:
                            query_parts.append("cinematic business")
                        
                        search_query = " ".join(query_parts)[:80]  # Pexels query limit
                        
                        try:
                            resp = await client.get(
                                "https://api.pexels.com/videos/search",
                                headers={"Authorization": pexels_key},
                                params={"query": search_query, "per_page": 3, "orientation": "landscape"}
                            )
                            resp.raise_for_status()
                            videos = resp.json().get("videos", [])
                            
                            if videos:
                                # Pick a random video to avoid repetition
                                import random
                                chosen = random.choice(videos)
                                files = chosen.get("video_files", [])
                                # Prefer HD quality for cinematic look
                                hd_files = [f for f in files if f.get("quality") == "hd" and f.get("width", 0) >= 1280]
                                sd_files = [f for f in files if f.get("quality") == "sd"]
                                best = hd_files[0] if hd_files else (sd_files[0] if sd_files else files[0])
                                scene["brollUrl"] = best["link"]
                                logger.info(f"Scene {scene.get('id')}: B-roll assigned ({search_query[:30]}...)")
                            else:
                                logger.warning(f"Scene {scene.get('id')}: No B-roll found for '{search_query}'")
                        except Exception as scene_err:
                            logger.warning(f"Scene {scene.get('id')}: B-roll fetch failed: {scene_err}")
            except Exception as broll_err:
                logger.warning(f"B-roll fetching failed (non-fatal): {broll_err}")
        else:
            logger.info("No Pexels API key found — skipping B-roll enrichment.")

        # Write storyboard.json
        absolute_storyboard_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "src", "data", "storyboard.json")
        )
        os.makedirs(os.path.dirname(absolute_storyboard_path), exist_ok=True)
        
        # Helper to convert NaN to None before writing
        import math
        def remove_nans(obj):
            if isinstance(obj, float) and math.isnan(obj):
                return None
            elif isinstance(obj, dict):
                return {k: remove_nans(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [remove_nans(i) for i in obj]
            return obj

        cleaned_storyboard = remove_nans(storyboard_data)

        try:
            with open(absolute_storyboard_path, "w", encoding="utf-8") as f:
                json.dump(cleaned_storyboard, f, indent=2)
            logger.info(f"Successfully saved storyboard to {absolute_storyboard_path}")
        except Exception as io_err:
            logger.error(f"Failed to write storyboard JSON: {io_err}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to save storyboard.json: {io_err}")

        return {
            "status": "success",
            "message": f"Storyboard approved! {len(tasks)} audio track(s) generated successfully.",
        }

    except Exception as e:
        import traceback
        logger.error(f"Approval pipeline error: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="An error occurred while approving the storyboard.")


# ── Endpoint: /edit ───────────────────────────────────────────

@app.post("/edit")
async def edit_storyboard(payload: dict):
    try:
        storyboard_data = payload.get("storyboard")
        instruction = payload.get("instruction")

        if not storyboard_data or not instruction:
            raise HTTPException(status_code=400, detail="Both 'storyboard' and 'instruction' are required.")

        prompt = PromptTemplate(
            input_variables=["instruction", "storyboard"],
            template="""
You are an expert video producer. I am providing you with the current JSON state of a Remotion video storyboard.
The user has requested the following natural language edit:
"{instruction}"

Current Storyboard JSON:
{storyboard}

Please apply the requested edits to the scenes.
You MUST maintain the exact same strict Remotion-compatible JSON schema.
Every scene MUST still have `id`, `durationInSeconds`, and `narration`, along with the specific properties for its type.
Do not change the root structure (`video`, `style`, `scenes`).

Return ONLY the completely updated full JSON object, with no markdown formatting, no code blocks, and no extra text.
"""
        )
        raw_json = await _invoke_with_retry(prompt, {
            "instruction": instruction,
            "storyboard": json.dumps(storyboard_data, indent=2)
        })

        cleaned = _strip_markdown_fences(raw_json)
        updated = json.loads(cleaned)

        if isinstance(updated, list):
            storyboard_data["scenes"] = _normalize_scenes(updated)
            updated = storyboard_data
        elif isinstance(updated, dict) and "scenes" in updated:
            updated["scenes"] = _normalize_scenes(updated["scenes"])
        else:
            raise Exception("AI returned an invalid JSON structure (missing 'scenes' array).")

        StoryboardModel.model_validate(updated)
        return updated
    except ValidationError as e:
        raise HTTPException(status_code=500, detail=f"AI returned invalid storyboard schema: {e}")
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        import logging
        logger = logging.getLogger("uvicorn.error")
        logger.error(f"Editing pipeline error: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="An internal server error occurred while applying edits.")

# ── Endpoint: /fetch-broll ────────────────────────────────────

import httpx

@app.get("/fetch-broll")
async def fetch_broll(query: str):
    pexels_key = os.getenv("PEXELS_API_KEY") or os.getenv("PEXEL_API_KEY")
    if not pexels_key:
        raise HTTPException(status_code=500, detail="Pexels API key not configured.")
        
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.pexels.com/videos/search",
                headers={"Authorization": pexels_key},
                params={"query": query, "per_page": 5, "orientation": "landscape"}
            )
            response.raise_for_status()
            data = response.json()
            
            if not data.get("videos"):
                return {"videos": []}
                
            videos = []
            for video in data["videos"]:
                # Pick the HD version if available
                files = video.get("video_files", [])
                hd_files = [f for f in files if f.get("quality") == "hd"]
                best_file = hd_files[0] if hd_files else files[0]
                videos.append({
                    "id": video["id"],
                    "image": video["image"],
                    "url": best_file["link"],
                    "duration": video["duration"]
                })
                
            return {"videos": videos}
    except Exception as e:
        import traceback
        import logging
        logger = logging.getLogger("uvicorn.error")
        logger.error(f"Failed to fetch B-roll: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to fetch cinematic B-roll.")

# ── Static Files (Control Panel) ─────────────────────────────

from fastapi.staticfiles import StaticFiles
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
