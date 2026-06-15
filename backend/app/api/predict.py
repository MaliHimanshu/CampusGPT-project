from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services.vector_db import get_chroma_collection
from groq import Groq
import os
import json
import re

router = APIRouter()
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Initialize Groq client
client = None
if GROQ_API_KEY:
    client = Groq(api_key=GROQ_API_KEY)


class PredictRequest(BaseModel):
    topic: str = ""


def get_default_prediction(topic: str = "") -> dict:
    """Fallback response if Groq API fails or there is no API key."""
    focused_topic = topic or "General Studies"
    return {
        "prepScore": 75,
        "examConfidence": 80,
        "topics": [
            { "name": f"{focused_topic} Fundamentals", "weight": 90, "coverage": 85, "frequency": 95, "last_appeared": "2025", "probability": 92, "priority": "High" },
            { "name": "Core Theoretical Models", "weight": 80, "coverage": 70, "frequency": 85, "last_appeared": "2024", "probability": 84, "priority": "High" },
            { "name": "Practical Implementations", "weight": 75, "coverage": 65, "frequency": 75, "last_appeared": "2025", "probability": 78, "priority": "Medium" },
            { "name": "Comparative Case Studies", "weight": 60, "coverage": 80, "frequency": 50, "last_appeared": "2023", "probability": 62, "priority": "Medium" },
            { "name": "Advanced Research & Trends", "weight": 45, "coverage": 40, "frequency": 30, "last_appeared": "2022", "probability": 48, "priority": "Low" }
        ],
        "heatmap": [
            [4, 3, 2, 0, 1, 3, 4, 2, 1, 0, 4, 3],
            [3, 4, 4, 2, 3, 1, 3, 4, 4, 2, 3, 4],
            [1, 2, 0, 4, 2, 1, 0, 2, 3, 1, 2, 2],
            [2, 1, 3, 1, 0, 2, 1, 3, 2, 0, 1, 3],
            [0, 1, 1, 2, 1, 4, 1, 1, 0, 1, 2, 1]
        ],
        "questions": [
            {
                "id": 1,
                "tag": f"{focused_topic} · High Probability",
                "question": f"Explain the core theoretical principles of {focused_topic} and discuss its real-world trade-offs.",
                "answer": "The core principles revolve around optimizing efficiency, scalability, and correctness. Real-world trade-offs include balancing memory usage against processing time, and complexity against maintainability.",
                "tip": "Exam Tip: Draw a comprehensive architectural diagram and cite at least two practical examples."
            },
            {
                "id": 2,
                "tag": "Theory · Medium Probability",
                "question": "Compare and contrast the primary paradigms used in this subject area.",
                "answer": "Paradigm A focuses on modularity and ease of design, whereas Paradigm B focuses on raw throughput and low latency. The choice depends heavily on project constraints and performance requirements.",
                "tip": "Exam Tip: Use a comparative table layout to present features side-by-side."
            }
        ],
        "insights": [
            "This topic has appeared in almost all recent exam cycles.",
            "Higher weight is placed on practical and implementation-oriented questions.",
            "Focus on foundational concepts to secure maximum scoring potential."
        ]
    }


@router.post("/predict")
def predict_questions(
    body: PredictRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        # Step 1: Retrieve all text documents uploaded by current user
        collection = get_chroma_collection()
        results = collection.get(
            where={"user_id": str(current_user.id), "type": "text"},
            include=["documents"]
        )

        docs = results.get("documents", [])
        if not docs:
            raise HTTPException(
                status_code=404,
                detail="No study documents found. Please upload syllabus, notes, or previous year question papers in 'Upload PDF' page first."
            )

        # Step 2: Combine texts, limiting total context length to avoid token limits
        # Take a subset of documents if text is excessively large
        combined_text = ""
        for d in docs:
            combined_text += d + "\n\n"
            if len(combined_text) > 40000:
                combined_text = combined_text[:40000]
                break

        # If we have no active Groq client, return default prediction
        if not client:
            print("Groq client not configured. Returning default structured prediction.")
            return get_default_prediction(body.topic)

        # Step 3: Setup prompt
        topic_instruction = ""
        if body.topic.strip():
            topic_instruction = f"The student is specifically interested in the topic: '{body.topic.strip()}'. Tailor the analysis, topics list, heatmap, insights, and questions to focus on this topic and its sub-topics."
        else:
            topic_instruction = "Perform a broad analysis across the entire syllabus/document text provided."

        prompt = f"""You are an expert academic tutor and exam prediction AI.
Analyze the student's study materials and previous-year question papers (PYQs) provided below:

--- START OF MATERIALS ---
{combined_text}
--- END OF MATERIALS ---

Instructions:
1. Identify the most important topics covered in the materials.
2. Estimate the student's syllabus coverage based on details in the materials.
3. Calculate an overall Syllabus Prep Score (0-100) and an Exam Confidence Index (0-100).
4. Predict which topics have the highest probability of appearing in the next exam, their frequency of appearance in the notes/PYQs, and their last appearance year.
5. Create a weekly syllabus focus heatmap (Weeks 1 to 12) for each topic. Assign an importance level from 0 (low/none) to 4 (critical/high) for each week. Each topic must have exactly 12 integers representing the weeks.
6. Generate 3 to 5 predicted exam questions with clear answers and helpful exam tips.
7. Generate 3 to 5 overall AI insights/recommendations for study strategy.

{topic_instruction}

You MUST return a valid JSON object matching the exact keys below:
{{
  "prepScore": <int between 0 and 100>,
  "examConfidence": <int between 0 and 100>,
  "topics": [
    {{
      "name": "<string, topic name>",
      "weight": <int, 0-100 overall weight>,
      "coverage": <int, 0-100 syllabus coverage>,
      "frequency": <int, 0-100 frequency in papers/materials>,
      "last_appeared": "<string, year, e.g. '2025' or '2024'>",
      "probability": <int, 0-100 predicted exam probability>,
      "priority": "<'High' | 'Medium' | 'Low'>"
    }}
  ],
  "heatmap": [
    [<exactly 12 integers from 0 to 4 for topic 1>],
    [<exactly 12 integers from 0 to 4 for topic 2>],
    ...
  ],
  "questions": [
    {{
      "id": <int>,
      "tag": "<string, e.g. 'Algorithms · High Probability'>",
      "question": "<string>",
      "answer": "<string>",
      "tip": "<string>"
    }}
  ],
  "insights": [
    "<string insight 1>",
    "<string insight 2>",
    ...
  ]
}}

Ensure topics.length matches heatmap.length (each topic needs one row of 12 numbers in the heatmap).
Return ONLY the raw JSON object. Do not include markdown code block syntax (like ```json). Just the clean JSON.
"""

        # Step 4: Execute LLM prediction
        res = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=3000,
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        content = res.choices[0].message.content.strip()

        # Parse response
        try:
            prediction_data = json.loads(content)
            # Basic structural sanity checks
            if "topics" in prediction_data and "heatmap" in prediction_data:
                # Ensure sizes match
                if len(prediction_data["topics"]) != len(prediction_data["heatmap"]):
                    # Pad or truncate heatmap to match topics length
                    diff = len(prediction_data["topics"]) - len(prediction_data["heatmap"])
                    if diff > 0:
                        for _ in range(diff):
                            prediction_data["heatmap"].append([2] * 12)
                    else:
                        prediction_data["heatmap"] = prediction_data["heatmap"][:len(prediction_data["topics"])]
                return prediction_data
            else:
                print("JSON missing key fields. Falling back to default prediction.")
                return get_default_prediction(body.topic)
        except Exception as json_err:
            print(f"Failed to parse Groq JSON response: {json_err}. Raw output was: {content[:300]}")
            return get_default_prediction(body.topic)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Prediction Error: {e}")
        return get_default_prediction(body.topic)
