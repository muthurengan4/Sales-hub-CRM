# SalesHub CRM Platform - PRD

## Original Problem Statement
Build an AI-powered HubSpot CRM clone with Lead Management, Pipeline & Deals (Kanban), Basic Analytics Dashboard, and AI features powered by Claude Sonnet 4.5. Later expanded to include Multi-tenancy, Role-Based Access Control (RBAC), Excel Import, Enhanced Analytics, comprehensive sales workflow, and AI CRM features.

## Latest Update (December 2025)
Implemented comprehensive sales workflow based on AI CRM Feature Specification:
- **Assignment System**: 4 modes (manual, round-robin, territory, default agent)
- **Call-Based Pipeline**: New → Contacted → No Answer → Interested → Follow Up → Booked → Won/Lost
- **Lead-to-Client Conversion**: Convert leads to clients with service tracking
- **Clients Page**: View all converted leads with purchased services
- **Terminology**: "Contacts" renamed to "Customers"

## Architecture

### Tech Stack
- **Frontend**: React 19, TailwindCSS (Elstar theme), Lucide React icons, Recharts
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: Claude Sonnet 4.5 via emergentintegrations library

### Key Components
```
/app/
├── backend/
│   ├── server.py           # FastAPI with all endpoints
│   ├── tests/              # pytest test files
│   └── .env                # MONGO_URL, JWT_SECRET, EMERGENT_LLM_KEY
├── frontend/src/
│   ├── App.js              # Auth/Theme providers, routing
│   ├── components/
│   │   ├── Layout.jsx      # Sidebar with all navigation
│   │   ├── Pagination.jsx  # Reusable pagination
│   │   ├── NotificationsDropdown.jsx  # In-app notifications
│   │   └── AssignmentSettings.jsx     # Lead assignment config
│   ├── pages/
│   │   ├── Dashboard.jsx   # Analytics + org setup
│   │   ├── Worklist.jsx    # Operational lead dashboard
│   │   ├── Leads.jsx       # Lead table + Convert to Client
│   │   ├── Pipeline.jsx    # Kanban with call-based stages
│   │   ├── Customers.jsx   # Customer management (renamed from Contacts)
│   │   ├── Clients.jsx     # Converted leads with services
│   │   ├── Users.jsx       # Team management
│   │   ├── CustomerProfile.jsx  # Detailed profile view
│   │   └── Organization.jsx     # Org settings + Assignment settings
│   └── index.css           # Elstar theme styles
```

## Sales Workflow

### Lead Assignment (on Excel Import)
1. **Manual**: Leads not auto-assigned, admins assign later
2. **Round Robin**: Distributed evenly among sales reps
3. **Territory**: Assigned based on state/city to specific agents
4. **Default Agent**: All leads go to one agent

### Call-Based Pipeline Stages
1. **New** - Fresh lead, not contacted
2. **Contacted** - Initial contact made
3. **No Answer** - Called but no response
4. **Interested** - Lead shows interest
5. **Follow Up** - Scheduled for follow-up
6. **Booked** - Meeting/demo scheduled
7. **Won** - Converted to client
8. **Lost** - Did not convert

### Customer Lifecycle
Lead → AI Contacted → Interested → Opportunity → Customer → Repeat Customer

### Lead to Client Conversion
1. Lead in pipeline reaches "Won" stage
2. User clicks "Convert to Client"
3. Adds purchased services (name, amount, status)
4. Client record created in /clients
5. Lead marked as converted
6. Customer record auto-created

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Leads
- GET/POST /api/leads (paginated)
- GET/PUT/DELETE /api/leads/{id}
- POST /api/leads/{id}/refresh-score
- POST /api/leads/{id}/convert (Convert to Client)
- PUT /api/leads/{id}/pipeline-stage
- POST /api/leads/import

### Clients (NEW)
- GET /api/clients (paginated)
- GET /api/clients/{id}
- POST /api/clients/{id}/services

### Assignment Settings (NEW)
- GET /api/assignment-settings
- PUT /api/assignment-settings

### Other Endpoints
- GET/POST /api/deals
- GET /api/customers (formerly contacts)
- GET /api/users (paginated)
- GET /api/worklist (paginated, filtered)
- GET /api/notifications
- GET /api/profile/lead/{id}
- GET /api/filter-options
- GET/POST /api/ai-calls (PLACEHOLDER)

## Features Implemented

### ✅ Core CRM
- Multi-tenant architecture
- RBAC (Super Admin, Org Admin, Manager, Sales Rep, Viewer)
- Lead/Contact/Deal management
- Excel import with auto-assignment
- AI-powered lead scoring

### ✅ Sales Workflow (December 2025)
- Assignment Settings (4 modes)
- Call-based Pipeline stages
- Lead to Client conversion
- Clients page with services
- Customers page (renamed)

### ✅ Dashboard & Analytics
- Stats cards with trends
- Revenue charts
- Sales funnel
- Team leaderboard
- Activity timeline

### ✅ Notifications
- Bell icon with unread count
- In-app notifications
- Auto-refresh

### ✅ UI/UX
- Elstar Admin theme (White & Gold)
- Dark/Light mode
- Pagination (10, 25, 50, 100)
- Responsive layout

## Pending/Future

### P0 - Critical
- ✅ Sales workflow (Done)
- ⏳ Rebranding to AISalesTask.com

### P1 - Important
- AI Call Agent integration (Twilio/Bland.ai/Vapi)
- Email notifications
- Data export (CSV/Excel)
- Progress indicator for imports

### P2 - Nice to Have
- Calendar integration
- Automation workflows
- Custom report builder
- Mobile app

## Known Issues (Minor)
1. Lead conversion allows re-conversion (creates duplicate clients)
2. Pipeline-stage endpoint uses query param instead of body
3. React hydration warning in AssignmentSettings select

## Test Credentials
- Email: Register new user or use existing test accounts
- First user in org becomes Org Admin automatically
