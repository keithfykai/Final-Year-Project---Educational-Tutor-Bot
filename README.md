# 🧠 Tutor Bot: AI-Powered Exam Paper Assistant

This project is an **LLM + RAG-based Tutor Bot** application that automatically scrapes, processes, and understands exam papers. It leverages modern AI tools like **Ollama (LLaMA 3.1)**, **Chroma/FAISS for vector search**, **Next.js on Vercel**, and **Django backend with Firebase Auth**.



---


## 🏷️ Tech Stack

<p align="left">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS"/>
  <img src="https://img.shields.io/badge/Vercel-000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel"/>
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase"/>
  <img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white" alt="Django"/>
  <img src="https://img.shields.io/badge/FAISS-009688?style=for-the-badge&logo=vector&logoColor=white" alt="FAISS"/>
  <img src="https://img.shields.io/badge/Chroma-5C2D91?style=for-the-badge&logo=neural&logoColor=white" alt="Chroma"/>
  <img src="https://img.shields.io/badge/Ollama-2E2E2E?style=for-the-badge&logo=ai&logoColor=white" alt="Ollama"/>
  <img src="https://img.shields.io/badge/LLaMA 3.1-4CAF50?style=for-the-badge&logo=openai&logoColor=white" alt="LLaMA 3.1"/>
</p>


---



## 🗂️ Project Structure

```
tutor-bot/
├── frontend/               # Vercel-hosted frontend (Next.js + TypeScript)
│   ├── components/         # Reusable UI components
│   ├── pages/              # Frontend pages (Home, Login, Tutor, etc.)
│   └── utils/              # Client-side helpers and fetchers
│
├── backend/                # Django REST API server
│   ├── api/                # Core Django app for endpoints
│   ├── vectorstore/        # FAISS/Chroma setup and retrieval logic
│   ├── auth/               # Firebase Auth verification middleware
│   └── pdf_processor/      # PDF scraping, OCR, markdown conversion
│
├── embeddings/             # Local Ollama + embedding generation scripts
│   └── ollama_client.py    # Sends chunked docs to generate embeddings
│
├── syllabus/               # Raw syllabus text files by subject
│
├── data/                   # Stored PDFs, text, and markdown files
│   ├── pdfs/
│   ├── texts/
│   └── markdowns/
│
├── scripts/                # PDF scraping + batch processing tools
│
└── README.md               # This file
```



---



## 🧰 Technologies Used

### 🖥 Frontend
- **Next.js** with **TypeScript**
- **TailwindCSS** for styling
- **Vercel** for deployment
- **Firebase Auth** for user authentication
- **MUI** for UI Component Library

### ⚙️ Backend
- **Django** with **Django REST Framework**
- **Firebase Admin SDK** for verifying auth tokens
- **ChromaDB** or **FAISS** for fast vector search
- **Tesseract OCR** and **pdf2image** for PDF scanning
- **Langchain / custom RAG logic** for document-based Q&A

### 🧠 Local AI
- **Ollama** with **LLaMA 3.1** running locally
- Chunking, embedding, and storing document vectors
- RAG: Retrieve top-k relevant vectors → pass into LLM for generation



---



## 🧩 How It Works

1. **Scrape PDFs** from academic sources.
2. **Convert to text/markdown** using OCR & formatting tools.
3. **Store syllabus and notes** in plain text files.
4. **Embed documents** using local Ollama & store vectors in Chroma/FAISS.
5. **User asks question** → retrieve relevant chunks using similarity search.
6. **Generate answers** using RAG prompt to LLaMA 3.1 (via Ollama).
7. **Serve via Django API** and **rendered by Next.js frontend**.



---



## 🔐 Authentication

- Users authenticate via **Firebase Auth** on the frontend.
- Token passed with each request and verified on Django backend using Firebase Admin SDK.



---



## 🚀 Development & Deployment

### Frontend
```bash
cd frontend
npm install
npm run dev
# Deploy using Vercel CLI or GitHub integration
```

### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py runserver
```

### Embedding + Vector Store
```bash
# After generating .txt or .md from PDFs
python embeddings/ollama_client.py
# This embeds and stores in Chroma or FAISS
```



---



## 📌 Notes

- All AI/LLM processing is **local-only** via Ollama.
- API rate limiting and access control handled via Firebase + Django middleware.
- Scalable to add more subjects, syllabus types, and exam paper sources.



---



## 📬 Contributing

Feel free to open an issue or PR for new features, bug fixes, or improvements!



---



## © License

MIT License. Built for educational research and tutoring purposes only.