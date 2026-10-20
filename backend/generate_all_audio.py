import os
import json
import asyncio
import edge_tts
from gtts import gTTS

VOICE = "en-US-ChristopherNeural"

async def generate_one(scene_id: int, text: str, out_path: str):
    try:
        comm = edge_tts.Communicate(text=text, voice=VOICE)
        await comm.save(out_path)
        if not os.path.exists(out_path) or os.path.getsize(out_path) < 100:
            raise ValueError("Empty file from edge-tts")
        print(f"[OK - EdgeTTS] scene_{scene_id}.mp3")
    except Exception as e:
        print(f"[FALLBACK - gTTS] Edge-TTS failed ({e}), using gTTS for scene_{scene_id}.mp3...")
        if os.path.exists(out_path):
            os.remove(out_path)
        tts = gTTS(text=text, lang="en", slow=False)
        tts.save(out_path)
        print(f"[OK - gTTS] scene_{scene_id}.mp3")

async def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    storyboard_path = os.path.abspath(os.path.join(base_dir, "..", "src", "data", "storyboard.json"))
    public_dir = os.path.abspath(os.path.join(base_dir, "..", "public"))
    os.makedirs(public_dir, exist_ok=True)

    with open(storyboard_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    for s in data.get("scenes", []):
        sid = s.get("id")
        narration = s.get("narration", "")
        if sid and narration:
            out_file = os.path.join(public_dir, f"scene_{sid}.mp3")
            await generate_one(sid, narration, out_file)

if __name__ == "__main__":
    asyncio.run(main())