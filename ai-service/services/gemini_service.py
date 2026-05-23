import os
from google import genai
import json

async def getGeminiResponse(logs: str) -> str :
    print("Gemini response::")
    key = os.getenv('API_KEY')

    if not key:
        print("Missing API_KEY")
        return
    client = genai.Client(api_key=key);
    

    res = client.models.generate_content(
        model="gemini-3.1-flash-lite",
        # contents = f"While buildig/ deploying this project , why is this failing, here are some logs that will help, now give me 2 hints and one solution that can help , all under 150-words , in plain points labelling hints and solutions explicitely: {logs}."
        contents=f"""
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
        """
    )

    # html = markdown.markdown(res.text)
    # print(html)
    return json.loads(res.text)