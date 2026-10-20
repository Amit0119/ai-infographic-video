import os
import re
import json
import glob
import asyncio
from contextlib import asynccontextmanager
from typing import Any, Optional, Union, Literal, Annotated, Type

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, ValidationError, Field, ConfigDict
import pandas as pd
import requests
import httpx
from dotenv import load_dotenv

import PyPDF2
import faiss
import numpy as np
import io
import docx

# LangChain Imports for Multi-Agent Workflow
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate
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
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-2.5-pro",
]
GEMINI_MODEL: str = "gemini-2.5-flash"

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
    yield

app = FastAPI(lifespan=lifespan)

# ── CORS ──────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ── Pydantic Schema Validation (With 3-Zone Support) ──────────

class SceneStyleModel(BaseModel):
    backgroundColor: str = "#0b1120"
    primaryColor: str = "#38bdf8"
    secondaryColor: str = "#818cf8"
    accentColor: str = "#34d399"
    textColor: str = "#ffffff"
    subtextColor: str = "#94a3b8"
    fontFamily: str = "Inter"
    currencySymbol: Optional[str] = "$"
    companyWatermark: Optional[str] = "DeptCast Analytics"

class VideoMetaModel(BaseModel):
    title: str = "Enterprise Video"
    duration: Optional[float] = 36
    audience: Optional[str] = "Executive Board"
    fps: int = 30
    width: int = 1920
    height: int = 1080

class ChartDataModel(BaseModel):
    label: str = ""
    value: Union[float, str, None] = None

class ComparisonItemModel(BaseModel):
    name: str = ""
    actual: Union[float, str, None] = None
    target: Union[float, str, None] = None

class BaseSceneModel(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: Union[int, str] = 1
    durationInSeconds: float = 12.0
    type: str
    narration: str = Field(...)
    captions: Optional[list[dict[str, Any]]] = None
    brollUrl: Optional[str] = None
    percentage: Optional[float] = None
    budgetAmount: Optional[float] = None
    actualAmount: Optional[float] = None
    categoryName: Optional[str] = None
    highlightText: Optional[str] = None

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

class PremiumChartSceneModel(BaseSceneModel):
    type: Literal["heat_map", "dashboard_ui", "GlowingDonutChart", "VarianceBarChart", "GlassmorphismBadge"]
    title: str = ""
    section_header: Optional[str] = None
    heading: str = ""
    chart_data: list[ChartDataModel] = []
    top_kpi_controls: Optional[list[dict[str, Any]]] = None
    main_chart: Optional[dict[str, Any]] = None
    side_insight_panel: Optional[dict[str, Any]] = None

class HierarchySceneModel(BaseSceneModel):
    type: Literal["hierarchy_pyramid"]
    heading: str = ""
    content_points: list[str] = []

class SplitScreenSceneModel(BaseSceneModel):
    type: Literal["split_screen"]
    title: str = ""
    left_content: str = ""
    right_content: str = ""

SceneModel = Union[
    TitleSceneModel,
    KPISceneModel,
    ChartSceneModel,
    HighlightSceneModel,
    ComparisonSceneModel,
    ListSceneModel,
    PremiumChartSceneModel,
    HierarchySceneModel,
    SplitScreenSceneModel
]

class StoryboardModel(BaseModel):
    model_config = ConfigDict(extra="allow")
    video: VideoMetaModel
    style: SceneStyleModel
    scenes: list[Annotated[SceneModel, Field(discriminator="type")]]

# ── Default Style ──────────

DEFAULT_STYLE = {
    "backgroundColor": "#0b1120",
    "primaryColor": "#38bdf8",
    "secondaryColor": "#818cf8",
    "accentColor": "#34d399",
    "textColor": "#ffffff",
    "subtextColor": "#94a3b8",
    "fontFamily": "Inter",
    "currencySymbol": "$",
    "companyWatermark": "DeptCast Analytics",
}

# ── Helper: Convert Snehal's Contract Format -> Storyboard Format ──

def _convert_contract_to_storyboard(payload: dict) -> dict:
    """Automatically converts Snehal's input_schema_contract.json structure into Remotion storyboard structure."""
    if "video_metadata" in payload and "video" not in payload:
        meta = payload.get("video_metadata", {})
        res = meta.get("resolution", {"width": 1920, "height": 1080})
        payload["video"] = {
            "title": meta.get("project_title", "Enterprise Budget Analytics"),
            "duration": 38,
            "audience": "Executive Board",
            "fps": meta.get("fps", 30),
            "width": res.get("width", 1920),
            "height": res.get("height", 1080),
        }
    if "style" not in payload:
        payload["style"] = DEFAULT_STYLE.copy()

    if "scenes" in payload and isinstance(payload["scenes"], list):
        for idx, s in enumerate(payload["scenes"], start=1):
            s["id"] = idx
            if not s.get("type"):
                s["type"] = "dashboard_ui"
            if "duration_seconds" in s and "durationInSeconds" not in s:
                s["durationInSeconds"] = float(s["duration_seconds"])
            if not s.get("title"):
                s["title"] = s.get("section_header", f"Executive Scene {idx}")
            nar = s.get("narration", "")
            if isinstance(nar, dict):
                s["narration"] = nar.get("vo_text", "").strip()
    return payload

# ── Helper: Parse & Normalize JSON Output ──────────────

def _strip_markdown_fences(text: str) -> str:
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
    if not isinstance(raw_scenes, list):
        return []

    normalized = []
    for idx, scene in enumerate(raw_scenes):
        if not isinstance(scene, dict):
            continue
        
        cleaned = dict(scene)
        # Keep numeric ID (1, 2, 3...) so Root.tsx matches scene_1.mp3
        cleaned["id"] = idx + 1
        
        try:
            cleaned["durationInSeconds"] = float(
                cleaned.get("durationInSeconds") or cleaned.get("duration_seconds") or 12.0
            )
        except (ValueError, TypeError):
            cleaned["durationInSeconds"] = 12.0
            
        nar = cleaned.get("narration")
        if isinstance(nar, dict):
            cleaned["narration"] = str(nar.get("vo_text") or "").strip()
        elif not nar:
            narration_text = str(
                cleaned.get("script") or cleaned.get("narration_text") or cleaned.get("voiceover") or ""
            ).strip()
            if not narration_text or len(narration_text) < 5:
                narration_text = f"Now, let's analyze the data for {cleaned.get('title') or cleaned.get('section_header') or cleaned.get('heading') or 'this section'}."
            cleaned["narration"] = narration_text
        else:
            cleaned["narration"] = str(nar).strip()

        # If 3-Zone fields exist, default type to dashboard_ui
        if any(k in cleaned for k in ("top_kpi_controls", "main_chart", "side_insight_panel")):
            cleaned["type"] = "dashboard_ui"

        stype = str(cleaned.get("type", "dashboard_ui")).lower().strip()
        valid_types = [
            "title", "kpi", "bar_chart", "pie_chart", "timeline",
            "line_chart", "highlight", "comparison", "bullet_points", "numbered_steps",
            "heat_map", "hierarchy_pyramid", "split_screen", "dashboard_ui"
        ]
        if stype not in valid_types:
            stype = "dashboard_ui"
        cleaned["type"] = stype

        if stype == "dashboard_ui":
            cleaned["title"] = str(cleaned.get("title") or cleaned.get("section_header") or "Executive Overview")
            if not isinstance(cleaned.get("chart_data"), list):
                cleaned["chart_data"] = []
        elif stype == "title":
            cleaned["title"] = str(cleaned.get("title") or "Summary")
            cleaned["subtitle"] = str(cleaned.get("subtitle") or "")
        elif stype == "kpi":
            cleaned["metric"] = str(cleaned.get("metric") or "Metric")
            raw_val = cleaned.get("value", 0)
            raw_unit = str(cleaned.get("unit") or "")
            if isinstance(raw_val, str):
                stripped = raw_val.strip().replace(",", "")
                if stripped.endswith("%"):
                    try:
                        cleaned["value"] = float(stripped[:-1])
                        if not raw_unit:
                            raw_unit = "%"
                    except ValueError:
                        pass
                else:
                    for sym in ("$", "€", "₹"):
                        if stripped.startswith(sym):
                            try:
                                cleaned["value"] = float(stripped[len(sym):])
                                cleaned["prefix"] = sym
                            except ValueError:
                                pass
                            break
            cleaned["unit"] = raw_unit
            raw_growth = cleaned.get("growth")
            if isinstance(raw_growth, str):
                g_str = raw_growth.strip().replace(",", "").replace("%", "").replace("+", "")
                try:
                    cleaned["growth"] = float(g_str) if g_str else 0
                except ValueError:
                    cleaned["growth"] = 0
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
                cleaned["content_points"] = cleaned.get("points", []) if isinstance(cleaned.get("points"), list) else []

        normalized.append(cleaned)

    return normalized

async def _invoke_with_retry(prompt_or_chain, inputs: dict, max_attempts: int = 3, schema: Optional[Type[BaseModel]] = None) -> Any:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is missing.")

    models_to_try = []
    for m in [GEMINI_MODEL] + PREFERRED_MODELS:
        if m and m not in models_to_try:
            models_to_try.append(m)
    last_error = None

    if isinstance(prompt_or_chain, (PromptTemplate, ChatPromptTemplate)):
        for model_name in models_to_try:
            try:
                llm = ChatGoogleGenerativeAI(
                    model=model_name,
                    temperature=0.2,
                    api_key=GEMINI_API_KEY
                )
                if schema:
                    chain = prompt_or_chain | llm.with_structured_output(schema)
                else:
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
    for pattern in ["scene_*.wav"]:
        old_files = glob.glob(os.path.join(public_dir, pattern))
        for f in old_files:
            try:
                os.remove(f)
            except OSError as e:
                print(f"[WARNING] Could not delete {f}: {e}")

# ── Edge-TTS Audio Helper (With gTTS Fallback) ───────────────

EDGE_TTS_VOICE = "en-US-ChristopherNeural"

async def generate_edge_audio(scene: dict, text: str, output_path: str):
    """Generate TTS audio using edge-tts with automatic gTTS fallback if 403 occurs."""
    import edge_tts
    from gtts import gTTS
    try:
        communicate = edge_tts.Communicate(text=text, voice=EDGE_TTS_VOICE)
        await communicate.save(output_path)
        if not os.path.exists(output_path) or os.path.getsize(output_path) < 100:
            raise ValueError("Empty Edge-TTS audio file")
    except Exception as e:
        print(f"[FALLBACK - gTTS] Edge-TTS failed ({e}), using gTTS for {os.path.basename(output_path)}...")
        if os.path.exists(output_path):
            try:
                os.remove(output_path)
            except OSError:
                pass
        gTTS(text=text, lang="en", slow=False).save(output_path)
    scene["captions"] = []

# ── Known Brand Database ─────────────────────────────────────────

KNOWN_BRANDS: dict[str, dict] = {
    "schindler": {
        "name": "Schindler",
        "colors": {
            "backgroundColor": "#0a0a0a",
            "primaryColor": "#CC0000",
            "secondaryColor": "#FFFFFF",
            "accentColor": "#E63333",
            "textColor": "#FFFFFF",
            "subtextColor": "#B0B0B0",
        },
        "fontFamily": "Inter",
        "watermark": "SCHINDLER",
        "industry": "elevator and escalator manufacturing, urban mobility",
    },
    "deloitte": {
        "name": "Deloitte",
        "colors": {
            "backgroundColor": "#0C1B2A",
            "primaryColor": "#86BC25",
            "secondaryColor": "#FFFFFF",
            "accentColor": "#00A3E0",
            "textColor": "#FFFFFF",
            "subtextColor": "#97999B",
        },
        "fontFamily": "Inter",
        "watermark": "DELOITTE",
        "industry": "professional services and consulting",
    },
    "mckinsey": {
        "name": "McKinsey & Company",
        "colors": {
            "backgroundColor": "#051C2C",
            "primaryColor": "#2251FF",
            "secondaryColor": "#FFFFFF",
            "accentColor": "#00A9F4",
            "textColor": "#FFFFFF",
            "subtextColor": "#8CA3BA",
        },
        "fontFamily": "Inter",
        "watermark": "McKINSEY",
        "industry": "management consulting",
    },
}

def _detect_brand(text: str) -> Optional[dict]:
    text_lower = text.lower()
    for brand_key, brand_config in KNOWN_BRANDS.items():
        if brand_key in text_lower:
            return brand_config
    return None

# ── B-Roll Keyword Sanitization ──────────────────────────────────

BROLL_BLOCKLIST = frozenset({
    "graveyard", "cemetery", "death", "dead", "funeral", "coffin",
    "weapon", "gun", "violent", "blood", "war", "kill", "bomb",
    "crash", "disaster", "apocalypse", "horror", "scary", "evil",
    "murder", "suicide", "corpse", "grave", "morgue",
})

BROLL_CORPORATE_FALLBACKS = [
    "corporate office modern aerial",
    "business meeting professional team",
    "city skyline sunset aerial",
    "modern glass architecture building",
    "professional team collaboration office",
    "technology data visualization screen",
    "financial dashboard analytics",
    "modern corporate lobby interior",
]

BROLL_KEYWORD_MAP = {
    "cross-departmental": "corporate teamwork collaboration office",
    "cross departmental": "corporate teamwork collaboration office",
    "alignment": "business strategy meeting boardroom",
    "budget": "financial planning corporate office",
    "opex": "corporate office modern operations",
    "capex": "industrial infrastructure construction modern",
    "roi": "financial growth chart success",
    "revenue": "business growth charts success",
    "compliance": "corporate governance professional meeting",
    "kpi": "business analytics dashboard screen",
    "forecast": "data analytics visualization futuristic",
    "quarterly": "corporate quarterly review meeting",
    "annual": "annual corporate conference professional",
    "strategy": "corporate strategy boardroom executive",
    "leadership": "executive leadership meeting professional",
    "innovation": "technology innovation futuristic lab",
    "sustainability": "green building sustainable modern",
    "digital transformation": "digital technology futuristic office",
    "supply chain": "logistics warehouse modern automated",
    "manufacturing": "modern factory automation robotics",
    "elevator": "modern elevator glass building lobby",
    "escalator": "modern escalator architecture interior",
    "submission": "professional team deadline office",
    "deadline": "professional office productivity",
    "blueprint": "modern architecture design planning",
    "historical": "corporate office data analysis charts",
    "performance": "business performance metrics dashboard",
    "operating expenses": "corporate office operations meeting",
    "capital expenditure": "industrial investment infrastructure",
}

def _sanitize_broll_query(raw_query: str) -> str:
    import random as _rnd
    query_lower = raw_query.lower().strip()
    for key, safe_query in BROLL_KEYWORD_MAP.items():
        if key in query_lower:
            return safe_query
    words = query_lower.split()
    safe_words = [w for w in words if w not in BROLL_BLOCKLIST]
    if not safe_words:
        return _rnd.choice(BROLL_CORPORATE_FALLBACKS)
    sanitized = " ".join(safe_words)
    if len(sanitized.split()) < 3:
        sanitized += " corporate professional modern"
    return sanitized[:80]

# ── Multi-Agent Prompts ──────────────────────────────────────────

RESEARCHER_PROMPT_TEMPLATE = """
Persona: Act as a charismatic Fortune 500 CFO & Analytics Lead presenting an executive financial review.
Analyze the provided data and structure a 3-scene executive story:
Scene 1: Overall Budget vs Actual Summary across all categories.
Scene 2: Operational & Maintenance Variance Deep-Dive (Monthly trends & peak overrun months).
Scene 3: OPEX Share Distribution & Strategic Cost Optimization Playbook.

Input Topic/Data: {input_data}
Additional Instructions: {initial_prompt}

Return a detailed 3-scene executive breakdown with exact numbers, KPIs, and strategic recommendations.
"""

VISUAL_DIRECTOR_PROMPT_TEMPLATE = """
You are the Visual Director Agent for an Enterprise 3-Zone Remotion Dashboard Engine.
Convert the Researcher's script into a JSON array of 3 `dashboard_ui` scenes.

Researcher Script:
{script}

EVERY SCENE MUST USE `"type": "dashboard_ui"` AND INCLUDE:
- "id": integer (1, 2, 3)
- "type": "dashboard_ui"
- "durationInSeconds": 13
- "title": string
- "section_header": string
- "narration": string (2 sentences explaining the numbers clearly)
- "top_kpi_controls": array of 3 KPI objects (`label`, `value`, `prefix`, `unit`, `variance_pct`, `status_badge`, `traffic_light`: "green" | "red")
- "main_chart": object with `"component"` set to `"Grouped_Bar_Chart"` (Scene 1 with `categories`), `"Multi_Line_Trend_Chart"` (Scene 2 with `x_axis` and `series`), or `"Donut_Chart"` (Scene 3 with `segments`).
- "side_insight_panel": object with `headline`, `bullets` (array of 3 strings), and `recommendation_badge`.

Return ONLY the valid JSON array. No markdown fences.
"""

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

def _sanitize_text_for_llm(text: str) -> str:
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
        raise HTTPException(status_code=500, detail=f"An error occurred while processing the PDF: {e}")

class ExplainerRequestModel(BaseModel):
    topic: str
    initial_prompt: Optional[str] = None

@app.post("/generate-explainer")
async def generate_explainer(payload: ExplainerRequestModel):
    try:
        brand = _detect_brand(payload.topic)
        context = ""
        if faiss_index.ntotal > 0:
            query_emb = _get_embedding(payload.topic)
            D, I = faiss_index.search(np.expand_dims(query_emb, axis=0), k=3)
            retrieved_chunks = [document_chunks[i] for i in I[0] if i < len(document_chunks)]
            context = "Extracted Document Context:\n" + "\n\n".join(retrieved_chunks)

        financial_summary = ""
        try:
            excel_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src", "data", "Financial analysis_Data Set.xlsx"))
            df = pd.read_excel(excel_path)
            budget_col = next((c for c in df.columns if 'budget' in c.lower()), df.columns[1] if len(df.columns) > 1 else None)
            actual_col = next((c for c in df.columns if 'actual' in c.lower()), df.columns[2] if len(df.columns) > 2 else None)
            cat_col = next((c for c in df.columns if 'category' in c.lower() or 'department' in c.lower() or df[c].dtype == 'O'), df.columns[0])
            if budget_col and actual_col:
                total_budget = df[budget_col].sum()
                total_actual = df[actual_col].sum()
                df['Variance'] = df[actual_col] - df[budget_col]
                top_over = df.loc[df['Variance'].idxmax()]
                top_under = df.loc[df['Variance'].idxmin()]
                financial_summary = (
                    f"2023 Financial Overview: Total Budget was ${total_budget:,.2f}, Total Actual was${total_actual:,.2f}. "
                    f"Highest Over-Budget Category: {top_over[cat_col]} (over by ${top_over['Variance']:,.2f}). "
                    f"Most Efficient Category: {top_under[cat_col]} (under budget by ${-top_under['Variance']:,.2f})."
                )
        except Exception as e:
            financial_summary = f"Financial Data could not be loaded: {e}"

        brand_prefix = f"[Company: {brand['name']} | Industry: {brand['industry']}] " if brand else ""
        input_data_with_context = brand_prefix + payload.topic
        if context or financial_summary:
            input_data_with_context = f"Topic: {payload.topic}\n\nFinancial Summary:\n{financial_summary}\n\n{context}"

        researcher_prompt = PromptTemplate(
            input_variables=["input_data", "initial_prompt"],
            template=RESEARCHER_PROMPT_TEMPLATE
        )
        script = await _invoke_with_retry(researcher_prompt, {
            "input_data": input_data_with_context,
            "initial_prompt": payload.initial_prompt or "None"
        })

        director_prompt = ChatPromptTemplate.from_messages([
            ("system", VISUAL_DIRECTOR_PROMPT_TEMPLATE),
            ("user", "{script}")
        ])
        raw_res = await _invoke_with_retry(director_prompt, {"script": script})
        cleaned = _strip_markdown_fences(str(raw_res))
        parsed = json.loads(cleaned)

        if isinstance(parsed, list):
            scenes = _normalize_scenes(parsed)
            storyboard_data = {
                "video": {"title": payload.topic, "fps": 30, "width": 1920, "height": 1080},
                "style": DEFAULT_STYLE.copy(),
                "scenes": scenes
            }
        elif isinstance(parsed, dict):
            storyboard_data = _convert_contract_to_storyboard(parsed)
            storyboard_data["scenes"] = _normalize_scenes(storyboard_data.get("scenes", []))
        else:
            raise Exception("AI returned an invalid JSON structure.")

        if brand:
            storyboard_data["style"].update(brand["colors"])
            storyboard_data["style"]["fontFamily"] = brand.get("fontFamily", "Inter")
            storyboard_data["style"]["companyWatermark"] = brand.get("watermark", "")

        validated = StoryboardModel.model_validate(storyboard_data)
        return validated.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explainer pipeline error: {e}")

@app.post("/preview-data")
async def preview_data(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large. Max 10MB allowed.")
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext in ['.xls', '.xlsx', '.csv']:
            df = pd.read_excel(io.BytesIO(contents)) if file_ext in ['.xls', '.xlsx'] else pd.read_csv(io.BytesIO(contents))
            return {
                "status": "success",
                "columns": df.columns.tolist()[:10],
                "total_columns": len(df.columns),
                "total_rows": len(df),
                "type": "spreadsheet"
            }
        elif file_ext in ['.pdf', '.docx', '.txt', '.json']:
            return {"status": "success", "type": "document"}
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse data file: {str(e)}")

@app.post("/analyze")
async def analyze_data(
    file: Optional[UploadFile] = File(None),
    initial_prompt: Optional[str] = Form(None),
    topic_input: Optional[str] = Form(None)
):
    try:
        if file:
            raw_filename = file.filename or "Uploaded Document"
            video_title = os.path.splitext(raw_filename)[0].replace("_", " ").replace("-", " ").title()
            contents = await file.read()
            if len(contents) > MAX_FILE_SIZE:
                raise HTTPException(status_code=413, detail="File too large. Max 10MB allowed.")
            file_ext = os.path.splitext(file.filename)[1].lower()
            if file_ext in ['.xls', '.xlsx']:
                df = pd.read_excel(io.BytesIO(contents))
                input_data = f"Corporate Data:\n{df.to_csv(index=False)}"
            elif file_ext == '.csv':
                df = pd.read_csv(io.BytesIO(contents))
                input_data = f"Corporate Data:\n{df.to_csv(index=False)}"
            elif file_ext == '.json':
                data = json.loads(contents.decode('utf-8'))
                # If Snehal's contract JSON is uploaded directly, convert & return it immediately!
                if "video_metadata" in data or ("scenes" in data and any("top_kpi_controls" in s for s in data.get("scenes", []))):
                    converted = _convert_contract_to_storyboard(data)
                    converted["scenes"] = _normalize_scenes(converted.get("scenes", []))
                    validated = StoryboardModel.model_validate(converted)
                    return validated.model_dump()
                input_data = f"Document Data (JSON):\n{json.dumps(data, indent=2)}"
            elif file_ext == '.pdf':
                reader = PyPDF2.PdfReader(io.BytesIO(contents))
                text = "\n".join([page.extract_text() or "" for page in reader.pages])
                input_data = f"Document Content:\n{text}"
            elif file_ext == '.docx':
                doc = docx.Document(io.BytesIO(contents))
                text = "\n".join([para.text for para in doc.paragraphs])
                input_data = f"Document Content:\n{text}"
            elif file_ext == '.txt':
                input_data = f"Document Content:\n{contents.decode('utf-8')}"
            else:
                raise HTTPException(status_code=400, detail="Unsupported file format.")
        else:
            video_title = "Topic Explained"
            if topic_input:
                input_data = f"Topic to explain: {topic_input}"
            else:
                raise HTTPException(status_code=400, detail="Must provide either a file or a topic_input")

        brand_source = topic_input or initial_prompt or (file.filename if file else "") or ""
        brand = _detect_brand(brand_source)
        if brand:
            input_data = f"[Company: {brand['name']} | Industry: {brand['industry']}] " + input_data

        researcher_prompt = PromptTemplate(
            input_variables=["input_data", "initial_prompt"],
            template=RESEARCHER_PROMPT_TEMPLATE
        )
        script = await _invoke_with_retry(researcher_prompt, {
            "input_data": input_data,
            "initial_prompt": initial_prompt or "None"
        })

        director_prompt = ChatPromptTemplate.from_messages([
            ("system", VISUAL_DIRECTOR_PROMPT_TEMPLATE),
            ("user", "{script}")
        ])
        raw_res = await _invoke_with_retry(director_prompt, {"script": script})
        cleaned = _strip_markdown_fences(str(raw_res))
        parsed = json.loads(cleaned)

        if isinstance(parsed, list):
            scenes = _normalize_scenes(parsed)
            storyboard_data = {
                "video": {"title": video_title, "fps": 30, "width": 1920, "height": 1080},
                "style": DEFAULT_STYLE.copy(),
                "scenes": scenes
            }
        elif isinstance(parsed, dict):
            storyboard_data = _convert_contract_to_storyboard(parsed)
            storyboard_data["scenes"] = _normalize_scenes(storyboard_data.get("scenes", []))
        else:
            raise Exception("AI returned an invalid JSON structure.")

        if brand:
            storyboard_data["style"].update(brand["colors"])
            storyboard_data["style"]["fontFamily"] = brand.get("fontFamily", "Inter")
            storyboard_data["style"]["companyWatermark"] = brand.get("watermark", "")

        validated = StoryboardModel.model_validate(storyboard_data)
        return validated.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {e}")

# ── Endpoint: /approve ────────────────────────────────────────

@app.post("/approve")
async def approve_storyboard(storyboard_data: dict, quality: str = "high"):
    import logging
    import math
    logger = logging.getLogger("uvicorn.error")
    
    try:
        # Auto-convert Snehal's contract format if sent directly to /approve
        storyboard_data = _convert_contract_to_storyboard(storyboard_data)
        if "scenes" in storyboard_data:
            storyboard_data["scenes"] = _normalize_scenes(storyboard_data["scenes"])

        # Validate schema before proceeding
        try:
            StoryboardModel.model_validate(storyboard_data)
        except ValidationError as e:
            logger.error(f"Storyboard validation failed: {e}")
            raise HTTPException(status_code=422, detail=f"Invalid storyboard schema: {e}")

        absolute_public_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "public")
        )
        os.makedirs(absolute_public_dir, exist_ok=True)
        _cleanup_old_audio(absolute_public_dir)

        # Generate TTS audio files (scene_1.mp3, scene_2.mp3...) with gTTS fallback
        scenes = storyboard_data.get("scenes", [])
        generated_count = 0
        for scene in scenes:
            scene_id = scene.get("id")
            narration = scene.get("narration")
            if scene_id is not None and narration:
                audio_path = os.path.join(absolute_public_dir, f"scene_{scene_id}.mp3")
                await generate_edge_audio(scene, narration, audio_path)
                generated_count += 1

        # Save to src/data/storyboard.json
        absolute_storyboard_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "src", "data", "storyboard.json")
        )
        os.makedirs(os.path.dirname(absolute_storyboard_path), exist_ok=True)

        def remove_nans(obj):
            if isinstance(obj, float) and math.isnan(obj):
                return None
            elif isinstance(obj, dict):
                return {k: remove_nans(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [remove_nans(i) for i in obj]
            return obj

        cleaned_storyboard = remove_nans(storyboard_data)
        with open(absolute_storyboard_path, "w", encoding="utf-8") as f:
            json.dump(cleaned_storyboard, f, indent=2)

        return {
            "status": "success",
            "message": f"Storyboard approved! {generated_count} audio track(s) generated.",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error approving storyboard: {str(e)}")

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
You are an expert video producer. Update the Remotion storyboard JSON based on this instruction:
"{instruction}"

Current Storyboard JSON:
{storyboard}

Maintain the exact same JSON structure (including `top_kpi_controls`, `main_chart`, and `side_insight_panel` if present).
Return ONLY the updated full JSON object, with no markdown fences.
"""
        )
        raw_json = await _invoke_with_retry(prompt, {
            "instruction": instruction,
            "storyboard": json.dumps(storyboard_data, indent=2)
        })
        cleaned = _strip_markdown_fences(raw_json)
        updated = json.loads(cleaned)
        updated = _convert_contract_to_storyboard(updated)
        updated["scenes"] = _normalize_scenes(updated.get("scenes", []))
        validated = StoryboardModel.model_validate(updated)
        return validated.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Editing error: {e}")

@app.get("/fetch-broll")
async def fetch_broll(query: str):
    pexels_key = os.getenv("PEXELS_API_KEY") or os.getenv("PEXEL_API_KEY")
    if not pexels_key:
        raise HTTPException(status_code=500, detail="Pexels API key not configured.")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "[https://api.pexels.com/videos/search](https://api.pexels.com/videos/search)",
                headers={"Authorization": pexels_key},
                params={"query": query, "per_page": 5, "orientation": "landscape"}
            )
            response.raise_for_status()
            data = response.json()
            videos = []
            for video in data.get("videos", []):
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
        raise HTTPException(status_code=500, detail=f"Failed to fetch B-roll: {e}")

@app.get("/download/latest")
async def download_latest_video():
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "out"))
    if not os.path.exists(out_dir):
        raise HTTPException(status_code=404, detail="No output directory found.")
    mp4_files = glob.glob(os.path.join(out_dir, "*.mp4"))
    if not mp4_files:
        raise HTTPException(status_code=404, detail="No generated videos found.")
    latest_file = max(mp4_files, key=os.path.getctime)
    return FileResponse(path=latest_file, media_type="video/mp4", filename=os.path.basename(latest_file))

static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)

@app.get("/share/{vid_id}")
async def share_route(vid_id: str):
    return FileResponse(os.path.join(static_dir, "index.html"))

app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")