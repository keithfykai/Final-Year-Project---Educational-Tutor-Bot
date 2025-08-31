import os
import json
import requests
from typing import List
from huggingface_hub import InferenceClient

client = InferenceClient()
userInput = input("Enter your question: ")
while userInput != "end":
    completion = client.chat.completions.create(
        model="meta-llama/Llama-3.1-8B-Instruct",
        messages=[
            {
                "role": "user",
                "content": userInput,
            }
        ],
    )

    print(completion.choices[0].message)
    
    userInput = input("Enter your question: \n")