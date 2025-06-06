# PDF Helper - AI-Powered PDF Query System 🤖📚

A FastAPI-based application that allows users to upload PDFs and query their contents using AI. The system processes PDFs, extracts text, and uses embeddings to provide context-aware answers to questions about the documents.

## Features ✨

- 📤 Upload multiple PDF files
- 📝 Extract and clean text from PDFs
- 🔍 Semantic search using embeddings
- 🤖 AI-powered question answering
- 📄 Page-aware querying
- 🌐 RESTful API interface

## Tech Stack 🛠️

- **Backend Framework**: FastAPI
- **PDF Processing**: PyPDF2
- **Embeddings**: Sentence Transformers (all-MiniLM-L6-v2)
- **Vector Storage**: ChromaDB
- **LLM Integration**: Local LLM server (compatible with OpenAI API format)
- **Text Processing**: Custom regex-based cleaning

## Prerequisites 📋

Before running the project, make sure you have:

1. Python 3.8+ installed
2. A local LLM server running (like [LM Studio](https://lmstudio.ai/) or [Ollama](https://ollama.ai/))
3. Git (for cloning the repository)

## Installation 🚀

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd PDFhelper
   ```

2. **Create and activate a virtual environment**
   ```bash
   python -m venv .venv
   # On Windows:
   .venv\Scripts\activate
   # On Unix or MacOS:
   source .venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install fastapi uvicorn python-multipart sentence-transformers chromadb PyPDF2 requests
   ```

## Configuration ⚙️

1. **Set up your local LLM server**
   - Install and run LM Studio or Ollama
   - Make sure it's running on `http://localhost:1234`
   - Configure it to use either:
     - mistral-7b-instruct-v0.3
     - qwen3-8b-instruct-q4_k_m

2. **Directory Structure**
   The application will create:
   - `uploaded_pdfs/` - for storing uploaded PDFs
   - `chroma_db/` - for the vector database

## Running the Application 🏃‍♂️

1. **Start your local LLM server** (LM Studio or Ollama)

2. **Start the FastAPI server**
   ```bash
   # Make sure you're in the virtual environment
   python -m uvicorn main:app --reload
   ```

3. **Access the API**
   - The server will run on `http://localhost:8000`
   - API documentation available at `http://localhost:8000/docs`

## API Endpoints 🛣️

- `POST /upload` - Upload PDF files
- `GET /list_pdfs` - List all uploaded PDFs
- `GET /pdf/{pdf_name}` - Download a specific PDF
- `POST /query` - Query the PDFs with questions

## Usage Examples 💡

1. **Upload PDFs**
   ```bash
   curl -X POST "http://localhost:8000/upload" -H "accept: application/json" -H "Content-Type: multipart/form-data" -F "files=@your_pdf.pdf"
   ```

2. **Query PDFs**
   ```bash
   curl -X POST "http://localhost:8000/query" -H "accept: application/json" -H "Content-Type: application/json" -d '{"question":"What is this document about?"}'
   ```

## Features in Detail 🔍

### PDF Processing
- Extracts text from PDFs
- Cleans and normalizes text content
- Removes citations, URLs, and irrelevant formatting
- Chunks text for efficient processing

### Vector Search
- Creates embeddings for text chunks
- Stores embeddings in ChromaDB
- Enables semantic search capabilities

### Question Answering
- Uses context-aware prompting
- Retrieves relevant chunks based on question similarity
- Supports page-specific queries
- Includes fun responses for greetings!

## Contributing 🤝

Feel free to:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License 📄

[Your chosen license]

## Acknowledgments 🙏

- Sentence Transformers for embeddings
- ChromaDB for vector storage
- FastAPI for the web framework
- PyPDF2 for PDF processing
