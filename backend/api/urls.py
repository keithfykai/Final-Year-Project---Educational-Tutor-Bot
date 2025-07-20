from django.urls import path
from . import views  # Import your views

urlpatterns = [
    path('hello/', views.hello_world, name='hello_world'),
]
