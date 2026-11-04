import asyncio
import json
import os
import edge_tts
from mutagen.mp3 import MP3

SCENE_SEGMENTS = {
    1: [
        {
            "text": "Executive summary of the financial dataset. Against a total allocated budget of 1.76 million dollars, actual expenditure stood at 1.72 million dollars.",
            "kpis": [0, 1],
            "chart_rows": [],
            "steps": [],
        },
        {
            "text": "This delivers a net favorable savings of 44 thousand dollars, keeping overall spend 2.5 percent under budget.",
            "kpis": [2],
            "chart_rows": [],
            "steps": [0],
        },
        {
            "text": "In the core cost center chart, Development, Training, and Marketing all operated well below their allocated ceilings.",
            "kpis": [],
            "chart_rows": [0, 2, 3],
            "steps": [1],
        },
        {
            "text": "However, Operational Costs exceeded budget by 5.5 percent and is flagged for immediate review.",
            "kpis": [],
            "chart_rows": [1],
            "steps": [2],
        },
    ],
    2: [
        {
            "text": "Focusing on cost overruns. Operational Costs recorded actual spend of 174.1 thousand dollars against a 165 thousand dollar budget, a 5.5 percent overrun.",
            "kpis": [0],
            "chart_rows": [0],
            "steps": [0],
        },
        {
            "text": "Second, Maintenance Cost reached 50.5 thousand dollars against a 48 thousand dollar budget, resulting in a 5.18 percent variance.",
            "kpis": [1],
            "chart_rows": [2],
            "steps": [1],
        },
        {
            "text": "Together, these two categories created a combined overrun impact of 11.6 thousand dollars.",
            "kpis": [2],
            "chart_rows": [0, 2],
            "steps": [],
        },
        {
            "text": "Fortunately, strong favorable savings of 24.7 thousand dollars across Training and Travel completely absorbed these overruns.",
            "kpis": [],
            "chart_rows": [1, 3],
            "steps": [2],
        },
    ],
    3: [
        {
            "text": "Across the portfolio breakdown, Development Costs represent 76.5 percent of total spend and delivered 25.6 thousand dollars in savings.",
            "kpis": [0],
            "chart_rows": [0],
            "steps": [1],
        },
        {
            "text": "Training Cost and Travel and Marketing generated an additional 30 thousand dollars in combined savings.",
            "kpis": [1, 2],
            "chart_rows": [2, 3],
            "steps": [],
        },
        {
            "text": "Based on these insights, the AI engine recommends an immediate line-item audit on Operational and Maintenance workflows.",
            "kpis": [],
            "chart_rows": [1, 4],
            "steps": [0],
        },
        {
            "text": "Meanwhile, teams should continue monitoring Marketing and Travel guardrails to sustain overall favorable performance.",
            "kpis": [],
            "chart_rows": [],
            "steps": [2],
        },
    ],
}

storyboard_data = {
    "template_category": "Finance & Accounts — BvA Analytics",
    "blueprint_id": "FIN_BVA_ANALYTICS_V2",
    "video": {
        "title": "AI Financial Analytics & Variance Report",
        "duration": 65.0,
        "audience": "Executive Leadership & FP&A",
        "fps": 30,
        "width": 1920,
        "height": 1080,
    },
    "style": {
        "backgroundColor": "#0b1120",
        "primaryColor": "#38bdf8",
        "secondaryColor": "#818cf8",
        "accentColor": "#34d399",
        "textColor": "#ffffff",
        "subtextColor": "#94a3b8",
        "fontFamily": "Inter",
        "currencySymbol": "$",
        "companyWatermark": "DeptCast AI Analytics Engine",
    },
    "scenes": [
        {
            "id": 1,
            "type": "dashboard_ui",
            "durationInSeconds": 22.0,
            "title": "Executive Summary: Total Budget vs Actual Expenditure",
            "section_header": "AI ANALYTICS ENGINE  |  PORTFOLIO SUMMARY (STEP 01 / 03)",
            "narration": "",
            "blueprint_meta": {
                "template_name": "BvA Analytics Deliverable",
                "blueprint_code": "ANL-FIN-01",
                "phase_badge": "OVERALL STATUS: FAVORABLE",
                "steps_header": "KEY AI INSIGHTS",
                "sla_label": "VALIDATION STATUS",
                "owner_role": "AI Analytics & Insight Engine",
                "sla_timeline": "Excel Cross-Validated: PASSED",
                "highlights": [],
            },
            "blueprint_steps": [
                {
                    "step_no": "01",
                    "title": "Portfolio Under Budget (-2.5%)",
                    "detail": "Total actual spend ($1,718,180) remained $44,020 below the master budget ($1,762,200).",
                    "tag": "FAVORABLE",
                    "status": "favorable",
                },
                {
                    "step_no": "02",
                    "title": "4 of 6 Cost Centers Favorable",
                    "detail": "Development, Training, Travelling, and Marketing all operated below their allocated ceilings.",
                    "tag": "COST DISCIPLINE",
                    "status": "favorable",
                },
                {
                    "step_no": "03",
                    "title": "2 Categories Flagged for Overrun",
                    "detail": "Operational Costs (+5.5%) and Maintenance Cost (+5.18%) exceeded budget thresholds.",
                    "tag": "ACTION REQUIRED",
                    "status": "overspent",
                },
            ],
            "top_kpi_controls": [
                {
                    "label": "Total Allocated Budget",
                    "value": 1762200,
                    "prefix": "$",
                    "unit": "",
                    "variance_pct": 0.0,
                    "status_badge": "MASTER CEILING",
                    "traffic_light": "green",
                },
                {
                    "label": "Total Actual Expenditure",
                    "value": 1718180,
                    "prefix": "$",
                    "unit": "",
                    "variance_pct": -2.5,
                    "status_badge": "UNDER BUDGET",
                    "traffic_light": "green",
                },
                {
                    "label": "Net Favorable Variance",
                    "value": 44020,
                    "prefix": "$",
                    "unit": "",
                    "variance_pct": -2.5,
                    "status_badge": "SAVINGS ACHIEVED",
                    "traffic_light": "green",
                },
            ],
            "main_chart": {
                "component": "Grouped_Bar_Chart",
                "title": "Core Cost Centers: Allocated Budget vs Actual Spend ($)",
                "categories": [
                    {
                        "name": "Development Costs",
                        "label": "Development Costs",
                        "budget": 1340200,
                        "actual": 1314635,
                        "variance_pct": -1.91,
                        "status": "favorable",
                    },
                    {
                        "name": "Operational Costs",
                        "label": "Operational Costs",
                        "budget": 165000,
                        "actual": 174082,
                        "variance_pct": 5.5,
                        "status": "overspent",
                    },
                    {
                        "name": "Training Cost",
                        "label": "Training Cost",
                        "budget": 86000,
                        "actual": 68000,
                        "variance_pct": -20.93,
                        "status": "favorable",
                    },
                    {
                        "name": "Marketing Costs",
                        "label": "Marketing Costs",
                        "budget": 75000,
                        "actual": 69676,
                        "variance_pct": -7.1,
                        "status": "favorable",
                    },
                ],
            },
            "chart_data": [],
            "captions": [],
        },
        {
            "id": 2,
            "type": "dashboard_ui",
            "durationInSeconds": 22.0,
            "title": "Overrun Analysis: Operational & Maintenance Cost Variances",
            "section_header": "AI ANALYTICS ENGINE  |  OVERRUN DIAGNOSTICS (STEP 02 / 03)",
            "narration": "",
            "blueprint_meta": {
                "template_name": "BvA Analytics Deliverable",
                "blueprint_code": "ANL-FIN-02",
                "phase_badge": "VARIANCE ALERT: 2 OVERRUNS",
                "steps_header": "KEY AI INSIGHTS",
                "sla_label": "VARIANCE THRESHOLD",
                "owner_role": "Department Cost Controllers",
                "sla_timeline": "Threshold Breached: >5.0%",
                "highlights": [],
            },
            "blueprint_steps": [
                {
                    "step_no": "01",
                    "title": "Operational Costs Overrun (+$9.08K)",
                    "detail": "Actual spend reached $174,082 vs $165,000 budget (+5.5%). Review recurring operational run-rate.",
                    "tag": "+5.50% OVER",
                    "status": "overspent",
                },
                {
                    "step_no": "02",
                    "title": "Maintenance Cost Overrun (+$2.49K)",
                    "detail": "Actual spend reached $50,487 vs $48,000 budget (+5.18%). Audit unplanned maintenance work orders.",
                    "tag": "+5.18% OVER",
                    "status": "overspent",
                },
                {
                    "step_no": "03",
                    "title": "Offset by Travel & Training Savings",
                    "detail": "Combined $24,700 savings in Training (-20.9%) and Travel (-14.0%) absorbed the operational overruns.",
                    "tag": "BUFFER OFFSET",
                    "status": "favorable",
                },
            ],
            "top_kpi_controls": [
                {
                    "label": "Operational Cost Actual",
                    "value": 174082,
                    "prefix": "$",
                    "unit": "",
                    "variance_pct": 5.5,
                    "status_badge": "OVERRUN (+$9.1K)",
                    "traffic_light": "red",
                },
                {
                    "label": "Maintenance Cost Actual",
                    "value": 50487,
                    "prefix": "$",
                    "unit": "",
                    "variance_pct": 5.18,
                    "status_badge": "OVERRUN (+$2.5K)",
                    "traffic_light": "red",
                },
                {
                    "label": "Combined Overrun Impact",
                    "value": 11569,
                    "prefix": "+$",
                    "unit": "",
                    "variance_pct": 5.43,
                    "status_badge": "NEEDS OPTIMIZATION",
                    "traffic_light": "red",
                },
            ],
            "main_chart": {
                "component": "Grouped_Bar_Chart",
                "title": "Secondary & Flagged Categories: Budget vs Actual ($)",
                "categories": [
                    {
                        "name": "Operational Costs",
                        "label": "Operational Costs",
                        "budget": 165000,
                        "actual": 174082,
                        "variance_pct": 5.5,
                        "status": "overspent",
                    },
                    {
                        "name": "Training Cost",
                        "label": "Training Cost",
                        "budget": 86000,
                        "actual": 68000,
                        "variance_pct": -20.93,
                        "status": "favorable",
                    },
                    {
                        "name": "Maintenance Cost",
                        "label": "Maintenance Cost",
                        "budget": 48000,
                        "actual": 50487,
                        "variance_pct": 5.18,
                        "status": "overspent",
                    },
                    {
                        "name": "Travelling Cost",
                        "label": "Travelling Cost",
                        "budget": 48000,
                        "actual": 41300,
                        "variance_pct": -13.96,
                        "status": "favorable",
                    },
                ],
            },
            "chart_data": [],
            "captions": [],
        },
        {
            "id": 3,
            "type": "dashboard_ui",
            "durationInSeconds": 22.0,
            "title": "Expenditure Share & AI Optimization Recommendations",
            "section_header": "AI ANALYTICS ENGINE  |  RECOMMENDATIONS (STEP 03 / 03)",
            "narration": "",
            "blueprint_meta": {
                "template_name": "BvA Analytics Deliverable",
                "blueprint_code": "ANL-FIN-03",
                "phase_badge": "AI INSIGHT RECOMMENDATIONS",
                "steps_header": "ACTIONABLE RECOMMENDATIONS",
                "sla_label": "QUALITY ASSURANCE",
                "owner_role": "FP&A & Department Leads",
                "sla_timeline": "Validation: 5/5 Checks Passed",
                "highlights": [],
            },
            "blueprint_steps": [
                {
                    "step_no": "01",
                    "title": "Optimize Operational & Maintenance Spend",
                    "detail": "Conduct line-item review on Operational ($174K) and Maintenance ($50.5K) costs to eliminate the +5% overrun.",
                    "tag": "PRIORITY FIX",
                    "status": "favorable",
                },
                {
                    "step_no": "02",
                    "title": "Capture Development & Training Efficiencies",
                    "detail": "Development (-$25.6K) and Training (-$18.0K) generated the largest dollar savings across the dataset.",
                    "tag": "$43.6K SAVED",
                    "status": "favorable",
                },
                {
                    "step_no": "03",
                    "title": "Maintain Category Monitoring Guardrails",
                    "detail": "Continue tracking Marketing (-7.1%) and Travel (-14.0%) to sustain overall favorable budget status.",
                    "tag": "ON TRACK",
                    "status": "favorable",
                },
            ],
            "top_kpi_controls": [
                {
                    "label": "Development Savings",
                    "value": 25565,
                    "prefix": "-$",
                    "unit": "",
                    "variance_pct": -1.91,
                    "status_badge": "LARGEST SAVING",
                    "traffic_light": "green",
                },
                {
                    "label": "Training Cost Savings",
                    "value": 18000,
                    "prefix": "-$",
                    "unit": "",
                    "variance_pct": -20.93,
                    "status_badge": "TOP % SAVING",
                    "traffic_light": "green",
                },
                {
                    "label": "Travel & Marketing Saved",
                    "value": 12024,
                    "prefix": "-$",
                    "unit": "",
                    "variance_pct": -9.78,
                    "status_badge": "UNDER CEILING",
                    "traffic_light": "green",
                },
            ],
            "main_chart": {
                "component": "Donut_Chart",
                "title": "Actual Expenditure Breakdown by Category ($1.72M Total)",
                "center_label": "$1.72M Actual",
                "segments": [
                    {
                        "name": "Development Costs",
                        "label": "Development Costs",
                        "value": 1314635,
                        "percentage": 76.5,
                        "share_pct": 76.5,
                        "color": "#38bdf8",
                    },
                    {
                        "name": "Operational Costs",
                        "label": "Operational Costs",
                        "value": 174082,
                        "percentage": 10.1,
                        "share_pct": 10.1,
                        "color": "#f43f5e",
                    },
                    {
                        "name": "Marketing Costs",
                        "label": "Marketing Costs",
                        "value": 69676,
                        "percentage": 4.1,
                        "share_pct": 4.1,
                        "color": "#34d399",
                    },
                    {
                        "name": "Training Cost",
                        "label": "Training Cost",
                        "value": 68000,
                        "percentage": 4.0,
                        "share_pct": 4.0,
                        "color": "#818cf8",
                    },
                    {
                        "name": "Maintenance & Travel",
                        "label": "Maintenance & Travel",
                        "value": 91787,
                        "percentage": 5.3,
                        "share_pct": 5.3,
                        "color": "#f59e0b",
                    },
                ],
            },
            "chart_data": [],
            "captions": [],
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


async def build_snehal_video_assets():
    os.makedirs("public", exist_ok=True)
    pause_duration_sec = 0.864  # 36 MPEG frames * 24ms = 0.864s human pause

    for scene in storyboard_data["scenes"]:
        sid = scene["id"]
        segments = SCENE_SEGMENTS[sid]
        combined_mp3 = bytearray()
        highlights = []
        cursor_sec = 0.0

        for idx, seg in enumerate(segments):
            seg_bytes = await fetch_segment_bytes(seg["text"])
            # edge-tts outputs 48kbps CBR MP3 (6000 bytes/sec, 144 bytes/frame)
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

            # Add 0.86s natural human silence pause between segments
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
        scene["blueprint_meta"]["highlights"] = highlights
        print(f"Scene {sid} -> {out_mp3} ({scene['durationInSeconds']}s) with {len(highlights)} synced highlight windows")

    storyboard_data["video"]["duration"] = round(
        sum(s["durationInSeconds"] for s in storyboard_data["scenes"]), 1
    )
    with open("src/data/storyboard.json", "w", encoding="utf-8") as f:
        json.dump(storyboard_data, f, indent=2)
    print("Done! Updated src/data/storyboard.json with audio pauses & visual highlight sync.")


if __name__ == "__main__":
    asyncio.run(build_snehal_video_assets())