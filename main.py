"""FastAPI application entrypoint for the fergon backend.

Run locally with: uvicorn main:app --reload
"""
import logging

from fastapi import FastAPI

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="fergon")


@app.get("/health")
def health():
    """Liveness probe used by local tooling and orchestration."""
    logger.info("health check")
    return {"status": "ok"}
