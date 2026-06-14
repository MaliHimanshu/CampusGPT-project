# CampusGPT

AI-Powered University Assistant built with FastAPI, React, Gemini, Groq, and RAG.

## Features

- User Registration & Login (JWT Authentication)
- PDF Upload
- Document Processing
- Vector Database (ChromaDB)
- Retrieval-Augmented Generation (RAG)
- Gemini AI Integration
- Groq LLM Integration
- React Dashboard
- Chat Interface
- Protected Routes

## Tech Stack

### Backend
- FastAPI
- SQLAlchemy
- JWT Authentication
- ChromaDB
- PyMuPDF

### Frontend
- React
- Vite
- React Router
- Axios

## Installation

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Documentation

```text
http://127.0.0.1:8000/docs
```

## Author

Himanshu Mali

Aspiring Data Scientist
