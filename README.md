# 🧠 Final Year Project: Educational Tutor Bot

### 🇸🇬 A Singapore-Tailored AI Exam Preparation Assistant

This project is an **LLM + RAG-based Tutor Bot** that scrapes, processes, and understands past-year exam papers and syllabi. It leverages cutting-edge tools like **Ollama (LLaMA 3.1)**, **Meta's Nougat OCR**, **ChromaDB**, **LangChain**, and is deployed with a **Next.js frontend (Vercel)** and **Django backend (Firebase Auth)**.

Unlike generic AI chatbots, our system is **specifically trained on Singaporean national exams** — including PSLE, O-Level, and A-Level content — to deliver **accurate, syllabus-aligned answers** that truly help students prepare.

---

## 🧰 Tech Stack

**Frontend**: Next.js · React · TypeScript · TailwindCSS · Vercel  
**Backend**: Django · DRF · Firebase Auth · LangChain · ChromaDB · Nougat (OCR)  
**LLM**: Ollama (LLaMA 3.1)  
**Infra**: Dockerized for deployment

<p align="left">
  <img src="https://img.shields.io/badge/Next.js-000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-000?style=for-the-badge&logo=vercel&logoColor=white" />
  <img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Chroma-5C2D91?style=for-the-badge&logo=neural&logoColor=white" />
  <img src="https://img.shields.io/badge/Nougat OCR-ff4088?style=for-the-badge&logo=meta&logoColor=white" />
  <img src="https://img.shields.io/badge/Ollama-2E2E2E?style=for-the-badge&logo=ai&logoColor=white" />
  <img src="https://img.shields.io/badge/LLaMA 3.1-4CAF50?style=for-the-badge&logo=openai&logoColor=white" />
</p>

---

## 🧠 How It Works

1. **Scrape PDF exam papers and syllabi**
2. **Use OCR (Nougat)** to convert content into clean markdown/text
3. **Chunk and embed documents** using HuggingFace + ChromaDB
4. **Store vector DB** for fast semantic search
5. **Use LangChain RAG pipeline**: retrieve top-k chunks relevant to the user query
6. **Pass to LLaMA 3.1 (via Ollama)** for generating contextual answers
7. **Serve via Django API** and render in a **Next.js chat interface**

---

## 🖥 Frontend

- ✅ Next.js + TypeScript
- 🎨 TailwindCSS for styling
- 🚀 Vercel deployment
- 🔐 Firebase Auth for secure user login

## ⚙️ Backend

- 🐍 Django + Django REST Framework
- 🔥 Firebase Admin SDK for token validation
- 🧠 LangChain + custom RAG logic
- 🗂️ ChromaDB for vector search
- 📄 Nougat OCR (Meta AI) for PDF parsing

## 🧠 Local AI

- 🧩 LLaMA 3.1 served via **Ollama**
- 🧠 Runs locally for privacy + speed
- 🔍 Uses document embeddings for **contextual, syllabus-based answers**

---

## 📚 Supported Syllabi

### ✅ A-Level
- H1/H2 Mathematics
- H1/H2 Chemistry
- H1/H2 Physics
- H1/H2 Biology

### ✅ O-Level
- Pure & Combined Physics
- Pure & Combined Chemistry
- Pure & Combined Biology
- Elementary Mathematics
- Additional Mathematics

### 🛠 Coming Soon
- PSLE (Science, Math)
- IB HL/SL Subjects

---

## 💻 Local Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py runserver
```

---

## 📝 Notes

- 🤖 All AI processing is **fully local** (Ollama)
- 🧱 Vector DB built using Chroma
- 🔐 Secure API via Firebase Auth middleware
- ⚙️ Easily extendable to new subjects or exam boards

---

## 📌 Contributions & License

Currently not accepting contributions (Final Year Solo Project)
This project is open-source and for educational purposes only.