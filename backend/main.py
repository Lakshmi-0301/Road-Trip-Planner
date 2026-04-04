from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routes import auth as auth_router
from .routes import trip as trip_router

# Create all tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Road Trip Planner API",
    description="Road Trip Planner — Auth + Trip Planning API",
    version="2.0.0",
)

# CORS configuration — allow Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(trip_router.router)


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "message": "Road Trip Planner API is running"}
