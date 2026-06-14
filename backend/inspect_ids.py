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
        results = collection.get(include=["metadatas"])
        print("\nAll IDs and Metadata in ChromaDB:")
        for idx, (cid, meta) in enumerate(zip(results["ids"], results["metadatas"])):
            print(f"{idx}: ID={cid}, Metadata={meta}")
except Exception as e:
    import traceback
    traceback.print_exc()
