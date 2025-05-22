from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from .db import (
    get_commit_blame,
    get_commit_summary,
    get_directory_structure,
    get_repos,
    init_db,
)

init_db()

app = FastAPI(title="blameless scapegoat API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"status": "ok", "message": "blameless scapegoat API"}


@app.get("/repos")
async def fetch_repos():
    return get_repos()


@app.get("/commit_summary")
async def fetch_commit_summary(repo_name: str = Query()):
    return get_commit_summary(repo_name)


@app.get("/commit_blame")
async def fetch_commit_blame(commit_hash: str = Query()):
    return get_commit_blame(commit_hash)


@app.get("/directory_structure")
async def fetch_directory_structure(commit_hash: str = Query()):
    return get_directory_structure(commit_hash)
