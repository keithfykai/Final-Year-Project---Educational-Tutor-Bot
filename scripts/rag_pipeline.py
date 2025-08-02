import os
import re
import requests
import json
from typing import List
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain_community.document_loaders import TextLoader

CATEGORY_LIST = {
    "PSLE": "PSLE",
    "ib": "IB",
    "a_level": "GCE 'A' Levels",
    "o_level": "GCE 'O' Levels"
}

SUBJECT_LIST = {
    "science": "Science",
    "mathematics": "Mathematics",
    "combined_physics": "Combined Physics",
    "combined_chemistry": "Combined Chemistry",
    "combined_biology": "Combined Biology",
    "physics": "Pure Physics",
    "chemistry": "Pure Chemistry",
    "biology": "Pure Biology",
    "add_math": "Additional Mathematics",
    "elem_math": "Elementary Mathematics",
    "h2_math": "H2 Mathematics",
    "h1_math": "H1 Mathematics",
    "h2_biology": "H2 Biology",
    "h1_biology": "H1 Biology",
    "h2_physics": "H2 Physics",
    "h1_physics": "H1 Physics",
    "h2_chemistry": "H2 Chemistry",
    "h1_chemistry": "H1 Chemistry",
    "hl_math": "HL Mathematics",
    "sl_math": "SL Mathematics",
    "hl_biology": "HL Biology",
    "sl_biology": "SL Biology",
    "hl_physics": "HL Physics",
    "sl_physics": "SL Physics",
    "hl_chemistry": "HL Chemistry",
    "sl_chemistry": "SL Chemistry",
}



# --- CONFIGURATION ---
SYLLABUS_FILE = "./olevelphysics/O Level Physics Syllabus_nougat.mmd"  # folder with syllabus + handwritten .mmd files
NOTES_FOLDER = "./olevelphysics/notes"
CHROMA_DB_DIR = "./chroma_db/"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
OLLAMA_URL = "http://localhost:11434/api/chat"

# --- DOCUMENT LOADING ---
def load_documents(syllabus_path: str, notes_folder: str) -> List[Document]:
    all_docs = []

    # Load syllabus
    syllabus_loader = TextLoader(syllabus_path)
    syllabus_docs = syllabus_loader.load()
    for doc in syllabus_docs:
        doc.metadata["source"] = "SYLLABUS"
    all_docs.extend(syllabus_docs)

    # Load handwritten notes
    for filename in os.listdir(notes_folder):
        if filename.endswith(".mmd"):
            path = os.path.join(notes_folder, filename)
            loader = TextLoader(path)
            docs = loader.load()
            for doc in docs:
                doc.metadata["source"] = f"NOTES: {filename}"
            all_docs.extend(docs)

    return all_docs

# --- CHUNKING ---
def chunk_documents(documents):
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
    return splitter.split_documents(documents)

# --- EMBEDDING & STORAGE ---
def embed_and_store(docs, persist_dir):
    embedder = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    vectordb = Chroma.from_documents(docs, embedding=embedder, persist_directory=persist_dir)
    vectordb.persist()
    return vectordb

# --- OLLAMA CHAT INTERFACE ---
def query_ollama(prompt: str, history: List[dict]) -> str:
    payload = {
        "model": "llama3.1",
        "messages": history + [{"role": "user", "content": prompt}],
        "stream": True  # Important: Streaming output
    }
    response = requests.post(OLLAMA_URL, json=payload, stream=True)
    response.raise_for_status()

    # Stream the chunks and combine them
    full_reply = ""
    for line in response.iter_lines():
        if line:
            try:
                data = json.loads(line.decode("utf-8"))
                delta = data.get("message", {}).get("content", "")
                full_reply += delta
            except Exception as e:
                print(f"⚠️ Failed to parse line: {line}\nError: {e}")
    return full_reply

# --- MAIN ---
if __name__ == "__main__":
    print("🔍 Loading or building vector DB...")

    if os.path.exists(CHROMA_DB_DIR):
        vectordb = Chroma(persist_directory=CHROMA_DB_DIR, embedding_function=HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL))
    else:
        docs = load_documents(SYLLABUS_FILE, NOTES_FOLDER)
        chunks = chunk_documents(docs)
        vectordb = embed_and_store(chunks, CHROMA_DB_DIR)

    retriever = vectordb.as_retriever()
    memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

    chat_history = []
    print("🤖 Tutor Bot ready! Type 'exit' to quit.")

    while True:
        user_input = input("You: ")
        if user_input.lower() in ["exit", "quit"]:
            break

        # Retrieve context
        docs = retriever.get_relevant_documents(user_input)

        # Prioritize syllabus content
        syllabus_context = "\n".join([doc.page_content for doc in docs if doc.metadata.get("source") == "SYLLABUS"])
        notes_context = "\n".join([doc.page_content for doc in docs if doc.metadata.get("source", "").startswith("NOTES")])

        context = syllabus_context + "\n\n" + notes_context

        # Compose prompt
        full_prompt = f"Context:\n{context}\n\nQuestion: {user_input}"

        try:
            reply = query_ollama(full_prompt, chat_history)
            print(f"AI: {reply}\n")
            chat_history.append({"role": "user", "content": user_input})
            chat_history.append({"role": "assistant", "content": reply})
        except Exception as e:
            print(f"⚠️ Error: {e}")