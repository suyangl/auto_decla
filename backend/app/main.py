from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.corpus import LocalCorpus
from app.models import DeclarationInput, EvaluationResult, SearchRequest
from app.rules import evaluate_lmnp
from app.services import LocalServices


BASE_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BASE_DIR.parent
FRONTEND_DIR = PROJECT_DIR / "frontend"

app = FastAPI(title="Auto Decla LMNP", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

corpus = LocalCorpus(BASE_DIR / "data")
services = LocalServices(BASE_DIR / "data")


@app.get("/")
def index() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "index.html")


app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")


@app.get("/api/health")
def health() -> dict[str, object]:
    return {"ok": True, "sources": len(corpus.docs), "services": len(services.services), "mode": "no-llm-local-rules"}


@app.get("/api/sources")
def sources() -> list[dict[str, str]]:
    return corpus.list_sources()


@app.get("/api/services")
def list_services() -> list[dict[str, object]]:
    return services.list_services()


@app.get("/api/services/{service_id}")
def get_service(service_id: str) -> dict[str, object]:
    service = services.get_service(service_id)
    if service is None:
        raise HTTPException(status_code=404, detail="service not found")
    return service


@app.post("/api/search")
def search(request: SearchRequest) -> list[dict[str, object]]:
    return corpus.search(request.query, request.limit)


@app.post("/api/evaluate", response_model=EvaluationResult)
def evaluate(data: DeclarationInput) -> EvaluationResult:
    return evaluate_lmnp(data, corpus.list_sources())
