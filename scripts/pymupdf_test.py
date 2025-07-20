import sys
import os
import fitz  # Import PyMuPDF as fitz

# Get PDF path from Command-Line Argument
if len(sys.argv) < 2:
    print("Usage: python your_script_name.py <pdf_path>")
    sys.exit(1)

pdf_path = sys.argv[1]

if not os.path.isfile(pdf_path):
    print(f"❌ File not found: {pdf_path}")
    sys.exit(1)

text = ""

try:
    # Open the PDF document
    doc = fitz.open(pdf_path)

    # Iterate through each page
    for page_num in range(doc.page_count):
        page = doc.load_page(page_num)  # Load the current page
        text += page.get_text()      # Extract text and append

    # Close the document
    doc.close()

    # Write the extracted text to a file
    with open("pymupdf_output.txt", "w", encoding="utf-8") as f:
        f.write(text)

    print("✅ Extracted text written to: pymupdf_output.txt")

except fitz.FileDataError:
    print(f"❌ Error: Could not open '{pdf_path}'. It might be corrupted or not a valid PDF.")
    sys.exit(1)
except Exception as e:
    print(f"An unexpected error occurred: {e}")
    sys.exit(1)