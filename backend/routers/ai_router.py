import os
import json
import re
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from auth import require_admin
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/admin/ai", tags=["ai"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"


class GeneratePaperRequest(BaseModel):
    topic: str
    num_questions: int = 10
    marks_per_question: int = 2
    level: str = "standard"  # easy | standard | hard
    subject: Optional[str] = None
    additional_instructions: Optional[str] = None


class GeneratedQuestion(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    marks: int


class GeneratePaperResponse(BaseModel):
    topic: str
    subject: str
    questions: list[GeneratedQuestion]
    total_marks: int


@router.post("/generate-paper", response_model=GeneratePaperResponse)
async def generate_paper(
    payload: GeneratePaperRequest,
    _=Depends(require_admin),
):
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Gemini API key not configured. Set GEMINI_API_KEY environment variable."
        )

    level_desc = {
        "easy": "basic recall and simple understanding",
        "standard": "moderate application and analysis",
        "hard": "advanced problem solving and deep understanding",
    }.get(payload.level, "moderate application and analysis")

    subject = payload.subject or payload.topic

    prompt = f"""Generate exactly {payload.num_questions} multiple choice questions for an examination.

Topic: {payload.topic}
Subject: {subject}
Difficulty Level: {payload.level} ({level_desc})
Marks per question: {payload.marks_per_question}
{f'Additional instructions: {payload.additional_instructions}' if payload.additional_instructions else ''}

Requirements:
- Each question must have exactly 4 options: A, B, C, D
- Only one option is correct
- Questions must be clear, unambiguous, and academically appropriate
- Vary the correct answer positions (not always A or B)
- Questions should test different aspects of the topic
- No duplicate questions

Return ONLY a valid JSON array with this exact structure, no markdown, no explanation:
[
  {{
    "question_text": "Question here?",
    "option_a": "Option A text",
    "option_b": "Option B text",
    "option_c": "Option C text",
    "option_d": "Option D text",
    "correct_option": "A"
  }}
]"""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{GEMINI_URL}?key={GEMINI_API_KEY}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.7,
                        "maxOutputTokens": 4096,
                    }
                }
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"Gemini API error: {response.status_code} — {response.text[:200]}"
            )

        data = response.json()
        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]

        # Strip markdown code blocks if present
        raw_text = re.sub(r'```json\s*', '', raw_text)
        raw_text = re.sub(r'```\s*', '', raw_text)
        raw_text = raw_text.strip()

        questions_raw = json.loads(raw_text)

        questions = []
        for q in questions_raw[:payload.num_questions]:
            correct = q.get("correct_option", "A").upper().strip()
            if correct not in ("A", "B", "C", "D"):
                correct = "A"
            questions.append(GeneratedQuestion(
                question_text=q["question_text"],
                option_a=q["option_a"],
                option_b=q["option_b"],
                option_c=q["option_c"],
                option_d=q["option_d"],
                correct_option=correct,
                marks=payload.marks_per_question,
            ))

        return GeneratePaperResponse(
            topic=payload.topic,
            subject=subject,
            questions=questions,
            total_marks=len(questions) * payload.marks_per_question,
        )

    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Gemini returned invalid JSON. Try again.")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Gemini API timed out. Try again.")
    except KeyError:
        raise HTTPException(status_code=502, detail="Unexpected Gemini response format.")
