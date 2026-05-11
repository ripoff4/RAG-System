from typing import TypedDict, Any
from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI

from dotenv import load_dotenv
import os

load_dotenv()

llm = ChatOpenAI(
    model="gpt-4o-mini",
    api_key=os.getenv("OPENAI_API_KEY"),
    temperature=0
)


class AgentState(TypedDict):
    user_question: str
    response: str
    retrieved_docs: list
    retriever: Any
    chat_history: list
    reworked_question: str
    sources: list


def document_retrieval(state: AgentState):

    query = state["reworked_question"]

    retrieved_documents = state["retriever"].invoke(query)

    query_words = query.lower().split()

    scored_docs = []

    for doc in retrieved_documents:

        content = doc.page_content.lower()

        keyword_score = sum(

            word in content
            for word in query_words
        )

        scored_docs.append(
            (keyword_score, doc)
        )

    scored_docs.sort(
        key=lambda x: x[0],
        reverse=True
    )

    reranked_docs = [

        doc
        for _, doc in scored_docs
    ]

    return {
        "retrieved_docs": reranked_docs
    }


def generate_standalone_question(state: AgentState):

    history = state["chat_history"]

    question = state["user_question"]

    formatted_history = "\n".join(

        [
            f"{msg['role']}: {msg['content']}"
            for msg in history
        ]
    )

    rewrite_prompt = f"""

        You are a query rewriting assistant.

        Using the chat history,
        rewrite the latest user question
        into a standalone question.

        Chat History:
        {formatted_history}

        Latest Question:
        {question}

        Standalone Question:

    """

    answer = llm.invoke(rewrite_prompt)

    return {
        "reworked_question": answer.content
    }


def generate_answer(state: AgentState):

    context = "\n\n".join(
        [doc.page_content for doc in state["retrieved_docs"]]
    )

    prompt = f"""
    You are S, a professional AI RAG assistant.

    Answer ONLY from the provided context.

    If the context does not contain enough information,
    say:
    "I could not find this information in the document."

    Provide concise and professional answers.

    Context:
    {context}

    Question:
    {state["reworked_question"]}
    """

    answer = llm.invoke(prompt)

    return {
        "response": answer.content
    }


def get_sources(state: AgentState):

    sources = []

    for doc in state["retrieved_docs"]:

        source_name = doc.metadata.get(
            "source",
            "Unknown"
        )

        source_content = doc.page_content

        sources.append({

            "file": source_name,

            "content": source_content[:300]
        })

    return {
        "sources": sources
    }


graph = StateGraph(AgentState)

graph.add_node(
    "generate_standalone_question",
    generate_standalone_question
)

graph.add_node(
    "document_retrieval",
    document_retrieval
)

graph.add_node(
    "generate_answer",
    generate_answer
)

graph.add_node(
    "get_sources",
    get_sources
)

graph.add_edge(
    START,
    "generate_standalone_question"
)

graph.add_edge(
    "generate_standalone_question",
    "document_retrieval"
)

graph.add_edge(
    "document_retrieval",
    "generate_answer"
)

graph.add_edge(
    "generate_answer",
    "get_sources"
)

graph.add_edge(
    "get_sources",
    END
)

agent = graph.compile()
