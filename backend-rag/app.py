
from fastapi import FastAPI
from pydantic import BaseModel

from router import orchestrator


app = FastAPI(
    title="Energy Intelligence API",
    version="1.0.0"
)


class ChatRequest(BaseModel):
    question: str


@app.get("/")
def root():

    return {
        "status": "online",
        "service": "Energy Intelligence API"
    }


@app.post("/chat")
def chat(request: ChatRequest):

    result = orchestrator(
        request.question
    )

    return result
