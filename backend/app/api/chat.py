from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.embedding_service import get_query_embedding
from app.services.vector_db import get_chroma_collection
from app.services.llm_service import generate_answer

router = APIRouter()


class ChatRequest(BaseModel):
    question: str


@router.post("/chat")
def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        # Get query embedding
        query_embedding = get_query_embedding(request.question)

        # Search ChromaDB for relevant chunks
        collection = get_chroma_collection()
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=5,
            where={"user_id": str(current_user.id)},
        )

        # Build context from retrieved chunks
        docs = results.get("documents", [[]])[0]
        if not docs:
            context = "No relevant documents found."
        else:
            context = "\n\n".join(docs)

        # Generate answer with Gemini
        answer = generate_answer(request.question, context)
        return {"answer": answer}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")