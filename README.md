# Acme Dataroom MVP

A secure, single‑page dataroom for due diligence workflows. The MVP focuses on clean UX for creating datarooms, nesting folders, and managing PDF files with previews.

## Highlights
- Datarooms, nested folders, and PDF files with full CRUD + filename search dropdown
- GraphQL API with file upload support
- PostgreSQL metadata storage and Redis caching
- Clean UI with breadcrumb navigation, inline actions, and PDF preview pane
- Dockerized stack for one‑command local setup

## Tech Stack
- **Frontend:** React + TypeScript + Vite, Tailwind CSS, Apollo Client, GraphQL Code Generator
- **Backend:** FastAPI + Strawberry GraphQL, SQLAlchemy ORM
- **Data:** PostgreSQL for metadata, Redis for short‑lived cache
- **Files:** Stored on disk with validation and size limits

## Data Model
- **Dataroom** → top‑level workspace
- **Folder** → nested via `parentId` and scoped to a dataroom
- **File** → PDF metadata + disk path, scoped to a dataroom + folder

## API Surface (GraphQL)
- Endpoint: `http://localhost:8000/api/graphql`
- File preview/download: `http://localhost:8000/files/{fileId}`
- Schema: `backend/schema.graphql`

## Local Development

### 1) Backend
```bash
cd backend
cp .env.example .env
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2) Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run codegen
npm run dev
```

Open `http://localhost:5173`.

## Authentication
This app uses JWT authentication with a username/password flow.
- Register or sign in in the UI to receive a JWT stored in local storage
- The token is sent with every GraphQL request and file download
- Configure `JWT_SECRET` and `JWT_EXPIRES_MINUTES` in `backend/.env` or `docker-compose.yml`
- Datarooms are scoped per user; each account only sees its own rooms
## Docker
```bash
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend GraphQL: `http://localhost:8000/api/graphql`
- Postgres: `localhost:5433`

## Codegen Workflow
- GraphQL schema source: `backend/schema.graphql`
- Operations: `frontend/src/graphql/operations.graphql`
- Generated types/hooks: `frontend/src/graphql/generated.ts`

Regenerate after schema or operations changes:
```bash
cd frontend
npm run codegen
```

If you update the backend schema, refresh `backend/schema.graphql` (see `backend/scripts/export_schema.py`).

## UX/Edge Cases Covered
- Prevent duplicate folder/file names in the same parent
- Enforce PDF‑only uploads and size limits
- Safely handle deleting folders with nested children and files
- Clear feedback for errors and successful actions
- Graceful behavior when Redis is unavailable (cache bypassed)

## Roadmap Ideas
- Authentication and role‑based access controls
- Full‑text search and metadata filters
- Audit log and watermarking
- Blob storage integration (S3/R2/GCS)

## Walkthrough Video
Record a 3–5 minute walkthrough video and link it here.

## Deployment
This repo includes Dockerfiles and a `docker-compose.yml`. You can deploy the backend to Render/Fly.io and the frontend to Vercel/Netlify. Update `VITE_API_URL` accordingly.
