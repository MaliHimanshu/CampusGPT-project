from fastapi import APIRouter, Depends, HTTPException  # type: ignore[import]
from sqlalchemy.orm import Session  # type: ignore[import]
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, Document

router = APIRouter()


@router.get("/documents")
def get_documents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return all documents uploaded by the current user."""
    docs = db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.uploaded_at.desc()).all()
    return {
        "documents": [
            {
                "id": d.id,
                "filename": d.filename,
                "file_size": d.file_size,
                "chunks": d.chunks,
                "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
            }
            for d in docs
        ]
    }


@router.delete("/documents/{doc_id}")
def delete_document(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a document and its vectors from ChromaDB."""
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove vectors from ChromaDB
    try:
        from app.services.vector_db import get_chroma_collection
        collection = get_chroma_collection()
        collection.delete(where={"document_id": str(doc_id)})
    except Exception:
        pass  # Don't fail if vector removal errors

    db.delete(doc)
    db.commit()
    return {"message": f"Document '{doc.filename}' deleted successfully"}
