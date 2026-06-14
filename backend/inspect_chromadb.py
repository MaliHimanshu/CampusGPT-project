import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.join(os.path.dirname(__file__), "app"))
sys.path.append(os.path.dirname(__file__))

load_dotenv()

from app.services.vector_db import get_chroma_collection

try:
    collection = get_chroma_collection()
    count = collection.count()
    print(f"Collection count: {count}")
    if count > 0:
        # Get all documents
        results = collection.get(include=["metadatas", "documents", "embeddings"])
        print("Keys in results:", results.keys())
        print("Number of documents retrieved:", len(results.get("ids", [])))
        if results.get("embeddings") is not None and len(results["embeddings"]) > 0:
            emb = results["embeddings"][0]
            print(f"Embedding type: {type(emb)}")
            try:
                print(f"First embedding dimension: {len(emb)}")
                print(f"First embedding snippet (first 10 elements): {list(emb)[:10]}")
            except Exception as e:
                print(f"Error printing embedding: {e}")
                print(f"First embedding value: {emb}")
        else:
            print("No embeddings returned in get() or list empty")
            
        print("\nChecking metadata and doc samples:")
        for i in range(min(5, count)):
            print(f"\nDoc {i}:")
            print("ID:", results["ids"][i])
            print("Metadata:", results["metadatas"][i])
            print("Document snippet:", results["documents"][i][:100])
except Exception as e:
    import traceback
    traceback.print_exc()
