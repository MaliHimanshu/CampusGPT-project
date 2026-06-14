import chromadb
import os

CHROMA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "vector_db")

_client = None
_collection = None


def get_chroma_collection():
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path=CHROMA_PATH)
        _collection = _client.get_or_create_collection(
            name="campus_documents",
            metadata={"hnsw:space": "cosine"}
        )
    return _collection