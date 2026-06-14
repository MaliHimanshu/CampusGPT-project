from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))


def generate_answer(question: str, context: str) -> str:
    """Generate answer using Groq LLM."""
    prompt = f"""You are CampusGPT, an AI university assistant.
Use ONLY the context below to answer the student's question.
If the answer is not in the context, say "I couldn't find that in your uploaded documents."

Context from uploaded documents:
{context}

Student Question: {question}

Answer:"""

    try:
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1024,
            temperature=0.3,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Groq LLM error: {e}")
        return "Sorry, I couldn't generate an answer. Please try again."