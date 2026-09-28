# RAG Platform

A production-oriented Retrieval-Augmented Generation (RAG) platform that allows authenticated users to upload private documents and ask questions against their content using semantic search and LLMs.

The platform supports document ingestion, asynchronous processing, vector indexing with Qdrant, conversational chat, source references, Supabase authentication, Google OAuth, and provider-independent LLM integration.

---

## 🚀 Features

### Authentication

* Email/password authentication
* Google OAuth
* Supabase Auth
* JWT-based backend authentication
* Protected APIs
* User-specific data isolation

### Document Management

* Upload PDF, DOCX, and TXT documents
* Drag-and-drop upload
* 10 MB file-size limit
* Private Supabase Storage
* Document processing status
* Document deletion

### RAG Pipeline

* Document text extraction
* Text cleaning
* Word-based chunking with overlap
* `all-MiniLM-L6-v2` embeddings
* 384-dimensional vectors
* Qdrant vector search
* User-level metadata filtering
* Top-K semantic retrieval
* Context construction
* LLM-generated answers
* Source references

### Conversational Chat

* Create conversations
* Continue existing conversations
* Persist messages
* Conversation history
* Delete conversations
* Retrieved document sources associated with answers

### LLM Providers

Local development:

* Ollama
* Qwen 2.5 7B
* Mistral 7B

Production:

* Google Gemini

The LLM layer is provider-independent, allowing the RAG pipeline to switch between local and cloud models through environment configuration.

### Infrastructure

* Docker
* Docker Compose
* GitHub Actions
* Railway deployment
* Supabase
* Qdrant Cloud

---

# 🏗️ Architecture

```text
                         ┌──────────────────────┐
                         │      React App       │
                         │   Vite + Tailwind    │
                         └──────────┬───────────┘
                                    │
                                    │ HTTP / JWT
                                    ▼
                         ┌──────────────────────┐
                         │    Node / Express    │
                         │       Backend        │
                         └──────────┬───────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
       ┌───────────┐         ┌─────────────┐        ┌────────────┐
       │ Supabase  │         │   Qdrant    │        │   Gemini   │
       │           │         │             │        │            │
       │ Auth      │         │ Vector DB   │        │ Production │
       │ PostgreSQL│         │ Embeddings  │        │ LLM        │
       │ Storage   │         │ Retrieval   │        │            │
       └───────────┘         └─────────────┘        └────────────┘
```

---

# 📄 Document Ingestion Pipeline

When a user uploads a document:

```text
Upload
  │
  ▼
Supabase Storage
  │
  ▼
Text Extraction
  │
  ▼
Text Cleaning
  │
  ▼
Chunking
  │
  ▼
Embedding
  │
  ▼
Qdrant
```

The document metadata is stored in Supabase PostgreSQL while the document itself is stored in private Supabase Storage.

Each chunk is converted into a 384-dimensional vector using `all-MiniLM-L6-v2`.

Qdrant stores the vector together with metadata such as:

```json
{
  "userId": "...",
  "documentId": "...",
  "fileName": "...",
  "chunkIndex": 12,
  "text": "...",
  "visibility": "private"
}
```

---

# 💬 RAG Query Pipeline

When a user asks a question:

```text
User Question
      │
      ▼
Generate Query Embedding
      │
      ▼
Qdrant Similarity Search
      │
      ▼
User-specific Filtering
      │
      ▼
Top-K Relevant Chunks
      │
      ▼
Context Construction
      │
      ▼
LLM
      │
      ▼
Answer + Sources
```

The current implementation uses cosine similarity for semantic retrieval and filters results by the authenticated user's ID.

---

# 🔐 Authentication & Authorization

Supabase Auth manages user authentication.

The frontend obtains a Supabase access token and sends it to the backend:

```text
Authorization: Bearer <access-token>
```

The Express authentication middleware verifies the token with Supabase and attaches the authenticated user to the request:

```text
req.user
```

Protected resources use the authenticated user's ID rather than trusting a `userId` supplied by the frontend.

This provides user-level isolation for:

* Documents
* Conversations
* Messages
* Qdrant vectors
* Supabase Storage files

Supabase Row Level Security (RLS) is also enabled for user-owned database records.

---

# 📂 Project Structure

```text
rag-platform/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── lib/
│   │   ├── services/
│   │   └── ...
│   │
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
│   │       ├── document/
│   │       ├── embedding/
│   │       ├── llm/
│   │       ├── rag/
│   │       ├── storage/
│   │       ├── vector/
│   │       └── conversation/
│   │
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
│
├── .github/
│   └── workflows/
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

# 🛠️ Tech Stack

| Layer            | Technology          |
| ---------------- | ------------------- |
| Frontend         | React               |
| Build Tool       | Vite                |
| Styling          | Tailwind CSS        |
| Backend          | Node.js             |
| API              | Express             |
| Authentication   | Supabase Auth       |
| Database         | Supabase PostgreSQL |
| File Storage     | Supabase Storage    |
| Vector Database  | Qdrant Cloud        |
| Embeddings       | all-MiniLM-L6-v2    |
| Local LLM        | Ollama              |
| Production LLM   | Google Gemini       |
| Containerization | Docker              |
| CI/CD            | GitHub Actions      |
| Deployment       | Railway             |

---

# ⚙️ Local Development

## Prerequisites

Make sure the following are installed:

* Node.js 22+
* Docker
* Docker Compose
* Git
* Ollama

For local LLM development, install the required Ollama model:

```bash
ollama pull qwen2.5:7b
```

---

# 📥 Clone the Repository

```bash
git clone <your-repository-url>

cd rag-platform
```

---

# 🔧 Backend Setup

```bash
cd backend
npm install
```

Create:

```text
backend/.env
```

Example:

```env
PORT=3000

SUPABASE_URL=your-supabase-url
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key

QDRANT_URL=your-qdrant-url
QDRANT_API_KEY=your-qdrant-api-key

LLM_PROVIDER=ollama

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=your-gemini-model
```

Start the backend:

```bash
npm run dev
```

Backend:

```text
http://localhost:3000
```

Health check:

```text
GET /api/health
```

---

# 🎨 Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Create:

```text
frontend/.env
```

Example:

```env
VITE_API_URL=http://localhost:3000

VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Start the frontend:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 🐳 Docker

The project includes Dockerfiles for both frontend and backend.

Build the backend:

```bash
cd backend
docker build -t rag-backend .
```

Build the frontend:

```bash
cd frontend
docker build -t rag-frontend .
```

The project also includes Docker Compose for running the application together:

```bash
docker compose build
docker compose up
```

---

# 🔑 Environment Variables

Never commit real credentials to GitHub.

The following must remain private:

* Qdrant API key
* Gemini API key
* Supabase service-role credentials
* Any other server-side secrets

Frontend `VITE_*` variables are bundled into the browser application, so only values intended to be public should be placed there.

Recommended local files:

```text
backend/.env
frontend/.env
```

These files are excluded through `.gitignore`.

---

# 🔄 CI/CD

GitHub Actions is used for continuous integration.

The CI pipeline validates the project before changes are released.

```text
Git Push / Pull Request
        │
        ▼
GitHub Actions
        │
        ├── Install dependencies
        ├── Backend validation
        ├── Frontend build
        └── Docker build
                │
                ▼
             CI PASS
```

Railway is used for deployment.

The production deployment architecture uses:

```text
GitHub
   │
   ▼
Railway
   │
   ├── Frontend Service
   │
   └── Backend Service
```

---

# ☁️ Production Architecture

Production uses cloud services instead of local development dependencies.

```text
                     Internet
                        │
                        ▼
                ┌───────────────┐
                │ Railway       │
                │ Frontend      │
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │ Railway       │
                │ Backend       │
                └───────┬───────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
      Supabase       Qdrant        Gemini
```

Local development uses Ollama, while production uses Gemini:

```text
Development → Ollama
Production   → Gemini
```

The rest of the RAG pipeline remains provider-independent.

---

# 🧪 Current Release Scope

This is the **first production release** of the platform.

Currently supported:

* User authentication
* Google OAuth
* Private document upload
* PDF/DOCX/TXT processing
* Document embeddings
* Qdrant retrieval
* Conversational RAG
* Conversation persistence
* Source references
* Docker
* GitHub Actions
* Railway deployment

---

# 🚧 Future Improvements

The current release intentionally focuses on getting a complete production system running before adding advanced RAG capabilities.

Planned improvements include:

### Retrieval

* Hybrid search
* BM25 / keyword retrieval
* Reranking
* Query rewriting
* Improved chunking strategies
* Better similarity thresholds

### RAG

* Conversation-aware retrieval
* Context optimization
* Improved citation handling
* Better handling of insufficient context
* Prompt-injection defenses

### UX

* Streaming responses
* Markdown rendering
* Better source previews
* Improved loading/error states
* Message regeneration
* Stop generation

### Engineering

* Unit tests
* Integration tests
* API validation
* Rate limiting
* Observability
* Improved production monitoring

---

# 🎯 Project Goals

This project is designed to demonstrate practical understanding of modern RAG systems rather than simply integrating an LLM API.

Key engineering concepts demonstrated include:

* Semantic search
* Vector embeddings
* Vector databases
* Document chunking
* Retrieval pipelines
* LLM abstraction
* Authentication and authorization
* Multi-user data isolation
* Asynchronous document processing
* Cloud storage
* Docker
* CI/CD
* Cloud deployment

---

# 📌 Status

**Release 1 — Production deployment**

🚧 Active development

The core platform is functional and deployed architecture is being established. Advanced retrieval and RAG improvements will be introduced incrementally in subsequent releases.
