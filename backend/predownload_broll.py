"""
Pre-download all Pexels B-Roll videos from storyboard.json to local public/broll/ folder,
then update the storyboard to point to local paths so Remotion renders offline.
"""
import json
import os
import requests
import sys

STORYBOARD_PATH = r"E:\ai-infographic-video\src\data\storyboard.json"
BROLL_DIR = r"E:\ai-infographic-video\public\broll"

def main():
    # Load storyboard
    with open(STORYBOARD_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    os.makedirs(BROLL_DIR, exist_ok=True)

    scenes = data.get("scenes", [])
    total = sum(1 for s in scenes if s.get("brollUrl"))
    downloaded = 0
    failed = 0

    print(f"\n{'='*60}")
    print(f"  Pexels B-Roll Pre-Downloader")
    print(f"  Found {total} videos to download")
    print(f"{'='*60}\n")

    for scene in scenes:
        url = scene.get("brollUrl")
        if not url:
            continue

        scene_id = scene.get("id", "unknown")
        # Create a safe filename from the URL
        filename = f"{scene_id}_broll.mp4"
        local_path = os.path.join(BROLL_DIR, filename)

        # Skip if already downloaded
        if os.path.exists(local_path) and os.path.getsize(local_path) > 10000:
            print(f"  [SKIP] {scene_id}: Already downloaded ({os.path.getsize(local_path) / 1024 / 1024:.1f} MB)")
            # Update path to local
            scene["brollUrl"] = f"/broll/{filename}"
            downloaded += 1
            continue

        print(f"  [DOWNLOADING] {scene_id}: {url[:80]}...")
        try:
            resp = requests.get(url, timeout=120, stream=True)
            resp.raise_for_status()

            total_size = 0
            with open(local_path, "wb") as vf:
                for chunk in resp.iter_content(chunk_size=8192):
                    vf.write(chunk)
                    total_size += len(chunk)

            size_mb = total_size / 1024 / 1024
            print(f"  [OK] {scene_id}: Downloaded {size_mb:.1f} MB")

            # Update storyboard to use local path
            scene["brollUrl"] = f"/broll/{filename}"
            downloaded += 1

        except Exception as e:
            print(f"  [FAIL] {scene_id}: {e}")
            failed += 1

    # Save updated storyboard
    with open(STORYBOARD_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(f"\n{'='*60}")
    print(f"  DONE: {downloaded}/{total} downloaded, {failed} failed")
    print(f"  Storyboard updated with local paths!")
    print(f"{'='*60}\n")

    if failed > 0:
        print("  WARNING: Some videos failed. Disconnect VPN and retry!")
        sys.exit(1)

if __name__ == "__main__":
    main()
