from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
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
        # Search ChromaDB for relevant chunks (using local embedding generation)
        collection = get_chroma_collection()
        results = collection.query(
            query_texts=[request.question],
            n_results=10,
            where={"user_id": str(current_user.id)},
        )

        # Build context from retrieved chunks
        docs = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]

        # Separate text chunks from image entries
        text_chunks = []
        images = []
        sources = set()

        for doc_text, meta in zip(docs, metadatas):
            if not meta:
                continue
            sources.add(meta.get("filename", ""))

            if meta.get("type") == "image":
                images.append({
                    "url": f"/images/{meta['image_file']}",
                    "page": meta.get("page", 0),
                    "filename": meta.get("filename", ""),
                    "width": meta.get("width", 0),
                    "height": meta.get("height", 0),
                })
            else:
                text_chunks.append(doc_text)

        # Remove empty strings from sources
        sources = [s for s in sources if s]

        if not text_chunks:
            context = "No relevant documents found."
        else:
            context = "\n\n".join(text_chunks)

        # Generate answer
        answer = generate_answer(request.question, context)
        return {
            "answer": answer,
            "sources": sources,
            "images": images,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")