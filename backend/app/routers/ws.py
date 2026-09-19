from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional
from jose import jwt, JWTError
from app.config import settings
from app.websocket.connection_manager import manager
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSockets"])

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    client_id: str,
    token: Optional[str] = Query(None)
):
    user_id = int(client_id) if client_id.isdigit() else 0
    role = "passenger"

    # Validate token if supplied
    if token:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id = int(payload.get("sub", user_id))
            role = payload.get("role", role)
        except JWTError:
            logger.warning(f"WebSocket token validation failed for client {client_id}")

    await manager.connect(websocket, user_id=user_id, role=role)
    
    try:
        # Acknowledge connection
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "user_id": user_id,
            "role": role,
            "message": "Connected to RYDO live network"
        })
        
        while True:
            # Keep socket alive and handle incoming client heartbeats/pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id=user_id, role=role)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, user_id=user_id, role=role)
