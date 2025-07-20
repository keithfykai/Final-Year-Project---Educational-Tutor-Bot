from pdf2image import convert_from_path
import pytesseract
import requests
import sys
import os
import tiktoken
from tqdm import tqdm
import json

# === Input Files from CLI ===
# Get PDF path from Command-Line Argument
if len(sys.argv) < 2 or len(sys.argv) > 3: # print usage demo if number of arguments is not 2
    print("Usage (output file is optional): python extract_topics.py <input-pdf> [output-markdown-file]")
    sys.exit(1)
    
pdf_path = sys.argv[1] # path to pdf will be the second argument

if not os.path.isfile(pdf_path):
    print(f"❌ File not found: {pdf_path}")
    sys.exit(1)
    
# Use optional output filename if provided
if len(sys.argv) == 3:
    cleaned_output = sys.argv[2]
else:
    cleaned_output = pdf_path.replace(".pdf", " Cleaned and Consolidated.md")

ocr_text_path = pdf_path + " OCR Output .txt" # intermediate output step for debugging
ollama_url = "http://localhost:11434/api/chat"
ollama_model = "deepseek-r1"

# === Step 1: Convert PDF pages to images and OCR them ===
print("🔍 Converting PDF to images and extracting text via OCR...")
images = convert_from_path(pdf_path)
output_text = ""

for i, img in enumerate(tqdm(images, desc="🧠 OCR Progress", unit="page")):
    text = pytesseract.image_to_string(img)
    output_text += f"\n\n--- PAGE {i + 1} ---\n\n{text}"
    
# === Step 2: Save raw OCR Text for reference/debugging ===
with open(ocr_text_path, "w", encoding="utf-8") as f:
    f.write(output_text)
print(f"✅ OCR text written to: {ocr_text_path}")

# Tokenizing the full text using OpenAI tiktoken tokenizer to count how many tokens the full text contains
enc = tiktoken.get_encoding("cl100k_base")
tokens = enc.encode(output_text) # to find out number of tokens of ocr text
print(f"Number of Tokens of OCR Raw Text: {len(tokens)}")

# === Step 4: LLM prompt for structured syllabus extraction ===
messages = [
    {
        "role": "system",
        "content": (
            "You are an education assistant specializing in curriculum summarization. "
            "Your task is to extract and organize *only* all the syllabus content from noisy OCR data. "
            "Ignore instructional guidance, introduction, learning outcomes, and teaching strategies.\n\n"

            "Your goal is to generate a clean, well-structured **Markdown-formatted document** titled with the name of the syllabus (e.g. 'Secondary Science Syllabus' or 'A-Level History Syllabus').\n\n"

            "Write down all formulas and notation listed."

            "✅ Organize the content by **subject areas and main topics** and by level and Grade (e.g Primary 1, Secondary 4. etc...).\n"
            "✅ Under each main topic or strand, consolidate all relevant subtopics across levels into a unified list.\n"
            "✅ Use nested bullet points for clarity, grouping related subpoints appropriately.\n"
            "✅ Preserve all subject-specific terminology and curriculum-relevant phrasing.\n"
            "✅ **Crucially, maintain maximum verbosity and detail.** Do not summarize, condense, or omit *any* content, even if it appears repetitive or minor. Ensure every single point and sub-point from the original text is fully represented, preserving all nuances and specific phrasing. The output must be as extensive and comprehensive as possible, reflecting the absolute full detail of the syllabus.\n\n"

            "✅ Use proper Markdown formatting with heading levels (#, ##, ###) for major sections.\n"
            "✅ The final output should be suitable for use in a study reference or digital syllabus explorer.\n\n"

            "🚫 Do NOT include generic learning outcomes, pedagogy, or examples.\n"
            "🚫 Do NOT shorten or omit detailed curriculum points.\n\n"

            "This document should represent the **complete syllabus** of the all of the grades in the input text, grouped logically by topic, and formatted cleanly for academic use."
        )
    },
    {
        "role": "user",
        "content": (
            f"Here is the noisy OCR result from the syllabus PDF:\n\n"
            f"{output_text}\n\n"
            f"Remove everything except actual syllabus content (e.g., topics, strands, grade-specific learning material). Delete intros, outcomes, teaching strategies, and assessments."
        )
    }
]

payload = {
    "model": ollama_model,
    "messages": messages,
    "stream": False
}

# === Step 5: Send to Ollama and save cleaned result ===
estimated_payload_tokens = len(enc.encode(json.dumps(payload)))
print(f"🧮 Estimated total tokens in full payload: {estimated_payload_tokens}")

print("💬 Sending request to Ollama...")
try:
    response = requests.post(url=ollama_url, json=payload)
    response.raise_for_status()
except requests.exceptions.RequestException as e:
    print("❌ Ollama request failed:", e)
    sys.exit(1)

if response.status_code == 200:
    cleaned_text = response.json()["message"]["content"]
    with open(cleaned_output, "w", encoding="utf-8") as f:
        f.write(cleaned_text)
    print("✅ Cleaned syllabus written to:", cleaned_output)
else:
    print("❌ Failed to get response from Ollama:", response.status_code)
    print(response.text)
