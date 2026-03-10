# AISalesTask CRM Platform - PRD

## Original Problem Statement
Build an AI-powered CRM with Lead Management, Pipeline & Deals, Analytics Dashboard, and AI features.

## Latest Update (March 2026)

### Completed Changes

**1. Rebranding to AISalesTask**
- ✅ Login page: "AISalesTask" title and branding
- ✅ Register page: "AISalesTask" branding  
- ✅ Sidebar: "AISalesTask v2.0" logo
- ✅ Browser tab: "AISalesTask | AI-Powered Sales Platform"

**2. Create Event Modal Fix**
- ✅ Fixed modal CSS (z-index: 9998/9999, proper centering)
- ✅ Modal now displays fully with all form fields visible
- ✅ Max height prevents overflow

**3. WhatsApp Lead Navigation**
- ✅ Added "WhatsApp" option in lead action dropdown (green icon)
- ✅ Clicking navigates to `/whatsapp?leadId={id}` 
- ✅ WhatsApp page auto-selects the lead on load
- ✅ User can go back to contact list to chat with others

### Previous Updates
- ActionDropdown using React Portal (z-index fix)
- Calendar page with Month/Week/Day views
- WhatsApp messaging interface
- Color scheme changed to blue (#A0C4FF)
- PDF-spec UI for Leads, Tasks, Pipeline, Customers

## Code Architecture
```
/app/
├── backend/server.py           # FastAPI
├── frontend/src/
│   ├── components/
│   │   ├── ActionDropdown.jsx  # React Portal (z-index: 9999)
│   │   ├── Modal.jsx           # Fixed modal component
│   │   └── Layout.jsx          # "AISalesTask" branding
│   ├── pages/
│   │   ├── CalendarPage.jsx    # Full calendar with event modal
│   │   ├── WhatsAppMessages.jsx # Auto-selects lead from URL param
│   │   ├── Leads.jsx           # WhatsApp action in dropdown
│   │   ├── Login.jsx           # "AISalesTask" branding
│   │   └── Register.jsx        # "AISalesTask" branding
│   └── index.css               # Blue theme, modal fixes
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
- Email: testadmin2@example.com
- Password: Password123!

## MOCKED Features
- WhatsApp external API (messages stored locally)
- AI Calling button (placeholder)
- Google Calendar OAuth (credentials UI ready)
