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


# ---------------- GLOBAL RETRIEVER ---------------- #

retriever = None


# ---------------- REQUEST MODEL ---------------- #

class ChatRequest(BaseModel):

    question: str


# ---------------- HOME ROUTE ---------------- #

@app.get("/")
def home():

    return {
        "message": "RAG Backend Running"
    }


# ---------------- PDF UPLOAD ---------------- #

@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...)
):

    global retriever

    file_path = os.path.join(
        UPLOAD_DIR,
        file.filename
    )

    with open(file_path, "wb") as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    # -------- INGESTION PIPELINE -------- #

    documents = process_pdf(file_path)

    chunks = make_chunks(documents)

    vectorstore = create_vector_database(chunks)

    retriever = generate_retriever(vectorstore)

    return {
        "message": "PDF uploaded successfully",
        "filename": file.filename
    }


# ---------------- CHAT ENDPOINT ---------------- #

@app.post("/chat")
def chat(request: ChatRequest):

    global retriever

    if retriever is None:

        return {
            "error": "Please upload a PDF first."
        }

    response = agent.invoke({

        "user_question": request.question,

        "retriever": retriever

    })

    return {
        "response": response["response"]
    }
