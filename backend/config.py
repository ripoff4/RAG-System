UPLOAD_DIR = "uploaded_pdfs"

# splitter.py

chunk_size = 1500
chunk_overlap = 200

embedding_model = "text-embedding-3-small"

retriever_search_type = "mmr"
retriever_search_kwargs = {
    "k": 5,
    "fetch_k": 10
}
