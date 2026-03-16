# AI CRM Application - Product Requirements Document

## Original Problem Statement
Build a comprehensive AI-powered CRM system with the following core features:
- Lead management with AI scoring
- Deal pipeline management
- Customer relationship tracking
- Task management with auto-sync to deals
- AI calling integration with ElevenLabs
- WhatsApp messaging via Twilio
- Google Calendar integration

## Architecture
- **Frontend:** React with Tailwind CSS, Shadcn UI, Framer Motion
- **Backend:** FastAPI (Python) with MongoDB
- **Database:** MongoDB via motor (async driver)

## Key Pages
1. Dashboard - Overview metrics and charts
2. Leads - Lead management with AI calling
3. Pipeline - Deal stages (Lead, Qualified, Proposal, Negotiation, Sales Closed, Lost)
4. Tasks - Task management with deal auto-sync
5. Customers - Customer profiles with colored avatars
6. Calendar - Event scheduling
7. Settings - Organization configuration

## What's Been Implemented (as of March 2026)

### Core Features
- [x] User authentication (JWT-based)
- [x] Organization management
- [x] Lead CRUD operations
- [x] Deal pipeline with drag-and-drop
- [x] Task management with deal auto-sync
- [x] Customer management with profile views
- [x] Dashboard with metrics

### AI Features
- [x] AI Score calculation based on pipeline stages
- [x] AI Calling UI on LeadDetailPage
- [x] AI Calling UI on Leads page (batch/individual)
- [x] Dynamic AI Agent configuration in Settings

### Integrations
- [x] Twilio WhatsApp configuration UI
- [x] ElevenLabs AI Agent configuration (Settings page)
- [x] Google Calendar placeholder UI

### Recent Updates (March 16, 2026)
- Simplified AI Agent form: removed Description field
- Changed label from "ElevenLabs Agent ID" to "Agent ID"
- Removed Setup Instructions section from AI Agents config

## Prioritized Backlog

### P0 - Critical
- [ ] Test AI Calling modal on LeadDetailPage with dynamic agents
- [ ] Test batch AI Calling on Leads page
- [ ] Implement Google Calendar sync logic

### P1 - High Priority
- [ ] Backend for Knowledge Base file processing
- [ ] Populate AI Call Detail modal with real data
- [ ] Actual ElevenLabs API integration for calls

### P2 - Medium Priority
- [ ] Export to CSV functionality
- [ ] Custom report builder

### Technical Debt
- [ ] **CRITICAL:** Refactor server.py (4000+ lines) into modular APIRouter files
  - routes/auth.py
  - routes/leads.py
  - routes/deals.py
  - routes/tasks.py
  - routes/customers.py
  - routes/ai_agents.py
  - routes/settings.py

## Key API Endpoints
- `/api/auth/*` - Authentication
- `/api/leads/*` - Lead management
- `/api/deals/*` - Deal management
- `/api/tasks/*` - Task management
- `/api/customers/*` - Customer management
- `/api/ai-agents` - AI Agent CRUD (GET, POST, DELETE)
- `/api/leads/{lead_id}/initiate-call` - Initiate AI call (placeholder)
- `/api/organization-settings` - Org settings

## Database Collections
- users
- organizations
- organization_settings (includes ai_agents array)
- leads
- deals
- tasks
- customers
- ai_calls
- activities

## Test Credentials
- Email: test@test.com
- Password: Password123!
