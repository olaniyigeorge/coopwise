import uuid
from fastapi import Query, WebSocket, WebSocketDisconnect, Depends
from fastapi.routing import APIRouter
from typing import Dict, List, Tuple

from pydantic import BaseModel
from db.models.notifications import NotificationStatus
from app.api.v1.routes.auth import get_current_user, get_current_user_ws
from app.schemas.auth import AuthenticatedUser
from app.schemas.notifications_schema import NotificationCreate, NotificationDetail, NotificationUpdate
from db.dependencies import get_async_db_session
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.notification_service import active_connections, NotificationService

router = APIRouter(
    prefix="/api/v1/notifications",
    tags=["Notifications"]
)


class NotificationResponse(BaseModel):
    total: int
    page: int
    page_size: int
    notifications: List[NotificationDetail]

@router.websocket("/ws")
async def listen_for_notifications(
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

@router.get("/me", response_model=NotificationResponse, summary="Get current user's notifications")
async def get_user_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session),
) -> Tuple[List[NotificationDetail], int]:
    """
    Fetch the current user's notifications, ordered by unread → read → archived.
    Supports pagination.
    """
    notifications, total = await NotificationService.get_user_notifications(
        user=current_user,
        db=db,
        page=page,
        page_size=page_size,
    )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "notifications": [n.model_dump(mode="json") for n in notifications],
    }

@router.patch("/mark-all-as-read")
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
     Mark all the auth user unread notifications as read.
    """
    mark_response = await NotificationService.mark_all_as_read(
        db, user
    )
    
    if not mark_response:
        return {"message": "Couldn't mark Notifications as read."}
    
    return mark_response

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
    notification_detail = await NotificationService.create_and_push_notification_to_user(
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

@router.get("/{notification_id}", response_model=NotificationDetail)
async def get_notification(
    notification_id: uuid.UUID,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db_session)
):
    """
    Get a specific notification by its ID.
    """
    notification = await NotificationService.get_notification_by_id(
        db, user, notification_id
    )
    if not notification:
        return {"message": "Notification not found."}
    
    return notification.model_dump(mode="json")

@router.patch("/{notification_id}")
async def mark_notification(
    db: AsyncSession = Depends(get_async_db_session),
    user: AuthenticatedUser = Depends(get_current_user),
    notification_id: uuid.UUID = "00000000-0000-0000-0000-000000000000",
    status: NotificationStatus = NotificationStatus.READ
   
):
    """
    Update a specific notification by its ID.
    """
    updated_notification = await NotificationService.mark_notification(
        db, user, notification_id, status
    )
    
    if not updated_notification:
        return {"message": "Notification not found."}
    
    return updated_notification.model_dump(mode="json")

