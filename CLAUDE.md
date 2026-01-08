# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GreetingGen** is an AI-powered Chinese New Year greeting card generator web application for the 2026 Year of the Horse. It generates customized greetings with text, images, and audio using Google's Gemini AI models.

**Tech Stack:**
- React 19.2.3 + TypeScript 5.8
- Vite 6.2 (dev server & build tool)
- Tailwind CSS 3.x (via CDN in index.html)
- @google/genai 1.34 (Google Gemini AI SDK)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production (outputs to /dist)
npm run build

# Preview production build
npm run preview
```

## Environment Setup

This app requires a `GEMINI_API_KEY` environment variable:

1. Create `.env.local` in the project root (already gitignored)
2. Add: `GEMINI_API_KEY=your_api_key_here`

**Note:** The app also integrates with AI Studio's key selection flow. In `geminiService.ts`, the client is initialized with `process.env.API_KEY` (injected by Vite from `GEMINI_API_KEY`). The app checks for AI Studio's `window.aistudio.hasSelectedApiKey()` in `App.tsx:90-100`.

## Architecture

### Component Structure

```
App.tsx (main state container, 516 lines)
├── Header.tsx (navigation bar)
├── Lantern.tsx (decorative animated SVG)
└── Confetti (inline component in App.tsx)
```

### Service Layer

**`services/geminiService.ts`** - Centralized API integration with three main functions:

- `generateGreeting(config)` - Text generation using `gemini-3-flash-preview` (temperature: 0.8)
- `generateCardImage(style)` - Image generation using `gemini-2.5-flash-image`, returns base64 data URL
- `generateSpeech(text)` - TTS using `gemini-2.5-flash-preview-tts` with voice 'Kore', returns base64 audio

All functions use `getAiClient()` helper which creates a fresh `GoogleGenAI` instance with the current environment key.

### Data Flow

```
User Input → GreetingConfig State → Generate Button Click
    ↓
Parallel API Calls:
├─ generateGreeting() (required, blocks on success)
├─ generateCardImage() (optional, falls back to default on error)
└─ generateSpeech() (async, non-blocking)
    ↓
GeneratedContent State → UI Update → Copy/Play Actions
```

### State Management

The app uses React local state (`useState`) - no external state management library. Key state in `App.tsx`:
- `config: GreetingConfig` - User's selected options
- `status: 'idle' | 'generating' | 'success' | 'error'` - Generation state
- `resultText, bgImage, audioData` - Generated content
- `audioContextRef` - Ref for AudioContext persistence

## Type Definitions

**`types.ts`** exports:
- `StyleOption` enum: `Elegant` (古风典雅), `Creative` (文采斐然), `Colloquial` (通俗口语), `Intimate` (亲密温馨)
- `GreetingConfig` interface: `recipient`, `style`, `length`, `customText`
- `GeneratedContent` interface: `text`, `imageUrl?`, `audioData?`

## Styling System

**Font classes** (defined in index.html via Google Fonts):
- `font-display` - Noto Sans SC
- `font-serif-cn` - Noto Serif SC
- `font-calligraphy` - Ma Shan Zheng
- `font-cursive-cn` - Zhi Mang Xing
- `font-handwritten` - Long Cang

**Dynamic text styles** - `getTextStyle()` in `App.tsx:29-69` maps StyleOption to title/body font classes, colors, shadows, and container styles.

**Custom animations** - Defined via Tailwind CDN configuration:
- `animate-sway` - Lantern swaying
- `animate-float` - Floating effect
- `animate-fall` - Confetti falling

## Key Implementation Details

1. **Error Handling** - Image/audio generation failures don't block text display. Errors are logged and graceful fallbacks used (default image, no audio).

2. **Audio Playback** - Uses Web Audio API with base64-decoded audio data. State is tracked via `audioContextRef` to allow play/pause.

3. **Generation Flow** - In `App.tsx`, the `handleGenerate()` function calls text generation first, then spawns parallel image/audio generation.

4. **Copy to Clipboard** - `navigator.clipboard.writeText()` used with visual feedback.

5. **AI Studio Integration** - The app is designed for AI Studio deployment. Metadata in `metadata.json` and environment variable injection in `vite.config.ts` support this.

## Configuration Files

- **`vite.config.ts`** - Dev server on port 3000, host 0.0.0.0, React plugin, path alias `@/*` → root
- **`tsconfig.json`** - Target ES2022, module ESNext, JSX react-jsx, strict mode not enabled
- **`.env.local`** - Contains `GEMINI_API_KEY` (gitignored)

## Deployment

The app builds as a static site (SPA) suitable for:
- AI Studio (primary target)
- Vercel, Netlify, Cloudflare Pages
- Any static hosting service

**Note:** In production, the API key is visible in the client-side bundle. This is a client-side only app with no backend proxy.
