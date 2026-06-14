# CampusGPT 🎓

AI-Powered University Assistant built with FastAPI + React + Gemini + ChromaDB.

---

## Quick Start

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn sqlalchemy passlib[bcrypt] python-jose[cryptography] \
            python-multipart pymupdf chromadb google-generativeai python-dotenv

# Create .env file
cp .env.example .env
# Fill in GEMINI_API_KEY and SECRET_KEY

# Run server
uvicorn main:app --reload
# → http://127.0.0.1:8000
# → Swagger: http://127.0.0.1:8000/docs
```

### 2. Frontend

```bash
cd frontend

npm install
npm run dev
# → http://localhost:5173
```

---

## Environment Variables (`backend/.env`)

```env
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_super_secret_key_here_min_32_chars
DATABASE_URL=sqlite:///./campusgpt.db
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

---

## Project Structure

```
campusgpt/
├── backend/
│   ├── main.py                  ← FastAPI app, all routers registered
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py          ← POST /register, POST /login
│   │   │   ├── upload.py        ← POST /upload  (saves Document record)
│   │   │   ├── chat.py          ← POST /chat    (RAG pipeline)
│   │   │   ├── documents.py     ← GET /documents, DELETE /documents/{id}
│   │   │   └── profile.py       ← GET /profile, PATCH /profile/password
│   │   ├── core/
│   │   │   ├── config.py        ← Settings from .env
│   │   │   ├── database.py      ← SQLAlchemy engine + session
│   │   │   └── security.py      ← JWT, bcrypt, get_current_user
│   │   ├── models/
│   │   │   └── user.py          ← User + Document SQLAlchemy models
│   │   └── services/
│   │       ├── pdf_service.py   ← PyMuPDF text extraction
│   │       ├── chunk_service.py ← Text chunking
│   │       ├── embedding_service.py ← Gemini embeddings
│   │       ├── vector_db.py     ← ChromaDB collection
│   │       └── llm_service.py   ← Gemini answer generation
│   └── .env
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Login.jsx        ← Auth with validation
        │   ├── Register.jsx     ← Registration + password strength
        │   ├── Dashboard.jsx    ← Stats + quick actions
        │   ├── Chat.jsx         ← ChatGPT-style interface
        │   ├── Upload.jsx       ← Drag & drop PDF upload
        │   ├── Documents.jsx    ← List + delete documents
        │   └── Profile.jsx      ← Account info + change password
        ├── components/
        │   ├── Layout.jsx       ← Sidebar navigation
        │   └── Toast.jsx        ← Notification toasts
        ├── api.js               ← Axios client with JWT interceptor
        ├── App.jsx              ← Routes + private route guard
        └── index.css            ← Full dark design system
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Create account |
| POST | `/login` | No | Get JWT token |
| POST | `/upload` | Yes | Upload + index PDF |
| POST | `/chat` | Yes | Ask a question (RAG) |
| GET | `/documents` | Yes | List user's documents |
| DELETE | `/documents/{id}` | Yes | Delete document + vectors |
| GET | `/profile` | Yes | Get profile info |
| PATCH | `/profile/password` | Yes | Change password |

---

## Notes

- The `Document` model is new — run the app once to auto-create the `documents` table via `Base.metadata.create_all`.
- If you already have a `campusgpt.db`, delete it and let the app recreate it (or use Alembic migrations).
- ChromaDB stores vectors locally in `backend/vector_db/`.
