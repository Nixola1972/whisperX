"""
MCP Server for Transcription Search
Deploy on Hostinger VPS with Docker

Features:
- Search transcripts by keyword
- Get full transcript
- Semantic search (if using pgvector)
"""

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import asyncpg
from typing import Optional, List
import re

app = FastAPI(
    title="Transcription MCP Server",
    description="MCP tools for searching and retrieving transcriptions",
    version="1.0.0"
)

# CORS for MCP clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
DATABASE_URL = os.environ.get("DATABASE_URL")
db_pool = None


@app.on_event("startup")
async def startup():
    global db_pool
    db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    print("Database pool created")


@app.on_event("shutdown")
async def shutdown():
    if db_pool:
        await db_pool.close()


# Auth middleware
async def verify_api_key(authorization: str = Header(...)) -> str:
    """Verify API key and return user_id"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Invalid authorization header format")

    api_key = authorization.replace("Bearer ", "")

    # Verify API key in database
    async with db_pool.acquire() as conn:
        result = await conn.fetchrow(
            """
            SELECT user_id, revoked_at
            FROM api_keys
            WHERE key = $1
            """,
            api_key
        )

    if not result:
        raise HTTPException(401, "Invalid API key")

    if result["revoked_at"]:
        raise HTTPException(401, "API key has been revoked")

    # Update last used
    async with db_pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE api_keys
            SET last_used_at = NOW()
            WHERE key = $1
            """,
            api_key
        )

    return result["user_id"]


# Models
class SearchRequest(BaseModel):
    query: str
    limit: int = 10


class TranscriptResponse(BaseModel):
    id: str
    file_name: str
    created_at: str
    excerpt: Optional[str] = None
    full_text: Optional[str] = None


# MCP Tool: search_transcripts
@app.post("/mcp/search-transcripts", response_model=List[TranscriptResponse])
async def search_transcripts(
    request: SearchRequest,
    user_id: str = Depends(verify_api_key)
):
    """
    Search keyword in user's transcriptions

    Returns list of matching transcripts with excerpts around the match.
    """
    async with db_pool.acquire() as conn:
        results = await conn.fetch(
            """
            SELECT
                id,
                file_name,
                transcript_text,
                created_at
            FROM transcripts
            WHERE user_id = $1
              AND status = 'completed'
              AND transcript_text ILIKE $2
            ORDER BY created_at DESC
            LIMIT $3
            """,
            user_id,
            f"%{request.query}%",
            request.limit
        )

    transcripts = []
    for row in results:
        excerpt = extract_excerpt(row["transcript_text"], request.query)
        transcripts.append(
            TranscriptResponse(
                id=row["id"],
                file_name=row["file_name"],
                created_at=row["created_at"].isoformat(),
                excerpt=excerpt
            )
        )

    return transcripts


# MCP Tool: get_transcript
@app.get("/mcp/get-transcript/{transcript_id}", response_model=TranscriptResponse)
async def get_transcript(
    transcript_id: str,
    user_id: str = Depends(verify_api_key)
):
    """
    Get full transcript by ID

    Returns complete transcript with all metadata.
    """
    async with db_pool.acquire() as conn:
        result = await conn.fetchrow(
            """
            SELECT
                id,
                file_name,
                transcript_text,
                created_at,
                duration_seconds,
                language
            FROM transcripts
            WHERE id = $1
              AND user_id = $2
              AND status = 'completed'
            """,
            transcript_id,
            user_id
        )

    if not result:
        raise HTTPException(404, "Transcript not found")

    return TranscriptResponse(
        id=result["id"],
        file_name=result["file_name"],
        created_at=result["created_at"].isoformat(),
        full_text=result["transcript_text"]
    )


# MCP Tool: list_transcripts
@app.get("/mcp/list-transcripts", response_model=List[TranscriptResponse])
async def list_transcripts(
    limit: int = 20,
    user_id: str = Depends(verify_api_key)
):
    """
    List user's recent transcripts

    Returns list of transcripts ordered by creation date.
    """
    async with db_pool.acquire() as conn:
        results = await conn.fetch(
            """
            SELECT
                id,
                file_name,
                created_at,
                duration_seconds
            FROM transcripts
            WHERE user_id = $1
              AND status = 'completed'
            ORDER BY created_at DESC
            LIMIT $2
            """,
            user_id,
            limit
        )

    transcripts = []
    for row in results:
        transcripts.append(
            TranscriptResponse(
                id=row["id"],
                file_name=row["file_name"],
                created_at=row["created_at"].isoformat()
            )
        )

    return transcripts


def extract_excerpt(text: str, query: str, context_chars: int = 200) -> str:
    """Extract snippet of text around the keyword"""
    if not text:
        return ""

    lower_text = text.lower()
    lower_query = query.lower()

    # Find first occurrence
    index = lower_text.find(lower_query)
    if index == -1:
        return text[:context_chars] + "..."

    # Extract context around match
    start = max(0, index - context_chars // 2)
    end = min(len(text), index + len(query) + context_chars // 2)

    excerpt = text[start:end]

    # Add ellipsis
    if start > 0:
        excerpt = "..." + excerpt
    if end < len(text):
        excerpt = excerpt + "..."

    # Highlight match (bold)
    excerpt = re.sub(
        f"({re.escape(query)})",
        r"**\1**",
        excerpt,
        flags=re.IGNORECASE
    )

    return excerpt


# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "MCP Transcription Server"}


# MCP manifest (for client discovery)
@app.get("/.well-known/mcp-manifest.json")
async def mcp_manifest():
    return {
        "name": "transcription-search",
        "version": "1.0.0",
        "tools": [
            {
                "name": "search_transcripts",
                "description": "Search for keywords in your transcriptions",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query (keyword or phrase)"
                        },
                        "limit": {
                            "type": "number",
                            "description": "Maximum results to return",
                            "default": 10
                        }
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "get_transcript",
                "description": "Get full transcript by ID",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "transcript_id": {
                            "type": "string",
                            "description": "Transcript ID"
                        }
                    },
                    "required": ["transcript_id"]
                }
            },
            {
                "name": "list_transcripts",
                "description": "List recent transcriptions",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "limit": {
                            "type": "number",
                            "description": "Number of transcripts to return",
                            "default": 20
                        }
                    }
                }
            }
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
