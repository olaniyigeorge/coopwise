from fastapi import FastAPI
import sqlalchemy
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()
from app.core.middleware import app_middleware
from app.utils.logger import logger
from app.core.config import config
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
    """Application lifespan manager"""
    # Startup
    try:
        # Initialize database
        engine_kwargs = {}
        if "sqlite" in config.DATABASE_URL:
            engine_kwargs.update(
                {
                    "connect_args": {"check_same_thread": False},
                    "poolclass": sqlalchemy.StaticPool,
                }
            )

        db_manager.initialize(config.DATABASE_URL, **engine_kwargs)

        # Create tables
        await db_manager.create_tables()

        logger.info("Application startup complete")
        yield

    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise
    finally:
        # Shutdown
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


templates = Jinja2Templates(directory="app/templates")

app.mount("/static", StaticFiles(directory="app/static"), name="static")


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    base_url = config.DOMAIN

    return templates.TemplateResponse(
        request,
        "home.html",
        {
            "name": "CoopWise Backend",
            "details": "CoopWise API Backend",
            "docs": f"{base_url}/api/docs",
        },
    )


@app.get("/ping")
async def home(request: Request):
    return {"message": "Pong"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", reload=True, port=8000)
