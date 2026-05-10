from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

from backend.config import (
    chunk_size,
    chunk_overlap,
    embedding_model,
    retriever_search_type,
    retriever_search_kwargs
)

from dotenv import load_dotenv
import os

load_dotenv()


def process_pdf(file_path):

    loader = PyPDFLoader(file_path)

    docs = loader.load()

    return docs


def make_chunks(document):

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )

    chunks = splitter.split_documents(document)

    return chunks


def create_vector_database(chunks):

    embeddings = OpenAIEmbeddings(
        model=embedding_model,
        api_key=os.getenv("OPENAI_API_KEY")
    )

    vectorstore = FAISS.from_documents(
        chunks,
        embeddings
    )

    return vectorstore


def generate_retriever(vectorstore):

    retriever = vectorstore.as_retriever(
        search_type=retriever_search_type,
        search_kwargs=retriever_search_kwargs
    )

    return retriever
