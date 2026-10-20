import asyncio
from pydantic import BaseModel
from typing import Optional

class ExplainerRequestModel(BaseModel):
    topic: str
    initial_prompt: Optional[str] = None

async def test_generate():
    try:
        import traceback
        import sys
        
        from main import generate_explainer
        
        payload = ExplainerRequestModel(
            topic="TechNova Q3 2026",
            initial_prompt="Analyze this processed 2023 financial data and structure a story."
        )
        
        result = await generate_explainer(payload)
        print("SUCCESS:")
        print(result)
        
    except Exception as e:
        import traceback
        print("TRACEBACK:")
        print(traceback.format_exc())

if __name__ == "__main__":
    asyncio.run(test_generate())
