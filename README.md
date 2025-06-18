# CVFactory - AI Cover Letter Generator

<div align="center">
  <img src="logo.png" alt="CVFactory Logo" style="width:200px; height:auto;"/>
  <br>

  [![한국어](https://img.shields.io/badge/language-한국어-red.svg)](README.kr.md)
</div>

## 📖 Overview

CVFactory is an AI-powered web application that helps users easily generate customized cover letters based on job postings. It consists of a simple frontend interface and a powerful backend server responsible for all the heavy lifting.

The backend server processes and extracts information from web pages, automates information extraction using web scraping, and leverages Large Language Models (LLMs) with Retrieval-Augmented Generation (RAG) for advanced text generation tasks. Core functionalities are managed as asynchronous background tasks using Celery.

## ✨ Core Technologies (Backend)

The server employs several key technologies and methodologies:

### Data Extraction and Preprocessing

-   **Web Scraping/Crawling**: Utilizes Playwright to dynamically fetch and render web pages. This enables the extraction of content even from JavaScript-heavy sites.
-   **HTML Parsing**: Employs BeautifulSoup to parse the fetched HTML for targeted extraction of text.

### Asynchronous Task Orchestration

-   **Background Task Management**: Leverages Celery with Redis as a message broker to manage long-running operations (scraping, parsing, LLM calls) asynchronously, ensuring the API remains responsive.

### Generative AI and Advanced Text Processing

-   **Large Language Model (LLM) Integration**: Incorporates Groq API to generate application-specific text like cover letters.
-   **Retrieval-Augmented Generation (RAG)**: Implements a RAG pipeline using Langchain to enhance the LLM's context understanding. This involves creating vector embeddings of the job posting content using Cohere, storing them in a FAISS vector store, and retrieving relevant information to provide as augmented context to the LLM.

## ✨ Key Features
- Extract information based on job posting URL and official company URL
- User story input and analysis
- AI-based draft cover letter generation using input information
- Function to view and edit generated cover letters

## 🛠 Tech Stack

| Category | Technologies |
|----------|--------------|
| Language | Python 3.x |
| Backend Framework | FastAPI |
| Asynchronous Tasks | Celery |
| Message Broker | Redis |
| Frontend | HTML, CSS, JavaScript (Static) |
| Web Scraping | Playwright |
| HTML Parsing | BeautifulSoup4 |
| AI/ML | Langchain, Groq API, Cohere (for Embeddings) |
| RAG | FAISS (Vector Store) |
| Containerization | Docker, Docker Compose |
| Deployment | Google Cloud Run |

## 🚀 Getting Started

### Prerequisites

-   Docker
-   Docker Compose
-   An `.env` file with necessary API keys (see `api/core/config.py` and other files for required keys like `GROQ_API_KEY`, `COHERE_API_KEY`, etc.). Place it in the `api/` directory.

### Installation and Running with Docker

This project is set up to run with Docker Compose, which orchestrates the web server and background workers.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/CV-Factory/CVFactoryForLocal.git
    cd CVFactoryForLocal
    ```

2.  **Create your environment file:**
    Create a file named `.env` inside the `api/` directory and add your API keys.
    ```
    # api/.env
    GROQ_API_KEY=your_groq_api_key
    COHERE_API_KEY=your_cohere_api_key
    # Add other necessary environment variables for Celery/Redis if not using defaults
    ```

3.  **Build and run the application:**
    ```bash
    docker-compose up --build
    ```
    This command builds the Docker image for the service and starts the FastAPI web server.

4.  **Access the application:**
    -   The web interface will be available at `http://127.0.0.1:8000/`.
    -   The FastAPI documentation can be accessed at `http://127.0.0.1:8000/docs`.

## ⚙️ CI/CD Pipeline

This project uses GitHub Actions for its CI/CD pipeline to deploy the backend server to Google Cloud Run.

-   **Trigger**: Automatically starts when new commits are pushed to the `develop` branch.
-   **Workflow File**: `.github/workflows/deploy.yaml`.
-   **Key Steps**:
    1.  **Checkout Code**: Fetches the latest code.
    2.  **Authenticate to GCP**: Uses Workload Identity Federation for secure, keyless authentication to Google Cloud.
    3.  **Build and Push Docker Image**: Builds the application's Docker image using the root `Dockerfile` and pushes it to Google Artifact Registry.
    4.  **Deploy to Cloud Run**: Deploys the new image to the `cvfactory-server` service on Google Cloud Run.

## 📁 Project Structure

```
.
├── api/                   # FastAPI backend source code
│   ├── main.py            # FastAPI application entry point and API endpoints
│   ├── celery_app.py      # Celery application instance configuration
│   ├── celery_tasks.py    # Definitions of Celery background tasks
│   ├── tasks/             # Modules for each step of the Celery pipeline
│   ├── core/              # Core utilities and configurations (LLM settings, logging)
│   └── utils/             # General utility functions
├── static/                # Static files (CSS, JS) for the frontend
├── .github/               # GitHub Actions CI/CD workflows
├── Dockerfile             # Defines the Docker image for the application
├── docker-compose.yml     # Defines services for local development
├── requirements.txt       # Python dependencies
├── index.html             # Main frontend page
├── README.md              # This file
└── README.kr.md           # Korean README
```

## 📄 License

CC BY-NC 4.0 License
(See the [LICENSE](LICENSE) file for the full text.)

## 📬 Contact

wintrover@gmail.com 