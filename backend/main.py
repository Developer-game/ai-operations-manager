from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.autopilot import router as autopilot_router
from app.api.routes.ops import router as ops_router

app = FastAPI(
    title="Campus Society Autopilot API (Gemma Powered)",
    description="Autonomous Multi-Agent Operations Manager for University Events & Workshops.",
    version="2.0.0"
)

# Enable CORS for frontend dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(autopilot_router)
app.include_router(ops_router)

@app.get("/")
def root():
    return {
        "service": "AI Operations Manager API",
        "status": "operational",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
