# AISalesTask CRM - Product Requirements Document

## Original Problem Statement
Build an AI-powered CRM system with lead management, deal pipeline, team organization, AI calling integration (ElevenLabs), WhatsApp messaging (Twilio), and Google Calendar scheduling.

## Tech Stack
- **Frontend**: React with Tailwind CSS, Shadcn/UI components
- **Backend**: FastAPI with Motor (async MongoDB driver)
- **Database**: MongoDB
- **AI Integration**: ElevenLabs for voice AI calling
- **Messaging**: Twilio for WhatsApp/SMS (BLOCKED - awaiting valid credentials)
- **Scheduling**: Google Calendar OAuth integration

## Core Features Implemented

### Lead Management
- Full CRUD operations for leads
- Lead import from Excel files
- AI Score calculation
- Lead to Customer conversion
- Auto-migration of legacy customers to leads
- Pagination and filtering by status/state

### Deal Pipeline
- Kanban-style pipeline board
- Drag-and-drop deal management
- Time-based filtering (5 days, 10 days, 30 days, all time)
- Dynamic currency display based on organization settings

### Tasks Management
- Slide-in preview panel with Deals and AI Score sections
- Task creation and management
- Payment tracking

### Customer Management
- Customer profiles linked to leads
- Auto-migration endpoint for legacy customers
- Service tracking

### AI Calling (ElevenLabs)
- AI agent configuration
- Call initiation to leads
- Batch calling support

### Organization Features
- Team management with roles (admin, member)
- Dynamic currency settings
- Organization-level configurations via Settings page

### UI/UX
- Responsive design with mobile/tablet adaptations
- iOS Safari scroll bug fixes
- Dynamic global currency via Context API
- Slide-in panels for entity previews

## Database Schema

### Collections:
- `users`: User accounts with auth
- `organizations`: Organization settings including currency_symbol
- `leads`: Core lead entity with ai_score, status, pipeline_status
- `customers`: Customer profiles with lead_id linkage
- `deals`: Deal records with value, stage
- `lead-deal-linkages`: Links between leads and deals with updated_at
- `tasks`: Task records
- `ai-agents`: Configured AI calling agents

## API Endpoints

### Leads
- `GET /api/leads` - List with pagination/filters
- `POST /api/leads` - Create lead
- `PUT /api/leads/{id}` - Update lead
- `DELETE /api/leads/{id}` - Delete lead
- `POST /api/leads/import` - Excel import
- `POST /api/leads/{id}/convert` - Convert to customer

### Customers
- `POST /api/customers/{id}/migrate-to-lead` - Migrate legacy customer to lead

### Deals
- `GET /api/deals` - List deals
- Pipeline management endpoints

### AI Calling
- `POST /api/ai-calls/initiate` - Start AI call
- `GET /api/ai-agents` - List configured agents

## Pending Issues

### P1: Twilio WhatsApp 401 Error
- **Status**: BLOCKED
- **Root Cause**: Invalid API credentials
- **Action Needed**: User must provide valid Twilio Account SID and Auth Token

### P2: Mobile Table Readability
- **Status**: CSS fix applied, needs user verification
- **Description**: Tables forced to fit mobile screens without horizontal scrolling
- **Risk**: May be visually cramped on very small screens

## Technical Debt

### Critical: server.py Refactoring
- Current file: 5700+ lines
- Need to split into modular APIRouter files:
  - `routes/leads.py`
  - `routes/deals.py`
  - `routes/customers.py`
  - `routes/ai_calls.py`
  - `routes/organization.py`

## Upcoming Tasks
1. Verify Twilio messaging once credentials provided
2. Data export to CSV
3. Custom report builder
4. server.py modularization

## Session Changelog

### 2026-03-31
- Fixed Leads table layout - columns no longer cut off on right side
- Used colgroup with percentage-based widths for proper scaling
- Updated CSS to prevent horizontal overflow

### Previous Session
- Fixed ValidationError in LeadResponse Pydantic model
- Created migrate-to-lead endpoint for legacy customers
- Implemented auto-redirect from customer URLs to lead profiles
- Converted Tasks preview to Slide-In panel with Deals/AI Score
- Added time-based filter to Pipeline board
- Integrated dynamic global currency via AuthContext
- Fixed iOS Safari white-screen scroll bug
- Applied responsive table fixes across Leads, Tasks, Customers
