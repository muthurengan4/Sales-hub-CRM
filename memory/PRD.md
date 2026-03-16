# AISalesTask CRM Platform - PRD

## Original Problem Statement
Build an AI-powered CRM with Lead Management, Pipeline & Deals, Analytics Dashboard, and AI features.

## Latest Update (March 16, 2026) - AI Calling Features

### AI Calling Implementation
1. ✅ **"Start AI Calling" Button** - Added to Lead Detail page header (blue phone icon)
2. ✅ **AI Call Modal** with:
   - AI Agent selection (Sarah, Michael, Emma) with avatars and descriptions
   - Deal selection dropdown (mandatory - to discuss specific deal)
   - Phone number display (auto-filled from lead)
   - "Start Call" and "Cancel" buttons
3. ✅ **Knowledge Base Upload** - Added to Pipeline "Create Deal" form
   - Optional upload for PDF, DOC, TXT files (Max 10MB)
   - Purpose: Train AI to speak about the deal
4. ✅ **AI Call Activity Timeline** - Shows AI calls in activity timeline
   - Clickable to open Call Details modal
   - Shows "AI Call" badge
5. ✅ **Call Details Modal** with:
   - Agent Name, Date, Time, Source, Direction
   - Summary of the call
   - Recording audio player (placeholder)
6. ✅ **Backend API Endpoints**:
   - POST `/api/ai-calls/initiate` - Initiate AI call
   - GET `/api/ai-calls/lead/{lead_id}` - Get AI calls for a lead

**Note:** AI Calling is MOCKED - actual integration with Twilio Voice or Bland.ai pending.

## Previous Update (March 16, 2026) - Batch 2

### 10 Corrections Implemented
1. ✅ **Mobile Responsive** - Added CSS media queries for mobile (375px+), tablet (769-1024px) breakpoints
2. ✅ **Lead Detail - Full Address** - Left sidebar now shows Contact Info, Address (postcode, city, state, country), Additional Details, Ownership
3. ✅ **Deal Selection Mandatory** - "Associate with Deal" now required with red asterisk and validation
4. ✅ **AI Score Configuration** - New Settings section showing base scores by pipeline stage (Lead:20, Qualified:40, Proposal:60, Negotiation:75, Sales Closed:100, Lost:0)
5. ✅ **Pipeline "New" → "Lead"** - Changed first stage from "New" to "Lead" everywhere
6. ✅ **Task Auto-creation Fixed** - Tasks now auto-created when pipeline status is updated with a deal
7. ✅ **Tasks - Deal Cost** - Deal column now shows deal name + RM amount below
8. ✅ **Tasks - Removed Status from Edit** - Status field removed from task edit form
9. ✅ **Customers - Clickable Company Name** - Company name directly opens preview panel (removed separate Preview button)
10. ✅ **Customers - Open Full Profile** - Now navigates to lead detail page if customer was converted from a lead

### Additional Fixes
- AI Score auto-updates based on pipeline status changes (backend updated)
- Backend calculates score: base_score + bonus points (email:+5, phone:+5, company:+5, notes:+5)

## Previous Update (March 16, 2026) - Batch 1
1. ✅ **Dashboard** - Analytics data already dynamically updates based on activities
2. ✅ **Lead Detail - Pipeline Status Update** - Added "Associate with Deal" dropdown showing all deals dynamically, comment textarea, Save Update button
3. ✅ **Lead Detail - Activity Summary** - Replaced "Company" section with "Activity Summary" showing Total Activities, AI Calls, WhatsApp, AI Score
4. ✅ **Lead Detail - Deals Section** - Removed "+ Add" button, now only shows associated deals
5. ✅ **Lead Detail - Convert to Customer** - If lead is already converted, button changes to "Customer" badge (green)
6. ✅ **Pipeline Page - Lost Stage** - Added "Lost" as 6th pipeline stage (Lead, Qualified, Proposal, Negotiation, Sales Closed, Lost)
7. ✅ **Pipeline Page - Date Picker** - Date field now has `showPicker()` to open calendar on click
8. ✅ **Tasks Page - New Column Order**: NO., COMPANY NAME, PIC NAME, DEAL, PIPELINE, COMMENTS, DATE & TIME, PAYMENT

### Text Changes
- ✅ Changed "POC Name" to "PIC Name" in Leads page
- ✅ Changed "Convert to Client" to "Convert to Customer" everywhere

## Previous Updates (March 13, 2026)

### Twilio WhatsApp Integration (NEW - March 13, 2026)
- ✅ **Backend integration** - Twilio SDK installed and configured
- ✅ **Settings page section** - New "Twilio WhatsApp Integration" card in Settings
  - Account SID input
  - Auth Token input (masked)
  - WhatsApp Number input
  - Setup instructions with links to Twilio console
  - Enable/Test Connection button
- ✅ **WhatsApp send endpoint updated** - `/api/whatsapp/send` now uses Twilio when configured
- ✅ **Test connection endpoint** - `/api/twilio/test-connection` to verify credentials
- ✅ **AI Features status** - Shows "Active" for WhatsApp when Twilio is connected

### Customers Page Redesign (NEW - March 13, 2026)
- ✅ **Table redesign**: Columns - COMPANY NAME, PIC/DOCTOR, ROLE, MOBILE, EMAIL, STATUS
- ✅ **Colored avatars**: 7 colors cycling (amber, emerald, purple, blue, pink, cyan, orange)
- ✅ **Company name column**: Avatar + name + "Preview" button + industry/location below
- ✅ **Role badges**: Owner (red), PIC (blue), Doctor (green), Manager (purple), Staff (gray)
- ✅ **Preview slide-in panel**: Opens on "Preview" button click
  - Green header with avatar, name, title, email link
  - ABOUT THIS CONTACT section with all fields
  - DEALS section with linked deals and "+ Add Deal" button
  - COMMENTS section with Add remark input (MOCKED - not persisted)
  - "Open Full Profile" and "Cancel" buttons in footer

### Tasks Page Redesign (NEW)
- ✅ **Slide-in panel for Add/Edit Task** - Opens from right side (matches screenshot design)
- ✅ **Simplified table columns**: NO., COMPANY NAME, DEAL, STATUS, PIC NAME
- ✅ **Tasks sync with Pipeline Deals** - Deal dropdown links tasks to pipeline deals
- ✅ **Auto-fill PIC Name** - When selecting a company, PIC Name auto-fills from lead data
- ✅ **Form fields**: Company Name*, Deal*, Status*, PIC Name (auto-filled), Sales Person*, Payment*
- ✅ **Status badges**: Shows Lead/Customer with colored badges
- ✅ **Deal names in primary color** - Linked deals displayed in gold/amber color
- ✅ **Action dropdown**: Edit, Sync to Calendar, Delete options
- ✅ **Deals filter dropdown** - Filter tasks by specific deals

## Previous Updates

### Update (March 11, 2026)

### Pipeline Page Enhancements (NEW)
- ✅ **Pipeline stages updated**: Lead, Qualified, Proposal, Negotiation, Sales Closed (5 stages)
- ✅ **Deal cards show linked companies**: Green icon with clinic name, "+X more" for multiple companies
- ✅ **Deal Detail slide-in panel**: Opens when clicking a deal card
  - Shows DEAL TITLE, DEAL VALUE, EXPECTED CLOSE
  - PIPELINE STAGE tabs (clickable to update stage)
  - LINKED COMPANIES section with company cards
- ✅ **Company cards show**: Avatar with initials, name, industry, PIC, Mobile, Location, View button
- ✅ **Create/Edit Deal slide-in panels** with LINK COMPANIES section (search + checkboxes)

### Add Lead Slide-In Panel
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
