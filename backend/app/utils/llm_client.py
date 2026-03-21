import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")


async def ask_llm(prompt: str) -> str:
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {
                "role": "system",
                "content": "You are a smart cooperative savings insight assistant.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=600,
    )
    return response["choices"][0]["message"]["content"]
