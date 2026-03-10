# AISalesTask CRM Platform - PRD

## Original Problem Statement
Build an AI-powered HubSpot CRM clone with Lead Management, Pipeline & Deals (Kanban), Basic Analytics Dashboard, and AI features. Multi-tenancy, RBAC, Excel Import, and comprehensive sales workflow.

## Latest Update (March 2026)

### Bug Fixes Completed
1. **ActionDropdown Not Working** - Fixed by using React Portal (`createPortal` to `document.body`) with z-index: 9999
2. **Excel Import in Customers** - Added `/api/customers` endpoint (alias for contacts)
3. **Color Scheme Update** - Changed from gold (#f5c77a) to blue (#A0C4FF) throughout the app

### New Features Implemented
4. **Calendar Page** (`/calendar`)
   - Month/Week/Day view switcher
   - Event CRUD with color coding
   - Navigation (prev/next/today)
   - Google Calendar sync ready (credentials in Settings)

5. **WhatsApp Messages Page** (`/whatsapp`)
   - Contact list from leads
   - Chat interface with messages
   - Message templates
   - Local storage (external API MOCKED)

6. **Dashboard Color Overhaul**
   - Dynamic gradient colors for stats cards
   - Blue (#A0C4FF) primary accent
   - Gradient backgrounds for cards

### Previous Updates
- Leads page: New columns, checkboxes, state filter, AI calling buttons
- Tasks page: PDF-spec columns (NO., Company Name, Deal, Status, PIC Name, etc.)
- Pipeline: Linked companies feature
- Customers: Table layout with preview

## Code Architecture
```
/app/
├── backend/server.py           # FastAPI (3500+ lines - needs refactoring)
├── frontend/src/
│   ├── components/
│   │   ├── ActionDropdown.jsx  # React Portal dropdown (z-index fix)
│   │   ├── Layout.jsx          # Navigation with Calendar, WhatsApp
│   │   └── ...
│   ├── pages/
│   │   ├── CalendarPage.jsx    # NEW: Full calendar
│   │   ├── WhatsAppMessages.jsx # NEW: Messaging interface
│   │   ├── Dashboard.jsx       # Updated colors
│   │   ├── Leads.jsx           # Updated form/table
│   │   ├── Tasks.jsx           # PDF spec columns
│   │   └── ...
│   └── index.css               # Blue color scheme (#A0C4FF)
```

## Key API Endpoints

### Calendar
- GET/POST /api/calendar/events
- GET/PUT/DELETE /api/calendar/events/{id}

### WhatsApp
- GET /api/whatsapp/messages/{contact_id}
- POST /api/whatsapp/send (MOCKED - stores locally)

### Customers (alias for Contacts)
- GET/POST /api/customers
- GET/PUT/DELETE /api/customers/{id}
- POST /api/customers/import

## Pending Tasks

### P0 - Critical
- ✅ ActionDropdown fix (Done)
- ✅ Calendar page (Done)
- ✅ WhatsApp interface (Done)
- ⏳ Rebrand to "AISalesTask.com"

### P1 - Important
- ⏳ Google Calendar OAuth integration (UI ready)
- ⏳ WhatsApp Business API integration
- AI Call Agent integration (Twilio/Bland.ai)

### P2 - Nice to Have
- Data export (CSV/Excel)
- Custom report builder
- Backend refactoring (split server.py)

## Test Credentials
- Email: testadmin2@example.com
- Password: Password123!

## MOCKED Features
- WhatsApp external API (messages stored locally)
- AI Calling/WhatsApp buttons (placeholders)
