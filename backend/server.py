from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from enum import Enum
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'hubspot-crm-secret-key-2024-very-secure')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

app = FastAPI(title="SalesHub Platform", version="2.0.0")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============= ENUMS =============

class RoleType(str, Enum):
    SUPER_ADMIN = "super_admin"
    ORG_ADMIN = "org_admin"
    MANAGER = "manager"
    SALES_REP = "sales_rep"
    VIEWER = "viewer"

class Permission(str, Enum):
    # Organization
    MANAGE_ORGANIZATION = "manage_organization"
    VIEW_ORGANIZATION = "view_organization"
    # Users
    MANAGE_USERS = "manage_users"
    VIEW_USERS = "view_users"
    INVITE_USERS = "invite_users"
    # Leads
    MANAGE_ALL_LEADS = "manage_all_leads"
    MANAGE_OWN_LEADS = "manage_own_leads"
    VIEW_ALL_LEADS = "view_all_leads"
    VIEW_OWN_LEADS = "view_own_leads"
    # Deals
    MANAGE_ALL_DEALS = "manage_all_deals"
    MANAGE_OWN_DEALS = "manage_own_deals"
    VIEW_ALL_DEALS = "view_all_deals"
    VIEW_OWN_DEALS = "view_own_deals"
    # Contacts
    MANAGE_CONTACTS = "manage_contacts"
    VIEW_CONTACTS = "view_contacts"
    # Analytics
    VIEW_ANALYTICS = "view_analytics"
    VIEW_TEAM_ANALYTICS = "view_team_analytics"
    # Settings
    MANAGE_SETTINGS = "manage_settings"

# Role permissions mapping
ROLE_PERMISSIONS = {
    RoleType.SUPER_ADMIN: list(Permission),
    RoleType.ORG_ADMIN: [
        Permission.VIEW_ORGANIZATION, Permission.MANAGE_USERS, Permission.VIEW_USERS,
        Permission.INVITE_USERS, Permission.MANAGE_ALL_LEADS, Permission.VIEW_ALL_LEADS,
        Permission.MANAGE_ALL_DEALS, Permission.VIEW_ALL_DEALS, Permission.MANAGE_CONTACTS,
        Permission.VIEW_CONTACTS, Permission.VIEW_ANALYTICS, Permission.VIEW_TEAM_ANALYTICS,
        Permission.MANAGE_SETTINGS
    ],
    RoleType.MANAGER: [
        Permission.VIEW_ORGANIZATION, Permission.VIEW_USERS, Permission.INVITE_USERS,
        Permission.MANAGE_ALL_LEADS, Permission.VIEW_ALL_LEADS, Permission.MANAGE_ALL_DEALS,
        Permission.VIEW_ALL_DEALS, Permission.MANAGE_CONTACTS, Permission.VIEW_CONTACTS,
        Permission.VIEW_ANALYTICS, Permission.VIEW_TEAM_ANALYTICS
    ],
    RoleType.SALES_REP: [
        Permission.VIEW_ORGANIZATION, Permission.MANAGE_OWN_LEADS, Permission.VIEW_OWN_LEADS,
        Permission.MANAGE_OWN_DEALS, Permission.VIEW_OWN_DEALS, Permission.MANAGE_CONTACTS,
        Permission.VIEW_CONTACTS, Permission.VIEW_ANALYTICS
    ],
    RoleType.VIEWER: [
        Permission.VIEW_ORGANIZATION, Permission.VIEW_OWN_LEADS, Permission.VIEW_OWN_DEALS,
        Permission.VIEW_CONTACTS, Permission.VIEW_ANALYTICS
    ]
}

# ============= MODELS =============

# Organization Models
class OrganizationCreate(BaseModel):
    name: str
    domain: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None

class OrganizationResponse(BaseModel):
    id: str
    name: str
    domain: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    settings: Dict[str, Any] = {}
    created_at: str
    owner_id: str
    member_count: int = 0

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: RoleType = RoleType.SALES_REP

class UserInvite(BaseModel):
    email: EmailStr
    name: str
    role: RoleType = RoleType.SALES_REP

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[RoleType] = None
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: RoleType
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None
    permissions: List[str] = []
    is_active: bool = True
    created_at: str
    last_login: Optional[str] = None

class AuthResponse(BaseModel):
    token: str
    user: UserResponse

# Contact Models (HubSpot-style)
class ContactCreate(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    linkedin: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postcode: Optional[str] = None
    country: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    custom_fields: Dict[str, Any] = {}
    is_public: Optional[bool] = False

class ContactUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    linkedin: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    custom_fields: Optional[Dict[str, Any]] = None

class ContactResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    first_name: str
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    linkedin: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postcode: Optional[str] = None
    country: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    custom_fields: Dict[str, Any] = {}
    is_public: Optional[bool] = False
    organization_id: Optional[str] = None
    owner_id: str
    owner_name: Optional[str] = None
    created_at: str
    updated_at: str

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
    contact_id: Optional[str] = None
    address: Optional[str] = None
    postcode: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    is_public: Optional[bool] = False

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
    assigned_to: Optional[str] = None
    address: Optional[str] = None
    postcode: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    is_public: Optional[bool] = None

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
    contact_id: Optional[str] = None
    address: Optional[str] = None
    postcode: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    is_public: Optional[bool] = False
    organization_id: Optional[str] = None
    owner_id: str
    owner_name: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    created_at: str
    updated_at: str

# Deal Models
class DealCreate(BaseModel):
    title: str
    value: float
    lead_id: Optional[str] = None
    contact_id: Optional[str] = None
    company: Optional[str] = None
    contact_name: Optional[str] = None
    stage: str = "lead"
    expected_close_date: Optional[str] = None
    notes: Optional[str] = None
    probability: Optional[int] = None

class DealUpdate(BaseModel):
    title: Optional[str] = None
    value: Optional[float] = None
    stage: Optional[str] = None
    expected_close_date: Optional[str] = None
    notes: Optional[str] = None
    probability: Optional[int] = None
    assigned_to: Optional[str] = None

class DealResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    value: float
    lead_id: Optional[str] = None
    contact_id: Optional[str] = None
    company: Optional[str] = None
    contact_name: Optional[str] = None
    stage: str
    expected_close_date: Optional[str] = None
    notes: Optional[str] = None
    probability: Optional[int] = None
    ai_health_score: int
    organization_id: Optional[str] = None  # Optional for legacy deals
    owner_id: str
    owner_name: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    created_at: str
    updated_at: str

# Activity Models
class ActivityCreate(BaseModel):
    type: str  # call, email, meeting, note, task
    subject: str
    description: Optional[str] = None
    contact_id: Optional[str] = None
    lead_id: Optional[str] = None
    deal_id: Optional[str] = None
    scheduled_at: Optional[str] = None
    completed: bool = False

class ActivityResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    type: str
    subject: str
    description: Optional[str] = None
    contact_id: Optional[str] = None
    lead_id: Optional[str] = None
    deal_id: Optional[str] = None
    scheduled_at: Optional[str] = None
    completed: bool
    organization_id: Optional[str] = None  # Optional for legacy activities
    owner_id: str
    owner_name: Optional[str] = None
    created_at: str

# Analytics Models
class AnalyticsResponse(BaseModel):
    total_leads: int
    total_deals: int
    total_contacts: int
    total_pipeline_value: float
    won_deals_value: float
    conversion_rate: float
    leads_by_status: Dict[str, int]
    leads_by_source: Dict[str, int] = {}
    deals_by_stage: Dict[str, int]
    monthly_revenue: List[Dict[str, Any]]
    team_performance: List[Dict[str, Any]] = []
    recent_activities: List[Dict[str, Any]] = []
    organization_stats: Dict[str, Any] = {}

# ============= AUTH HELPERS =============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, org_id: str = None) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'organization_id': org_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    token = authorization.split(' ')[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({'id': payload['user_id']}, {'_id': 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Add permissions based on role
        user['permissions'] = [p.value for p in ROLE_PERMISSIONS.get(RoleType(user['role']), [])]
        
        # Get organization name
        if user.get('organization_id'):
            org = await db.organizations.find_one({'id': user['organization_id']}, {'_id': 0, 'name': 1})
            user['organization_name'] = org['name'] if org else None
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def check_permission(user: dict, permission: Permission):
    if permission.value not in user.get('permissions', []):
        raise HTTPException(status_code=403, detail=f"Permission denied: {permission.value}")

def get_data_filter(user: dict, permission_all: Permission, permission_own: Permission):
    """Get MongoDB filter based on user permissions"""
    base_filter = {'organization_id': user.get('organization_id')}
    
    if permission_all.value in user.get('permissions', []):
        return base_filter
    elif permission_own.value in user.get('permissions', []):
        return {**base_filter, 'owner_id': user['id']}
    else:
        raise HTTPException(status_code=403, detail="Permission denied")

# ============= AI HELPERS =============

async def calculate_lead_score(lead: dict) -> dict:
    score = 50
    insights = []
    
    if lead.get('email'):
        score += 10
        insights.append("Email provided")
    if lead.get('phone'):
        score += 10
        insights.append("Phone available")
    if lead.get('company'):
        score += 10
        insights.append("Company identified")
    if lead.get('title'):
        score += 5
        if any(role in lead['title'].lower() for role in ['ceo', 'cto', 'vp', 'director', 'head', 'manager']):
            score += 10
            insights.append("Decision maker")
    if lead.get('company_size') in ['51-200', '201-500', '500+']:
        score += 10
        insights.append("Mid-large company")
    
    return {"score": min(score, 100), "insights": " | ".join(insights) or "No specific insights"}

async def calculate_deal_health(deal: dict) -> int:
    stage_scores = {
        'lead': 30, 'qualified': 50, 'demo': 60, 'proposal': 75,
        'negotiation': 85, 'closed_won': 100, 'closed_lost': 0
    }
    return stage_scores.get(deal.get('stage', 'lead'), 50)

# ============= ORGANIZATION ROUTES =============

@api_router.post("/organizations", response_model=OrganizationResponse)
async def create_organization(org_data: OrganizationCreate, user: dict = Depends(get_current_user)):
    """Create a new organization (Super Admin only or first org for user)"""
    
    # Allow if super admin or user has no org
    if user.get('organization_id') and user['role'] != RoleType.SUPER_ADMIN.value:
        raise HTTPException(status_code=403, detail="You already belong to an organization")
    
    org_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    org_doc = {
        'id': org_id,
        'name': org_data.name,
        'domain': org_data.domain,
        'industry': org_data.industry,
        'size': org_data.size,
        'settings': {},
        'created_at': now,
        'owner_id': user['id']
    }
    
    await db.organizations.insert_one(org_doc)
    
    # Update user to be org admin of this org
    await db.users.update_one(
        {'id': user['id']},
        {'$set': {'organization_id': org_id, 'role': RoleType.ORG_ADMIN.value}}
    )
    
    org_doc.pop('_id', None)
    org_doc['member_count'] = 1
    return OrganizationResponse(**org_doc)

@api_router.get("/organizations", response_model=List[OrganizationResponse])
async def get_organizations(user: dict = Depends(get_current_user)):
    """Get organizations (Super Admin sees all, others see their own)"""
    
    if user['role'] == RoleType.SUPER_ADMIN.value:
        orgs = await db.organizations.find({}, {'_id': 0}).to_list(1000)
    else:
        if not user.get('organization_id'):
            return []
        orgs = await db.organizations.find({'id': user['organization_id']}, {'_id': 0}).to_list(1)
    
    # Add member counts
    for org in orgs:
        count = await db.users.count_documents({'organization_id': org['id']})
        org['member_count'] = count
    
    return [OrganizationResponse(**org) for org in orgs]

@api_router.get("/organizations/{org_id}", response_model=OrganizationResponse)
async def get_organization(org_id: str, user: dict = Depends(get_current_user)):
    if user['role'] != RoleType.SUPER_ADMIN.value and user.get('organization_id') != org_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    org = await db.organizations.find_one({'id': org_id}, {'_id': 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    org['member_count'] = await db.users.count_documents({'organization_id': org_id})
    return OrganizationResponse(**org)

@api_router.put("/organizations/{org_id}", response_model=OrganizationResponse)
async def update_organization(org_id: str, org_data: OrganizationUpdate, user: dict = Depends(get_current_user)):
    check_permission(user, Permission.MANAGE_SETTINGS)
    
    if user['role'] != RoleType.SUPER_ADMIN.value and user.get('organization_id') != org_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {k: v for k, v in org_data.model_dump().items() if v is not None}
    if update_data:
        await db.organizations.update_one({'id': org_id}, {'$set': update_data})
    
    org = await db.organizations.find_one({'id': org_id}, {'_id': 0})
    org['member_count'] = await db.users.count_documents({'organization_id': org_id})
    return OrganizationResponse(**org)

# ============= USER MANAGEMENT ROUTES =============

@api_router.post("/auth/register", response_model=AuthResponse)
async def register(user_data: UserCreate):
    """Register a new user (creates new org or joins existing)"""
    
    existing = await db.users.find_one({'email': user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Check if this is the first user (make them super admin)
    user_count = await db.users.count_documents({})
    role = RoleType.SUPER_ADMIN if user_count == 0 else user_data.role
    
    user_doc = {
        'id': user_id,
        'email': user_data.email,
        'password': hash_password(user_data.password),
        'name': user_data.name,
        'role': role.value,
        'organization_id': None,
        'is_active': True,
        'created_at': now,
        'last_login': now
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.email, None)
    permissions = [p.value for p in ROLE_PERMISSIONS.get(role, [])]
    
    return AuthResponse(
        token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            role=role,
            organization_id=None,
            organization_name=None,
            permissions=permissions,
            is_active=True,
            created_at=now,
            last_login=now
        )
    )

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({'email': credentials.email}, {'_id': 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get('is_active', True):
        raise HTTPException(status_code=403, detail="Account is deactivated")
    
    # Update last login
    await db.users.update_one(
        {'id': user['id']},
        {'$set': {'last_login': datetime.now(timezone.utc).isoformat()}}
    )
    
    token = create_token(user['id'], user['email'], user.get('organization_id'))
    permissions = [p.value for p in ROLE_PERMISSIONS.get(RoleType(user['role']), [])]
    
    org_name = None
    if user.get('organization_id'):
        org = await db.organizations.find_one({'id': user['organization_id']}, {'_id': 0, 'name': 1})
        org_name = org['name'] if org else None
    
    return AuthResponse(
        token=token,
        user=UserResponse(
            id=user['id'],
            email=user['email'],
            name=user['name'],
            role=RoleType(user['role']),
            organization_id=user.get('organization_id'),
            organization_name=org_name,
            permissions=permissions,
            is_active=user.get('is_active', True),
            created_at=user['created_at'],
            last_login=user.get('last_login')
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user['id'],
        email=user['email'],
        name=user['name'],
        role=RoleType(user['role']),
        organization_id=user.get('organization_id'),
        organization_name=user.get('organization_name'),
        permissions=user.get('permissions', []),
        is_active=user.get('is_active', True),
        created_at=user['created_at'],
        last_login=user.get('last_login')
    )

@api_router.post("/users/invite", response_model=UserResponse)
async def invite_user(invite_data: UserInvite, user: dict = Depends(get_current_user)):
    """Invite a user to the organization"""
    check_permission(user, Permission.INVITE_USERS)
    
    if not user.get('organization_id'):
        raise HTTPException(status_code=400, detail="You must belong to an organization")
    
    existing = await db.users.find_one({'email': invite_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    temp_password = str(uuid.uuid4())[:8]  # Temporary password
    
    user_doc = {
        'id': user_id,
        'email': invite_data.email,
        'password': hash_password(temp_password),
        'name': invite_data.name,
        'role': invite_data.role.value,
        'organization_id': user['organization_id'],
        'is_active': True,
        'created_at': now,
        'invited_by': user['id']
    }
    
    await db.users.insert_one(user_doc)
    
    permissions = [p.value for p in ROLE_PERMISSIONS.get(invite_data.role, [])]
    
    return UserResponse(
        id=user_id,
        email=invite_data.email,
        name=invite_data.name,
        role=invite_data.role,
        organization_id=user['organization_id'],
        organization_name=user.get('organization_name'),
        permissions=permissions,
        is_active=True,
        created_at=now
    )

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(user: dict = Depends(get_current_user)):
    """Get users in the organization"""
    check_permission(user, Permission.VIEW_USERS)
    
    query = {}
    if user['role'] != RoleType.SUPER_ADMIN.value:
        if not user.get('organization_id'):
            return []
        query['organization_id'] = user['organization_id']
    
    users = await db.users.find(query, {'_id': 0, 'password': 0}).to_list(1000)
    
    result = []
    for u in users:
        org_name = None
        if u.get('organization_id'):
            org = await db.organizations.find_one({'id': u['organization_id']}, {'_id': 0, 'name': 1})
            org_name = org['name'] if org else None
        
        permissions = [p.value for p in ROLE_PERMISSIONS.get(RoleType(u['role']), [])]
        result.append(UserResponse(
            id=u['id'],
            email=u['email'],
            name=u['name'],
            role=RoleType(u['role']),
            organization_id=u.get('organization_id'),
            organization_name=org_name,
            permissions=permissions,
            is_active=u.get('is_active', True),
            created_at=u['created_at'],
            last_login=u.get('last_login')
        ))
    
    return result

@api_router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_data: UserUpdate, user: dict = Depends(get_current_user)):
    """Update user (role, status)"""
    check_permission(user, Permission.MANAGE_USERS)
    
    target_user = await db.users.find_one({'id': user_id}, {'_id': 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Can only manage users in same org (unless super admin)
    if user['role'] != RoleType.SUPER_ADMIN.value:
        if target_user.get('organization_id') != user.get('organization_id'):
            raise HTTPException(status_code=403, detail="Cannot manage users outside your organization")
    
    update_data = {k: v.value if isinstance(v, RoleType) else v for k, v in user_data.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({'id': user_id}, {'$set': update_data})
    
    updated_user = await db.users.find_one({'id': user_id}, {'_id': 0, 'password': 0})
    permissions = [p.value for p in ROLE_PERMISSIONS.get(RoleType(updated_user['role']), [])]
    
    return UserResponse(
        id=updated_user['id'],
        email=updated_user['email'],
        name=updated_user['name'],
        role=RoleType(updated_user['role']),
        organization_id=updated_user.get('organization_id'),
        permissions=permissions,
        is_active=updated_user.get('is_active', True),
        created_at=updated_user['created_at'],
        last_login=updated_user.get('last_login')
    )

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, user: dict = Depends(get_current_user)):
    check_permission(user, Permission.MANAGE_USERS)
    
    if user_id == user['id']:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    target_user = await db.users.find_one({'id': user_id}, {'_id': 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user['role'] != RoleType.SUPER_ADMIN.value:
        if target_user.get('organization_id') != user.get('organization_id'):
            raise HTTPException(status_code=403, detail="Cannot delete users outside your organization")
    
    await db.users.delete_one({'id': user_id})
    return {"message": "User deleted"}

# ============= CONTACT ROUTES =============

@api_router.post("/contacts", response_model=ContactResponse)
async def create_contact(contact_data: ContactCreate, user: dict = Depends(get_current_user)):
    check_permission(user, Permission.MANAGE_CONTACTS)
    
    if not user.get('organization_id'):
        raise HTTPException(status_code=400, detail="You must belong to an organization")
    
    contact_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    contact_doc = {
        'id': contact_id,
        **contact_data.model_dump(),
        'organization_id': user['organization_id'],
        'owner_id': user['id'],
        'created_at': now,
        'updated_at': now
    }
    
    await db.contacts.insert_one(contact_doc)
    contact_doc.pop('_id', None)
    contact_doc['owner_name'] = user['name']
    
    return ContactResponse(**contact_doc)

@api_router.get("/contacts", response_model=List[ContactResponse])
async def get_contacts(search: Optional[str] = None, user: dict = Depends(get_current_user)):
    check_permission(user, Permission.VIEW_CONTACTS)
    
    if not user.get('organization_id'):
        return []
    
    query = {'organization_id': user['organization_id']}
    if search:
        query['$or'] = [
            {'first_name': {'$regex': search, '$options': 'i'}},
            {'last_name': {'$regex': search, '$options': 'i'}},
            {'email': {'$regex': search, '$options': 'i'}},
            {'company': {'$regex': search, '$options': 'i'}}
        ]
    
    contacts = await db.contacts.find(query, {'_id': 0}).sort('created_at', -1).to_list(1000)
    
    # Add owner names
    for contact in contacts:
        owner = await db.users.find_one({'id': contact['owner_id']}, {'_id': 0, 'name': 1})
        contact['owner_name'] = owner['name'] if owner else None
    
    return [ContactResponse(**c) for c in contacts]

@api_router.get("/contacts/{contact_id}", response_model=ContactResponse)
async def get_contact(contact_id: str, user: dict = Depends(get_current_user)):
    check_permission(user, Permission.VIEW_CONTACTS)
    
    contact = await db.contacts.find_one(
        {'id': contact_id, 'organization_id': user.get('organization_id')},
        {'_id': 0}
    )
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    owner = await db.users.find_one({'id': contact['owner_id']}, {'_id': 0, 'name': 1})
    contact['owner_name'] = owner['name'] if owner else None
    
    return ContactResponse(**contact)

@api_router.put("/contacts/{contact_id}", response_model=ContactResponse)
async def update_contact(contact_id: str, contact_data: ContactUpdate, user: dict = Depends(get_current_user)):
    check_permission(user, Permission.MANAGE_CONTACTS)
    
    contact = await db.contacts.find_one({'id': contact_id, 'organization_id': user.get('organization_id')})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    update_data = {k: v for k, v in contact_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.contacts.update_one({'id': contact_id}, {'$set': update_data})
    
    updated = await db.contacts.find_one({'id': contact_id}, {'_id': 0})
    owner = await db.users.find_one({'id': updated['owner_id']}, {'_id': 0, 'name': 1})
    updated['owner_name'] = owner['name'] if owner else None
    
    return ContactResponse(**updated)

@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str, user: dict = Depends(get_current_user)):
    check_permission(user, Permission.MANAGE_CONTACTS)
    
    result = await db.contacts.delete_one({'id': contact_id, 'organization_id': user.get('organization_id')})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    return {"message": "Contact deleted"}

@api_router.post("/contacts/import")
async def import_contacts(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Import contacts from Excel file"""
    check_permission(user, Permission.MANAGE_CONTACTS)
    
    if not user.get('organization_id'):
        raise HTTPException(status_code=400, detail="You must belong to an organization")
    
    try:
        import pandas as pd
        
        contents = await file.read()
        
        # Determine file type and read accordingly
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            # Try to auto-detect header row by looking for 'Clinic Name' or 'Name'
            df_raw = pd.read_excel(io.BytesIO(contents), header=None)
            header_row = 0
            for i in range(min(5, len(df_raw))):
                row_values = [str(v).lower() if pd.notna(v) else '' for v in df_raw.iloc[i]]
                if any('clinic name' in v or v == 'name' for v in row_values):
                    header_row = i
                    break
            df = pd.read_excel(io.BytesIO(contents), header=header_row)
        
        logging.info(f"Excel columns found: {list(df.columns)}")
        
        # Column mapping from Excel to our schema
        column_mapping = {
            'Clinic Name': 'first_name',
            'clinic name': 'first_name',
            'Name': 'first_name',
            'name': 'first_name',
            'First Name': 'first_name',
            'first_name': 'first_name',
            'Last Name': 'last_name',
            'last_name': 'last_name',
            'Address': 'address',
            'address': 'address',
            'Postcode': 'postcode',
            'postcode': 'postcode',
            'City': 'city',
            'city': 'city',
            'State': 'state',
            'state': 'state',
            'Contact Number': 'phone',
            'contact number': 'phone',
            'Phone': 'phone',
            'phone': 'phone',
            'Email': 'email',
            'email': 'email',
            'Is public': 'is_public',
            'is public': 'is_public',
            'Company': 'company',
            'company': 'company',
            'Job Title': 'job_title',
            'job_title': 'job_title',
        }
        
        # Rename columns
        df = df.rename(columns={k: v for k, v in column_mapping.items() if k in df.columns})
        logging.info(f"Columns after mapping: {list(df.columns)}")
        
        now = datetime.now(timezone.utc).isoformat()
        imported_count = 0
        
        for _, row in df.iterrows():
            contact_data = {
                'id': str(uuid.uuid4()),
                'first_name': str(row.get('first_name', '')).strip() if pd.notna(row.get('first_name')) else '',
                'last_name': str(row.get('last_name', '')).strip() if pd.notna(row.get('last_name')) else '',
                'email': str(row.get('email', '')).strip() if pd.notna(row.get('email')) else '',
                'phone': str(row.get('phone', '')).strip() if pd.notna(row.get('phone')) else '',
                'company': str(row.get('company', '')).strip() if pd.notna(row.get('company')) else '',
                'job_title': str(row.get('job_title', '')).strip() if pd.notna(row.get('job_title')) else '',
                'address': str(row.get('address', '')).strip() if pd.notna(row.get('address')) else '',
                'postcode': str(row.get('postcode', '')).strip() if pd.notna(row.get('postcode')) else '',
                'city': str(row.get('city', '')).strip() if pd.notna(row.get('city')) else '',
                'state': str(row.get('state', '')).strip() if pd.notna(row.get('state')) else '',
                'country': 'Malaysia',
                'is_public': str(row.get('is_public', '')).lower() in ['yes', 'true', '1'] if pd.notna(row.get('is_public')) else False,
                'linkedin': '',
                'notes': f"Imported from {file.filename}",
                'tags': [],
                'custom_fields': {},
                'organization_id': user['organization_id'],
                'owner_id': user['id'],
                'owner_name': user['name'],
                'created_at': now,
                'updated_at': now
            }
            
            # Skip rows without a name
            if not contact_data['first_name']:
                continue
            
            await db.contacts.insert_one(contact_data)
            imported_count += 1
        
        return {"imported": imported_count, "message": f"Successfully imported {imported_count} contacts"}
    
    except Exception as e:
        logging.error(f"Import error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to import file: {str(e)}")

# ============= LEAD ROUTES =============

@api_router.post("/leads", response_model=LeadResponse)
async def create_lead(lead_data: LeadCreate, user: dict = Depends(get_current_user)):
    if Permission.MANAGE_ALL_LEADS.value not in user['permissions'] and Permission.MANAGE_OWN_LEADS.value not in user['permissions']:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    if not user.get('organization_id'):
        raise HTTPException(status_code=400, detail="You must belong to an organization")
    
    lead_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    lead_doc = {
        'id': lead_id,
        **lead_data.model_dump(),
        'status': 'new',
        'ai_score': 50,
        'ai_insights': None,
        'organization_id': user['organization_id'],
        'owner_id': user['id'],
        'assigned_to': user['id'],
        'created_at': now,
        'updated_at': now
    }
    
    # Calculate AI score
    ai_result = await calculate_lead_score(lead_doc)
    lead_doc['ai_score'] = ai_result['score']
    lead_doc['ai_insights'] = ai_result['insights']
    
    await db.leads.insert_one(lead_doc)
    lead_doc.pop('_id', None)
    lead_doc['owner_name'] = user['name']
    lead_doc['assigned_to_name'] = user['name']
    
    return LeadResponse(**lead_doc)

@api_router.get("/leads", response_model=List[LeadResponse])
async def get_leads(status: Optional[str] = None, search: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = get_data_filter(user, Permission.VIEW_ALL_LEADS, Permission.VIEW_OWN_LEADS)
    
    if status:
        query['status'] = status
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'company': {'$regex': search, '$options': 'i'}},
            {'email': {'$regex': search, '$options': 'i'}}
        ]
    
    leads = await db.leads.find(query, {'_id': 0}).sort('created_at', -1).to_list(1000)
    
    # Add owner and assigned names
    for lead in leads:
        owner = await db.users.find_one({'id': lead['owner_id']}, {'_id': 0, 'name': 1})
        lead['owner_name'] = owner['name'] if owner else None
        if lead.get('assigned_to'):
            assigned = await db.users.find_one({'id': lead['assigned_to']}, {'_id': 0, 'name': 1})
            lead['assigned_to_name'] = assigned['name'] if assigned else None
    
    return [LeadResponse(**lead) for lead in leads]

@api_router.get("/leads/{lead_id}", response_model=LeadResponse)
async def get_lead(lead_id: str, user: dict = Depends(get_current_user)):
    query = get_data_filter(user, Permission.VIEW_ALL_LEADS, Permission.VIEW_OWN_LEADS)
    query['id'] = lead_id
    
    lead = await db.leads.find_one(query, {'_id': 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    owner = await db.users.find_one({'id': lead['owner_id']}, {'_id': 0, 'name': 1})
    lead['owner_name'] = owner['name'] if owner else None
    
    return LeadResponse(**lead)

@api_router.put("/leads/{lead_id}", response_model=LeadResponse)
async def update_lead(lead_id: str, lead_data: LeadUpdate, user: dict = Depends(get_current_user)):
    query = get_data_filter(user, Permission.MANAGE_ALL_LEADS, Permission.MANAGE_OWN_LEADS)
    query['id'] = lead_id
    
    lead = await db.leads.find_one(query)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    update_data = {k: v for k, v in lead_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # Recalculate AI score if needed
    if any(k in update_data for k in ['company', 'title', 'company_size', 'email', 'phone']):
        lead.update(update_data)
        ai_result = await calculate_lead_score(lead)
        update_data['ai_score'] = ai_result['score']
        update_data['ai_insights'] = ai_result['insights']
    
    await db.leads.update_one({'id': lead_id}, {'$set': update_data})
    
    updated_lead = await db.leads.find_one({'id': lead_id}, {'_id': 0})
    owner = await db.users.find_one({'id': updated_lead['owner_id']}, {'_id': 0, 'name': 1})
    updated_lead['owner_name'] = owner['name'] if owner else None
    
    return LeadResponse(**updated_lead)

@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, user: dict = Depends(get_current_user)):
    query = get_data_filter(user, Permission.MANAGE_ALL_LEADS, Permission.MANAGE_OWN_LEADS)
    query['id'] = lead_id
    
    result = await db.leads.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return {"message": "Lead deleted"}

@api_router.post("/leads/import")
async def import_leads(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Import leads from Excel file"""
    if Permission.MANAGE_ALL_LEADS.value not in user['permissions'] and Permission.MANAGE_OWN_LEADS.value not in user['permissions']:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    if not user.get('organization_id'):
        raise HTTPException(status_code=400, detail="You must belong to an organization")
    
    try:
        import pandas as pd
        
        contents = await file.read()
        
        # Determine file type and read accordingly
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            # Try to auto-detect header row by looking for 'Clinic Name' or 'Name'
            df_raw = pd.read_excel(io.BytesIO(contents), header=None)
            header_row = 0
            for i in range(min(5, len(df_raw))):
                row_values = [str(v).lower() if pd.notna(v) else '' for v in df_raw.iloc[i]]
                if any('clinic name' in v or v == 'name' for v in row_values):
                    header_row = i
                    break
            df = pd.read_excel(io.BytesIO(contents), header=header_row)
        
        logging.info(f"Excel columns found for leads: {list(df.columns)}")
        
        # Column mapping from Excel to our schema
        column_mapping = {
            'Clinic Name': 'name',
            'clinic name': 'name',
            'Name': 'name',
            'name': 'name',
            'Address': 'address',
            'address': 'address',
            'Postcode': 'postcode',
            'postcode': 'postcode',
            'City': 'city',
            'city': 'city',
            'State': 'state',
            'state': 'state',
            'Contact Number': 'phone',
            'contact number': 'phone',
            'Phone': 'phone',
            'phone': 'phone',
            'Email': 'email',
            'email': 'email',
            'Is public': 'is_public',
            'is public': 'is_public',
            'Company': 'company',
            'company': 'company',
            'Industry': 'industry',
            'industry': 'industry',
        }
        
        # Rename columns
        df = df.rename(columns={k: v for k, v in column_mapping.items() if k in df.columns})
        logging.info(f"Columns after mapping: {list(df.columns)}")
        
        now = datetime.now(timezone.utc).isoformat()
        imported_count = 0
        
        for _, row in df.iterrows():
            lead_data = {
                'id': str(uuid.uuid4()),
                'name': str(row.get('name', '')).strip() if pd.notna(row.get('name')) else '',
                'email': str(row.get('email', '')).strip() if pd.notna(row.get('email')) else '',
                'phone': str(row.get('phone', '')).strip() if pd.notna(row.get('phone')) else '',
                'company': str(row.get('company', '')).strip() if pd.notna(row.get('company')) else '',
                'address': str(row.get('address', '')).strip() if pd.notna(row.get('address')) else '',
                'postcode': str(row.get('postcode', '')).strip() if pd.notna(row.get('postcode')) else '',
                'city': str(row.get('city', '')).strip() if pd.notna(row.get('city')) else '',
                'state': str(row.get('state', '')).strip() if pd.notna(row.get('state')) else '',
                'industry': str(row.get('industry', '')).strip() if pd.notna(row.get('industry')) else 'Healthcare',
                'is_public': str(row.get('is_public', '')).lower() in ['yes', 'true', '1'] if pd.notna(row.get('is_public')) else False,
                'title': '',
                'company_size': '',
                'source': 'import',
                'status': 'new',
                'notes': f"Imported from {file.filename}",
                'ai_score': 50,  # Default score for imports
                'organization_id': user['organization_id'],
                'owner_id': user['id'],
                'owner_name': user['name'],
                'created_at': now,
                'updated_at': now
            }
            
            # Skip rows without a name
            if not lead_data['name']:
                continue
            
            await db.leads.insert_one(lead_data)
            imported_count += 1
        
        return {"imported": imported_count, "message": f"Successfully imported {imported_count} leads"}
    
    except Exception as e:
        logging.error(f"Import error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to import file: {str(e)}")

# ============= DEAL ROUTES =============

@api_router.post("/deals", response_model=DealResponse)
async def create_deal(deal_data: DealCreate, user: dict = Depends(get_current_user)):
    if Permission.MANAGE_ALL_DEALS.value not in user['permissions'] and Permission.MANAGE_OWN_DEALS.value not in user['permissions']:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    if not user.get('organization_id'):
        raise HTTPException(status_code=400, detail="You must belong to an organization")
    
    deal_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    deal_doc = {
        'id': deal_id,
        **deal_data.model_dump(),
        'ai_health_score': 50,
        'organization_id': user['organization_id'],
        'owner_id': user['id'],
        'assigned_to': user['id'],
        'created_at': now,
        'updated_at': now
    }
    
    deal_doc['ai_health_score'] = await calculate_deal_health(deal_doc)
    
    await db.deals.insert_one(deal_doc)
    deal_doc.pop('_id', None)
    deal_doc['owner_name'] = user['name']
    deal_doc['assigned_to_name'] = user['name']
    
    return DealResponse(**deal_doc)

@api_router.get("/deals", response_model=List[DealResponse])
async def get_deals(stage: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = get_data_filter(user, Permission.VIEW_ALL_DEALS, Permission.VIEW_OWN_DEALS)
    
    if stage:
        query['stage'] = stage
    
    deals = await db.deals.find(query, {'_id': 0}).sort('created_at', -1).to_list(1000)
    
    for deal in deals:
        owner = await db.users.find_one({'id': deal['owner_id']}, {'_id': 0, 'name': 1})
        deal['owner_name'] = owner['name'] if owner else None
        if deal.get('assigned_to'):
            assigned = await db.users.find_one({'id': deal['assigned_to']}, {'_id': 0, 'name': 1})
            deal['assigned_to_name'] = assigned['name'] if assigned else None
    
    return [DealResponse(**deal) for deal in deals]

@api_router.get("/deals/{deal_id}", response_model=DealResponse)
async def get_deal(deal_id: str, user: dict = Depends(get_current_user)):
    query = get_data_filter(user, Permission.VIEW_ALL_DEALS, Permission.VIEW_OWN_DEALS)
    query['id'] = deal_id
    
    deal = await db.deals.find_one(query, {'_id': 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    return DealResponse(**deal)

@api_router.put("/deals/{deal_id}", response_model=DealResponse)
async def update_deal(deal_id: str, deal_data: DealUpdate, user: dict = Depends(get_current_user)):
    query = get_data_filter(user, Permission.MANAGE_ALL_DEALS, Permission.MANAGE_OWN_DEALS)
    query['id'] = deal_id
    
    deal = await db.deals.find_one(query)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    update_data = {k: v for k, v in deal_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    if 'stage' in update_data:
        deal.update(update_data)
        update_data['ai_health_score'] = await calculate_deal_health(deal)
    
    await db.deals.update_one({'id': deal_id}, {'$set': update_data})
    
    updated_deal = await db.deals.find_one({'id': deal_id}, {'_id': 0})
    return DealResponse(**updated_deal)

@api_router.delete("/deals/{deal_id}")
async def delete_deal(deal_id: str, user: dict = Depends(get_current_user)):
    query = get_data_filter(user, Permission.MANAGE_ALL_DEALS, Permission.MANAGE_OWN_DEALS)
    query['id'] = deal_id
    
    result = await db.deals.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    return {"message": "Deal deleted"}

# ============= ACTIVITY ROUTES =============

@api_router.post("/activities", response_model=ActivityResponse)
async def create_activity(activity_data: ActivityCreate, user: dict = Depends(get_current_user)):
    if not user.get('organization_id'):
        raise HTTPException(status_code=400, detail="You must belong to an organization")
    
    activity_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    activity_doc = {
        'id': activity_id,
        **activity_data.model_dump(),
        'organization_id': user['organization_id'],
        'owner_id': user['id'],
        'created_at': now
    }
    
    await db.activities.insert_one(activity_doc)
    activity_doc.pop('_id', None)
    activity_doc['owner_name'] = user['name']
    
    return ActivityResponse(**activity_doc)

@api_router.get("/activities", response_model=List[ActivityResponse])
async def get_activities(
    contact_id: Optional[str] = None,
    lead_id: Optional[str] = None,
    deal_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    if not user.get('organization_id'):
        return []
    
    query = {'organization_id': user['organization_id']}
    if contact_id:
        query['contact_id'] = contact_id
    if lead_id:
        query['lead_id'] = lead_id
    if deal_id:
        query['deal_id'] = deal_id
    
    activities = await db.activities.find(query, {'_id': 0}).sort('created_at', -1).to_list(100)
    
    for activity in activities:
        owner = await db.users.find_one({'id': activity['owner_id']}, {'_id': 0, 'name': 1})
        activity['owner_name'] = owner['name'] if owner else None
    
    return [ActivityResponse(**a) for a in activities]

# ============= ANALYTICS ROUTES =============

@api_router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(user: dict = Depends(get_current_user)):
    check_permission(user, Permission.VIEW_ANALYTICS)
    
    if not user.get('organization_id'):
        return AnalyticsResponse(
            total_leads=0, total_deals=0, total_contacts=0,
            total_pipeline_value=0, won_deals_value=0, conversion_rate=0,
            leads_by_status={}, leads_by_source={}, deals_by_stage={}, 
            monthly_revenue=[], team_performance=[], recent_activities=[], organization_stats={}
        )
    
    org_filter = {'organization_id': user['organization_id']}
    
    # If user can only see own data
    if Permission.VIEW_ALL_LEADS.value not in user['permissions']:
        org_filter['owner_id'] = user['id']
    
    # Get leads stats
    leads = await db.leads.find(org_filter, {'_id': 0}).to_list(10000)
    total_leads = len(leads)
    leads_by_status = {}
    leads_by_source = {}
    for lead in leads:
        status = lead.get('status', 'new')
        leads_by_status[status] = leads_by_status.get(status, 0) + 1
        source = lead.get('source', 'other') or 'other'
        leads_by_source[source] = leads_by_source.get(source, 0) + 1
    
    # Get deals stats
    deals = await db.deals.find(org_filter, {'_id': 0}).to_list(10000)
    total_deals = len(deals)
    total_pipeline_value = sum(d.get('value', 0) for d in deals if d.get('stage') not in ['closed_won', 'closed_lost'])
    won_deals_value = sum(d.get('value', 0) for d in deals if d.get('stage') == 'closed_won')
    
    deals_by_stage = {}
    for deal in deals:
        stage = deal.get('stage', 'lead')
        deals_by_stage[stage] = deals_by_stage.get(stage, 0) + 1
    
    # Conversion rate
    won_count = deals_by_stage.get('closed_won', 0)
    total_closed = won_count + deals_by_stage.get('closed_lost', 0)
    conversion_rate = (won_count / total_closed * 100) if total_closed > 0 else 0
    
    # Get contacts count
    total_contacts = await db.contacts.count_documents(org_filter)
    
    # Monthly revenue
    monthly_revenue = [
        {"month": "Jan", "revenue": won_deals_value * 0.1},
        {"month": "Feb", "revenue": won_deals_value * 0.15},
        {"month": "Mar", "revenue": won_deals_value * 0.12},
        {"month": "Apr", "revenue": won_deals_value * 0.18},
        {"month": "May", "revenue": won_deals_value * 0.2},
        {"month": "Jun", "revenue": won_deals_value * 0.25}
    ]
    
    # Recent activities (simulated based on recent leads/deals)
    recent_activities = []
    recent_leads = sorted(leads, key=lambda x: x.get('created_at', ''), reverse=True)[:3]
    recent_deals = sorted(deals, key=lambda x: x.get('created_at', ''), reverse=True)[:3]
    
    for lead in recent_leads:
        recent_activities.append({
            'type': 'lead_created',
            'title': f"New lead: {lead.get('name', 'Unknown')}",
            'description': f"From {lead.get('source', 'unknown')} source",
            'time': lead.get('created_at', '')[:10] if lead.get('created_at') else 'Recently',
            'icon': 'user'
        })
    
    for deal in recent_deals:
        recent_activities.append({
            'type': 'deal_created',
            'title': f"Deal: {deal.get('title', 'Unknown')}",
            'description': f"${deal.get('value', 0):,.0f} - {deal.get('stage', 'lead').replace('_', ' ')}",
            'time': deal.get('created_at', '')[:10] if deal.get('created_at') else 'Recently',
            'icon': 'briefcase'
        })
    
    # Sort activities by time
    recent_activities = sorted(recent_activities, key=lambda x: x.get('time', ''), reverse=True)[:5]
    
    # Organization stats for multi-tenancy view
    org_stats = {}
    if user.get('organization_id'):
        org = await db.organizations.find_one({'id': user['organization_id']}, {'_id': 0})
        if org:
            member_count = await db.users.count_documents({'organization_id': user['organization_id']})
            org_stats = {
                'name': org.get('name', 'Unknown'),
                'member_count': member_count,
                'domain': org.get('domain', ''),
                'industry': org.get('industry', ''),
                'created_at': org.get('created_at', '')[:10] if org.get('created_at') else ''
            }
    
    # Team performance (only for managers/admins)
    team_performance = []
    if Permission.VIEW_TEAM_ANALYTICS.value in user['permissions']:
        org_users = await db.users.find({'organization_id': user['organization_id']}, {'_id': 0}).to_list(100)
        for u in org_users:
            user_leads = await db.leads.count_documents({'owner_id': u['id'], 'organization_id': user['organization_id']})
            user_deals = await db.deals.count_documents({'owner_id': u['id'], 'organization_id': user['organization_id']})
            user_won = await db.deals.count_documents({'owner_id': u['id'], 'organization_id': user['organization_id'], 'stage': 'closed_won'})
            team_performance.append({
                'user_id': u['id'],
                'name': u['name'],
                'role': u['role'],
                'leads': user_leads,
                'deals': user_deals,
                'won_deals': user_won
            })
    
    return AnalyticsResponse(
        total_leads=total_leads,
        total_deals=total_deals,
        total_contacts=total_contacts,
        total_pipeline_value=total_pipeline_value,
        won_deals_value=won_deals_value,
        conversion_rate=round(conversion_rate, 1),
        leads_by_status=leads_by_status,
        leads_by_source=leads_by_source,
        deals_by_stage=deals_by_stage,
        monthly_revenue=monthly_revenue,
        team_performance=team_performance,
        recent_activities=recent_activities,
        organization_stats=org_stats
    )

# ============= ROLES INFO ROUTE =============

@api_router.get("/roles")
async def get_roles():
    """Get available roles and their permissions"""
    return {
        "roles": [
            {
                "id": role.value,
                "name": role.value.replace('_', ' ').title(),
                "permissions": [p.value for p in ROLE_PERMISSIONS.get(role, [])]
            }
            for role in RoleType
        ]
    }

# ============= ROOT ROUTE =============

@api_router.get("/")
async def root():
    return {"message": "SalesHub Platform API", "version": "2.0.0", "features": ["Multi-tenant", "RBAC", "CRM", "Sales"]}

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
