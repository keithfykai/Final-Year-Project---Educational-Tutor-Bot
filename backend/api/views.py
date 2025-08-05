# backend/api/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .tutor_pipeline import load_or_get_retriever, query_ollama_with_context


@api_view(['POST'])
def chat_with_bot(request):
    user_input = request.data.get("message", "")
    history = request.data.get("history", [])
    level = request.data.get("level", "").lower()
    subject = request.data.get("subject", "").lower()

    # Validate required fields
    if not user_input or not level or not subject:
        return Response(
            {"error": "Missing required fields: 'message', 'level', or 'subject'."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Clean history format
    valid_history = [msg for msg in history if isinstance(msg, dict) and "role" in msg and "content" in msg]

    print("📝 Prompt:", user_input)
    print("🎓 Level / Subject:", level, subject)
    print("🕘 History:", valid_history)

    try:
        retriever, memory = load_or_get_retriever(level, subject)
        docs = retriever.get_relevant_documents(user_input)

        # Build context from both syllabus and notes
        syllabus_context = "\n".join([doc.page_content for doc in docs if doc.metadata.get("source") == "SYLLABUS"])
        notes_context = "\n".join([doc.page_content for doc in docs if doc.metadata.get("source", "").startswith("NOTES")])
        context = f"{syllabus_context}\n\n{notes_context}"

        prompt = f"""You are an expert tutor.

        If the question is multiple-choice, answer with the letter and a concise explanation.
        If the question is open-ended or complex, provide a clear, step-by-step, multi-paragraph explanation.
        
        When writing mathematical expressions, always:
        - Use \\( ... \\) for inline math
        - Use \\[ ... \\] for block math (e.g., full equations)
        - Do not use dollar signs ($) for LaTeX

        Ensure the math is LaTeX-formatted correctly so it renders properly on the frontend.
        
        Context:
        {context}

        Question:
        {user_input}
        """

        reply = query_ollama_with_context(prompt, valid_history)
        return Response({"response": reply})

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
