import os
import sys
from unittest.mock import MagicMock
from dotenv import load_dotenv

sys.path.append(os.path.join(os.path.dirname(__file__), "app"))
sys.path.append(os.path.dirname(__file__))

load_dotenv()

# Let's create a test PDF using fitz (PyMuPDF)
import fitz

def create_test_pdf(filename, text_content):
    doc = fitz.open()
    page = doc.new_page()
    rect = fitz.Rect(50, 50, 500, 700)
    # insert text
    page.insert_textbox(rect, text_content, fontsize=12)
    doc.save(filename)
    doc.close()

pdf_filename = "test_doc_to_upload.pdf"
create_test_pdf(pdf_filename, "This is some test content inside our PDF file. It contains information about Simulink and other basic tutorial items to help us verify the upload flow.")

print("Test PDF created.")

# Now import the services and database models
from app.services.pdf_service import extract_text_from_pdf
from app.services.chunk_service import chunk_text
from app.services.embedding_service import get_embeddings
from app.services.vector_db import get_chroma_collection
from app.models.user import Document, User
from app.core.database import SessionLocal, get_db

# Create a mock/real db session
db = SessionLocal()

# Mock current user
mock_user = db.query(User).first()
if not mock_user:
    # If no user exists, create a temporary one for testing
    print("No user found in DB, creating a test user...")
    from app.core.security import get_password_hash
    mock_user = User(
        email="test_user@example.com",
        hashed_password=get_password_hash("password"),
        full_name="Test User"
    )
    db.add(mock_user)
    db.commit()
    db.refresh(mock_user)

print(f"Using user: {mock_user.email} (ID: {mock_user.id})")

# Let's run the upload_pdf logic step by step:
file_path = f"data/{mock_user.id}_{pdf_filename}"
os.makedirs("data", exist_ok=True)

import shutil
shutil.copy(pdf_filename, file_path)
print(f"Copied test PDF to {file_path}")

try:
    # Step 1: Extract text
    print(f"Extracting text from {pdf_filename}...")
    text = extract_text_from_pdf(file_path)
    print(f"Extracted text: '{text}'")
    if not text.strip():
        raise Exception("Could not extract text from PDF. Make sure it's not a scanned image.")

    # Step 2: Chunk
    print(f"Chunking text ({len(text)} chars)...")
    chunks = chunk_text(text)
    print(f"Created {len(chunks)} chunks")

    # Step 3: Save doc record
    print("Saving document record to SQLite database...")
    doc = Document(
        user_id=mock_user.id,
        filename=pdf_filename,
        file_path=file_path,
        file_size=os.path.getsize(file_path),
        chunks=len(chunks),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    print(f"Document record created in DB. ID: {doc.id}")

    # Step 4: Embed and store
    print(f"Generating embeddings...")
    embeddings = get_embeddings(chunks)
    print(f"Got {len(embeddings)} embeddings")
    collection = get_chroma_collection()
    ids = [f"doc{doc.id}_chunk{i}" for i in range(len(chunks))]
    metadatas = [{"document_id": str(doc.id), "user_id": str(mock_user.id), "filename": pdf_filename, "chunk_index": i} for i in range(len(chunks))]
    
    print("Adding to ChromaDB collection...")
    collection.add(documents=chunks, embeddings=embeddings, ids=ids, metadatas=metadatas)
    print("Success! Upload flow completed successfully.")
    
    # Cleanup DB
    db.delete(doc)
    db.commit()
    print("Cleaned up document record from DB.")
    # Cleanup Chroma
    collection.delete(ids=ids)
    print("Cleaned up document from ChromaDB.")

except Exception as e:
    import traceback
    print("--- FLOW FAILED ---")
    traceback.print_exc()

finally:
    # Clean up local files
    if os.path.exists(pdf_filename):
        os.remove(pdf_filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    print("Cleaned up local test files.")
