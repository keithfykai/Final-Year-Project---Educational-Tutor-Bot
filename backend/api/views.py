# backend/api/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .tutor_pipeline import load_or_get_retriever, query_ollama_with_context

retriever, memory = load_or_get_retriever()  # Preload once

@api_view(['POST'])
def chat_with_bot(request):
    user_input = request.data.get("message", "")
    history = request.data.get("history", [])
    
    # Clean the history to remove any None or invalid entries
    valid_history = [msg for msg in history if isinstance(msg, dict) and "role" in msg and "content" in msg]
    
    print("📝 Prompt:", user_input)
    print("🕘 History:", valid_history)
    
    if not user_input:
        return Response({"error": "No message provided."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        docs = retriever.get_relevant_documents(user_input)

        syllabus_context = "\n".join([doc.page_content for doc in docs if doc.metadata.get("source") == "SYLLABUS"])
        notes_context = "\n".join([doc.page_content for doc in docs if doc.metadata.get("source", "").startswith("NOTES")])
        context = f"{syllabus_context}\n\n{notes_context}"

        prompt = f"""You are an expert physics tutor.

If the question is multiple-choice, answer with the letter and a concise explanation.
If the question is open-ended or complex, provide a clear, step-by-step, multi-paragraph explanation.

Context:
{context}

Question:
{user_input}
"""

        reply = query_ollama_with_context(prompt, valid_history)

        return Response({"response": reply})
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
