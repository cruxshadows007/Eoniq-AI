
import pickle
import faiss
import numpy as np

from sentence_transformers import SentenceTransformer


INDEX_PATH = "data/energy_rag.index"
CHUNKS_PATH = "data/energy_chunks.pkl"


index = faiss.read_index(INDEX_PATH)

with open(CHUNKS_PATH, "rb") as f:
    chunks = pickle.load(f)


embedding_model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2"
)


def search_chunks(
    query,
    category=None,
    top_k=5
):

    query_vector = embedding_model.encode(
        [query]
    )

    distances, indices = index.search(
        query_vector,
        top_k * 10
    )

    results = []

    for idx in indices[0]:

        chunk = chunks[idx]

        if category:

            if chunk["category"] != category:
                continue

        chunk["score"] = float(distances[0][0]) #mejora para los casos que no exista en los documentos cargados

        results.append(chunk)

        if len(results) >= top_k:
            break

    return results


def has_relevant_context(
    query,
    category=None,
    threshold=1.2
):

    results = search_chunks(
        query,
        category=category,
        top_k=1
    )

    if not results:
        return False

    score = results[0].get("score", 999)

    return score < threshold
