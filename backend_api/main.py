from fastapi import FastAPI
import sqlalchemy
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()
from app.core.middlewares import app_middleware
from app.core.redis_client import redis_manager
from app.core.middlewares import  DistributedTokenBucketMiddleware
from app.utils.logger import logger
from config import AppConfig as config, rate_limit_rules
from app.api.v1.routes import (
    auth,
    cooperative_group,
    membership,
    user,
    contribution,
    dashboard,
    notifications_router,
    support_router,
    payment_routes,
    wallet_routes,
    insights_router,
    cashramp_router,
)
import uvicorn
from contextlib import asynccontextmanager
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi import Request

from db.database import db_manager



@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application startup...")

    app.state.redis = None

    try:
        # ---- DB init (your existing logic) ----
        engine_kwargs = {}
        if "sqlite" in config.DATABASE_URL:
            engine_kwargs.update(
                {
                    "connect_args": {"check_same_thread": False},
                    "poolclass": sqlalchemy.StaticPool,
                }
            )

        db_manager.initialize(config.DATABASE_URL, **engine_kwargs)
        await db_manager.create_tables()

        # ---- Redis init (same pattern) ----
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
        # Shutdown (reverse order is fine)
        await redis_manager.close()
        await db_manager.close()
        logger.info("Application shutdown complete")


app = FastAPI(title=config.PROJECT_NAME, docs_url="/api/docs", lifespan=lifespan)


# Routers
app.include_router(auth.router)
app.include_router(cooperative_group.router)
app.include_router(membership.router)
app.include_router(user.router)
app.include_router(contribution.router)
app.include_router(dashboard.router)
app.include_router(notifications_router.router)
app.include_router(support_router.router)
app.include_router(payment_routes.router)
app.include_router(wallet_routes.router)
app.include_router(insights_router.router)
app.include_router(cashramp_router.router)

# Middleware
app.add_middleware(BaseHTTPMiddleware, dispatch=app_middleware)


# Add CORS middleware 
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.CLIENT_DOMAIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

default_rule = rate_limit_rules.get("default", {"capacity": 10, "refill_rate": 1})

app.add_middleware(
    DistributedTokenBucketMiddleware,
    capacity=default_rule["capacity"],
    refill_rate=default_rule["refill_rate"]
)


templates = Jinja2Templates(directory="app/templates")

app.mount("/static", StaticFiles(directory="app/static"), name="static")


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    base_url = config.DOMAIN
    docs_href = f"{base_url}/api/docs"

    print("Rendering home page...", docs_href)
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
async def home(request: Request):
    return {"message": "Pong"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", reload=True, port=config.PORT)
