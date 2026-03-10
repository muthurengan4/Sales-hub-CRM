# AISalesTask CRM Platform - PRD

## Original Problem Statement
Build an AI-powered HubSpot CRM clone with Lead Management, Pipeline & Deals (Kanban), Basic Analytics Dashboard, and AI features powered by Claude Sonnet 4.5. Later expanded to include Multi-tenancy, Role-Based Access Control (RBAC), Excel Import, Enhanced Analytics, comprehensive sales workflow, and AI CRM features.

## Latest Update (March 2026) - PDF Specification Implementation

### Completed UI/UX Overhaul

**1. Leads Page (Picture 2 in PDF)**
- ✅ New table columns: Name, Company Name, Contact, Mobile/Office, Email, Location, State, Country, Status, AI Score
- ✅ Checkboxes for multi-select with selection counter
- ✅ "Start AI Calling" and "Start AI WhatsApp" placeholder buttons
- ✅ "All States/Areas" filter dropdown populated from database
- ✅ New form sections: Clinic/Company Info, Person in Charge (PIC), Location, Contact Details
- ✅ New form fields: Website, PIC Name, Office Number, Fax Number, Country, Pipeline Status

**2. Tasks Page (Picture 10, 11 in PDF)**
- ✅ New table columns: NO., Company Name, Deal, Status, PIC Name, Sales Person, Reg Time, Payment
- ✅ Filter dropdowns: All Deals, All Statuses, All Sales Person, All Payment
- ✅ Task-to-Deal linking in create/edit form
- ✅ Summary stats cards (Total Tasks, Pending, Total Payable, Total Paid)

**3. Pipeline Page (Picture 7, 8, 9 in PDF)**
- ✅ Linked companies feature - link multiple leads/customers to deals
- ✅ Company search in Create/Edit Deal form
- ✅ Linked companies display on deal cards
- ✅ Deal detail modal showing full linked companies list
- ✅ ActionDropdown component replacing old dropdown (z-index fix)

**4. Customers Page (Picture 13, 14 in PDF)**
- ✅ Table layout with columns: Company Name, PIC/Doctor, Role, Mobile, Email, Status
- ✅ Preview button for quick access
- ✅ ActionDropdown for edit/delete actions

**5. ActionDropdown Component (Z-Index Fix)**
- ✅ Created reusable component with fixed positioning (z-index: 70)
- ✅ Applied to all table-based pages (Leads, Tasks, Clients, Customers, Pipeline)
- ✅ Dropdowns now appear above table content correctly

### Previous Updates (December 2025)
- Assignment System: 4 modes (manual, round-robin, territory, default agent)
- Call-Based Pipeline: New → Contacted → No Answer → Interested → Follow Up → Booked → Won/Lost
- Lead-to-Client Conversion with service tracking
- Clients page for converted leads
- "Contacts" renamed to "Customers"

## Code Architecture
```
/app/
├── backend/
│   ├── server.py           # Monolithic FastAPI (needs refactoring)
│   ├── tests/              # pytest test files
│   └── .env
├── frontend/src/
│   ├── App.js
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── Pagination.jsx
│   │   ├── ActionDropdown.jsx  # NEW: Fixed-position dropdown
│   │   ├── NotificationsDropdown.jsx
│   │   └── AssignmentSettings.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Worklist.jsx
│   │   ├── Leads.jsx           # UPDATED: New columns, form, filters
│   │   ├── Tasks.jsx           # UPDATED: New columns, deal linking
│   │   ├── Pipeline.jsx        # UPDATED: Linked companies
│   │   ├── Customers.jsx       # UPDATED: Table layout
│   │   ├── Clients.jsx
│   │   ├── Users.jsx
│   │   ├── Settings.jsx
│   │   ├── CustomerProfile.jsx
│   │   └── Organization.jsx
│   └── index.css
```

## Key API Endpoints

### New/Updated Endpoints
- GET /api/lookup/states - Unique states from leads for filtering
- GET /api/lookup/companies - Leads/customers for deal linking
- GET /api/lookup/sales-persons - Users for assignment dropdowns
- GET/POST/PUT/DELETE /api/customers - Customer CRUD (alias for contacts)
- POST /api/customers/import - Excel import for customers

### Updated Models
- **Lead**: Added website, pic_name, office_number, fax_number, country, pipeline_status
- **Deal**: Added linked_company_ids array, linked_companies populated list
- **Task**: Added deal_id, deal_name, company_name, pic_name, reg_time

## Pending/Future Tasks

### P0 - Critical
- ✅ UI Overhaul (Done)
- ✅ Dropdown z-index fix (Done)
- ⏳ Rebrand to "AISalesTask.com" (logo, favicon, name)

### P1 - Important
- ⏳ Google Calendar OAuth integration (credentials storage ready)
- AI Call Agent integration (Twilio/Bland.ai/Vapi)
- Email notifications
- Data export (CSV/Excel)

### P2 - Nice to Have
- Custom report builder
- Automation workflows
- Mobile app

### Refactoring Needed
- **CRITICAL**: Split server.py (~3500 lines) into domain routers
- Abstract repeated table logic into hooks/components

## Test Credentials
- Email: testadmin2@example.com
- Password: Password123!

## Known Mocked Features
- AI Calling button (placeholder)
- AI WhatsApp button (placeholder)
- Google Calendar integration (credentials storage ready, OAuth not connected)
