# 🧠 Final Year Project: Eduble

### 🇸🇬 A Syllabus-Aligned AI Learning Assistant for Exam Preparation

This project is an **AI-powered educational tutor** designed to help students prepare effectively for examinations using **syllabus-specific guidance** and **intelligent practice questions**.

The system supports two main learning modes:

- **💬 Chatbot Mode** – a smart conversational tutor trained on a specific syllabus level  
- **📝 Quiz Mode** – AI-generated multiple-choice quizzes tailored to a student’s level and subject  

Unlike generic AI tools, this tutor is **focused on real exam preparation**, reinforcing concepts through **exam-style questions** and targeted explanations to help students truly understand and retain knowledge.

---

<p align="left">
  <img src="https://img.shields.io/badge/Next.js-000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-000?style=for-the-badge&logo=vercel&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Google%20Cloud-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenAI-000?style=for-the-badge&logo=openai&logoColor=white" />
</p>

---

## ✨ Key Features

### 💬 Chatbot Mode
- Context-aware AI tutor
- Answers questions based on **specific syllabus levels**
- Provides clear, structured explanations
- Designed to simulate how students revise and clarify doubts before exams

### 📝 Quiz Mode
- AI-generated **MCQ quizzes**
- Questions are adapted to:
  - Student’s academic level
  - Selected subject
- Helps students:
  - Practise exam-style questions
  - Identify weak areas
  - Reinforce understanding through active recall

---

## 🧰 Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- TailwindCSS
- Hosted on Vercel

### Backend
- Flask
- Google Cloud Platform (GCP)

### AI & Data
- OpenAI **GPT-5-mini**
- OpenAI Embeddings
- OpenAI Vector Store (semantic retrieval)

---

## 🧠 System Overview

1. Syllabus-specific content is embedded using OpenAI embeddings  
2. Embeddings are stored in an OpenAI-managed vector database  
3. User input is handled in one of two modes:
   - **Chat Mode** → contextual, syllabus-aligned responses  
   - **Quiz Mode** → dynamic MCQ generation  
4. Relevant context is retrieved from the vector store  
5. **GPT-5-mini** generates:
   - Explanations (Chatbot Mode)
   - Exam-style MCQs (Quiz Mode)  
6. Responses are served via **FastAPI** and rendered on a **Next.js frontend**

---

## 🖥 Frontend

- Interactive chat interface
- Quiz UI with MCQ-style questions
- Responsive design using TailwindCSS
- Deployed on **Vercel**
- **This repository contains frontend code only**

---

## ☁️ Backend (External)

> ⚠️ Backend code is **not included in this repository**

- Built with **Flask**
- Hosted on **Google Cloud**
- Handles:
  - AI requests
  - Vector search
  - Prompt orchestration
- Communicates with OpenAI APIs for:
  - Language model inference
  - Vector retrieval

---

## 📚 Supported Academic Levels & Subjects

### ✅ A-Level
- H1 / H2 Mathematics
- H1 / H2 Chemistry
- H1 / H2 Physics
- H1 / H2 Biology

### ✅ O-Level
- Pure & Combined Physics
- Pure & Combined Chemistry
- Pure & Combined Biology
- Elementary Mathematics
- Additional Mathematics

### ✅ PSLE
- Science
- Math

### 🛠 Planned Extensions
- International Bacchelaureate (IB)
- Updated Notes and Exam Papers

---

## 📝 Notes

- AI responses are **syllabus-focused**, not generic
- Quiz questions are **dynamically generated**, not pre-written
- Designed to encourage **active learning and exam readiness**
- Architecture is scalable and cloud-native

---

## 📌 Contributions & License

This project is a **Final Year Project** and is not currently accepting contributions.

Open-source and intended **strictly for educational purposes**.