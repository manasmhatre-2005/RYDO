import json
import logging
from typing import Dict, List, Set, Any
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Map user_id -> List[WebSocket] (user can have multiple tabs/devices open)
        self.active_user_connections: Dict[int, List[WebSocket]] = {}
        # Sockets subscribed to admin operations stream
        self.admin_connections: Set[WebSocket] = set()
        # Sockets of online drivers
        self.driver_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int, role: str):
        await websocket.accept()
        
        # Add to user map
        if user_id not in self.active_user_connections:
            self.active_user_connections[user_id] = []
        self.active_user_connections[user_id].append(websocket)

        # Track role-specific groups
        if role == "driver":
            if user_id not in self.driver_connections:
                self.driver_connections[user_id] = []
            self.driver_connections[user_id].append(websocket)
        elif role == "admin":
            self.admin_connections.add(websocket)

        logger.info(f"WebSocket connected: user_id={user_id}, role={role}")

    def disconnect(self, websocket: WebSocket, user_id: int, role: str):
        # Remove from user connections
        if user_id in self.active_user_connections:
            if websocket in self.active_user_connections[user_id]:
                self.active_user_connections[user_id].remove(websocket)
            if not self.active_user_connections[user_id]:
                del self.active_user_connections[user_id]

        # Remove from role connections
        if role == "driver" and user_id in self.driver_connections:
            if websocket in self.driver_connections[user_id]:
                self.driver_connections[user_id].remove(websocket)
            if not self.driver_connections[user_id]:
                del self.driver_connections[user_id]
        elif role == "admin":
            self.admin_connections.discard(websocket)

        logger.info(f"WebSocket disconnected: user_id={user_id}, role={role}")

    async def send_personal_message(self, user_id: int, message: Dict[str, Any]):
        """Send a JSON message to all active sockets of a specific user."""
        if user_id in self.active_user_connections:
            dead_sockets = []
            for connection in self.active_user_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    logger.warning(f"Failed to send to user {user_id}: {e}")
                    dead_sockets.append(connection)
            for dead in dead_sockets:
                self.active_user_connections[user_id].remove(dead)

    async def broadcast_to_drivers(self, message: Dict[str, Any], driver_ids: List[int] = None):
        """Broadcast an event to specified or all connected drivers."""
        target_ids = driver_ids if driver_ids is not None else list(self.driver_connections.keys())
        for d_id in target_ids:
            await self.send_personal_message(d_id, message)

    async def broadcast_to_admins(self, message: Dict[str, Any]):
        """Broadcast live telemetry to admin monitors."""
        dead_sockets = set()
        for conn in self.admin_connections:
            try:
                await conn.send_text(json.dumps(message))
            except Exception as e:
                logger.warning(f"Failed to send to admin: {e}")
                dead_sockets.add(conn)
        self.admin_connections.difference_update(dead_sockets)

    async def broadcast_ride_event(self, event_type: str, ride_data: Dict[str, Any], passenger_id: int, driver_id: int = None):
        """Unified ride event broadcaster that alerts passenger, driver, and admins simultaneously."""
        payload = {
            "type": event_type,
            "ride": ride_data
        }
        # 1. Alert Passenger
        if passenger_id:
            await self.send_personal_message(passenger_id, payload)
        # 2. Alert Driver if assigned
        if driver_id:
            await self.send_personal_message(driver_id, payload)
        # 3. Alert Admins
        await self.broadcast_to_admins(payload)

manager = ConnectionManager()
