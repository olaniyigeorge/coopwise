from fastapi import BackgroundTasks, Depends, FastAPI
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
    wallet_routes, 
    insights_router,
    cashramp_router
)
import uvicorn
from contextlib import asynccontextmanager
from db.database import database, init_db
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi import Request


@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    await init_db() 
    yield 
    await database.disconnect()


app = FastAPI(
    title=config.PROJECT_NAME, 
    docs_url="/api/docs",
    lifespan=lifespan
)


# Register Routers
app.include_router(auth.router)
app.include_router(cooperative_group.router)
app.include_router(membership.router)
app.include_router(user.router)
app.include_router(contribution.router)
app.include_router(dashboard.router)
app.include_router(notifications_router.router)
app.include_router(support_router.router)
app.include_router(wallet_routes.router)
app.include_router(insights_router.router)
app.include_router(cashramp_router.router)

# Add Middleware
app.add_middleware(BaseHTTPMiddleware, dispatch=app_middleware)

# Add CORS to middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.CLIENT_DOMAIN],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"], 
)


templates = Jinja2Templates(directory="app/templates")

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    base_url = config.DOMAIN
    
   
    return templates.TemplateResponse("home.html", {
        "request": request,
        "name": "CoopWise Backend",
        "details": "CoopWise API Backend",
        "docs": f"{base_url}/api/docs",
    })
@app.get("/ping")
async def home(request: Request):
    return {"message":"Pong"} 






if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", reload=True, port=8000)
