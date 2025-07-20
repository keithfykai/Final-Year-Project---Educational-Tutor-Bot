import os
import requests
import sys
import csv

# === CONFIG ===
GRAIL_API = "https://api.grail.moe/notes/approved"
GRAIL_DOCS_URL = "https://document.grail.moe/"
PAGE_SIZE = 20

CATEGORY_LIST = {
    "ib": "IB",
    "a_level": "GCE 'A' Levels",
    "o_level": "GCE 'O' Levels"
}

SUBJECT_LIST = {
    "combined_physics": "Combined Physics",
    "combined_chemistry": "Combined Chemistry",
    "combined_biology": "Combined Biology",
    "physics": "Pure Physics",
    "chemistry": "Pure Chemistry",
    "biology": "Pure Biology",
    "add_math": "Additional Mathematics",
    "elem_math": "Elementary Mathematics",
    "h2_math": "H2 Mathematics",
    "h1_math": "H1 Mathematics",
    "h2_biology": "H2 Biology",
    "h1_biology": "H1 Biology",
    "h2_physics": "H2 Physics",
    "h1_physics": "H1 Physics",
    "h2_chemistry": "H2 Chemistry",
    "h1_chemistry": "H1 Chemistry",
    "hl_math": "HL Mathematics",
    "sl_math": "SL Mathematics",
    "hl_biology": "HL Biology",
    "sl_biology": "SL Biology",
    "hl_physics": "HL Physics",
    "sl_physics": "SL Physics",
    "hl_chemistry": "HL Chemistry",
    "sl_chemistry": "SL Chemistry",
}

DOC_TYPE_LIST = {
    "exam_papers": "Exam Papers",
    "notes": "Notes/Practices",
    "tys": "TYS Answers",
    "mock_papers": "User Mock Papers"
}

# === CLI ARGUMENTS ===
if len(sys.argv) < 4:
    print("Usage: python grailmoe_webscraper.py <cat> <subject1,subject2,...> <doctype>")
    sys.exit(1)

cat_key = sys.argv[1]
subject_keys = sys.argv[2].split(",")
doctype_key = sys.argv[3]

if cat_key not in CATEGORY_LIST or doctype_key not in DOC_TYPE_LIST:
    print("❌ Invalid category or doc_type key.")
    sys.exit(1)

CATEGORY = CATEGORY_LIST[cat_key]
DOC_TYPE = DOC_TYPE_LIST[doctype_key]

# === HELPERS ===
def safe_filename(name):
    return "".join(c if c.isalnum() or c in " ._-" else "_" for c in name)

def scrape_subject(subject_key):
    if subject_key not in SUBJECT_LIST:
        print(f"❌ Skipping invalid subject key: {subject_key}")
        return

    SUBJECT = SUBJECT_LIST[subject_key]
    save_dir = os.path.join("grail_pdfs", cat_key, subject_key)
    os.makedirs(save_dir, exist_ok=True)

    # === CSV LOG SETUP ===
    log_filename = f"log_{cat_key}_{subject_key}_{doctype_key}.csv"
    log_path = os.path.join(save_dir, log_filename)
    log_exists = os.path.exists(log_path)

    with open(log_path, "a", newline='', encoding='utf-8') as log_file:
        csv_writer = csv.writer(log_file)
        if not log_exists:
            csv_writer.writerow([
                "Cleaned File Name", "Original Title", "Download URL", "Category", "Subject", "Doc Type", "Upload Date", "Saved Path"
            ])

        page = 1
        total_downloaded = 0

        while True:
            params = {
                "category": CATEGORY,
                "subject": SUBJECT,
                "doc_type": DOC_TYPE,
                "keyword": "",
                "page": page,
                "size": PAGE_SIZE,
                "sorted_by_upload_date": "desc"
            }

            print(f"🔎 [{subject_key}] Fetching page {page}...")
            try:
                response = requests.get(GRAIL_API, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()
            except Exception as e:
                print(f"❌ Failed to fetch page {page}: {e}")
                break

            items = data.get("items", [])
            if not items:
                print("✅ No more items.")
                break

            for item in items:
                file_name = item.get("file_name")
                title = item.get("document_name", "untitled").strip()
                upload_date = item.get("uploaded_on", "")
                if not file_name:
                    continue

                pdf_url = GRAIL_DOCS_URL + file_name
                cleaned_filename = safe_filename(title) + ".pdf"
                filepath = os.path.join(save_dir, cleaned_filename)

                if os.path.exists(filepath):
                    print(f"🟡 Skipped (already exists): {cleaned_filename}")
                    continue

                try:
                    pdf_response = requests.get(pdf_url, timeout=10)
                    pdf_response.raise_for_status()
                    with open(filepath, "wb") as f:
                        f.write(pdf_response.content)
                    print(f"✅ Downloaded: {cleaned_filename}")
                    total_downloaded += 1

                    csv_writer.writerow([
                        cleaned_filename, title, pdf_url, CATEGORY, SUBJECT, DOC_TYPE, upload_date, filepath
                    ])

                except Exception as e:
                    print(f"❌ Failed to download {cleaned_filename}: {e}")

            page += 1

    print(f"\n🎉 Done with {subject_key}! Downloaded {total_downloaded} PDFs into '{save_dir}'")
    print(f"📝 Log saved to '{log_path}'\n")


# === MAIN RUNNER ===
for subject_key in subject_keys:
    scrape_subject(subject_key)
