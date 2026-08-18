# 🚀 AI Platform

> **A production-style, cloud-native RAG platform built end-to-end with Kubernetes, GitOps, CI/CD, AWS, and observability.**

AI Platform is a full-stack Retrieval-Augmented Generation (RAG) system that lets users upload documents, index their content, and ask questions against their own knowledge base.

But the goal wasn't just to build another chatbot.

The project was built around the **platform engineering and DevOps side of AI workloads** — containerization, Kubernetes orchestration, persistent storage, vector search, GitHub Actions CI/CD, GitOps with ArgoCD, AWS S3, and application observability with Prometheus and Grafana.

---

## 🎥 Walkthrough

**Full project walkthrough:**
👉 `ADD YOUR VIDEO LINK HERE`

The walkthrough covers:

* Application UI and RAG workflow
* Document ingestion
* S3 document storage
* Kubernetes workloads
* AWS infrastructure
* GitHub Actions CI/CD
* GitHub Container Registry
* ArgoCD GitOps deployment
* Prometheus + Grafana observability
* Application access through Kubernetes port-forwarding

> **[🎬 Add walkthrough video / YouTube link here]**

---

# ✨ What It Does

The platform provides a simple workflow:

```text
Upload Document
      ↓
Store Original → Amazon S3
      ↓
Extract Text
      ↓
Chunk Document
      ↓
Generate Embeddings
      ↓
Store Vectors → PostgreSQL + pgvector
      ↓
User Asks Question
      ↓
Generate Query Embedding
      ↓
Vector Similarity Search
      ↓
Retrieve Relevant Context
      ↓
Llama 3.1
      ↓
Grounded Answer
```

The application also persists:

* 📄 Uploaded documents
* 🔢 Document chunks and embeddings
* 💬 Chat sessions
* 📝 Chat messages
* 🔗 S3 object references

So refreshing the browser doesn't wipe the application's state.

---

# 🖥️ Application

The frontend is intentionally minimal and focused on the actual workflow.

It provides:

* System health status
* Document library
* Document upload
* RAG-powered chat
* Chat sessions
* Persistent chat history
* Retrieved source context
* Session switching

### Application UI

<!-- SCREENSHOT: Add your clean final frontend screenshot here -->

`![AI Platform UI](docs/screenshots/01-frontend.png)`

### RAG Query

<!-- SCREENSHOT: Add the screenshot showing a question, answer and retrieved sources -->

`![RAG Query](docs/screenshots/02-rag-query.png)`

---

# 🧠 RAG Architecture

The core of the application is a traditional retrieval-augmented generation pipeline.

### Document ingestion

When a document is uploaded:

1. The original file is uploaded to **Amazon S3**
2. Text is extracted from the document
3. The text is split into chunks
4. Each chunk is converted into an embedding
5. Embeddings are stored in PostgreSQL using **pgvector**
6. Document metadata and the S3 key are stored in PostgreSQL

### Query

When a user asks a question:

1. The question is converted into an embedding
2. PostgreSQL performs vector similarity search
3. The most relevant chunks are retrieved
4. Retrieved context is provided to the LLM
5. Ollama generates the final answer
6. The question and answer are persisted as chat messages

This means the model answers using the application's indexed knowledge rather than relying purely on its pretrained knowledge.

---

# 🏗️ Architecture

```text
                         ┌──────────────────────┐
                         │       Browser        │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    React Frontend    │
                         │      + Nginx         │
                         └──────────┬───────────┘
                                    │
                              /api/*
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    FastAPI Backend   │
                         │       :8000          │
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
      ┌───────────────┐    ┌────────────────┐    ┌────────────────┐
      │  PostgreSQL   │    │   Amazon S3     │    │    Ollama      │
      │   + pgvector  │    │    Documents   │    │  Llama 3.1:8b  │
      └───────────────┘    └────────────────┘    └────────────────┘
              │
              ▼
       Vector Search
```

---

# ☁️ Infrastructure & Deployment

The application runs inside Kubernetes.

```text
                         GitHub
                            │
                            ▼
                    GitHub Actions
                            │
                     Run Tests
                            │
                            ▼
                     Docker Build
                            │
                            ▼
                           GHCR
                            │
                            ▼
                    Update GitOps
                      Manifest
                            │
                            ▼
                       Git Push
                            │
                            ▼
                         ArgoCD
                            │
                     Sync + Heal
                            │
                            ▼
                       Kubernetes
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
          ▼                 ▼                  ▼
      Frontend           Backend           Ollama
          │                 │
          │                 ▼
          │             PostgreSQL
          │                 │
          │                 ▼
          │              pgvector
          │
          └────────── /api ──────────► Backend
```

---

# 🧰 Tech Stack

## Application

| Component        | Technology            |
| ---------------- | --------------------- |
| Frontend         | React                 |
| Frontend server  | Nginx                 |
| Backend          | FastAPI               |
| Language         | Python                |
| LLM              | Ollama / Llama 3.1 8B |
| Embeddings       | OpenAI embeddings     |
| Vector database  | PostgreSQL + pgvector |
| Document storage | Amazon S3             |

## Platform

| Component        | Technology                |
| ---------------- | ------------------------- |
| Cloud            | AWS                       |
| Compute          | EC2                       |
| Containers       | Docker                    |
| Orchestration    | Kubernetes                |
| Package / Images | GitHub Container Registry |
| CI/CD            | GitHub Actions            |
| GitOps           | ArgoCD                    |
| Configuration    | Kustomize                 |

## Observability

| Component             | Technology               |
| --------------------- | ------------------------ |
| Metrics               | Prometheus               |
| Visualization         | Grafana                  |
| Application metrics   | Prometheus Python client |
| Kubernetes monitoring | ServiceMonitor           |

---

# 📦 Kubernetes Workloads

The `ai-platform` namespace contains the core application components:

```text
ai-platform
│
├── ai-platform-frontend
│   └── React + Nginx
│
├── ai-platform-api
│   └── FastAPI
│
├── postgres
│   └── PostgreSQL + pgvector
│
└── ollama
    └── Llama 3.1 8B
```

The backend exposes:

```text
/health
/metrics

/documents
/documents/upload

/query

/chat/{session_id}
/chat-sessions
```

---

# 🔄 CI/CD Pipeline

Every relevant change pushed to `main` goes through the GitHub Actions pipeline.

```text
git push
   │
   ▼
Checkout
   │
   ▼
Install dependencies
   │
   ▼
Run pytest
   │
   ├── ❌ Fail → Stop
   │
   ▼
Docker build
   │
   ▼
Push image → GHCR
   │
   ▼
Generate image tag
   │
   ▼
Update Kustomize
   │
   ▼
Commit GitOps change
   │
   ▼
Push to Git
```

### GitHub Actions

<!-- SCREENSHOT: Add successful GitHub Actions workflow screenshot -->

`![GitHub Actions](docs/screenshots/06-github-actions.png)`

The pipeline automatically updates the Kubernetes image tag, which allows ArgoCD to detect the desired-state change.

---

# 🔄 GitOps with ArgoCD

ArgoCD continuously monitors the Kubernetes manifests stored in Git.

When GitHub Actions updates the image tag:

```text
Git
 │
 │ desired state changes
 ▼
ArgoCD
 │
 │ detects drift
 ▼
Kubernetes
 │
 │ sync
 ▼
New application version
```

ArgoCD provides:

* Automated synchronization
* Kubernetes health monitoring
* Desired vs actual state visibility
* Self-healing
* Git as the deployment source of truth

### ArgoCD

<!-- SCREENSHOT: Add ArgoCD Synced + Healthy screenshot -->

`![ArgoCD](docs/screenshots/07-argocd.png)`

---

# 📊 Observability

The FastAPI backend exposes Prometheus metrics including:

* HTTP request count
* Request latency
* HTTP status
* Request errors

Example metric categories:

```text
http_requests_total
http_request_duration_seconds
http_requests_errors_total
```

Prometheus collects these metrics and Grafana visualizes them.

```text
FastAPI
   │
   │ /metrics
   ▼
Prometheus
   │
   ▼
Grafana
```

### Grafana Dashboard

<!-- SCREENSHOT: Add Grafana dashboard screenshot -->

`![Grafana Dashboard](docs/screenshots/08-grafana.png)`

### Prometheus Targets

<!-- SCREENSHOT: Add Prometheus Targets screenshot if you captured it -->

`![Prometheus Targets](docs/screenshots/09-prometheus-targets.png)`

---

# 🪣 Document Storage

Original uploaded files are stored in Amazon S3.

Example:

```text
ai-platform-documents-2026/
└── documents/
    ├── <uuid>/kubernetes.txt
    └── <uuid>/Sanji.txt
```

The generated S3 key is stored alongside the document metadata in PostgreSQL.

### S3

<!-- SCREENSHOT: Add S3 bucket screenshot -->

`![S3 Bucket](docs/screenshots/03-s3.png)`

---

# 🗄️ PostgreSQL + pgvector

PostgreSQL stores both application data and vector embeddings.

### Documents

```text
documents
├── id
├── filename
├── s3_key
└── created_at
```

### Chunks

```text
document_chunks
├── id
├── document_id
├── chunk_text
├── embedding
└── created_at
```

### Chat

```text
chat_sessions
└── chat_messages
    ├── user messages
    └── assistant messages
```

The relationship between documents and chunks uses foreign keys with cascading deletion.

### Database Evidence

<!-- SCREENSHOT: Add PostgreSQL documents/chunks screenshot -->

`![PostgreSQL](docs/screenshots/10-postgresql.png)`

---

# 🔐 Authentication & AWS Access

The backend does not contain hard-coded AWS credentials.

The application runs using an AWS IAM role attached to the EC2 instance, allowing the workload to obtain temporary AWS credentials through the AWS credential chain.

The application therefore accesses S3 without embedding access keys inside:

* Source code
* Docker images
* Kubernetes manifests

---

# 🩺 Health & Reliability

The backend exposes:

```http
GET /health
```

which returns:

```json
{
  "status": "healthy"
}
```

Kubernetes manages the application workloads while ArgoCD continuously monitors and reconciles the desired state.

---

# 📁 Repository Structure

```text
ai-platform/
│
├── backend/
│   ├── app/
│   │   ├── rag/
│   │   │   ├── chat.py
│   │   │   ├── chunking.py
│   │   │   ├── db.py
│   │   │   ├── document_loader.py
│   │   │   ├── embeddings.py
│   │   │   ├── generation.py
│   │   │   ├── ingestion.py
│   │   │   └── retrieval.py
│   │   │
│   │   ├── storage/
│   │   │   └── s3.py
│   │   │
│   │   └── main.py
│   │
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── api.js
│   │   └── main.jsx
│   │
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── k8s/
│   ├── backend/
│   ├── frontend/
│   ├── ollama/
│   ├── postgres/
│   ├── namespace.yaml
│   └── kustomization.yaml
│
├── tests/
│
└── .github/
    └── workflows/
        └── build-and-push.yml
```

### Repository

<!-- SCREENSHOT: Add GitHub repository structure screenshot -->

`![Repository](docs/screenshots/11-repository.png)`

---

# 🎯 Key Engineering Decisions

### 1. S3 for original documents

The database stores document metadata and vectors, while the original files remain in object storage.

This keeps large binary objects out of PostgreSQL.

### 2. PostgreSQL + pgvector

Instead of introducing a separate vector database, PostgreSQL handles both relational application data and vector similarity search.

This keeps the architecture relatively simple while still providing vector retrieval.

### 3. Ollama

The generation layer runs through Ollama, allowing the LLM workload to remain within the infrastructure rather than requiring a hosted inference endpoint.

### 4. GitOps

Kubernetes deployments are driven by Git rather than manually applying manifests.

Git becomes the desired state.

### 5. Kustomize

Kustomize manages Kubernetes configuration and image versioning without introducing templating complexity.

### 6. Nginx

The production frontend is served through Nginx, which also proxies `/api/*` requests to the FastAPI service.

This means the browser interacts with a single frontend origin.

---

# 🧪 Testing

The CI pipeline runs the project's Python test suite before building and publishing the backend image.

```bash
pytest
```

The application was also tested end-to-end with:

* Health endpoint
* Document upload
* S3 persistence
* PostgreSQL persistence
* Embedding generation
* Vector retrieval
* RAG generation
* Chat session creation
* Chat history persistence
* Frontend ↔ backend communication
* Kubernetes deployment
* ArgoCD synchronization
* Prometheus metrics
* Grafana visualization

---

# 🌐 Accessing the Application

For the demonstration environment, Kubernetes services were accessed using `kubectl port-forward`.

Example:

```bash
kubectl port-forward \
  -n ai-platform \
  svc/ai-platform-frontend 8081:80
```

The frontend was then available locally at:

```text
http://127.0.0.1:8081
```

Other development/observability services used local forwarded ports:

```text
Frontend      → 8081
Backend API   → 8000
ArgoCD        → 8080
Grafana       → 3000
Prometheus    → 9090
```

> **Note:** Port-forwarding was used for the demonstration environment. A public production deployment would typically use an Ingress or LoadBalancer with DNS and HTTPS.

---

# 📸 Project Screenshots

A quick gallery of the project:

### Application

<!-- SCREENSHOT: Frontend -->

`![Frontend](docs/screenshots/01-frontend.png)`

### RAG in Action

<!-- SCREENSHOT: RAG -->

`![RAG](docs/screenshots/02-rag-query.png)`

### AWS S3

<!-- SCREENSHOT: S3 -->

`![S3](docs/screenshots/03-s3.png)`

### Kubernetes

<!-- SCREENSHOT: Kubernetes pods -->

`![Kubernetes](docs/screenshots/04-kubernetes.png)`

### GitHub Actions

<!-- SCREENSHOT: GitHub Actions -->

`![CI/CD](docs/screenshots/06-github-actions.png)`

### ArgoCD

<!-- SCREENSHOT: ArgoCD -->

`![ArgoCD](docs/screenshots/07-argocd.png)`

### Grafana

<!-- SCREENSHOT: Grafana -->

`![Grafana](docs/screenshots/08-grafana.png)`

---

# 🚀 What This Project Demonstrates

This project brings together several areas that are normally demonstrated separately:

```text
Cloud Infrastructure
        +
Containers
        +
Kubernetes
        +
CI/CD
        +
GitOps
        +
Infrastructure Automation
        +
Object Storage
        +
Vector Search
        +
LLM / RAG
        +
Observability
```

The result is a complete path from:

> **Developer commit → automated test → container image → GitOps update → Kubernetes deployment → observable AI application**

---

# 🔮 Future Improvements

If this were taken beyond the current scope, the next improvements would include:

* Kubernetes Ingress + HTTPS
* Public DNS
* TLS automation
* Horizontal Pod Autoscaling
* Background/asynchronous document ingestion
* Authentication and authorization
* Document deletion from the UI
* Better document metadata
* Streaming LLM responses
* Rate limiting
* Persistent Kubernetes secrets management
* Production-grade PostgreSQL deployment
* Distributed tracing
* Alertmanager notifications
* Separate development/staging/production environments

---

# 🏁 Final Architecture

```text
                           ┌──────────────────────┐
                           │       GitHub         │
                           └──────────┬───────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │   GitHub Actions     │
                           │  Test + Build + Push │
                           └──────────┬───────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │       GHCR           │
                           └──────────┬───────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │       ArgoCD         │
                           │    GitOps / Sync     │
                           └──────────┬───────────┘
                                      │
                                      ▼
                    ┌──────────────────────────────────┐
                    │            Kubernetes             │
                    │                                    │
                    │  ┌──────────┐    ┌────────────┐  │
                    │  │  React   │───►│  FastAPI   │  │
                    │  │  Nginx   │    │    RAG     │  │
                    │  └──────────┘    └─────┬──────┘  │
                    │                        │          │
                    │             ┌──────────┼────────┐ │
                    │             │          │        │ │
                    │             ▼          ▼        ▼ │
                    │        PostgreSQL     S3      Ollama
                    │        + pgvector              Llama
                    │                                  │
                    └──────────────────────────────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │ Prometheus + Grafana │
                           │    Observability     │
                           └──────────────────────┘
```

