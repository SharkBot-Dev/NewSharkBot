import os

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from routers import levels

app = FastAPI(docs_url=None, redoc_url=None)

if not os.path.exists("static"):
    os.makedirs("static")

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(levels.router)

@app.get("/")
async def root():
    return {"status": "running", "service": "SharkBot Image Generator"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)