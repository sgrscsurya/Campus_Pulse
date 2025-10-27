from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import qrcode
import io
import base64
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'campus-pulse-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Enums
class UserRole(str, Enum):
    STUDENT = "student"
    ORGANIZER = "organizer"
    ADMIN = "admin"

class EventCategory(str, Enum):
    TECHNICAL = "technical"
    CULTURAL = "cultural"
    SPORTS = "sports"
    WORKSHOP = "workshop"
    SEMINAR = "seminar"
    FEST = "fest"
    OTHER = "other"

class EventStatus(str, Enum):
    UPCOMING = "upcoming"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: UserRole
    password_hash: str
    avatar: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    interests: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: UserRole

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: UserRole
    avatar: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    interests: List[str] = []

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    interests: Optional[List[str]] = None

class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category: EventCategory
    start_date: str
    end_date: str
    venue: str
    capacity: int
    registered_count: int = 0
    cost: float = 0.0
    image_url: Optional[str] = None
    organizer_id: str
    organizer_name: str
    status: EventStatus = EventStatus.UPCOMING
    tags: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class EventCreate(BaseModel):
    title: str
    description: str
    category: EventCategory
    start_date: str
    end_date: str
    venue: str
    capacity: int
    cost: float = 0.0
    image_url: Optional[str] = None
    tags: List[str] = []

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[EventCategory] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    venue: Optional[str] = None
    capacity: Optional[int] = None
    cost: Optional[float] = None
    image_url: Optional[str] = None
    status: Optional[EventStatus] = None
    tags: Optional[List[str]] = None

class Registration(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    user_id: str
    user_name: str
    user_email: str
    qr_code: str
    registered_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    checked_in: bool = False
    checked_in_at: Optional[str] = None

class Feedback(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FeedbackCreate(BaseModel):
    event_id: str
    rating: int
    comment: str

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    message: str
    read: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    payload = decode_jwt_token(token)
    user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def generate_qr_code(data: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()

async def create_notification(user_id: str, title: str, message: str):
    notification = Notification(user_id=user_id, title=title, message=message)
    await db.notifications.insert_one(notification.model_dump())

# Auth Routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        password_hash=hash_password(user_data.password)
    )
    
    await db.users.insert_one(user.model_dump())
    token = create_jwt_token(user.id, user.email, user.role)
    
    return {
        "token": token,
        "user": UserProfile(**user.model_dump())
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user['id'], user['email'], user['role'])
    
    return {
        "token": token,
        "user": UserProfile(**user)
    }

@api_router.get("/auth/me", response_model=UserProfile)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserProfile(**current_user)

# User Routes
@api_router.put("/users/profile")
async def update_profile(profile_data: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({"id": current_user['id']}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": current_user['id']}, {"_id": 0})
    return UserProfile(**updated_user)

@api_router.get("/users/stats")
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    if current_user['role'] == 'student':
        registrations = await db.registrations.count_documents({"user_id": current_user['id']})
        attended = await db.registrations.count_documents({"user_id": current_user['id'], "checked_in": True})
        feedbacks = await db.feedbacks.count_documents({"user_id": current_user['id']})
        return {"registrations": registrations, "attended": attended, "feedbacks": feedbacks}
    elif current_user['role'] == 'organizer':
        events = await db.events.count_documents({"organizer_id": current_user['id']})
        total_registrations = 0
        user_events = await db.events.find({"organizer_id": current_user['id']}, {"_id": 0}).to_list(1000)
        for event in user_events:
            total_registrations += event.get('registered_count', 0)
        return {"events_created": events, "total_registrations": total_registrations}
    else:
        total_users = await db.users.count_documents({})
        total_events = await db.events.count_documents({})
        total_registrations = await db.registrations.count_documents({})
        return {"total_users": total_users, "total_events": total_events, "total_registrations": total_registrations}

# Event Routes
@api_router.post("/events", response_model=Event)
async def create_event(event_data: EventCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['organizer', 'admin']:
        raise HTTPException(status_code=403, detail="Only organizers and admins can create events")
    
    event = Event(
        **event_data.model_dump(),
        organizer_id=current_user['id'],
        organizer_name=current_user['name']
    )
    
    await db.events.insert_one(event.model_dump())
    return event

@api_router.get("/events", response_model=List[Event])
async def get_events(
    category: Optional[str] = None,
    search: Optional[str] = None,
    status: Optional[str] = None
):
    query = {}
    if category:
        query['category'] = category
    if status:
        query['status'] = status
    if search:
        query['$or'] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    events = await db.events.find(query, {"_id": 0}).sort("start_date", 1).to_list(1000)
    return events

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return Event(**event)

@api_router.put("/events/{event_id}", response_model=Event)
async def update_event(
    event_id: str,
    event_data: EventUpdate,
    current_user: dict = Depends(get_current_user)
):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if current_user['role'] != 'admin' and event['organizer_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in event_data.model_dump().items() if v is not None}
    if update_data:
        await db.events.update_one({"id": event_id}, {"$set": update_data})
    
    updated_event = await db.events.find_one({"id": event_id}, {"_id": 0})
    return Event(**updated_event)

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, current_user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if current_user['role'] != 'admin' and event['organizer_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.events.delete_one({"id": event_id})
    return {"message": "Event deleted successfully"}

@api_router.get("/events/organizer/my-events", response_model=List[Event])
async def get_my_events(current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['organizer', 'admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = {"organizer_id": current_user['id']} if current_user['role'] == 'organizer' else {}
    events = await db.events.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return events

# Registration Routes
@api_router.post("/registrations/{event_id}")
async def register_for_event(event_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'student':
        raise HTTPException(status_code=403, detail="Only students can register for events")
    
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if event['registered_count'] >= event['capacity']:
        raise HTTPException(status_code=400, detail="Event is full")
    
    existing_reg = await db.registrations.find_one({"event_id": event_id, "user_id": current_user['id']})
    if existing_reg:
        raise HTTPException(status_code=400, detail="Already registered")
    
    registration = Registration(
        event_id=event_id,
        user_id=current_user['id'],
        user_name=current_user['name'],
        user_email=current_user['email'],
        qr_code=generate_qr_code(f"{event_id}:{current_user['id']}")
    )
    
    await db.registrations.insert_one(registration.model_dump())
    await db.events.update_one({"id": event_id}, {"$inc": {"registered_count": 1}})
    
    await create_notification(
        current_user['id'],
        "Registration Successful",
        f"You have successfully registered for {event['title']}"
    )
    
    return registration

@api_router.get("/registrations/my-registrations", response_model=List[Registration])
async def get_my_registrations(current_user: dict = Depends(get_current_user)):
    registrations = await db.registrations.find({"user_id": current_user['id']}, {"_id": 0}).to_list(1000)
    return registrations

@api_router.get("/registrations/event/{event_id}", response_model=List[Registration])
async def get_event_registrations(event_id: str, current_user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if current_user['role'] != 'admin' and event['organizer_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    registrations = await db.registrations.find({"event_id": event_id}, {"_id": 0}).to_list(1000)
    return registrations

@api_router.post("/registrations/checkin/{registration_id}")
async def checkin_attendee(registration_id: str, current_user: dict = Depends(get_current_user)):
    registration = await db.registrations.find_one({"id": registration_id}, {"_id": 0})
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    event = await db.events.find_one({"id": registration['event_id']}, {"_id": 0})
    if current_user['role'] != 'admin' and event['organizer_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if registration['checked_in']:
        raise HTTPException(status_code=400, detail="Already checked in")
    
    await db.registrations.update_one(
        {"id": registration_id},
        {"$set": {"checked_in": True, "checked_in_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    await create_notification(
        registration['user_id'],
        "Check-in Successful",
        f"You have been checked in to {event['title']}"
    )
    
    return {"message": "Check-in successful"}

# Feedback Routes
@api_router.post("/feedbacks", response_model=Feedback)
async def create_feedback(feedback_data: FeedbackCreate, current_user: dict = Depends(get_current_user)):
    # Check if user attended the event
    registration = await db.registrations.find_one({
        "event_id": feedback_data.event_id,
        "user_id": current_user['id'],
        "checked_in": True
    })
    
    if not registration:
        raise HTTPException(status_code=403, detail="You must attend the event to provide feedback")
    
    existing_feedback = await db.feedbacks.find_one({
        "event_id": feedback_data.event_id,
        "user_id": current_user['id']
    })
    
    if existing_feedback:
        raise HTTPException(status_code=400, detail="Feedback already submitted")
    
    feedback = Feedback(
        **feedback_data.model_dump(),
        user_id=current_user['id'],
        user_name=current_user['name']
    )
    
    await db.feedbacks.insert_one(feedback.model_dump())
    return feedback

@api_router.get("/feedbacks/event/{event_id}", response_model=List[Feedback])
async def get_event_feedbacks(event_id: str):
    feedbacks = await db.feedbacks.find({"event_id": event_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return feedbacks

# Notifications Routes
@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find({"user_id": current_user['id']}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user['id']},
        {"$set": {"read": True}}
    )
    return {"message": "Notification marked as read"}

# Analytics Routes
@api_router.get("/analytics/event/{event_id}")
async def get_event_analytics(event_id: str, current_user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if current_user['role'] != 'admin' and event['organizer_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    total_registrations = await db.registrations.count_documents({"event_id": event_id})
    checked_in = await db.registrations.count_documents({"event_id": event_id, "checked_in": True})
    feedbacks = await db.feedbacks.find({"event_id": event_id}, {"_id": 0}).to_list(1000)
    
    avg_rating = sum([f['rating'] for f in feedbacks]) / len(feedbacks) if feedbacks else 0
    
    return {
        "total_registrations": total_registrations,
        "checked_in": checked_in,
        "attendance_rate": (checked_in / total_registrations * 100) if total_registrations > 0 else 0,
        "feedback_count": len(feedbacks),
        "average_rating": round(avg_rating, 2)
    }

@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics(current_user: dict = Depends(get_current_user)):
    if current_user['role'] == 'admin':
        total_users = await db.users.count_documents({})
        total_events = await db.events.count_documents({})
        total_registrations = await db.registrations.count_documents({})
        students = await db.users.count_documents({"role": "student"})
        organizers = await db.users.count_documents({"role": "organizer"})
        
        # Events by category
        events_by_category = {}
        for category in EventCategory:
            count = await db.events.count_documents({"category": category.value})
            events_by_category[category.value] = count
        
        return {
            "total_users": total_users,
            "total_events": total_events,
            "total_registrations": total_registrations,
            "students": students,
            "organizers": organizers,
            "events_by_category": events_by_category
        }
    else:
        raise HTTPException(status_code=403, detail="Admin access required")

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()