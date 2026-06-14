import os
import sys
from dotenv import load_dotenv

# Add app to path
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))
sys.path.append(os.path.dirname(__file__))

load_dotenv()

print("Testing imports...")
try:
    import fitz
    print("PyMuPDF (fitz) imported successfully")
except Exception as e:
    print(f"Error importing fitz: {e}")

try:
    import chromadb
    print("chromadb imported successfully")
except Exception as e:
    print(f"Error importing chromadb: {e}")

try:
    import requests
    print("requests imported successfully")
except Exception as e:
    print(f"Error importing requests: {e}")

print("\nTesting embedding service...")
try:
    from app.services.embedding_service import get_embeddings
    emb = get_embeddings(["hello world"])
    print(f"Embedding dimensions: {len(emb[0]) if emb else 'None'}")
    print(f"First 5 elements of embedding: {emb[0][:5] if emb else 'None'}")
except Exception as e:
    print(f"Error calling embedding service: {e}")

print("\nTesting vector DB connection...")
try:
    from app.services.vector_db import get_chroma_collection
    col = get_chroma_collection()
    print(f"Chroma Collection name: {col.name}")
    print(f"Chroma Count: {col.count()}")
except Exception as e:
    print(f"Error calling vector db: {e}")
