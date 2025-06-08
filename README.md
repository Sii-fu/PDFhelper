# PDF Helper - AI-Powered PDF Query System 🤖📚

A full-stack application that allows users to upload PDFs and query their contents using AI. Built with FastAPI backend and Next.js frontend, the system processes PDFs, extracts text, and uses embeddings to provide context-aware answers to questions about the documents.

## Features ✨

- 📤 Upload multiple PDF files through a modern UI
- 📝 Extract and clean text from PDFs
- 🔍 Semantic search using embeddings
- 🤖 AI-powered question answering
- 📄 Page-aware querying
- 🌐 RESTful API interface
- 💅 Beautiful, responsive UI with Next.js
- 📱 Mobile-friendly design

## Tech Stack 🛠️

### Backend
- **Framework**: FastAPI
- **PDF Processing**: PyPDF2
- **Embeddings**: Sentence Transformers (all-MiniLM-L6-v2)
- **Vector Storage**: ChromaDB
- **LLM Integration**: Local LLM server (compatible with OpenAI API format)
- **Text Processing**: Custom regex-based cleaning

### Frontend
- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **PDF Viewer**: React PDF
- **State Management**: React Context
- **API Integration**: Axios

## Prerequisites 📋

Before running the project, make sure you have:

1. Python 3.8+ installed
2. Node.js 18+ installed
3. A local LLM server running (like [LM Studio](https://lmstudio.ai/) or [Ollama](https://ollama.ai/))
4. Git (for cloning the repository)

## Installation 🚀

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sii-fu/PDFhelper.git
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

3. **Install backend dependencies**
   ```bash
   pip install fastapi uvicorn python-multipart sentence-transformers chromadb PyPDF2 requests
   ```

### Frontend Setup

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   # or
   yarn install
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

3. **Frontend Environment Variables**
   Create a `.env.local` file in the frontend directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

## Running the Application 🏃‍♂️

1. **Start your local LLM server** (LM Studio or Ollama)

2. **Start the FastAPI backend server**
   ```bash
   # Make sure you're in the root directory and virtual environment is activated
   python -m uvicorn main:app --reload
   ```

3. **Start the Next.js frontend development server**
   ```bash
   # In a new terminal, navigate to the frontend directory
   cd frontend
   npm run dev
   # or
   yarn dev
   ```

4. **Access the Application**
   - Frontend will run on `http://localhost:3000`
   - Backend API will run on `http://localhost:8000`
   - API documentation available at `http://localhost:8000/docs`

## Using the Application 💻

1. **Upload PDFs**
   - Open the application in your browser at `http://localhost:3000`
   - Click the "Upload" button or drag and drop PDFs
   - Multiple PDFs can be uploaded at once
   - Progress bar shows upload status

2. **View PDFs**
   - All uploaded PDFs are listed in the sidebar
   - Click on a PDF to view its contents
   - Built-in PDF viewer for easy reading

3. **Query Documents**
   - Type your question in the chat interface
   - Select specific pages to query (optional)
   - Get AI-powered answers with source context
   - View highlighted relevant sections

## API Endpoints 🛣️

- `POST /upload` - Upload PDF files
- `GET /list_pdfs` - List all uploaded PDFs
- `GET /pdf/{pdf_name}` - Download a specific PDF
- `POST /query` - Query the PDFs with questions

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

### Frontend Features
- Responsive design works on all devices
- Dark/Light mode support
- Real-time upload progress
- Interactive PDF viewer
- Smooth animations and transitions
- Error handling and loading states
- Persistent chat history

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
- Next.js team for the frontend framework
- Shadcn UI for beautiful components

## Project Structure

- `main.py` - FastAPI backend server
- `/` - Next.js frontend application

## Deployment on Render

This project is configured for deployment on Render with two services:

### Backend Service (FastAPI)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following settings:
   - Name: `pdfhelper-backend`
   - Runtime: `Python 3.9`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Instance Type: Choose based on your needs (starter is fine for testing)

### Frontend Service (Next.js)

1. Create another Web Service on Render
2. Connect the same GitHub repository
3. Use the following settings:
   - Name: `pdfhelper-frontend`
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Instance Type: Choose based on your needs (starter is fine for testing)
4. Add the following environment variable:
   - `NEXT_PUBLIC_API_URL`: Set to your backend service URL (e.g., `https://pdfhelper-backend.onrender.com`)

## Local Development

1. Clone the repository
2. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Install frontend dependencies:
   ```bash
   npm install
   ```
4. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```
5. Start the frontend development server:
   ```bash
   npm run dev
   ```

## Environment Variables

### Backend
- `PORT`: Set by Render automatically
- `UPLOAD_DIR`: Directory for uploaded PDFs (default: 'uploaded_pdfs')

### Frontend
- `NEXT_PUBLIC_API_URL`: URL of the backend API service
