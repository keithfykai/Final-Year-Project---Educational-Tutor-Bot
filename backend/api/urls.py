# backend/api/urls.py
from django.urls import path
from .views import chat_with_bot

urlpatterns = [
    path('chat/', chat_with_bot, name='chat-with-bot'),
]
