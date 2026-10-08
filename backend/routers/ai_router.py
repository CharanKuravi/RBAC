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


# ── AI Question Extraction ───────────────────────────────────────────────────────

from fastapi import UploadFile, File
import base64
from typing import List

class ExtractedQuestion(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    marks: int = 1
    difficulty: str = "medium"
    subject: Optional[str] = None
    topic: Optional[str] = None


@router.post("/extract-questions")
async def extract_questions(
    file: UploadFile = File(...),
    _=Depends(require_admin),
):
    """
    Extract questions from uploaded document using Gemini AI.
    Supports: PDF, Word, Excel, Images (JPG, PNG)
    """
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=501, detail="AI service not configured. Add GEMINI_API_KEY to environment.")
    
    try:
        # Read file content
        contents = await file.read()
        file_extension = file.filename.split('.')[-1].lower()
        
        # Prepare content for Gemini
        if file_extension in ['jpg', 'jpeg', 'png']:
            # Image file - convert to base64
            mime_type = f"image/{file_extension.replace('jpg', 'jpeg')}"
            image_data = base64.b64encode(contents).decode('utf-8')
            
            prompt = """Extract all multiple-choice questions from this image.
For each question, provide:
1. Question text
2. Four options (A, B, C, D)
3. Correct answer (A, B, C, or D)
4. Marks (default to 1 if not mentioned)
5. Difficulty level (easy/medium/hard - estimate if not mentioned)

Format your response as JSON array:
[
  {
    "question_text": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_option": "A",
    "marks": 1,
    "difficulty": "medium"
  }
]

IMPORTANT: Return ONLY the JSON array, no other text."""

            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": image_data
                            }
                        }
                    ]
                }]
            }
        
        elif file_extension == 'pdf':
            # PDF - use base64
            pdf_data = base64.b64encode(contents).decode('utf-8')
            
            prompt = """Extract all multiple-choice questions from this PDF document.
For each question, provide:
1. Question text
2. Four options (A, B, C, D)
3. Correct answer (A, B, C, or D)
4. Marks (default to 1 if not mentioned)
5. Difficulty level (easy/medium/hard - estimate if not mentioned)

Format your response as JSON array:
[
  {
    "question_text": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_option": "A",
    "marks": 1,
    "difficulty": "medium"
  }
]

IMPORTANT: Return ONLY the JSON array, no other text."""

            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "application/pdf",
                                "data": pdf_data
                            }
                        }
                    ]
                }]
            }
        
        elif file_extension in ['xlsx', 'xls', 'csv', 'docx', 'doc']:
            # Text-based files - convert to text first
            if file_extension in ['xlsx', 'xls', 'csv']:
                import pandas as pd
                import io
                if file_extension == 'csv':
                    df = pd.read_csv(io.BytesIO(contents))
                else:
                    df = pd.read_excel(io.BytesIO(contents))
                text_content = df.to_string()
            else:
                # Word document - simple text extraction (for better extraction, use python-docx)
                text_content = contents.decode('utf-8', errors='ignore')
            
            prompt = f"""Extract all multiple-choice questions from this text content.
For each question, provide:
1. Question text
2. Four options (A, B, C, D)
3. Correct answer (A, B, C, or D)
4. Marks (default to 1 if not mentioned)
5. Difficulty level (easy/medium/hard - estimate if not mentioned)

Content:
{text_content[:10000]}

Format your response as JSON array:
[
  {{
    "question_text": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_option": "A",
    "marks": 1,
    "difficulty": "medium"
  }}
]

IMPORTANT: Return ONLY the JSON array, no other text."""

            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            }
        
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_extension}")
        
        # Call Gemini API
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{GEMINI_URL}?key={GEMINI_API_KEY}",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Gemini API error: {response.text}")
        
        result = response.json()
        
        # Extract text from response
        try:
            text_response = result["candidates"][0]["content"]["parts"][0]["text"]
            
            # Try to extract JSON from response
            # Remove markdown code blocks if present
            text_response = re.sub(r'```json\s*', '', text_response)
            text_response = re.sub(r'```\s*', '', text_response)
            text_response = text_response.strip()
            
            # Parse JSON
            questions = json.loads(text_response)
            
            if not isinstance(questions, list):
                raise ValueError("Response is not a list of questions")
            
            # Validate and clean questions
            valid_questions = []
            for q in questions:
                if all(key in q for key in ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option']):
                    # Ensure correct_option is uppercase
                    q['correct_option'] = str(q['correct_option']).strip().upper()
                    if q['correct_option'] not in ['A', 'B', 'C', 'D']:
                        q['correct_option'] = 'A'  # Default fallback
                    
                    # Ensure marks is int
                    q['marks'] = int(q.get('marks', 1))
                    
                    # Ensure difficulty is valid
                    difficulty = str(q.get('difficulty', 'medium')).lower()
                    if difficulty not in ['easy', 'medium', 'hard']:
                        difficulty = 'medium'
                    q['difficulty'] = difficulty
                    
                    valid_questions.append(q)
            
            return {"questions": valid_questions}
        
        except (KeyError, json.JSONDecodeError, ValueError) as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to parse AI response. Please try manual upload. Error: {str(e)}"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
