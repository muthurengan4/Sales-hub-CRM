from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
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
import bcrypt
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'fallback-secret-key')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# LLM Config
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============= MODELS =============

# Auth Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "sales_rep"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str

class AuthResponse(BaseModel):
    token: str
    user: UserResponse

# Lead Models
class LeadCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None
    linkedin: Optional[str] = None
    company_size: Optional[str] = None
    industry: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None
    linkedin: Optional[str] = None
    company_size: Optional[str] = None
    industry: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class LeadResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None
    linkedin: Optional[str] = None
    company_size: Optional[str] = None
    industry: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    status: str
    ai_score: int
    ai_insights: Optional[str] = None
    created_at: str
    updated_at: str
    owner_id: str

# Deal Models
class DealCreate(BaseModel):
    title: str
    value: float
    lead_id: Optional[str] = None
    company: Optional[str] = None
    contact_name: Optional[str] = None
    stage: str = "lead"
    expected_close_date: Optional[str] = None
    notes: Optional[str] = None

class DealUpdate(BaseModel):
    title: Optional[str] = None
    value: Optional[float] = None
    stage: Optional[str] = None
    expected_close_date: Optional[str] = None
    notes: Optional[str] = None

class DealResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    value: float
    lead_id: Optional[str] = None
    company: Optional[str] = None
    contact_name: Optional[str] = None
    stage: str
    expected_close_date: Optional[str] = None
    notes: Optional[str] = None
    ai_health_score: int
    created_at: str
    updated_at: str
    owner_id: str

# Analytics Models
class AnalyticsResponse(BaseModel):
    total_leads: int
    total_deals: int
    total_pipeline_value: float
    won_deals_value: float
    conversion_rate: float
    leads_by_status: dict
    deals_by_stage: dict
    monthly_revenue: List[dict]

# AI Models
class AIScoreRequest(BaseModel):
    lead_id: str

class AIInsightResponse(BaseModel):
    score: int
    insights: str
    recommendations: List[str]

# ============= AUTH HELPERS =============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split(' ')[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({'id': payload['user_id']}, {'_id': 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============= AI HELPERS =============

async def calculate_ai_lead_score(lead: dict) -> dict:
    """Use Claude to calculate lead score and provide insights"""
    score = 50  # Base score
    insights = []
    
    # Calculate base score from available data
    if lead.get('email'):
        score += 10
        insights.append("Email provided - direct contact available")
    if lead.get('phone'):
        score += 10
        insights.append("Phone number available")
    if lead.get('company'):
        score += 10
        insights.append("Company identified")
    if lead.get('title'):
        score += 5
        if any(role in lead['title'].lower() for role in ['ceo', 'cto', 'vp', 'director', 'head', 'manager']):
            score += 10
            insights.append("Decision maker role detected")
    if lead.get('company_size'):
        if lead['company_size'] in ['51-200', '201-500', '500+']:
            score += 10
            insights.append("Mid to large company - higher deal potential")
    if lead.get('linkedin'):
        score += 5
        insights.append("LinkedIn profile available for research")
    
    # Cap score at 100
    score = min(score, 100)
    
    # Try to get AI insights if key is available
    ai_insights = ""
    if EMERGENT_LLM_KEY:
        try:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"lead-scoring-{lead.get('id', 'unknown')}",
                system_message="You are a sales intelligence AI. Provide brief, actionable insights about leads. Be concise."
            ).with_model("anthropic", "claude-sonnet-4-5-20250929")
            
            lead_info = f"""
            Lead: {lead.get('name', 'Unknown')}
            Company: {lead.get('company', 'Unknown')}
            Title: {lead.get('title', 'Unknown')}
            Industry: {lead.get('industry', 'Unknown')}
            Company Size: {lead.get('company_size', 'Unknown')}
            Source: {lead.get('source', 'Unknown')}
            """
            
            message = UserMessage(text=f"Based on this lead info, provide 2-3 brief actionable insights for a sales rep (max 100 words):\n{lead_info}")
            ai_insights = await chat.send_message(message)
        except Exception as e:
            logger.error(f"AI scoring error: {e}")
            ai_insights = " | ".join(insights) if insights else "No specific insights available"
    else:
        ai_insights = " | ".join(insights) if insights else "No specific insights available"
    
    return {"score": score, "insights": ai_insights}

async def calculate_deal_health(deal: dict) -> int:
    """Calculate deal health score based on various factors"""
    score = 70  # Base score
    
    # Stage progression scoring
    stage_scores = {
        'lead': 30,
        'qualified': 50,
        'demo': 60,
        'proposal': 75,
        'negotiation': 85,
        'closed_won': 100,
        'closed_lost': 0
    }
    score = stage_scores.get(deal.get('stage', 'lead'), 50)
    
    # Adjust based on deal value
    if deal.get('value', 0) > 50000:
        score = min(score + 5, 100)
    
    return score

# ============= AUTH ROUTES =============

@api_router.post("/auth/register", response_model=AuthResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({'email': user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        'id': user_id,
        'email': user_data.email,
        'password': hash_password(user_data.password),
        'name': user_data.name,
        'role': user_data.role,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.email)
    
    return AuthResponse(
        token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            role=user_data.role,
            created_at=user_doc['created_at']
        )
    )

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({'email': credentials.email}, {'_id': 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'], user['email'])
    
    return AuthResponse(
        token=token,
        user=UserResponse(
            id=user['id'],
            email=user['email'],
            name=user['name'],
            role=user['role'],
            created_at=user['created_at']
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user['id'],
        email=user['email'],
        name=user['name'],
        role=user['role'],
        created_at=user['created_at']
    )

# ============= LEAD ROUTES =============

@api_router.post("/leads", response_model=LeadResponse)
async def create_lead(lead_data: LeadCreate, user: dict = Depends(get_current_user)):
    lead_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    lead_doc = {
        'id': lead_id,
        **lead_data.model_dump(),
        'status': 'new',
        'ai_score': 50,
        'ai_insights': None,
        'created_at': now,
        'updated_at': now,
        'owner_id': user['id']
    }
    
    # Calculate AI score
    ai_result = await calculate_ai_lead_score(lead_doc)
    lead_doc['ai_score'] = ai_result['score']
    lead_doc['ai_insights'] = ai_result['insights']
    
    await db.leads.insert_one(lead_doc)
    
    # Remove _id before returning
    lead_doc.pop('_id', None)
    return LeadResponse(**lead_doc)

@api_router.get("/leads", response_model=List[LeadResponse])
async def get_leads(
    status: Optional[str] = None,
    search: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {'owner_id': user['id']}
    if status:
        query['status'] = status
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'company': {'$regex': search, '$options': 'i'}},
            {'email': {'$regex': search, '$options': 'i'}}
        ]
    
    leads = await db.leads.find(query, {'_id': 0}).sort('created_at', -1).to_list(1000)
    return [LeadResponse(**lead) for lead in leads]

@api_router.get("/leads/{lead_id}", response_model=LeadResponse)
async def get_lead(lead_id: str, user: dict = Depends(get_current_user)):
    lead = await db.leads.find_one({'id': lead_id, 'owner_id': user['id']}, {'_id': 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return LeadResponse(**lead)

@api_router.put("/leads/{lead_id}", response_model=LeadResponse)
async def update_lead(lead_id: str, lead_data: LeadUpdate, user: dict = Depends(get_current_user)):
    lead = await db.leads.find_one({'id': lead_id, 'owner_id': user['id']})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    update_data = {k: v for k, v in lead_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # Recalculate AI score if relevant fields changed
    if any(k in update_data for k in ['company', 'title', 'company_size', 'email', 'phone']):
        lead.update(update_data)
        ai_result = await calculate_ai_lead_score(lead)
        update_data['ai_score'] = ai_result['score']
        update_data['ai_insights'] = ai_result['insights']
    
    await db.leads.update_one({'id': lead_id}, {'$set': update_data})
    
    updated_lead = await db.leads.find_one({'id': lead_id}, {'_id': 0})
    return LeadResponse(**updated_lead)

@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, user: dict = Depends(get_current_user)):
    result = await db.leads.delete_one({'id': lead_id, 'owner_id': user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Lead deleted"}

@api_router.post("/leads/{lead_id}/refresh-score", response_model=AIInsightResponse)
async def refresh_lead_score(lead_id: str, user: dict = Depends(get_current_user)):
    lead = await db.leads.find_one({'id': lead_id, 'owner_id': user['id']}, {'_id': 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    ai_result = await calculate_ai_lead_score(lead)
    
    await db.leads.update_one(
        {'id': lead_id},
        {'$set': {
            'ai_score': ai_result['score'],
            'ai_insights': ai_result['insights'],
            'updated_at': datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return AIInsightResponse(
        score=ai_result['score'],
        insights=ai_result['insights'],
        recommendations=["Follow up within 24 hours", "Research company on LinkedIn", "Prepare personalized pitch"]
    )

# ============= DEAL ROUTES =============

@api_router.post("/deals", response_model=DealResponse)
async def create_deal(deal_data: DealCreate, user: dict = Depends(get_current_user)):
    deal_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    deal_doc = {
        'id': deal_id,
        **deal_data.model_dump(),
        'ai_health_score': 50,
        'created_at': now,
        'updated_at': now,
        'owner_id': user['id']
    }
    
    # Calculate health score
    deal_doc['ai_health_score'] = await calculate_deal_health(deal_doc)
    
    await db.deals.insert_one(deal_doc)
    deal_doc.pop('_id', None)
    
    return DealResponse(**deal_doc)

@api_router.get("/deals", response_model=List[DealResponse])
async def get_deals(
    stage: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {'owner_id': user['id']}
    if stage:
        query['stage'] = stage
    
    deals = await db.deals.find(query, {'_id': 0}).sort('created_at', -1).to_list(1000)
    return [DealResponse(**deal) for deal in deals]

@api_router.get("/deals/{deal_id}", response_model=DealResponse)
async def get_deal(deal_id: str, user: dict = Depends(get_current_user)):
    deal = await db.deals.find_one({'id': deal_id, 'owner_id': user['id']}, {'_id': 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return DealResponse(**deal)

@api_router.put("/deals/{deal_id}", response_model=DealResponse)
async def update_deal(deal_id: str, deal_data: DealUpdate, user: dict = Depends(get_current_user)):
    deal = await db.deals.find_one({'id': deal_id, 'owner_id': user['id']})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    update_data = {k: v for k, v in deal_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # Recalculate health score if stage changed
    if 'stage' in update_data:
        deal.update(update_data)
        update_data['ai_health_score'] = await calculate_deal_health(deal)
    
    await db.deals.update_one({'id': deal_id}, {'$set': update_data})
    
    updated_deal = await db.deals.find_one({'id': deal_id}, {'_id': 0})
    return DealResponse(**updated_deal)

@api_router.delete("/deals/{deal_id}")
async def delete_deal(deal_id: str, user: dict = Depends(get_current_user)):
    result = await db.deals.delete_one({'id': deal_id, 'owner_id': user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Deal not found")
    return {"message": "Deal deleted"}

# ============= ANALYTICS ROUTES =============

@api_router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(user: dict = Depends(get_current_user)):
    # Get leads stats
    leads = await db.leads.find({'owner_id': user['id']}, {'_id': 0}).to_list(10000)
    total_leads = len(leads)
    
    leads_by_status = {}
    for lead in leads:
        status = lead.get('status', 'new')
        leads_by_status[status] = leads_by_status.get(status, 0) + 1
    
    # Get deals stats
    deals = await db.deals.find({'owner_id': user['id']}, {'_id': 0}).to_list(10000)
    total_deals = len(deals)
    
    total_pipeline_value = sum(d.get('value', 0) for d in deals if d.get('stage') not in ['closed_won', 'closed_lost'])
    won_deals_value = sum(d.get('value', 0) for d in deals if d.get('stage') == 'closed_won')
    
    deals_by_stage = {}
    for deal in deals:
        stage = deal.get('stage', 'lead')
        deals_by_stage[stage] = deals_by_stage.get(stage, 0) + 1
    
    # Calculate conversion rate
    won_count = deals_by_stage.get('closed_won', 0)
    total_closed = won_count + deals_by_stage.get('closed_lost', 0)
    conversion_rate = (won_count / total_closed * 100) if total_closed > 0 else 0
    
    # Monthly revenue (mock data for now based on won deals)
    monthly_revenue = [
        {"month": "Jan", "revenue": won_deals_value * 0.1},
        {"month": "Feb", "revenue": won_deals_value * 0.15},
        {"month": "Mar", "revenue": won_deals_value * 0.12},
        {"month": "Apr", "revenue": won_deals_value * 0.18},
        {"month": "May", "revenue": won_deals_value * 0.2},
        {"month": "Jun", "revenue": won_deals_value * 0.25}
    ]
    
    return AnalyticsResponse(
        total_leads=total_leads,
        total_deals=total_deals,
        total_pipeline_value=total_pipeline_value,
        won_deals_value=won_deals_value,
        conversion_rate=round(conversion_rate, 1),
        leads_by_status=leads_by_status,
        deals_by_stage=deals_by_stage,
        monthly_revenue=monthly_revenue
    )

# ============= ROOT ROUTE =============

@api_router.get("/")
async def root():
    return {"message": "HubSpot CRM API", "version": "1.0.0"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
