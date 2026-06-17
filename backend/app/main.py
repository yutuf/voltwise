from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db
from app.routers import admin, analyze, auth, catalog, profiles

FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend"
PAGES = {
    "/": "index.html",
    "/admin": "admin.html",
}


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(catalog.router, prefix="/api")
app.include_router(analyze.router, prefix="/api")
app.include_router(profiles.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "voltwise",
        "version": "1.0.0",
        "environment": settings.environment,
    }


if FRONTEND_DIR.exists():
    assets_dir = FRONTEND_DIR / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    def spa_home():
        return FileResponse(FRONTEND_DIR / "index.html")

    @app.get("/admin")
    def spa_admin():
        return FileResponse(FRONTEND_DIR / "admin.html")

    @app.get("/favicon.ico")
    def favicon():
        path = FRONTEND_DIR / "favicon.ico"
        if path.is_file():
            return FileResponse(path)
        raise HTTPException(404)
