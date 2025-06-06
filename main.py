from fastapi import FastAPI, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PyPDF2 import PdfReader

import os
import uuid
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.utils import embedding_functions
import requests
from typing import List, Optional
import math
from fastapi.responses import FileResponse, JSONResponse
from fastapi import Query
import re
import string

# === Setup ===
app = FastAPI()


API_URL = "http://localhost:1234/v1/completions"
HEADERS = {"Content-Type": "application/json"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to frontend domain if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Range", "Accept-Ranges", "Content-Length"]  # <-- Add this line
)

UPLOAD_DIR = "uploaded_pdfs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
chroma_client = chromadb.PersistentClient(path="./chroma_db")
# Use a single persistent collection name
collection = chroma_client.get_or_create_collection("pdf_chunks")

# === Utils ===

def extract_text_from_pdf(file_path):
    reader = PdfReader(file_path)
    full_text = ""
    for page in reader.pages:
        full_text += page.extract_text() + "\n\n"  # Add double newline to separate pages
    return full_text

def clean_text_content(text):
    
    # Remove bracketed numbers/citations like [1], [2,3], [4, 5]
    text = re.sub(r'\[\d+(?:, *\d+)*\]', '', text)
    # Remove parenthetical citations like (Author, 2023) or (Author et al., 2023)
    text = re.sub(r'\([A-Za-z\s]+, \d{4}\)', '', text)
    text = re.sub(r'\([A-Za-z\s]+ et al\., \d{4}\)', '', text)
    # Remove DOIs and URLs
    text = re.sub(r'https?://[\w\./\-\#\?=;&%]+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'doi:[\w\./\-]+', '', text, flags=re.IGNORECASE)
    # Remove lines that are just numbers (page numbers, section numbers)
    text = re.sub(r'^\s*\d+\s*$', '', text, flags=re.MULTILINE)
    # Remove lines that are just section headers (e.g., '1. Introduction')
    text = re.sub(r'^\s*\d+\.?\s+[A-Za-z ]+$', '', text, flags=re.MULTILINE)
    # Remove lines that are just short words (e.g., 'h', 'n', etc. from broken lines)
    text = re.sub(r'^\s*[a-zA-Z]\s*$', '', text, flags=re.MULTILINE)
    # Remove excessive dashes or underscores
    text = re.sub(r'[-_]{3,}', '', text)
    # Remove multiple blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Remove hyphenated line breaks (word-\nbreak)
    text = re.sub(r'(\w+)-\n(\w+)', r'\1\2', text)
    # Merge lines that are not separated by double newlines (paragraphs)
    text = re.sub(r'(?<!\n)\n(?!\n)', ' ', text)
    # Normalize whitespace
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n[ \t]*\n', '\n\n', text)
    text = text.strip()
    return text


def chunk_text(text, chunk_size=300, overlap=50):
    def split_recursive(txt):
        if len(txt) <= chunk_size:
            return [txt]
        split_at = txt.rfind(' ', 0, chunk_size)
        if split_at == -1 or split_at < chunk_size // 2:
            split_at = chunk_size
        chunk = txt[:split_at]
        next_start = max(0, split_at - overlap)
        return [chunk] + split_recursive(txt[next_start:])
    return [c.strip() for c in split_recursive(text) if c.strip()]

def call_local_llm(prompt):
    data = {
        # "model": "qwen3-8b-instruct-q4_k_m", 
        "model": "mistral-7b-instruct-v0.3",
        "prompt": prompt,
        "temperature": 0.7,
        "max_tokens": 500,
    }
    try:
        response = requests.post(API_URL, headers=HEADERS, json=data)
        response.raise_for_status()
        return response.json()["choices"][0]["text"]
    except Exception as e:
        print("Error:", e)
        print("Raw response:", response.text)
        return None

def estimate_tokens(text):
    # Simple heuristic: 1 token ≈ 0.75 words (OpenAI's estimate)
    return int(len(text.split()) / 0.75)

# === API Models ===

class QuestionRequest(BaseModel):
    question: str

class PageAwareQuestionRequest(BaseModel):
    question: str
    pdf_name: Optional[str] = None
    page_number: Optional[int] = None

# === Routes ===

@app.post("/upload")
async def upload_pdf(files: List[UploadFile] = File(...)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)  # Ensure directory exists for every upload
    processed_files_info = []
    for file in files:
        pdf_name = file.filename
        # Sanitize filename to prevent path traversal or invalid characters if necessary
        # For now, assume filename is safe or handle as per specific security requirements
        pdf_id = pdf_name  # Use filename as the id
        pdf_path = os.path.join(UPLOAD_DIR, pdf_name)

        # Ensure parent directories exist (handles nested paths)
        # os.makedirs(os.path.dirname(pdf_path), exist_ok=True) # This might be problematic if UPLOAD_DIR is root and filename has no path
        # UPLOAD_DIR itself is already created.

        with open(pdf_path, "wb") as f:
            content = await file.read()
            f.write(content)

        raw_text = extract_text_from_pdf(pdf_path)
        cleaned_text = clean_text_content(raw_text)
        
        # Optional: print cleaned text for debugging
        # print(f"--- Cleaned text for {pdf_name} ---\n{cleaned_text[:1000]}\n------------------")

        chunks = chunk_text(cleaned_text) # Chunk the cleaned text
        if not chunks:
            # Handle case where cleaned_text might be empty or result in no chunks
            print(f"Warning: No chunks generated for {pdf_name}. Cleaned text might be empty or too short.")
            processed_files_info.append({"filename": pdf_name, "status": "no_content_after_cleaning"})
            continue
            
        embeddings = embedding_model.encode(chunks).tolist()

        # Add to Chroma with pdf_id as metadata
        collection.add(
            documents=chunks,
            embeddings=embeddings,
            ids=[f"{pdf_id}_{i}" for i in range(len(chunks))],
            metadatas=[{"pdf_id": pdf_id} for _ in range(len(chunks))]
        )
        processed_files_info.append({"filename": pdf_name, "status": "indexed", "chunks": len(chunks)})

    if not processed_files_info:
        return {"message": "No files were processed."}
        
    return {"message": "PDFs processed.", "files_status": processed_files_info}

import random

@app.get("/list_pdfs")
def list_pdfs():
    pdfs = [f for f in os.listdir(UPLOAD_DIR) if f.lower().endswith('.pdf')]
    return {"pdfs": pdfs}

@app.get("/pdf/{pdf_name}")
def get_pdf(pdf_name: str):
    file_path = os.path.join(UPLOAD_DIR, pdf_name)
    if not os.path.exists(file_path):
        return JSONResponse(status_code=404, content={"error": "PDF not found"})
    return FileResponse(file_path, media_type="application/pdf")

@app.post("/query")
async def query_pdf(q: PageAwareQuestionRequest):
    print("Received /query payload:", q)
    question = q.question.lower().strip()
    pdf_name = q.pdf_name
    page_number = q.page_number

    # Clean question for greeting/mood detection
    question_clean = question.translate(str.maketrans('', '', string.punctuation)).strip()
    greetings = {"hi", "hello", "hey", "yo", "sup", "what's up", "wassup"}
    how_are_you = {"how are you", "how u doing", "how you doing", "how's it going", "what's good"}
    greeting_responses = [
        "�� Yo! PDFs beware, I'm armed with context and caffeine.",
        "Hey there, digital traveler. Ready to drop some PDFs on me?",
        "What's poppin'? If it's a PDF, I'm down to read it like a nerd on espresso.",
        "Sup? Upload your knowledge dumps and I'll do the thinking. 🧠",
        "Hi! Toss me some PDFs and let's pretend I'm smart together."
    ]
    mood_responses = [
        "I'm vibing at 1000 tokens per second, thanks for asking. 🫡",
        "Emotion.exe not found — but I'm functioning perfectly. Let's do this.",
        "I'm just a bunch of code and chaos, but livin' my best artificial life. 😎",
        "I'm doing better than your GPA during finals, probably. Ask away.",
        "Feeling like a server on Black Friday: overwhelmed but powered up."
    ]
    # Only match if the whole message is a greeting or mood question
    if question_clean in greetings:
        return {
            "answer": random.choice(greeting_responses),
            "context": "",
            "used_tokens": 0
        }
    if question_clean in how_are_you:
        return {
            "answer": random.choice(mood_responses),
            "context": "",
            "used_tokens": 0
        }

    question_embedding = embedding_model.encode(question).tolist()

    # Retrieve top 5 chunks
    results = collection.query(
        query_embeddings=[question_embedding],
        n_results=5 # Fetch top 5 chunks
    )
    top_chunks = results["documents"][0]
    top_metadatas = results["metadatas"][0]

    # If page-aware, extract that page's text and chunk/encode it
    page_chunks = []
    if pdf_name and page_number:
        pdf_path = os.path.join(UPLOAD_DIR, pdf_name)
        if os.path.exists(pdf_path):
            reader = PdfReader(pdf_path)
            if 1 <= page_number <= len(reader.pages):
                page_text = reader.pages[page_number-1].extract_text()
                cleaned_page_text = clean_text_content(page_text)
                page_chunks = chunk_text(cleaned_page_text)

    # Add page chunks to the context (prioritize them)
    context = ""
    # selected_chunks = # Not strictly needed anymore if not limiting by tokens
    # selected_metadatas = # Not strictly needed anymore if not limiting by tokens

    # Add page-aware chunks first (no --- separator)
    if page_chunks:
        context = "\n\n".join(page_chunks)
    else:
        context = ""
    print(f"Page-aware context length: {context} \ncharacters, estimated tokens: {estimate_tokens(context)}")    # Then add top chunks from Chroma
    for chunk, meta in zip(top_chunks, top_metadatas):
        context += f"{chunk}\n---\n"  # Removed PDF ID reference
        # selected_chunks.append(chunk)
        # selected_metadatas.append(meta)
    
    # Estimate tokens for the final context
    final_used_tokens = estimate_tokens(context)


    prompt = f"""
You are an AI assistant answering questions based on the provided documents.

### 🧠 Your Role:
- Use **only the provided context** as your **primary source** of truth.
- You **may** include your own explanations, analogies, or examples to help the user understand — **but clearly label** these sections like this:
> **Additional explanation beyond the documents:** ...

---

### 🚫 Important Rules:
- If the answer is **not found in the context**, respond with:
**"Not specified in the documents."**
- If the question is **not relevant** to the documents, respond with:
**"Question not related to the provided documents."**

---

### 📝 Output Formatting (Markdown):
- Use **headings** (`#`, `##`, `###`) to organize the response
- Use **bold** for key terms or concepts
- Use bullet points `-` or numbered lists `1.` when appropriate
- Use `inline code` for technical terms
- Use blockquotes `>` to emphasize notes, warnings, or additional explanations

---

**Context:**
{context}

---

**Question:**
{question}
"""


    answer = call_local_llm(prompt)

    if answer is None:
        return {"error": "LLM failed to respond."}

    return {
        "answer": answer,
        "context": context,
        "used_tokens": final_used_tokens, # Report estimated tokens of the final context
    }


