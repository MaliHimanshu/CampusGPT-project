import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.join(os.path.dirname(__file__), "app"))
sys.path.append(os.path.dirname(__file__))

load_dotenv()

from app.services.vector_db import get_chroma_collection

try:
    collection = get_chroma_collection()
    print("Got collection successfully, count:", collection.count())
    
    chunks = ["This is a test chunk 1", "This is a test chunk 2"]
    embeddings = [[0.0] * 384, [0.0] * 384]
    ids = ["test_chunk_1", "test_chunk_2"]
    metadatas = [{"document_id": "test_doc", "user_id": "test_user", "filename": "test.pdf", "chunk_index": i} for i in range(2)]
    
    print("Attempting to add to collection...")
    collection.add(documents=chunks, embeddings=embeddings, ids=ids, metadatas=metadatas)
    print("Added successfully!")
    
    # Try query
    print("Attempting query...")
    results = collection.query(
        query_embeddings=[[0.0] * 384],
        n_results=1
    )
    print("Query results:", results)
    
    # Cleanup
    collection.delete(ids=ids)
    print("Deleted successfully!")
except Exception as e:
    import traceback
    traceback.print_exc()
