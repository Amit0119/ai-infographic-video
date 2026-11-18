import asyncio
import json
import os
import edge_tts
from mutagen.mp3 import MP3

SCENE_SEGMENTS = {
    1: [
        {
            "text": "Phase One establishes the historical baseline. Begin with a twelve month baseline audit window to cleanse one-time anomalies across all cost centers.",
            "kpis": [0],
            "chart_rows": [],
            "steps": [0],
        },
        {
            "text": "Second, lock in top-down revenue growth at plus fifteen percent year-over-year, alongside minimum operating margin guardrails.",
            "kpis": [1],
            "chart_rows": [],
            "steps": [1],
        },
        {
            "text": "Third, publish a standardized four point five percent macro inflation cap and merit bands before issuing budget templates.",
            "kpis": [2],
            "chart_rows": [],
            "steps": [2],
        },
    ],
    2: [
        {
            "text": "In Phase Two, apply the fifty-thirty-twenty allocation rule. Dedicate fifty percent to core fixed operations, payroll, and contractual licenses.",
            "kpis": [0],
            "chart_rows": [0],
            "steps": [0],
        },
        {
            "text": "Allocate thirty percent to strategic growth, splitting twenty percent into R and D and ten percent into digital and CAPEX upgrades.",
            "kpis": [1],
            "chart_rows": [1, 2],
            "steps": [1],
        },
        {
            "text": "Finally, ring-fence the remaining twenty percent across G and A compliance and an unallocated ten percent CFO contingency reserve.",
            "kpis": [2],
            "chart_rows": [3, 4],
            "steps": [2],
        },
    ],
    3: [
        {
            "text": "Phase Three drives cross-functional consolidation. FP and A trims bottom-up submissions by eight point five percent across Sales, Cloud, and G and A to close the ceiling gap.",
            "kpis": [1],
            "chart_rows": [1, 2, 3],
            "steps": [0],
        },
        {
            "text": "Priority growth in Engineering and R and D is protected at two hundred fifty thousand dollars, while three scenario stress tests validate downside sensitivity.",
            "kpis": [0],
            "chart_rows": [0],
            "steps": [1],
        },
        {
            "text": "Once an eighteen month minimum cash runway is verified, the board ratifies the final cost envelopes for ERP release.",
            "kpis": [2],
            "chart_rows": [],
            "steps": [2],
        },
    ],
    4: [
        {
            "text": "Phase Four operationalizes rolling governance. Department controllers deliver monthly Budget-versus-Actual flash scorecards within a strict Day Five close SLA.",
            "kpis": [1],
            "chart_rows": [0, 1],
            "steps": [0],
        },
        {
            "text": "Automated triggers enforce a plus-or-minus five percent variance threshold, requiring immediate corrective action whenever any cost center breaches tolerance.",
            "kpis": [0],
            "chart_rows": [2],
            "steps": [1],
        },
        {
            "text": "Quarterly rolling re-forecasts sustain a ninety-six point five percent accuracy target, driving year-end landing performance up to ninety-eight percent.",
            "kpis": [2],
            "chart_rows": [3],
            "steps": [2],
        },
    ],
}


async def fetch_segment_bytes(text: str) -> bytes:
    comm = edge_tts.Communicate(text, "en-US-ChristopherNeural", rate="-2%")
    audio_bytes = bytearray()
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio_bytes.extend(chunk["data"])
    return bytes(audio_bytes)


async def build_budget_v2_assets():
    os.makedirs("public", exist_ok=True)
    with open("src/data/annual_budget_blueprint.json", "r", encoding="utf-8") as f:
        blueprint_data = json.load(f)

    pause_duration_sec = 0.864  # 36 MPEG frames * 24ms = 0.864s human pause

    for scene in blueprint_data["scenes"]:
        sid = scene["id"]
        segments = SCENE_SEGMENTS[sid]
        combined_mp3 = bytearray()
        highlights = []
        cursor_sec = 0.0

        for idx, seg in enumerate(segments):
            seg_bytes = await fetch_segment_bytes(seg["text"])
            seg_duration = len(seg_bytes) / 6000.0
            start_t = round(cursor_sec, 2)
            end_t = round(cursor_sec + seg_duration, 2)

            highlights.append({
                "start": start_t,
                "end": end_t,
                "kpis": seg["kpis"],
                "chart_rows": seg["chart_rows"],
                "steps": seg["steps"],
            })

            combined_mp3.extend(seg_bytes)
            cursor_sec += seg_duration

            if idx < len(segments) - 1 and len(seg_bytes) >= 144:
                silent_frame = seg_bytes[-144:]
                combined_mp3.extend(silent_frame * 36)
                cursor_sec += pause_duration_sec

        out_mp3 = f"public/scene_{sid}.mp3"
        with open(out_mp3, "wb") as f:
            f.write(combined_mp3)

        audio = MP3(out_mp3)
        scene["durationInSeconds"] = round(audio.info.length + 1.0, 1)
        scene["narration"] = " ... ".join(s["text"] for s in segments)
        scene["blueprint_meta"]["steps_header"] = "MANDATORY BLUEPRINT STEPS"
        scene["blueprint_meta"]["sla_label"] = "BLUEPRINT SLA TIMELINE"
        scene["blueprint_meta"]["highlights"] = highlights
        print(f"Scene {sid} -> {out_mp3} ({scene['durationInSeconds']}s) with {len(highlights)} synced highlight windows")

    blueprint_data["video"]["duration"] = round(
        sum(s["durationInSeconds"] for s in blueprint_data["scenes"]), 1
    )

    with open("src/data/annual_budget_blueprint.json", "w", encoding="utf-8") as f:
        json.dump(blueprint_data, f, indent=2)

    with open("src/data/storyboard.json", "w", encoding="utf-8") as f:
        json.dump(blueprint_data, f, indent=2)

    print("Done! Updated annual_budget_blueprint.json & storyboard.json with human pauses and live visual highlights.")


if __name__ == "__main__":
    asyncio.run(build_budget_v2_assets())