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


def document_retrieval(state: AgentState):

    retrieved_documents = state["retriever"].invoke(
        state["reworked_question"]
    )

    return {
        "retrieved_docs": retrieved_documents
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
    END
)

agent = graph.compile()
