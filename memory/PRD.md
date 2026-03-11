# AISalesTask CRM Platform - PRD

## Original Problem Statement
Build an AI-powered CRM with Lead Management, Pipeline & Deals, Analytics Dashboard, and AI features.

## Latest Update (March 11, 2026)

### UI/Navigation Changes
- ✅ **Removed Worklist tab** from sidebar navigation
- ✅ **Removed Clients tab** from sidebar navigation
- ✅ **Color scheme reverted** from blue (#A0C4FF) back to Gold (#D4A017)

### Leads Page Redesign
- ✅ **Updated table columns** in order: Company Name, POC Name, Mobile/Office, Email, Location, State, Country, Status, AI Score
- ✅ **Clickable lead rows** - Navigate to lead detail page on click

### New Lead Detail Page (`/leads/:id`)
- ✅ **Header**: Back button, Lead name, "Detail View" subtitle, Edit and "Convert to Customer" buttons
- ✅ **Left sidebar - Contact Info**: Company Name, Mobile, Office, Fax, Email, Website, Location, Country
- ✅ **Left sidebar - Pipeline section**: Status badge, AI Score, Last Contact, Owner
- ✅ **Middle section - Activity tabs**: Activity, Notes, Emails, Calls, Tasks, WhatsApp, Meetings
- ✅ **Middle section - Log Activity**: Task, Call, WhatsApp, Email, Meeting buttons
- ✅ **Middle section - Update Pipeline Status**: New, Qualified, Proposal, Negotiation, Sales Closed tabs with remark textarea
- ✅ **Right sidebar**: Company section, Deals section with "+Add", AI Score display with progress bar
- ✅ **Backend endpoints**: `/api/leads/{id}/activities` for GET and POST activity logging

### Previous Session (March 10, 2026)

**Excel Import Enhancement**
- ✅ Excel import working correctly
- ✅ Enhanced column mapping for 40+ variations
- ✅ Improved error messages

**Rebranding & Fixes**
- ✅ Rebranded to "AISalesTask"
- ✅ Fixed modal CSS issues
- ✅ WhatsApp lead navigation

## Code Architecture
```
/app/
├── backend/server.py           # FastAPI (~3700 lines)
├── frontend/src/
│   ├── components/
│   │   ├── ActionDropdown.jsx  # React Portal (z-index: 9999)
│   │   ├── Modal.jsx           # Fixed modal component
│   │   └── Layout.jsx          # Sidebar navigation (no Worklist/Clients)
│   ├── pages/
│   │   ├── LeadDetailPage.jsx  # NEW: Full lead detail view with activity logging
│   │   ├── Leads.jsx           # Updated table columns, clickable rows
│   │   ├── CalendarPage.jsx    # Full calendar with event modal
│   │   ├── WhatsAppMessages.jsx # Auto-selects lead from URL param
│   │   ├── Login.jsx           # Gold theme
│   │   └── Register.jsx        # Gold theme
│   └── index.css               # Gold theme (#D4A017)
└── frontend/public/
    └── index.html              # "AISalesTask" title
```

## Key Features

### WhatsApp Lead Flow
1. User views Leads table
2. Clicks action dropdown → "WhatsApp" 
3. Navigates to `/whatsapp?leadId=xxx`
4. WhatsApp page auto-selects that lead
5. User can send messages or click other contacts

### Calendar
- Month/Week/Day views
- Event CRUD with color coding
- Navigation (prev/next/today)
- Google Calendar sync ready

## Test Credentials
- Email: admin@testcrm.com
- Password: Password123!
- Role: ORG_ADMIN

## Upcoming Tasks (Priority Order)
1. **P0: Google Calendar Integration** - UI complete, OAuth sync logic pending
2. **P1: AI Calling/WhatsApp Integration** - Requires Twilio or similar service
3. **P2: Data Export (CSV)** - Export functionality for customers/leads

## Future Tasks (Backlog)
- Progress indicator for large imports
- Custom report builder
- Interactive dashboard charts with drill-downs
- In-app chat between users
- Automated follow-up sequences

## Refactoring Needed
- `server.py` is 3600+ lines - recommend splitting into modular route files

## MOCKED Features
- WhatsApp external API (messages stored locally)
- AI Calling button (placeholder)
- Google Calendar OAuth (credentials UI ready)
