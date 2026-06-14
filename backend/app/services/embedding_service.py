import requests
from typing import List

# Using a simple hash-based embedding since Groq doesn't provide embeddings
# We'll use a free embedding API instead
def get_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate embeddings using free HuggingFace API."""
    embeddings = []
    for text in texts:
        try:
            res = requests.post(
                "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
                headers={"Content-Type": "application/json"},
                json={"inputs": text[:512], "options": {"wait_for_model": True}},
                timeout=30
            )
            data = res.json()
            if isinstance(data, list) and isinstance(data[0], float):
                embeddings.append(data)
            elif isinstance(data, list) and isinstance(data[0], list):
                embeddings.append(data[0])
            else:
                embeddings.append([0.0] * 384)
        except Exception as e:
            print(f"Embedding error: {e}")
            embeddings.append([0.0] * 384)
    return embeddings


def get_query_embedding(text: str) -> List[float]:
    """Generate embedding for a search query."""
    result = get_embeddings([text])
    return result[0] if result else [0.0] * 384