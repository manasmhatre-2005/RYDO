from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.models.ai import AIConversation, AIMessage
from app.auth.jwt import get_current_user
from app.services.fare_service import calculate_haversine_distance, calculate_fare, get_tier_rates

router = APIRouter(prefix="/ai", tags=["RYDO AI"])

class AIChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None

class AIMessageDTO(BaseModel):
    role: str
    content: str
    timestamp: datetime

class AIChatResponse(BaseModel):
    response: str
    conversation_id: int
    suggestions: List[str]

def generate_ai_mobility_response(query: str, user_role: str, user_name: str) -> tuple[str, List[str]]:
    q = query.lower()

    # 1. Airport or SFO Fare Inquiry
    if "airport" in q or "sfo" in q:
        dist = 21.4
        dur = 26.0
        fare_go = calculate_fare(dist, dur, "GO")
        fare_comfort = calculate_fare(dist, dur, "COMFORT")
        fare_xl = calculate_fare(dist, dur, "XL")
        return (
            f"Hello {user_name}! A standard trip to the Airport is approximately **{dist} km** (~{dur} mins).\n\n"
            f"• **RYDO Go**: ~₹{fare_go:.2f}\n"
            f"• **RYDO Comfort**: ~₹{fare_comfort:.2f}\n"
            f"• **RYDO XL** (SUV/Luggage): ~₹{fare_xl:.2f}\n\n"
            f"All rides feature guaranteed upfront pricing in INR (₹), flight tracking, and verified drivers.",
            [
                "Book ride to Airport",
                "What is the cancellation policy?",
                "How does the security PIN work?"
            ]
        )

    # 2. Vehicle Tiers Inquiry
    if "tier" in q or "vehicle" in q or "category" in q or "difference" in q or "comfort" in q or "xl" in q:
        return (
            f"**RYDO offers 4 distinct mobility tiers tailored for every journey:**\n\n"
            f"1. **RYDO Go**: Everyday affordability, compact sedans (seats 4).\n"
            f"2. **RYDO Comfort**: Newer spacious sedans (Tesla Model 3, Camry Hybrid) with top-rated 4.9+ ★ drivers.\n"
            f"3. **RYDO XL**: Full-size SUVs (Chevrolet Suburban) seating up to 6 passengers with spacious luggage capacity.\n"
            f"4. **RYDO Premium**: High-end luxury chauffeured experience in black executive vehicles.\n\n"
            f"Which tier would you like to inspect?",
            [
                "Estimate fare for RYDO Comfort",
                "Check SUV rates for 6 passengers",
                "What safety features are included?"
            ]
        )

    # 3. Safety & PIN Verification
    if "safety" in q or "pin" in q or "otp" in q or "emergency" in q or "sos" in q:
        return (
            f"At RYDO, passenger & driver safety is engineered into every trip:\n\n"
            f"• **4-Digit Security PIN**: Every ride generates a unique code that your driver must enter before the trip can begin.\n"
            f"• **24/7 Incident Desk**: Emergency dispatch & 911 calling available in 1 click.\n"
            f"• **Live Shareable Tracking**: Send live GPS trip status links to family or colleagues.\n"
            f"• **Rigorous Driver Vetting**: Comprehensive background and vehicle checks.",
            [
                "How do I share my live trip link?",
                "How do I contact 24/7 support?",
                "Where do I view driver credentials?"
            ]
        )

    # 4. Driver Earnings & Commission
    if "driver" in q or "earnings" in q or "payout" in q or "commission" in q:
        return (
            f"**RYDO Driver Partner Program:**\n\n"
            f"• **80% Driver Payout**: Drivers keep 80% of the total metered trip fare.\n"
            f"• **20% Platform Commission**: Powers real-time dispatch, navigation, and passenger acquisition.\n"
            f"• **Weekly Direct Deposit**: Instant payout settlements recorded directly into your financial ledger.\n"
            f"• **Flexible Schedule**: Go online or offline at any time via the Driver Portal.",
            [
                "How do I register as a driver?",
                "What vehicle models qualify?",
                "Where can I view my lifetime earnings?"
            ]
        )

    # 5. Generic Welcome / Help
    return (
        f"Greetings, {user_name}! I am your **RYDO AI Concierge**.\n\n"
        f"I can assist you with:\n"
        f"• Instant fare estimates across all 4 vehicle tiers\n"
        f"• Best routes and transit times between city hubs\n"
        f"• Platform safety guidelines and 4-digit PIN verification\n"
        f"• Driver earnings, commission split, and vehicle requirements\n\n"
        f"How may I elevate your travel experience today?",
        [
            "Estimate fare to SFO Airport",
            "Explain RYDO vehicle tiers",
            "How does passenger safety PIN work?",
            "How do driver payouts work?"
        ]
    )

@router.post("/chat", response_model=AIChatResponse)
def chat_with_ai(
    req: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find or create conversation
    conv = None
    if req.conversation_id:
        conv = db.query(AIConversation).filter(
            AIConversation.id == req.conversation_id,
            AIConversation.user_id == current_user.id
        ).first()

    if not conv:
        conv = AIConversation(
            user_id=current_user.id,
            title="RYDO Mobility Assistant"
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # Save user message
    user_msg = AIMessage(
        conversation_id=conv.id,
        role="user",
        content=req.message
    )
    db.add(user_msg)

    # Generate AI response
    ai_text, suggestions = generate_ai_mobility_response(
        query=req.message,
        user_role=current_user.role,
        user_name=current_user.full_name
    )

    # Save assistant message
    ai_msg = AIMessage(
        conversation_id=conv.id,
        role="assistant",
        content=ai_text
    )
    db.add(ai_msg)
    db.commit()

    return AIChatResponse(
        response=ai_text,
        conversation_id=conv.id,
        suggestions=suggestions
    )

@router.get("/history")
def get_ai_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(AIConversation).filter(AIConversation.user_id == current_user.id).order_by(AIConversation.updated_at.desc()).first()
    if not conv:
        return {"conversation_id": None, "messages": []}

    msgs = db.query(AIMessage).filter(AIMessage.conversation_id == conv.id).order_by(AIMessage.created_at.asc()).all()
    return {
        "conversation_id": conv.id,
        "messages": [
            {"role": m.role, "content": m.content, "created_at": m.created_at}
            for m in msgs
        ]
    }
