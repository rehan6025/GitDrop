import os
import ollama
import json

async def getOllamaResponse(logs: str):
    print("Ollama local response::")
    res = ollama.chat(model="qwen2.5-coder:7b", messages=[
        {
            'role': 'user',
            'content': f"""
            You are a debugging assistant.

            Return ONLY valid JSON.
            Do not wrap in markdown.

            Format:
            {{
            "Likely Cause": "...",
            "Hints": ["...", "..."],
            "Suggested fix": ["..."]
            }}

            Logs:
            {logs}
            """,
        },
    ])
    # html = markdown.markdown(res.message.content)
    # print(html)
    return json.loads(res.message.content)