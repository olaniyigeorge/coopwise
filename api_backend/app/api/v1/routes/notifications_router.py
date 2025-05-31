from fastapi import WebSocket, WebSocketDisconnect, Depends
from fastapi.routing import APIRouter
from typing import Dict, List
from app.api.v1.routes.auth import get_current_user, get_current_user_ws
from app.schemas.auth import AuthenticatedUser
from app.schemas.notifications_schema import NotificationCreate
from db.dependencies import get_async_db_session
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.notification_service import active_connections, NotificationService

router = APIRouter(
    prefix="/api/v1/notifications",
    tags=["Notifications"]
)


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket, 
    user: AuthenticatedUser = Depends(get_current_user_ws)
    ):
    """
    WebSocket endpoint for joining a chat room.

    - This endpoint allows users to connect to a WebSocket for real-time notifications.
    - It accepts a WebSocket connection and adds the user to the active connections list.
    """
    await websocket.accept()
    user_id = user.id

    if user_id not in active_connections:
        active_connections[user_id] = []
    active_connections[user_id].append(websocket)

    try:
        while True:
            await websocket.receive_text()  # keep the connection alive
    except WebSocketDisconnect:
        active_connections[user_id].remove(websocket)
        if not active_connections[user_id]:
            del active_connections[user_id]


@router.post("/create_and_push")
async def create_notification(
    notification_data: NotificationCreate, 
    user: AuthenticatedUser = Depends(get_current_user), 
    db: AsyncSession = Depends(get_async_db_session)
    ):
    """
    Endpoint to create a new notification and push it to the user via WebSocket.
    """

    # notification_data["user_id"] = str(user.id)
    notification_detail = await NotificationService.create_notification_and_push_notification(
        notification_data, db
    )
    return notification_detail


@router.get("/")
async def send_mock_notification(
    user: AuthenticatedUser = Depends(get_current_user), 
    db: AsyncSession = Depends(get_async_db_session)
    ):
    """
    Mock endpoint to send a notification to the current user.
    """
    user_id = user.id
    new_notification_data = {
        "user_id": str(user_id),
        "title": "New Notification",
        "message": "This is a mock notification.",
        "event_type": "info",
        "type": "system",
        "is_read": False,
        "entity_url": None
    }
    await NotificationService.push_notification_to_user(user_id, new_notification_data)
    return {"message": "Notification sent successfully."}

