# Multi-Modal Financial Complaint Analyzer

A full-stack web app that analyzes financial complaints using a multi-step Gemini pipeline (issues -> category -> summary) with optional image input.

## Project structure

- client: Vite + React frontend (Figma-inspired UI)
- server: Express API that orchestrates Gemini calls
- frontend_figma_mojo: reference design (unchanged)

## Setup

### 1) Backend

```
cd server
npm install
```

Create or edit .env:

```
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-1.5-flash
FRONTEND_ORIGIN=http://localhost:5173
PORT=3001
```

Run the API:

```
npm run dev
```

### 2) Frontend

```
cd client
npm install
npm run dev
```

Open http://localhost:5173

## Single-deploy (Render)

This app can be deployed as a single Render Web Service that serves the built client from Express.

### Render settings

- Root directory: repo root
- Build command:
  ```
  cd client && npm install && npm run build && cd ../server && npm install
  ```
- Start command:
  ```
  cd server && npm run start
  ```

### Render environment variables

- GEMINI_API_KEY
- GEMINI_MODEL (example: models/gemini-2.5-flash)
- PORT (Render injects this automatically)

Once deployed, the Express server will serve the client build from client/dist.

## API

POST /analyze

Body:
```
{
  "text": "your complaint text",
  "imageBase64": "data:image/png;base64,..." // optional
}
```

Response:
```
{
  "category": "Billing Issue",
  "keyIssues": ["...", "..."],
  "summary": "..."
}
```

## Gemini models

For text + image, use a multimodal model:
- gemini-1.5-flash (fast, free-tier friendly)
- gemini-1.5-pro (higher quality)

Update GEMINI_MODEL in server/.env to switch.
