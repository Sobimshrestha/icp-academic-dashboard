import PyPDF2
import sys
import os

def extract_pdf_text(filepath):
    print(f"\n{'='*80}")
    print(f"FILE: {os.path.basename(filepath)}")
    print(f"{'='*80}")
    with open(filepath, 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        print(f"Number of pages: {len(reader.pages)}")
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            print(f"\n--- Page {i+1} ---")
            print(text)

# Extract out to a file so generate_app.py can read it
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pdf_dir = os.path.join(base_dir, "data", "raw_pdfs")
txt_dir = os.path.join(base_dir, "data", "extracted_txt")

outfile = os.path.join(txt_dir, "extracted_text.txt")
with open(outfile, "w", encoding="utf-8") as out:
    sys.stdout = out
    extract_pdf_text(os.path.join(pdf_dir, "BIT 1st year Sem 2 (1).pdf"))
    extract_pdf_text(os.path.join(pdf_dir, "AY 2025-26 BIT Year 2 Class Schedule.pdf"))
    extract_pdf_text(os.path.join(pdf_dir, "AY 2025-26 BIT Year 3 Class Schedule.pdf"))
    sys.stdout = sys.__stdout__
print("Extraction complete.")
