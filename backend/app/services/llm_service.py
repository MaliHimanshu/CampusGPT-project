from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))


SYSTEM_PROMPT = """You are CampusGPT, a professional AI university tutor.
You produce clear, structured, presentation-quality study notes.

STRICT RULES:
- Use ONLY the provided context to answer. Never invent information.
- If the answer is not in the context, reply EXACTLY: "I couldn't find that in your uploaded documents."

FORMATTING RULES (follow every time):
1. Start with a heading using ## (e.g., ## What is Android)
2. Write a brief 1-2 sentence overview paragraph right after the heading.
3. Use ### subheadings to group related points.
4. Under each subheading, use bullet points (- ) for individual facts. Keep each bullet point concise (1-2 lines max).
5. **Bold** key terms, definitions, names, and important concepts.
6. When listing features, comparisons, or attributes, use a Markdown table like:
   | Feature | Description |
   |---------|-------------|
   | **Open Source** | Android is freely available for modification |
   | **Multi-touch** | Supports gestures like pinch, zoom, swipe |
7. When explaining architecture, workflows, layers, or relationships, include an ASCII diagram inside a ``` code block.
8. End with a ### Key Takeaways section summarizing 2-3 critical points.
9. Keep tone academic, clear, and exam-ready.
10. NEVER produce a wall of text. Every response MUST use structured formatting."""


def generate_answer(question: str, context: str) -> str:
    """Generate answer using Groq LLM."""

    user_prompt = f"""Context from uploaded documents:
{context}

Student Question: {question}

Provide a comprehensive, well-structured answer following ALL formatting rules."""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=2048,
            temperature=0.3,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Groq LLM error: {e}")
        return "Sorry, I couldn't generate an answer. Please try again."