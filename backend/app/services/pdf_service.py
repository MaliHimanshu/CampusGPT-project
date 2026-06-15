import fitz  # PyMuPDF
import os
from typing import List, Dict

IMAGES_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "images")
os.makedirs(IMAGES_DIR, exist_ok=True)


def extract_text_from_pdf(file_path: str) -> str:
    """Extract all text from a PDF file."""
    text = ""
    try:
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text()
        doc.close()
    except Exception as e:
        print(f"PDF extraction error: {e}")
    return text


def extract_images_from_pdf(file_path: str, user_id: int, doc_id: int) -> List[Dict]:
    """Extract images from a PDF and save them to disk.
    
    Returns a list of dicts with image metadata:
      { "page": int, "image_path": str, "filename": str, "width": int, "height": int }
    """
    extracted = []
    try:
        doc = fitz.open(file_path)
        img_count = 0

        for page_num in range(len(doc)):
            page = doc[page_num]
            image_list = page.get_images(full=True)

            for img_index, img_info in enumerate(image_list):
                xref = img_info[0]
                try:
                    base_image = doc.extract_image(xref)
                    if not base_image:
                        continue

                    image_bytes = base_image["image"]
                    image_ext = base_image.get("ext", "png")
                    width = base_image.get("width", 0)
                    height = base_image.get("height", 0)

                    # Skip tiny images (icons, bullets, etc.)
                    if width < 80 or height < 80:
                        continue

                    # Save the image
                    img_filename = f"user{user_id}_doc{doc_id}_p{page_num}_img{img_count}.{image_ext}"
                    img_path = os.path.join(IMAGES_DIR, img_filename)

                    with open(img_path, "wb") as f:
                        f.write(image_bytes)

                    extracted.append({
                        "page": page_num + 1,
                        "filename": img_filename,
                        "image_path": img_path,
                        "width": width,
                        "height": height,
                    })
                    img_count += 1
                    print(f"  Extracted image: {img_filename} ({width}x{height})")

                except Exception as img_err:
                    print(f"  Error extracting image xref {xref}: {img_err}")
                    continue

        doc.close()
        print(f"Total images extracted: {img_count}")

    except Exception as e:
        print(f"PDF image extraction error: {e}")

    return extracted