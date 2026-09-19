from app.routers.auth import router as auth_router
from app.routers.rides import router as rides_router
from app.routers.drivers import router as drivers_router
from app.routers.admin import router as admin_router
from app.routers.ws import router as ws_router
from app.routers.ai import router as ai_router
from app.routers.notifications import router as notifications_router

__all__ = [
    "auth_router",
    "rides_router",
    "drivers_router",
    "admin_router",
    "ws_router",
    "ai_router",
    "notifications_router",
]
