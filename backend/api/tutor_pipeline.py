import os
import requests
import json
from typing import List
from huggingface_hub import InferenceClient
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain_community.document_loaders import TextLoader
from dotenv import load_dotenv
from constants import CATEGORY_SUBJECT_LIST 

load_dotenv()

# --- CONFIGURATION ---
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
# OLLAMA_URL = "http://host.docker.internal:11434/api/chat"
# OLLAMA_MODEL = "llama3.1"
HUGGINGFACE_MODEL = "meta-llama/Llama-3.1-8B-Instruct"
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
HF_API_URL = f"https://api-inference.huggingface.co/models/{HUGGINGFACE_MODEL}"

# Initialize the client
HF_CLIENT = InferenceClient(
    provider="fireworks-ai",
    api_key=os.getenv("HUGGINGFACE_API_KEY"),  # Make sure this is set in your environment
)

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

# --- HUGGINGFACE STREAMING CHAT WITH CLEAN FORMATTING ---
def query_hf_with_context(prompt: str, history: List[dict]):
    """
    Stream Hugging Face response token-by-token using InferenceClient.
    Yields each token as it arrives.
    """
    messages = history + [
        {"role": "system", "content": """You are an expert tutor that answers questions factually.

        If the question is multiple-choice, answer with the letter option and a concise explanation.
        If the question is open-ended or complex, provide a clear, step-by-step, multi-paragraph explanation.

        When writing mathematical expressions, always:
        - Use \\( ... \\) for inline math
        - Use \\[ ... \\] for block math (e.g., full equations)
        - Do not use dollar signs ($) for LaTeX

        Ensure the math is LaTeX-formatted correctly so it renders properly on the frontend."""},
        {"role": "user", "content": prompt}
    ]

    stream = HF_CLIENT.chat.completions.create(
        model=HUGGINGFACE_MODEL,
        messages=messages,
        stream=True,
        max_tokens=2048,
        temperature=0.2,
    )

    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            # Remove any stray 'data:' or whitespace issues
            clean_delta = delta.strip()
            if clean_delta and clean_delta != "[DONE]":
                yield clean_delta


def get_clean_answer(prompt: str, history: List[dict]) -> str:
    """
    Collect all tokens from streaming and return a clean, joined string.
    """
    tokens = list(query_hf_with_context(prompt, history))
    answer_text = "".join(tokens)

    # Optional: clean extra newlines and whitespace
    answer_text = "\n".join(line.strip() for line in answer_text.splitlines() if line.strip())
    return answer_text


def get_structured_qa(prompt: str, history: List[dict]) -> List[dict]:
    """
    Attempt to split the bot's answer into a structured list of Q&A.
    Each item is {'question': '...', 'answer': '...'}.
    """
    text = get_clean_answer(prompt, history)

    import re
    # Split on question numbers e.g., "1. ", "2. "
    parts = re.split(r'(?<=\n)(\d+)\.\s', text)
    structured = []
    for i in range(1, len(parts), 2):
        q_number = parts[i]
        content = parts[i + 1].strip()
        # Split question vs answer if your bot provides "Question: ... Answer: ..."
        structured.append({
            "question_number": q_number,
            "content": content
        })
    return structured

# # --- OLLAMA CHAT INTERFACE --- // changed to HF but kept for reference
# def query_ollama_with_context(prompt: str, history: List[dict]) -> str:
#     payload = {
#         "model": OLLAMA_MODEL,
#         "messages": history + [{"role": "user", "content": prompt}],
#         "stream": True  # Important: Streaming output
#     }
#     response = requests.post(OLLAMA_URL, json=payload, stream=True)
#     response.raise_for_status()

#     # Stream the chunks and combine them
#     # Yield each token chunk as it comes
#     for line in response.iter_lines():
#         if line:
#             try:
#                 data = json.loads(line.decode("utf-8"))
#                 delta = data.get("message", {}).get("content", "")
#                 yield delta
#             except Exception as e:
#                 print(f"⚠️ Failed to parse line: {line}\nError: {e}")

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