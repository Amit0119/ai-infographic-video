# AI-Driven Infographic Video Engine

An automated pipeline that transforms raw corporate sales data (Excel/CSV) into high-quality, programmatic video infographics using AI.

## Core Features
- **Dynamic AI Storyboard Generation**: Upload an `.xlsx` file and watch Google Gemini instantly analyze the data, determine the best visual representations (KPIs, bar charts, line charts, etc.), and structure a complete video storyboard.
- **Natural Language AI Revisions**: Tweak the storyboard effortlessly through a clean control panel using natural language prompts to have Gemini dynamically refine titles, scripts, and tone.
- **Automated Voiceovers**: Seamlessly generates and syncs high-quality narration audio via Edge-TTS.
- **Live Video Preview & Rendering**: Leveraging Remotion Studio, the React-based video hot-reloads instantly upon approval, fully styled and synced to the generated audio.
- **Dynamic Branding**: Apply custom background colors and persistent company watermarks programmatically directly from the UI.

## Tech Stack
- **Backend**: FastAPI, Python, Pandas
- **AI Engine**: Google Gemini API (`generateContent`)
- **Audio**: Edge-TTS (en-US-AriaNeural)
- **Frontend / Video Rendering**: React, Remotion, TypeScript
- **Styling**: Pure CSS / Inline React Styles (Optimized for Dark Theme)

## How to Run Locally

### 1. Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy the template environment file and add your Gemini API Key:
   ```bash
   cp .env.template .env
   # Edit .env and insert your GEMINI_API_KEY
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```

### 2. Frontend Setup
1. Open a new terminal and navigate to the project root.
2. Install the Node modules:
   ```bash
   npm install
   ```
3. Start the Remotion Studio:
   ```bash
   npm run dev
   ```

### 3. Usage
1. Open the AI Control Panel in your browser at `http://localhost:8000/`.
2. Upload your data file (e.g., `sample.xlsx`).
3. Review the AI-generated storyboard. Use the AI Revision text box to perform natural language edits if desired.
4. Define your brand's background color and watermark.
5. Click **Approve & Render Video**.
6. Check your Remotion Studio (usually `http://localhost:3000`) to view the fully rendered, audio-synced video hot-reloaded!
