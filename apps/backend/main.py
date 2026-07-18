from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import sqlalchemy

from src.api.middlewares.middlewares import app_middleware, DistributedTokenBucketMiddleware
from src.infra.cache.redis_client import redis_manager
from src.infra.db.database import db_manager
from src.shared.utils.logger import logger
from src.api.routers import router_list
from config import AppConfig as config, rate_limit_rules

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application startup...")
    app.state.redis = None

    try:
        engine_kwargs = {}
        if "sqlite" in config.DATABASE_URL:
            engine_kwargs.update({
                "connect_args": {"check_same_thread": False},
                "poolclass": sqlalchemy.StaticPool,
            })

        db_manager.initialize(config.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1), **engine_kwargs)
        await db_manager.create_tables()

        app.state.redis = await redis_manager.initialize(
            url=config.REDIS_URL,
            decode_responses=True,
        )

        logger.info("Application startup complete")
        yield

    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise

    finally:
        await redis_manager.close()
        await db_manager.close()
        logger.info("Application shutdown complete")


app = FastAPI(
    title=config.PROJECT_NAME,
    docs_url="/api/docs",
    lifespan=lifespan,
)

# --- Routers ---
for router in router_list:
    app.include_router(router)

# --- Middleware (order matters: last added = outermost = first to run) ---

app.add_middleware(
    DistributedTokenBucketMiddleware,
    rules=rate_limit_rules.get("rules", []),
    default=rate_limit_rules.get("default", {"capacity": 10, "refill_rate": 1}),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.CLIENT_DOMAIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(BaseHTTPMiddleware, dispatch=app_middleware)

# --- Static & Templates ---
templates = Jinja2Templates(directory="src/api/templates")
app.mount("/static", StaticFiles(directory="src/api/static"), name="static")


# --- Routes ---
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    docs_href = f"{config.DOMAIN}/api/docs"
    return templates.TemplateResponse(
        request,
        "home.html",
        {
            "name": "CoopWise Backend",
            "details": "CoopWise API Backend",
            "docs_href": docs_href,
        },
    )


@app.get("/ping")
async def ping():
    return {"message": "Pong"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", reload=True, port=config.PORT)