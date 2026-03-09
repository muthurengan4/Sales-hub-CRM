# SalesHub CRM Platform - PRD

## Original Problem Statement
Build an AI-powered HubSpot CRM clone with Lead Management, Pipeline & Deals (Kanban), Basic Analytics Dashboard, and AI features powered by Claude Sonnet 4.5. Later expanded to include Multi-tenancy, Role-Based Access Control (RBAC), Excel Import, Enhanced Analytics, and AI CRM features.

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
│   ├── server.py           # FastAPI with JWT auth, Multi-tenant, RBAC
│   ├── tests/              # pytest test files
│   └── .env                # MONGO_URL, JWT_SECRET, EMERGENT_LLM_KEY
├── frontend/src/
│   ├── App.js              # Auth/Theme providers, routing
│   ├── components/
│   │   ├── Layout.jsx      # Elstar sidebar with Worklist nav + Notifications
│   │   ├── Modal.jsx       # Reusable modal component
│   │   ├── Pagination.jsx  # Reusable pagination component
│   │   └── NotificationsDropdown.jsx  # In-app notifications
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx   # Analytics widgets + organization setup
│   │   ├── Worklist.jsx    # NEW: Operational dashboard for active leads
│   │   ├── Leads.jsx       # Lead table + CRUD with AI scoring + pagination
│   │   ├── Pipeline.jsx    # Kanban board for deals
│   │   ├── Contacts.jsx    # Contact management + pagination
│   │   ├── Users.jsx       # Team management + pagination
│   │   ├── CustomerProfile.jsx  # NEW: Detailed customer profile page
│   │   ├── Organization.jsx # Organization settings
│   │   └── Settings.jsx    # Theme toggle
│   └── index.css           # Elstar theme styles
```

## User Personas & Roles (RBAC)
1. **Super Admin**: Platform-wide access (multi-org)
2. **Org Admin**: Full access within organization, can invite users
3. **Manager**: Can view team data, manage all leads/deals
4. **Sales Rep**: Can manage own leads/deals
5. **Viewer**: Read-only access

## Customer Lifecycle Stages
1. Lead → 2. AI Contacted → 3. Interested → 4. Opportunity → 5. Customer → 6. Repeat Customer

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
- Lead fields: name, email, phone, company, title, industry, source, address, city, state, postcode
- AI-powered lead scoring (0-100) via Claude Sonnet 4.5
- Status tracking: new, contacted, qualified, lost
- Lifecycle stages: lead, ai_contacted, interested, opportunity, customer, repeat_customer
- Search and filter capabilities
- Organization-scoped data
- Excel/CSV import support
- **Pagination** (10, 25, 50, 100 items per page)

### ✅ Pipeline & Deals
- Visual Kanban board with 7 stages
- Drag-and-drop deal movement
- Deal fields: title, value, company, contact, expected close date
- AI health score for deals
- Stage value totals

### ✅ Contact Management
- Contact CRUD operations
- Contact fields: name, email, phone, company, job title, city, state
- Excel/CSV import support
- **Pagination** (10, 25, 50, 100 items per page)

### ✅ Team Management
- User listing per organization
- Role assignment and updates
- User invitation with email
- **Pagination** (10, 25, 50, 100 items per page)

### ✅ Analytics Dashboard
- 5 Stats cards with mini charts and trend indicators
- Revenue Trend bar chart with target comparison
- Sales Funnel visualization (Lead → Contacted → Qualified → Deals → Won)
- Lead Sources donut chart
- Lead Status donut chart
- Pipeline Stages progress bars
- Top Locations by lead concentration
- Recent Activities feed
- Team Leaderboard
- AI Insights panel
- Organization context display
- Role-based data visibility

### ✅ Worklist Dashboard (NEW - Dec 2025)
- Operational view for active leads requiring attention
- Advanced filtering: Status, Lifecycle Stage, Assigned To, Date Range
- Stats row: Total Active, New Today, Needs Follow-up, Qualified
- Quick actions: AI Call (placeholder), View Profile
- Server-side pagination

### ✅ Customer Profile Page (NEW - Dec 2025)
- Detailed lead/contact profile view
- Customer Lifecycle progress visualization
- Contact Information card
- Activity Summary stats
- Tabbed interface: Timeline, AI Calls, Deals, Notes
- Activity Timeline with chronological events
- Owner/Assigned user info

### ✅ In-App Notifications (NEW - Dec 2025)
- Bell icon in header with unread count badge
- Notification dropdown with list view
- Mark as read (individual and all)
- Notification types: new_lead, lead_assigned, ai_call_completed, deal_stage_changed, etc.
- Auto-refresh every 30 seconds

### ✅ AI Call Agent (PLACEHOLDER - Dec 2025)
- API endpoints created for future integration
- Call initiation, listing, details endpoints
- Status tracking: pending, in_progress, completed, failed
- Placeholder UI in Customer Profile
- Ready for voice provider integration (Twilio, Bland.ai, Vapi)

### ✅ UI/UX
- Elstar Admin Template design
- Dark/Light mode toggle
- Responsive layout
- Toast notifications
- Modal forms with working dropdowns
- Premium hover effects and animations

## What's Been Implemented (December 2025)

### Backend APIs (Multi-tenant)
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- GET/POST /api/organizations
- GET/PUT/DELETE /api/organizations/{id}
- GET /api/users (paginated, org-scoped)
- POST /api/users/invite
- PUT/DELETE /api/users/{id}
- GET/POST /api/leads (paginated, org-scoped)
- GET/PUT/DELETE /api/leads/{id}
- POST /api/leads/{id}/refresh-score
- POST /api/import/leads (Excel import)
- GET/POST /api/deals (org-scoped)
- GET/PUT/DELETE /api/deals/{id}
- GET/POST /api/contacts (paginated, org-scoped)
- POST /api/import/contacts (Excel import)
- GET /api/analytics (org-scoped)
- **NEW** GET /api/worklist (paginated, filtered)
- **NEW** GET /api/notifications
- **NEW** PUT /api/notifications/{id}/read
- **NEW** PUT /api/notifications/read-all
- **NEW** GET /api/filter-options
- **NEW** GET /api/profile/lead/{id}
- **NEW** GET /api/profile/contact/{id}
- **NEW** GET /api/timeline/{entity_type}/{entity_id}
- **NEW** GET/POST /api/ai-calls (placeholder)
- **NEW** GET /api/ai-calls/{id}

### Frontend Pages
- Login/Register with validation
- Dashboard with organization setup prompt
- **Worklist** Dashboard with filters
- Leads table with CRUD, pagination, View Profile
- Pipeline Kanban board
- Contacts management with pagination, View Profile
- **Customer Profile** page with timeline
- Team (Users) management with pagination
- Organization settings
- Settings with theme toggle
- **Notifications** dropdown in header

### AI Features
- Lead scoring algorithm (0-100)
- Deal health scoring based on stage progression
- AI Call placeholder for future integration

## Bug Fixes Applied (December 2025)
- Fixed `organization_id` validation error in DealResponse, LeadResponse, ContactResponse, ActivityResponse models
- Dropdown z-index issue in modals - resolved with Elstar UI overhaul
- Fixed input typing bug (users could only type one character)
- Fixed Excel import header parsing for non-standard header rows

## Theme Update (December 2025)
- Changed color scheme from white & blue to **white & gold (#f5c77a)**
- Primary color: `#f5c77a` (soft gold)
- Updated all UI elements: buttons, badges, icons, charts, gradients
- Added premium hover effects and animations

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
- ✅ Pagination on all list pages
- ✅ Worklist Dashboard
- ✅ Customer Profile Page
- ✅ Activity Timeline
- ✅ In-app Notifications
- ✅ Advanced Filtering

### P1 - Important (Next Phase)
- AI Call Agent integration (Twilio/Bland.ai/Vapi)
- Email notifications
- Progress indicator for large Excel imports
- Data export functionality (Export to CSV)
- AI automation rules (auto-retry calls, auto-move stages)
- Enhanced assignment system (auto-assignment by location/service)

### P2 - Nice to Have
- Calendar integration (Google Calendar)
- Workflow automation
- Custom report builder
- Interactive tooltips and drill-down for dashboard charts
- Conversational intelligence
- Predictive forecasting
- Mobile responsive improvements

## Rebranding (Pending)
- Rename "SalesHub" to "AISalesTask.com"
- Replace logo with new design from PDF
- Replace favicon from provided ZIP file
- Assets extracted to /tmp/favicon_extracted/

## Next Tasks
1. Complete rebranding to AISalesTask.com
2. Integrate AI Call Agent with voice provider
3. Add email notifications for key events
4. Implement data export (CSV/Excel)
5. Backend refactoring (break server.py into modular routers)
