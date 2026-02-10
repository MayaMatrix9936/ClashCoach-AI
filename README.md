# ClashCoach AI — Gemini 3 Hackathon (Devpost)

**Contest:** Gemini 3 Hackathon on Devpost  
**Link:** https://gemini3.devpost.com/

ClashCoach AI is a Clash of Clans tactical assistant that analyzes your army and base images, then generates a step-by-step attack plan with clear deployment directions. It uses the Gemini 3 API for multimodal reasoning and produces structured, actionable guidance for players.

## What it does
- Reads your **army composition image** and **enemy base image**
- Generates a **multi‑phase strategy** with explicit deployment directions (e.g., “9 o’clock (West)”)
- Renders **consistent arrow overlays** on the base image to visualize each direction

## Gemini 3 Integration (Write-up)
ClashCoach AI makes Gemini 3 the strategic brain of the experience, transforming two screenshots and a goal into a tournament‑ready plan. We call `gemini-3-pro-preview` with a multimodal prompt that includes the army image, the enemy base image, and the player’s objective, enabling reasoning across visual and textual inputs. The response is enforced with a strict JSON schema to guarantee reliability: army analysis, base weaknesses, critical advice, optional army improvements (if retraining is possible), and 3–5 tactical phases with explicit troop/spell usage.

To keep outputs deterministic and actionable, the prompt requires numeric troop counts and directions expressed as both clock position and cardinal direction. The UI then maps each phase directly onto the uploaded base image with directional overlays, closing the loop between what the player sees and what the model recommends. We also use Gemini 3 for real‑time validation: while the user types, the goal is checked for Clash relevance, and uploaded images are verified as Clash of Clans screenshots (with a fail‑safe confirmation path when confidence is low). Lightweight telemetry logs encoding and model latency to keep performance visible and debuggable.

Gemini 3’s multimodal reasoning and structured response support make this possible. Without them, the app could not convert raw images into a consistent, phase‑based strategy that feels like a coach rather than a chatbot. The result is faster, more confident decision‑making for millions of players who want a reliable plan without hours of trial and error.

## Tech Stack
- React + TypeScript + Vite
- Tailwind CSS (via CDN)
- Google Gemini API (`@google/genai`)

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key
3. Run the app:
   `npm run dev`

## Devpost Submission Checklist
- **Project page:** https://gemini3.devpost.com/
- **Public demo link:** https://clash-coach-ai.vercel.app/
- **Public code repo:** https://github.com/MayaMatrix9936/ClashCoach-AI
- **Demo video:** https://www.loom.com/share/c0a9ae7a0d34452198dcc0c29e3d0c90
