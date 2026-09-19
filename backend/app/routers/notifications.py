from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.auth.jwt import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("")
def get_user_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(15).all()

    # If user has no notifications yet, seed welcoming luxury notifications
    if not notifications:
        welcome_notifications = [
            Notification(
                user_id=current_user.id,
                title="Welcome to RYDO",
                message="Your luxury mobility account is active and verified. Enjoy seamless urban travel.",
                notification_type="SYSTEM",
                is_read=False,
                created_at=datetime.utcnow()
            ),
            Notification(
                user_id=current_user.id,
                title="RYDO AI Concierge Enabled",
                message="You can now consult RYDO AI for instant route planning, fair quotes, and vehicle choices.",
                notification_type="INFO",
                is_read=False,
                created_at=datetime.utcnow()
            ),
            Notification(
                user_id=current_user.id,
                title="Safety First: 4-Digit PIN",
                message="Always verify your 4-digit security PIN before starting any ride.",
                notification_type="RIDE",
                is_read=True,
                created_at=datetime.utcnow()
            )
        ]
        db.add_all(welcome_notifications)
        db.commit()
        notifications = welcome_notifications

    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "notification_type": n.notification_type,
            "is_read": n.is_read,
            "created_at": n.created_at
        }
        for n in notifications
    ]

@router.post("/read-all")
def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "success", "message": "All notifications marked as read"}
