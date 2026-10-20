import asyncio
import json
import traceback

async def run():
    try:
        from main import approve_storyboard
        with open('../src/data/storyboard.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        await approve_storyboard(data)
    except Exception as e:
        print("TRACEBACK:")
        print(traceback.format_exc())

if __name__ == "__main__":
    asyncio.run(run())
