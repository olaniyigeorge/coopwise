
from fastapi import APIRouter, Depends, HTTPException
from redis import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from src.api.middlewares.dependencies import get_current_user, get_redis
from src.infra.db.dependencies import get_async_db_session
from src.domains.ai_chat.schemas import AiChatHistoryResponse, AiChatBody
from src.domains.ai_chat.service import load_messages, save_messages, clear_messages, openai_chat_with_messages, AI_CHAT_SYSTEM, MAX_HISTORY_MESSAGES







from src.domains.auth.schemas import AuthenticatedUser


router = APIRouter(prefix="/api/v1/cooperatives", tags=["Cooperative Groups"])



@router.get("/ai-chat/history", response_model=AiChatHistoryResponse)
async def get_ai_chat_history(
    current_user: AuthenticatedUser = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
):
    uid = str(current_user.id)
    return AiChatHistoryResponse(messages=load_messages(redis_client, uid))


@router.delete("/ai-chat/history")
async def delete_ai_chat_history(
    current_user: AuthenticatedUser = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
):
    clear_messages(redis_client, str(current_user.id))
    return {"ok": True}


@router.post("/ai-chat", summary="Chat with AI Assistant")
async def get_immediate_ai_response(
    body: AiChatBody,
    db: AsyncSession = Depends(get_async_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
    redis_client: Redis = Depends(get_redis),
):
    _ = db
    uid = str(current_user.id)
    history = load_messages(redis_client, uid)

    api_messages: list[dict[str, str]] = [{"role": "system", "content": AI_CHAT_SYSTEM}]
    recent = history[-MAX_HISTORY_MESSAGES:] if len(history) > MAX_HISTORY_MESSAGES else history
    for m in recent:
        role = m.get("role")
        content = (m.get("content") or "").strip()
        if role in ("user", "assistant") and content:
            api_messages.append({"role": role, "content": content})

    user_line = (
        "Provide a helpful, useful, and very concise reply to the user's message.\n\n"
        f"Message: {body.prompt}"
    )
    api_messages.append({"role": "user", "content": user_line})

    try:
        response = await openai_chat_with_messages(
            api_messages,
            max_tokens=800,
            temperature=0.6,
        )
    except Exception as e:
        logger.error(f"AI chat failed: {e}")
        msg = str(e) if e else ""
        if "rate limited" in msg.lower():
            response = "AI is temporarily rate-limited. Please try again in a minute."
        else:
            response = "Something happened. Please try again."

    ts = datetime.now(timezone.utc).isoformat()
    history.append({"role": "user", "content": body.prompt, "ts": ts})
    history.append({"role": "assistant", "content": response, "ts": ts})
    save_messages(redis_client, uid, history)

    return response