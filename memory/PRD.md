# AI CRM Application - Product Requirements Document

## Original Problem Statement
Build a comprehensive AI-powered CRM system with the following core features:
- Lead management with AI scoring
- Deal pipeline management with per-lead status tracking
- Customer relationship tracking
- Task management with auto-sync to deals
- AI calling integration with ElevenLabs
- WhatsApp messaging via Twilio
- Google Calendar integration

## Architecture
- **Frontend:** React with Tailwind CSS, Shadcn UI, Framer Motion
- **Backend:** FastAPI (Python) with MongoDB
- **Database:** MongoDB via motor (async driver)

## Key Data Models

### Lead-Deal Linkage System (NEW)
The system now supports **per-lead pipeline status** for deals:
- A deal can be assigned to multiple leads
- Each lead maintains its own `pipeline_status` for that deal
- Updating one lead's status does NOT affect other leads

**Collection:** `lead_deal_linkages`
```json
{
  "id": "uuid",
  "lead_id": "lead-uuid",
  "deal_id": "deal-uuid",
  "pipeline_status": "lead|qualified|proposal|negotiation|sales_closed|lost",
  "notes": "optional notes",
  "organization_id": "org-uuid",
  "created_at": "ISO date",
  "updated_at": "ISO date"
}
```

### Key Collections
- `users` - User accounts
- `organizations` - Organization settings
- `organization_settings` - Includes `ai_agents` array for ElevenLabs
- `leads` - Lead records
- `deals` - Deal templates/products
- `lead_deal_linkages` - Per-lead deal status (NEW)
- `tasks` - Task records with `pipeline_status`
- `customers` - Customer records
- `ai_calls` - AI call logs

## Key Pages
1. Dashboard - Overview metrics and charts with interactive filters (Pipeline, Lead Status, Date Range)
2. Leads - Lead management with AI calling
3. Pipeline - Kanban view of lead-deal linkages
4. Tasks - Task management with deal auto-sync
5. Customers - Customer profiles with colored avatars
6. Calendar - Event scheduling
7. Settings - Organization configuration (including AI agents)

## What's Been Implemented (as of March 2026)

### Core Features
- [x] User authentication (JWT-based)
- [x] Organization management
- [x] Lead CRUD operations
- [x] Deal pipeline with drag-and-drop
- [x] **Lead-Deal Linkage System** - Per-lead pipeline status
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
- [x] ElevenLabs AI Agent configuration
- [x] Google Calendar placeholder UI

### Mobile Responsiveness
- [x] Dashboard - 2x2 stat grid on mobile, filters hidden
- [x] Leads page - Simplified table: Checkbox, Company, Status, AI Score, Actions
- [x] Tasks page - Company Name, Pipeline, Payment columns with expandable dropdown showing Deal, Date, Notes
- [x] Customers page - Company Name with avatar, Role, Status with expandable dropdown showing PIC, Phone, Email
- [x] Pipeline page - Horizontally scrollable kanban board
- [x] LeadDetailPage - responsive layout

### Recent Updates (March 18, 2026)
- Implemented Lead-Deal Linkage system
- Same deal can now have different statuses for different leads
- Pipeline shows lead-deal combinations with individual statuses
- Tasks track pipeline_status per lead-deal combination
- **Dashboard Filters** - Added interactive filters for Pipeline Status, Lead Status, and Date Range
  - Filters update all dashboard metrics (Total Leads, Active Deals, Pipeline Value, Won Revenue)
  - Charts and data visualizations respond to filter selections
  - Clear Filters button to reset all filters to default
  - **Lead Status filter now shows Pipeline stages** (Lead, Qualified, Proposal, Negotiation, Sales Closed, Lost) - matching Pipeline page tabs
- **Leads Page Filter Fixed** - Status filter now correctly filters by `pipeline_status` field

### Recent Updates (March 21, 2026)
- **AI Call Audio Player Fixed** ✅
  - Fixed audio playback issue where browser `<audio>` tags couldn't send JWT headers
  - Implemented blob-based audio loading with fetch + Authorization header
  - Added Play/Pause button, progress indicator, volume control, and download button
  - Audio successfully loads and plays from ElevenLabs recordings
- **Client Interest Level Feature** ✅
  - Added interest level tracking for AI calls (Interested, Not Interested, Maybe, Follow-up Needed)
  - Interest level buttons in Call Details modal with visual selection feedback
  - Backend endpoint `PUT /api/ai-calls/{call_id}/interest` stores interest data
  - Interest level persisted in database with timestamps and user attribution

## API Endpoints

### AI Calls
- `POST /api/ai-calls/initiate` - Start AI call with ElevenLabs
- `GET /api/ai-calls/lead/{lead_id}` - Get all AI calls for a lead
- `GET /api/ai-calls/{call_id}/details` - Get call details with transcript and summary
- `GET /api/ai-calls/{call_id}/audio` - Stream audio recording (requires JWT auth)
- `PUT /api/ai-calls/{call_id}/interest` - Update client interest level

### Lead-Deal Linkages (NEW)
- `GET /api/lead-deal-linkages` - Get all linkages (filter by lead_id, deal_id)
- `POST /api/lead-deal-linkages` - Create or update linkage
- `PUT /api/lead-deal-linkages/{id}` - Update linkage
- `DELETE /api/lead-deal-linkages/{id}` - Delete linkage

### Other Key Endpoints
- `/api/auth/*` - Authentication
- `/api/leads/*` - Lead management
- `/api/deals/*` - Deal management
- `/api/tasks/*` - Task management
- `/api/customers/*` - Customer management
- `/api/ai-agents` - AI Agent CRUD

## Prioritized Backlog

### P0 - Critical
- [x] Per-lead pipeline status system ✅ DONE
- [x] ElevenLabs AI Calling Integration ✅ DONE
- [x] Twilio WhatsApp Integration ✅ DONE

### P1 - High Priority
- [ ] Implement Google Calendar sync logic
- [ ] Backend for Knowledge Base file processing
- [ ] ElevenLabs Conversational AI dashboard setup (requires ElevenLabs account configuration)

### P2 - Medium Priority
- [x] Populate AI Call Detail modal with real data ✅ DONE
- [ ] Export to CSV functionality
- [ ] Custom report builder

## AI Integration Details

### ElevenLabs Conversational AI (CONFIGURED)
- **API Key:** Configured in backend/.env
- **Available Voices:** 44+ voices available via `/api/elevenlabs/voices`
- **Endpoints:**
  - `POST /api/ai-calls/initiate` - Start single AI call with context
  - `POST /api/ai-calls/batch` - Batch AI calls to multiple leads
  - `GET /api/elevenlabs/voices` - List available voices
- **Features:**
  - Dynamic script generation from lead/deal context
  - Knowledge base integration from deals
  - Call purpose types: follow_up, appointment, qualification, custom
  
### Twilio WhatsApp (CONFIGURED)
- **Account SID & Auth Token:** Configured in backend/.env
- **Endpoints:**
  - `POST /api/whatsapp/send` - Manual message sending
  - `POST /api/whatsapp/ai-send` - AI-powered personalized messages
  - `POST /api/whatsapp/batch` - Batch messaging to multiple leads
- **Features:**
  - AI-generated personalized messages
  - Message types: follow_up, appointment, introduction, thank_you
  - Full message history tracking

### Technical Debt
- [ ] **CRITICAL:** Refactor server.py (4000+ lines) into modular APIRouter files
  - routes/auth.py
  - routes/leads.py
  - routes/deals.py
  - routes/tasks.py
  - routes/customers.py
  - routes/ai_agents.py
  - routes/linkages.py
  - routes/settings.py

## Test Credentials
- Email: test@test.com
- Password: Password123!
