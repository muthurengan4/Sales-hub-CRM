# HubSpot CRM Clone - PRD

## Original Problem Statement
Build an AI-powered HubSpot CRM clone with Lead Management, Pipeline & Deals (Kanban), Basic Analytics Dashboard, and AI features powered by Claude Sonnet 4.5.

## User Choices
- **AI Provider**: Claude Sonnet 4.5 via Emergent LLM integration
- **Authentication**: JWT-based custom auth (email/password)
- **Scope**: Minimal MVP - Lead Management + Pipeline + Basic Analytics
- **Theme**: Dark/Light mode with toggle

## Architecture

### Tech Stack
- **Frontend**: React 19, TailwindCSS, Shadcn UI, Recharts
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: Claude Sonnet 4.5 via emergentintegrations library

### Key Components
```
/app/
├── backend/
│   ├── server.py          # FastAPI with JWT auth, Lead/Deal/Analytics APIs
│   └── .env               # MONGO_URL, JWT_SECRET, EMERGENT_LLM_KEY
├── frontend/src/
│   ├── App.js             # Auth/Theme providers, routing
│   ├── components/Layout.jsx  # Sidebar navigation
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx  # Analytics widgets + charts
│   │   ├── Leads.jsx      # Lead table + CRUD
│   │   ├── Pipeline.jsx   # Kanban board
│   │   └── Settings.jsx   # Theme toggle
```

## User Personas
1. **Sales Rep**: Creates/manages leads, tracks deals through pipeline
2. **Sales Manager**: Views analytics dashboard, monitors team performance

## Core Requirements (Implemented)

### ✅ Authentication
- JWT-based login/register
- Protected routes
- 24-hour token expiration

### ✅ Lead Management
- Create, Read, Update, Delete leads
- Lead fields: name, email, phone, company, title, industry, source
- AI-powered lead scoring (0-100)
- AI-generated insights from Claude Sonnet 4.5
- Status tracking: new, contacted, qualified, lost
- Search and filter capabilities

### ✅ Pipeline & Deals
- Visual Kanban board with 7 stages
- Drag-and-drop deal movement
- Deal fields: title, value, company, contact, expected close date
- AI health score for deals
- Stage value totals

### ✅ Analytics Dashboard
- Stats cards: Total Leads, Pipeline Value, Won Revenue, Conversion Rate
- Revenue Trend line chart
- Pipeline Overview bar chart
- AI Insights section

### ✅ UI/UX
- Dark/Light mode toggle
- Glassmorphism design
- Responsive layout
- Manrope + Inter + JetBrains Mono fonts
- Toast notifications

## What's Been Implemented (March 2026)

### Backend APIs
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- GET/POST /api/leads
- GET/PUT/DELETE /api/leads/{id}
- POST /api/leads/{id}/refresh-score
- GET/POST /api/deals
- GET/PUT/DELETE /api/deals/{id}
- GET /api/analytics

### Frontend Pages
- Login/Register with validation
- Dashboard with analytics charts
- Leads table with CRUD dialogs
- Pipeline Kanban board
- Settings with theme toggle

### AI Features
- Lead scoring algorithm (0-100)
- AI insights generation via Claude Sonnet 4.5
- Deal health scoring based on stage progression

## Prioritized Backlog

### P0 - Critical (Done)
- ✅ Authentication system
- ✅ Lead CRUD operations
- ✅ Pipeline Kanban board
- ✅ Basic analytics

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
- Mobile responsive improvements
- Calendar integration

## Next Tasks
1. Fix dropdown selection in modal forms (z-index issue)
2. Add AI Email Assistant for automated outreach
3. Implement lead activity timeline
4. Add deal value forecasting
5. Integrate calendar for meetings
