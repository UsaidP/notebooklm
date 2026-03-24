# Privylm - AI-Powered PDF Research Assistant

A full-stack application that enables users to upload, analyze, and chat with PDF documents using advanced RAG (Retrieval-Augmented Generation) and AI agents. Built with Next.js, LangChain, and Qdrant vector database.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D20-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)

## ✨ Features

- **📄 Document Management** - Upload and organize PDFs in personal notebooks
- **🔍 Semantic Search** - Find relevant content across your documents using vector embeddings
- **💬 AI Chat** - Chat with your documents using RAG-powered responses
- **🤖 AI Agents** - ReAct agents with tool use for complex research tasks
- **🔐 Authentication** - Secure user authentication powered by Clerk
- **📊 Real-time Processing** - Background job processing with BullMQ queues
- **🌓 Dark Mode** - Beautiful UI with light/dark theme support

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js UI    │────▶│   Express API    │────▶│   Qdrant DB     │
│   (Port 3000)   │     │   (Port 8000)    │     │   (Vectors)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                        │
        ▼                       ▼                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    Clerk Auth   │     │   BullMQ Worker  │────▶│   Redis/Valkey  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Appwrite       │
                       │   (File Storage) │
                       └──────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Shadcn/ui** - Beautiful UI components
- **Clerk** - Authentication & user management
- **Zustand** - State management
- **React Query** - Data fetching & caching

### Backend
- **Node.js 20** - Runtime environment
- **Express 5** - REST API framework
- **LangChain** - AI/LLM orchestration
- **Prisma** - Database ORM
- **BullMQ** - Job queue system
- **Qdrant** - Vector database

### AI & Embeddings
- **Groq** - Fast LLM inference (Llama 3.3 70B)
- **Custom Embedding Server** - Perplexity embeddings (1024 dimensions)
- **LangGraph** - Agent orchestration

### Infrastructure
- **PostgreSQL** - Primary database
- **Qdrant** - Vector storage
- **Redis/Valkey** - Caching & job queues
- **Appwrite** - File storage
- **Docker** - Containerization

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Docker & Docker Compose
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/privylm.git
cd privylm
```

### 2. Environment Variables

Create `.env` files in both `client/` and `server/` directories:

#### Client (`client/.env`)
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_BUCKET_ID=your_bucket_id
NEXT_APP_WRITE_API_KEY=your_api_key

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/notebooks
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/notebooks
```

#### Server (`server/.env`)
```env
# Database
DATABASE_URL=postgresql://pdf_user:vector@localhost:5432/pdf_rag_db

# Redis (for BullMQ queues)
REDISHOST=localhost
REDISPORT=6379

# Qdrant Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=docs
VECTOR_DIMENSION=1024

# Embeddings Service
EMBED_API_URL=https://your-embedding-server.com/v1/embeddings
EMBED_MODEL=pplx-embed-v1

# LLM Configuration
GROQ_API_KEY=your_groq_key
LLM_MODEL=llama-3.3-70b-versatile

# Appwrite
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_BUCKET_ID=your_bucket_id
NEXT_APP_WRITE_API_KEY=your_api_key

# Client URL
CLIENT_URL=http://localhost:3000
```

### 3. Start Infrastructure Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Qdrant (port 6333)
- Redis/Valkey (port 6379)
- pgAdmin (port 5050)

### 4. Install Dependencies

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 5. Database Setup

```bash
cd server
npx prisma migrate dev
npx prisma generate
```

### 6. Run the Application

**Terminal 1 - Client:**
```bash
cd client
npm run dev
```

**Terminal 2 - Server:**
```bash
cd server
npm run dev
```

The application will be available at:
- **Frontend:** http://localhost:3000
- **API:** http://localhost:8000
- **pgAdmin:** http://localhost:5050 (login: admin@admin.com / admin)

## 📦 Deployment

### Railway Deployment

**Quick Start:** Run the automated deployment script:

```bash
chmod +x scripts/deploy-railway.sh
./scripts/deploy-railway.sh
```

This script will:
- Check prerequisites (Node.js 20+, npm, Git)
- Install dependencies
- Generate Prisma client
- Push to GitHub
- Authenticate with Railway CLI

Then follow the [**DEPLOYMENT_CHECKLIST.md**](./DEPLOYMENT_CHECKLIST.md) for step-by-step Railway setup.

**Manual Deployment:** See [**DEPLOYMENT.md**](./DEPLOYMENT.md) for detailed instructions.

#### Environment Variables

Template files provided:
- `server/.env.example` - Server environment variables
- `client/.env.example` - Client environment variables

Copy these to `.env.production` and fill in your values.

## 📁 Project Structure

```
privylm/
├── client/                 # Next.js frontend
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities
│   ├── prisma/            # Prisma schema
│   └── middleware.ts      # Clerk auth middleware
├── server/                # Express backend
│   ├── src/
│   │   ├── api/          # Route handlers
│   │   ├── config/       # Configuration
│   │   ├── lib/          # Core libraries
│   │   ├── middleware/   # Auth & tenant scope
│   │   ├── queues/       # BullMQ queues
│   │   ├── services/     # Business logic
│   │   └── workers/      # PDF processing
│   ├── index.js          # API entry point
│   └── worker.js         # Background worker
├── docker-compose.yml     # Local infrastructure
└── Dockerfile.railway    # Production Dockerfile
```

## 🔌 API Endpoints

### Authentication
All API routes are protected via Clerk JWT middleware.

### Documents
- `POST /api/documents` - Upload document
- `GET /api/documents` - List documents
- `GET /api/documents/:id` - Get document details
- `DELETE /api/documents/:id` - Delete document

### Notebooks
- `POST /api/notebooks` - Create notebook
- `GET /api/notebooks` - List notebooks
- `GET /api/notebooks/:id` - Get notebook with documents
- `PUT /api/notebooks/:id` - Update notebook
- `DELETE /api/notebooks/:id` - Delete notebook

### Chat
- `POST /api/chat` - RAG-based chat
- `POST /api/agent` - Agent chat with SSE streaming
- `POST /search` - Semantic search

## 🧪 Testing

```bash
# Run client tests
cd client
npm test

# Run server tests
cd server
npm test
```

## 🛡️ Security

- **Authentication:** Clerk with JWT validation
- **Authorization:** Tenant-scoped queries per user
- **File Upload:** Validated PDF uploads via Appwrite
- **CORS:** Configured for specific origins with credentials
- **Environment Variables:** Sensitive data stored securely

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- [Clerk](https://clerk.com) for authentication
- [LangChain](https://langchain.com) for AI orchestration
- [Qdrant](https://qdrant.tech) for vector search
- [Appwrite](https://appwrite.io) for file storage
- [Shadcn/ui](https://ui.shadcn.com) for UI components

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review API error responses for debugging tips

---

**Built with ❤️ using Next.js, LangChain, and Qdrant**
