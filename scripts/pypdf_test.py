from pypdf import PdfReader
import sys
import os

pdf_path = sys.argv[1]

if not os.path.isfile(pdf_path):
    print(f"❌ File not found: {pdf_path}")
    sys.exit(1)
    
reader = PdfReader(pdf_path)
text = ""

for i in range(len(reader.pages)): 
    page = reader.pages[i]
    text += page.extract_text()

with open("pypdf output.txt", "w", encoding="utf-8") as f:
    f.write(text)