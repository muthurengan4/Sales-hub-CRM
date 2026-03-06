# HubSpot CRM Clone - PRD

## Original Problem Statement
Build an AI-powered HubSpot CRM clone with Lead Management, Pipeline & Deals (Kanban), Basic Analytics Dashboard, and AI features powered by Claude Sonnet 4.5. Later expanded to include Multi-tenancy and Role-Based Access Control (RBAC).

## User Choices
- **AI Provider**: Claude Sonnet 4.5 via Emergent LLM integration
- **Authentication**: JWT-based custom auth (email/password)
- **Scope**: Full CRM + Sales Management Platform
- **Theme**: Elstar Admin Template (Tailwind CSS) with White & Gold (#f5c77a) color scheme, Dark/Light mode

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
│   ├── server.py          # FastAPI with JWT auth, Multi-tenant, RBAC
│   └── .env               # MONGO_URL, JWT_SECRET, EMERGENT_LLM_KEY
├── frontend/src/
│   ├── App.js             # Auth/Theme providers, routing
│   ├── components/Layout.jsx  # Elstar sidebar navigation
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx  # Analytics widgets + organization setup
│   │   ├── Leads.jsx      # Lead table + CRUD with AI scoring
│   │   ├── Pipeline.jsx   # Kanban board for deals
│   │   ├── Contacts.jsx   # Contact management
│   │   ├── Users.jsx      # Team management + user invites
│   │   ├── Organization.jsx # Organization settings
│   │   └── Settings.jsx   # Theme toggle
│   └── index.css          # Elstar theme styles
```

## User Personas & Roles (RBAC)
1. **Super Admin**: Platform-wide access (multi-org)
2. **Org Admin**: Full access within organization, can invite users
3. **Manager**: Can view team data, manage all leads/deals
4. **Sales Rep**: Can manage own leads/deals
5. **Viewer**: Read-only access

## Core Requirements - IMPLEMENTED

### ✅ Authentication & Authorization
- JWT-based login/register
- Protected routes
- Role-Based Access Control (RBAC)
- 24-hour token expiration

### ✅ Multi-tenancy
- Organization creation and management
- Data isolation per organization
- User invitation system with role assignment

### ✅ Lead Management
- Create, Read, Update, Delete leads
- Lead fields: name, email, phone, company, title, industry, source
- AI-powered lead scoring (0-100) via Claude Sonnet 4.5
- Status tracking: new, contacted, qualified, lost
- Search and filter capabilities
- Organization-scoped data

### ✅ Pipeline & Deals
- Visual Kanban board with 7 stages
- Drag-and-drop deal movement
- Deal fields: title, value, company, contact, expected close date
- AI health score for deals
- Stage value totals

### ✅ Contact Management
- Contact CRUD operations
- Contact fields: name, email, phone, company, job title

### ✅ Team Management
- User listing per organization
- Role assignment and updates
- User invitation with email

### ✅ Analytics Dashboard
- Stats cards: Total Leads, Pipeline Value, Won Revenue, Contacts
- Organization context display
- Role-based data visibility

### ✅ UI/UX
- Elstar Admin Template design
- Dark/Light mode toggle
- Responsive layout
- Toast notifications
- Modal forms with working dropdowns

## What's Been Implemented (December 2025)

### Backend APIs (Multi-tenant)
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- GET/POST /api/organizations
- GET/PUT/DELETE /api/organizations/{id}
- GET /api/users (org-scoped)
- POST /api/users/invite
- PUT/DELETE /api/users/{id}
- GET/POST /api/leads (org-scoped)
- GET/PUT/DELETE /api/leads/{id}
- POST /api/leads/{id}/refresh-score
- GET/POST /api/deals (org-scoped)
- GET/PUT/DELETE /api/deals/{id}
- GET/POST /api/contacts (org-scoped)
- GET /api/analytics (org-scoped)

### Frontend Pages
- Login/Register with validation
- Dashboard with organization setup prompt
- Leads table with CRUD dialogs
- Pipeline Kanban board
- Contacts management
- Team (Users) management
- Organization settings
- Settings with theme toggle

### AI Features
- Lead scoring algorithm (0-100)
- Deal health scoring based on stage progression

## Bug Fixes Applied (December 2025)
- Fixed `organization_id` validation error in DealResponse, LeadResponse, ContactResponse, ActivityResponse models - made field optional for legacy data compatibility
- Dropdown z-index issue in modals - resolved with Elstar UI overhaul

## Theme Update (December 2025)
- Changed color scheme from white & blue to **white & gold (#f5c77a)**
- Primary color: `#f5c77a` (soft gold)
- Updated all UI elements: buttons, badges, icons, charts, gradients
- Added premium hover effects and animations

## Features Added (December 2025)
- **Excel Import**: Import leads and contacts from Excel/CSV files
  - Supports columns: Clinic Name, Address, Postcode, City, State, Contact Number, Is public
  - Automatic field mapping
  - Available for both Leads and Contacts pages
- **Enhanced Dashboard**:
  - 5 stat tiles with mini area charts and trend indicators
  - Revenue Trend bar chart with target comparison
  - Sales Funnel visualization (Lead → Contacted → Qualified → Deals → Won)
  - Lead Sources donut chart
  - Lead Status donut chart
  - Pipeline Stages progress bars
  - Top Locations by lead concentration
  - Recent Activities feed
  - Team Leaderboard
  - AI Insights panel
- **Fixed Input Bug**: Resolved issue where users could only type one character at a time in form fields

## Prioritized Backlog

### P0 - Critical (Done)
- ✅ Authentication system
- ✅ Lead CRUD operations
- ✅ Pipeline Kanban board
- ✅ Basic analytics
- ✅ Multi-tenancy
- ✅ RBAC system
- ✅ Organization management
- ✅ Team management

### P1 - Important (Next Phase)
- Email generation with AI (AI Email Assistant)
- Advanced lead filtering
- Deal activity timeline
- Bulk lead import/export
- Custom fields

### P2 - Nice to Have
- AI Prospecting Workspace
- Conversational intelligence
- Predictive forecasting
- Workflow automation
- Calendar integration
- Mobile responsive improvements

## Next Tasks
1. Add AI Email Assistant for automated outreach
2. Implement lead activity timeline
3. Add deal value forecasting
4. Integrate calendar for meetings
5. Backend refactoring (break server.py into modular routers)
