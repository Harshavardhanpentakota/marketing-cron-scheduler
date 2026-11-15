import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.scheduler.manager import scheduler_manager
from app.api import alerts_router, logs_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("service.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing database...")
    init_db()
    logger.info("Starting scheduler engine...")
    scheduler_manager.start()
    scheduler_manager.resync_jobs()
    yield
    # Shutdown
    logger.info("Shutting down scheduler engine...")
    scheduler_manager.shutdown()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="FastAPI service for scheduling and dispatching marketing alerts via WhatsApp and Email.",
    lifespan=lifespan
)

# Configure CORS for Next.js UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(alerts_router, prefix="/api")
app.include_router(logs_router, prefix="/api")

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "scheduler_running": scheduler_manager.scheduler.running if scheduler_manager.scheduler else False,
        "mock_dispatch": settings.MOCK_DISPATCH
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Marketing Cron Scheduler API is up and running.",
        "docs_url": "/docs",
        "health_url": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
