# AI Tutor Bot - Copilot Instructions

## Project Overview

This is a **syllabus-aligned AI educational tutor** with a Next.js frontend and FastAPI backend (external). The system supports two learning modes: **Chat Mode** (Q&A with syllabus context) and **Quiz Mode** (AI-generated MCQs). It targets exam-focused students in Singapore (PSLE, O-Level, A-Level) and IB curricula.

### Key Architecture Points
- **Frontend (this repo)**: Next.js 15 + React 19 + TypeScript in `/frontend`
- **Backend**: External FastAPI service (GCP) - not in this repo
- **Data**: Scripts in `/scripts` for RAG pipeline setup (syllabus ingestion, embeddings)
- **AI**: OpenAI GPT-4-mini + embeddings for semantic retrieval
- **Deployment**: Frontend → Vercel, Backend → GCP, local dev via Docker Compose

## Critical Patterns

### Backend Communication
- Frontend calls external backend via `NEXT_PUBLIC_BACKEND_URL` env var
- **Chat endpoint**: `POST /llm/chat` with `{level, subject, prompt, image?}` → streaming response
- **Quiz endpoint**: `POST /llm/quiz/start` with `{level, subject, num_questions}` → structured questions
- **Fallback**: If `NEXT_PUBLIC_BACKEND_URL` is empty, same-origin requests (useful for dev proxies)
- See: `frontend/src/app/chat/page.tsx:backendBaseUrl()` pattern

### Subject/Level Taxonomy
All level/subject references use consistent keys (defined in `frontend/src/app/chat/consts.tsx`):
- **Levels**: `psle`, `o_level`, `a_level`, `ib`
- **Subjects**: `science`, `mathematics`, `combined_physics`, `pure_physics`, `add_math`, `h2_mathematics`, `hl_mathematics`, etc.
- Use `CATEGORY_SUBJECT_LIST` type `LevelKey` for type-safe level selection
- Backend scripts mirror this taxonomy in `scripts/rag_pipeline.py` for data consistency

### Mobile & iOS Quirks
Chat page (`frontend/src/app/chat/page.tsx`) has **extensive iOS/mobile handling**:
- Detects iOS via `navigator.userAgent` check (iPad OS 13+)
- Manages **keyboard lift** using VisualViewport API for iOS keyboard overlap
- Auto-scrolls to bottom with `useCallback` debouncing to prevent jarring behavior
- Input bar height measured dynamically for accurate padding
- **When editing chat**: preserve `isIOSDevice()`, `isMobileDevice()`, and keyboard height refs

### Layout & Navigation
- Root layout (`frontend/src/app/layout.tsx`) conditionally hides Navbar/Footer on `/chat` route only
- Chat page uses full-height layout with `flex flex-col h-screen`
- Floating chat widget (`ChatWidget.tsx`) has info banner suggesting opening chat in new tab for better UX

### Math Rendering
- Uses `react-katex` for inline (`<InlineMath>`) and block (`<BlockMath>`) LaTeX
- CSS: `import 'katex/dist/katex.min.css'`
- Backend responses with `$...$` or `$$...$$` are parsed client-side; ensure no escaping issues

### Environment Variables
Frontend requires (`.env.local`):
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000  # or your GCP backend
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```
- All must start with `NEXT_PUBLIC_` to be inlined at build time
- See `firebaseClient.ts` for Firebase client initialization

## Development Workflows

### Frontend Development
```bash
cd frontend
npm install
npm run dev      # localhost:3000 with HMR
npm run build    # Next.js production build
npm run lint     # ESLint + TypeScript check
```

### Docker Compose (Full Stack)
```bash
docker-compose up  # Runs frontend at localhost:3000
# Modify docker-compose.yml to add backend service if needed
```

### TypeScript
- Strict mode enabled (`tsconfig.json`: `"strict": true`)
- Path alias `@/*` → `./src/*` for clean imports
- Use `typeof` guards for discriminated unions (e.g., `LevelKey`)

### Testing & CI
- **Frontend CI** (`.github/workflows/frontend.yml`): ESLint + Next.js build on push to `frontend/`
- **General CI** (`.github/workflows/ci.yml`): Full pipeline (Node 18, npm install, build)
- No unit tests currently configured; add Jest/Vitest in `package.json` if needed

## Data Pipeline (Scripts)

Scripts in `/scripts` prepare syllabus data for the RAG system:
- `rag_pipeline.py`: Core RAG logic using LangChain + Chroma/OpenAI embeddings
- `syllabus_extractor.py`, `syllabus_to_text_converter.py`: Parse syllabus PDFs
- `grailmoe_webscraper.py`: Ingest MOE-published content
- `requirements.txt`: LangChain, Chroma, HuggingFace, OpenAI, etc.

**Not executed during frontend dev**, but context for understanding data flow: Syllabi → embeddings → vector store → backend retrieval.

## Common Tasks

### Adding a New Subject/Level
1. Add key to `CATEGORY_SUBJECT_LIST` in `frontend/src/app/chat/consts.tsx`
2. Update quiz subjects in `frontend/src/app/quizmode/page.tsx`
3. Add corresponding mapping in backend/scripts (not in this repo)
4. Test with `backendBaseUrl()` communication pattern

### Modifying Chat UI
- Chat page: `frontend/src/app/chat/page.tsx` (~675 lines, handles streaming, images, mobile UX)
- Message type: `{sender: 'user'|'bot'|'system', text: string}`
- Preserve mobile/iOS keyboard handling when editing

### Changing API Endpoints
1. Update `backendBaseUrl()` logic in chat/quiz pages
2. Adjust `fetch()` request bodies/headers
3. Test with `NEXT_PUBLIC_BACKEND_URL` env var

### Debugging Math Rendering
- Check response for unescaped `$...$` delimiters
- Verify `react-katex` CSS is imported
- Use browser DevTools to inspect rendered MathML/HTML

## Deployment

- **Frontend**: Vercel (auto-deploys on `main` push, triggered by CI)
- **Backend**: GCP (managed separately)
- **Environment**: Set `NEXT_PUBLIC_*` vars in Vercel project settings
- Ensure backend CORS allows frontend origin

## Known Limitations

- Backend code not in this repo (external dependency)
- No database in frontend (all state ephemeral)
- Mobile keyboard handling is complex; test on real iOS/Android
- Quiz data is generated per request (no persistence without backend)

## References
- Next.js docs: https://nextjs.org/docs
- LangChain docs: https://python.langchain.com/docs
- OpenAI API: https://platform.openai.com/docs
