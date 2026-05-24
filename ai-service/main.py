from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from services.gemini_service import getGeminiResponse
from services.ollama_service import getOllamaResponse
load_dotenv()

app = FastAPI()

class Log(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"Status": "Server running on port : 8000"}


@app.post("/analyze")
async def analyze_log(log:Log):
    res = await getGeminiResponse(log.text)
    return {"result": res }     