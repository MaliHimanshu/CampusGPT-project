import os
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, Document
from app.services.pdf_service import extract_text_from_pdf, extract_images_from_pdf
from app.services.chunk_service import chunk_text
from app.services.vector_db import get_chroma_collection

router = APIRouter()
UPLOAD_DIR = "data"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    safe_name = f"{current_user.id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    content = await file.read()
    file_size = len(content)

    with open(file_path, "wb") as f:
        f.write(content)

    try:
        # Step 1: Extract text
        print(f"Extracting text from {file.filename}...")
        text = extract_text_from_pdf(file_path)
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF. Make sure it's not a scanned image.")

        # Step 2: Chunk
        print(f"Chunking text ({len(text)} chars)...")
        chunks = chunk_text(text)
        print(f"Created {len(chunks)} chunks")

        # Step 3: Save doc record
        doc = Document(
            user_id=current_user.id,
            filename=file.filename,
            file_path=file_path,
            file_size=file_size,
            chunks=len(chunks),
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        # Step 4: Extract images from PDF
        print(f"Extracting images from {file.filename}...")
        images = extract_images_from_pdf(file_path, current_user.id, doc.id)
        print(f"Found {len(images)} diagram(s)/image(s)")

        # Step 5: Store chunks in ChromaDB (using local ONNX MiniLM embeddings)
        print(f"Storing chunks in ChromaDB...")
        collection = get_chroma_collection()
        ids = [f"doc{doc.id}_chunk{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "document_id": str(doc.id),
                "user_id": str(current_user.id),
                "filename": file.filename,
                "chunk_index": i,
                "type": "text",
            }
            for i in range(len(chunks))
        ]
        collection.add(documents=chunks, ids=ids, metadatas=metadatas)

        # Step 6: Store image references in ChromaDB so they can be retrieved
        if images:
            img_ids = []
            img_docs = []
            img_metas = []
            for idx, img in enumerate(images):
                img_ids.append(f"doc{doc.id}_img{idx}")
                # Create a searchable text description for the image
                img_docs.append(
                    f"[DIAGRAM] Image/diagram from page {img['page']} of {file.filename}. "
                    f"This is a visual figure, chart, or diagram extracted from the document."
                )
                img_metas.append({
                    "document_id": str(doc.id),
                    "user_id": str(current_user.id),
                    "filename": file.filename,
                    "type": "image",
                    "image_file": img["filename"],
                    "page": img["page"],
                    "width": img["width"],
                    "height": img["height"],
                })
            collection.add(documents=img_docs, ids=img_ids, metadatas=img_metas)

        print(f"Upload complete! doc_id={doc.id}")
        return {
            "message": f"'{file.filename}' uploaded and indexed",
            "document_id": doc.id,
            "chunks": len(chunks),
            "images": len(images),
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"UPLOAD ERROR: {e}")
        import traceback; traceback.print_exc()
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")