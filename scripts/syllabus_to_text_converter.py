"""
syllabus_to_text_converter.py

📝 Description:
This script recursively scans one or more input PDF files or directories containing PDF files,
extracts all readable text using PyMuPDF (fitz), and writes the output to a corresponding
`.txt` file named "<original_filename> Scanned.txt" in the same folder as the PDF.

📁 Input:
- A single PDF file
- A directory containing PDF files (recursively processes subfolders)
- Multiple files/directories as command-line arguments

📄 Output:
- For each PDF file, a text file with the same name + " Scanned.txt" is generated.

🚫 Notes:
- Skips non-PDF files.
- Gracefully handles corrupted or unreadable PDFs.
- Removes 'frontend' entries from sys.path to avoid import issues in certain environments.

📦 Dependencies:
- PyMuPDF (`pip install pymupdf`)

👾 Usage:
    python syllabus_to_text_converter.py file1.pdf folder1 file2.pdf

"""

import sys
import os
sys.path = [p for p in sys.path if "frontend" not in p]
import fitz  # PyMuPDF

def extract_text_from_pdf(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page_num in range(doc.page_count):
            page = doc.load_page(page_num)
            text += page.get_text()
        doc.close()

        out_path = pdf_path.replace(".pdf", " Scanned.txt")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"✅ Extracted text written to: {out_path}")

    except fitz.FileDataError:
        print(f"❌ Error: Could not open '{pdf_path}'. It might be corrupted or not a valid PDF.")
    except Exception as e:
        print(f"❌ Unexpected error with '{pdf_path}': {e}")

def process_path(path):
    if os.path.isfile(path) and path.lower().endswith(".pdf"):
        extract_text_from_pdf(path)

    elif os.path.isdir(path):
        for root, _, files in os.walk(path):
            for file in files:
                if file.lower().endswith(".pdf"):
                    pdf_file = os.path.join(root, file)
                    extract_text_from_pdf(pdf_file)
    else:
        print(f"❌ Path not found or invalid: {path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python syllabus_to_text_converter.py <pdf_file_or_directory> [more_files_or_dirs...]")
        sys.exit(1)

    for arg in sys.argv[1:]:
        process_path(arg)
