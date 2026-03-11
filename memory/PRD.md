# AISalesTask CRM Platform - PRD

## Original Problem Statement
Build an AI-powered CRM with Lead Management, Pipeline & Deals, Analytics Dashboard, and AI features.

## Latest Update (March 11, 2026)

### Add Lead Slide-In Panel (NEW)
- ✅ **Slide-in panel from right** - Mac-style side scroll panel replaces modal
- ✅ **CLINIC / COMPANY INFO section**: Company Name, Country dropdown, State/Location, City, Postcode, Company Size, Full Address, Website
- ✅ **PERSON IN CHARGE (PIC) section**: PIC Name, Job Title  
- ✅ **CONTACT DETAILS section**: Mobile Number, Office Number, Fax Number, Email
- ✅ **Pipeline Status dropdown**: New/Contacted/No Answer/Interested/Follow Up/Booked/Won/Lost
- ✅ **Click outside to close** - Overlay click slides panel back

### Log Activity Buttons Fixed (Lead Detail Page)
- ✅ **Task button** - Opens modal with Task Title, Due Date, Notes
- ✅ **Call button** - Opens modal with Call Summary, Call Duration (5-60 min), Notes
- ✅ **WhatsApp button** - Navigates to `/whatsapp?leadId={id}` with pre-selected contact
- ✅ **Email button** - Opens modal with Email Subject, Notes
- ✅ **Meeting button** - Opens modal with Meeting Title, Date/Time, Notes

### Previous Updates (March 11, 2026)

**UI/Navigation Changes**
- ✅ Removed Worklist tab from sidebar
- ✅ Removed Clients tab from sidebar
- ✅ Color scheme reverted to Gold (#D4A017)

**Leads Page Redesign**
- ✅ Updated table columns: Company Name, POC Name, Mobile/Office, Email, Location, State, Country, Status, AI Score
- ✅ Clickable lead rows navigate to detail page

**Lead Detail Page (`/leads/:id`)**
- ✅ Full contact info, pipeline status, activity timeline
- ✅ Log Activity buttons now functional
- ✅ Backend endpoints for activities

## Code Architecture
```
/app/
├── backend/server.py           # FastAPI (~3700 lines)
├── frontend/src/
│   ├── components/
│   │   ├── SlideInPanel.jsx    # NEW: Mac-style slide-in panel from right
│   │   ├── ActionDropdown.jsx  # React Portal (z-index: 9999)
│   │   ├── Modal.jsx           # Fixed modal component
│   │   └── Layout.jsx          # Sidebar navigation
│   ├── pages/
│   │   ├── LeadDetailPage.jsx  # Lead detail with activity logging modals
│   │   ├── Leads.jsx           # Uses SlideInPanel for Add/Edit Lead
│   │   ├── CalendarPage.jsx    # Full calendar with event modal
│   │   ├── WhatsAppMessages.jsx # Auto-selects lead from URL param
│   │   └── ...
│   └── index.css               # Gold theme (#D4A017)
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
