from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import shutil
import os

from backend.ingestion.splitter import (
    process_pdf,
    make_chunks,
    create_vector_database,
    generate_retriever
)

from backend.graph.graph import agent

from backend.config import UPLOAD_DIR


app = FastAPI()


# ---------------- CORS ---------------- #

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


# ---------------- CREATE UPLOAD FOLDER ---------------- #

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


# =========================================================
# GLOBAL STORAGE
# =========================================================

# Stores retriever for each session
retrievers = {}

# Stores chat history for each session
chat_histories = {}


# =========================================================
# REQUEST MODEL
# =========================================================

class ChatRequest(BaseModel):

    question: str

    session_id: str


# =========================================================
# HOME ROUTE
# =========================================================

@app.get("/")
def home():

    return {
        "message": "RAG Backend Running"
    }


# =========================================================
# PDF UPLOAD
# =========================================================

@app.post("/upload")
async def upload_pdf(

    session_id: str,

    file: UploadFile = File(...)

):

    global retrievers
    global chat_histories

    file_path = os.path.join(
        UPLOAD_DIR,
        file.filename
    )

    # Save uploaded file
    with open(file_path, "wb") as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    # =====================================================
    # INGESTION PIPELINE
    # =====================================================

    documents = process_pdf(file_path)

    chunks = make_chunks(documents)

    vectorstore = create_vector_database(chunks)

    retriever = generate_retriever(vectorstore)

    # =====================================================
    # SAVE RETRIEVER FOR THIS SESSION
    # =====================================================

    retrievers[session_id] = retriever

    # =====================================================
    # CREATE EMPTY CHAT HISTORY
    # =====================================================

    if session_id not in chat_histories:

        chat_histories[session_id] = []

    return {

        "message": "PDF uploaded successfully",

        "filename": file.filename,

        "session_id": session_id
    }


# =========================================================
# CHAT ENDPOINT
# =========================================================

@app.post("/chat")
def chat(request: ChatRequest):

    global retrievers
    global chat_histories

    # =====================================================
    # CHECK IF SESSION HAS PDF
    # =====================================================

    if request.session_id not in retrievers:

        return {
            "error": "Please upload a PDF first."
        }

    # =====================================================
    # GET RETRIEVER + HISTORY
    # =====================================================

    retriever = retrievers[request.session_id]

    history = chat_histories.get(
        request.session_id,
        []
    )

    # =====================================================
    # AGENT INVOCATION
    # =====================================================

    response = agent.invoke({

        "user_question": request.question,

        "chat_history": history,

        "retriever": retriever

    })

    assistant_response = response["response"]

    # =====================================================
    # SAVE CONVERSATION
    # =====================================================

    history.append({

        "role": "user",

        "content": request.question
    })

    history.append({

        "role": "assistant",

        "content": assistant_response
    })

    # Save updated history
    chat_histories[request.session_id] = history

    return {

        "response": assistant_response
    }


# =========================================================
# GET CHAT HISTORY
# =========================================================

@app.get("/history/{session_id}")
def get_history(session_id: str):

    history = chat_histories.get(
        session_id,
        []
    )

    return {
        "history": history
    }


# =========================================================
# CLEAR CHAT HISTORY
# =========================================================

@app.delete("/history/{session_id}")
def clear_history(session_id: str):

    if session_id in chat_histories:

        chat_histories[session_id] = []

    return {
        "message": "Chat history cleared"
    }
