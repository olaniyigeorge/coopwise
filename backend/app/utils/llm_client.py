from app.utils.openai_chat import openai_chat_completion


async def ask_llm(prompt: str) -> str:
    return await openai_chat_completion(
        prompt,
        system_prompt="You are a smart cooperative savings insight assistant.",
        max_tokens=600,
        temperature=0.7,
    )
