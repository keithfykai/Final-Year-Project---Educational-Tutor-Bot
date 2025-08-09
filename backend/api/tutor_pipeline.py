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

CATEGORY_SUBJECT_LIST = {
    "psle": {
        "science": "Science",
        "mathematics": "Mathematics",
        },
    "ib": {
        "hl_mathematics": "HL_Mathematics",
        "sl_mathematics": "SL_Mathematics",
        "hl_biology": "HL_Biology",
        "sl_biology": "SL_Biology",
        "hl_physics": "HL_Physics",
        "sl_physics": "SL_Physics",
        "hl_chemistry": "HL_Chemistry",
        "sl_chemistry": "SL_Chemistry",
        },
    "a_level": {
        "h2_mathematics": "H2_Mathematics",
        "h1_mathematics": "H1_Mathematics",
        "h2_biology": "H2_Biology",
        "h1_biology": "H1_Biology",
        "h2_physics": "H2_Physics",
        "h1_physics": "H1_Physics",
        "h2_chemistry": "H2_Chemistry",
        "h1_chemistry": "H1_Chemistry",
        },
    "o_level": {
        "combined_physics": "Combined_Physics",
        "combined_chemistry": "Combined_Chemistry",
        "combined_biology": "Combined_Biology",
        "pure_physics": "Pure_Physics",
        "pure_chemistry": "Pure_Chemistry",
        "pure_biology": "Pure_Biology",
        "add_math": "Additional_Mathematics",
        "elem_math": "Elementary_Mathematics",
    },
}

# --- CONFIGURATION ---
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
OLLAMA_URL = "http://host.docker.internal:11434/api/chat"
OLLAMA_MODEL = "llama3.1"

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
def query_ollama_with_context(prompt: str, history: List[dict]) -> str:
    payload = {
        "model": OLLAMA_MODEL,
        "messages": history + [{"role": "user", "content": prompt}],
        "stream": True  # Important: Streaming output
    }
    response = requests.post(OLLAMA_URL, json=payload, stream=True)
    response.raise_for_status()

    # Stream the chunks and combine them
    # Yield each token chunk as it comes
    for line in response.iter_lines():
        if line:
            try:
                data = json.loads(line.decode("utf-8"))
                delta = data.get("message", {}).get("content", "")
                yield delta
            except Exception as e:
                print(f"⚠️ Failed to parse line: {line}\nError: {e}")

retriever_cache = {}

# Run once and cache
def load_or_get_retriever(level: str, subject: str):
    # Cache
    cache_key = f"{level}:{subject}"
    if cache_key in retriever_cache:
        return retriever_cache[cache_key]

    # Normalize inputs
    level = level.lower()
    subject = subject.lower()

    # Validate level and subject
    if level not in CATEGORY_SUBJECT_LIST or subject not in CATEGORY_SUBJECT_LIST[level]:
        raise ValueError(f"Invalid level/subject: {level}/{subject}")

    # Use the VALUE as the folder and filename
    subject_folder = CATEGORY_SUBJECT_LIST[level][subject]
    base_path = os.path.join("./api/data", level, subject_folder)
    syllabus_file = os.path.join(base_path, f"{subject_folder} Syllabus.mmd")
    notes_folder = os.path.join(base_path, "notes")
    chroma_dir = os.path.join("./api/chroma_db", level, subject_folder)

    # Load or create Chroma DB
    if os.path.exists(chroma_dir):
        vectordb = Chroma(persist_directory=chroma_dir,
                          embedding_function=HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL))
    else:
        print(f"🔍 Creating new Chroma DB for {level}/{subject_folder}...")
        docs = load_documents(syllabus_file, notes_folder)
        chunks = chunk_documents(docs)
        vectordb = embed_and_store(chunks, chroma_dir)

    retriever = vectordb.as_retriever()
    memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
    retriever_cache[cache_key] = (retriever, memory)
    return retriever, memory