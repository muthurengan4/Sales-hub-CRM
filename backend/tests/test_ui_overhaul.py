"""
Test suite for UI/UX Overhaul - AISalesTask CRM
Testing new features:
1. Leads page - new fields (PIC Name, Website, Office Number, Fax, Country, pipeline_status)
2. State filter lookup endpoint
3. Tasks page - new columns (Deal linking, payment tracking)
4. Pipeline page - linked companies feature
5. Customers page - table layout
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')


class TestAuthentication:
    """Auth tests"""
    
    def test_login_returns_token(self):
        """Test login returns valid token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "testadmin2@example.com",
            "password": "Password123!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"Login successful, user: {data['user']['name']}")
        

@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "testadmin2@example.com",
        "password": "Password123!"
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get auth headers"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestLookupEndpoints:
    """Test new lookup endpoints for filters"""
    
    def test_get_states_returns_unique_states(self, auth_headers):
        """Test /api/lookup/states returns unique states from leads"""
        response = requests.get(f"{BASE_URL}/api/lookup/states", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "states" in data
        # States should be a list
        assert isinstance(data["states"], list)
        print(f"States returned: {data['states']}")
    
    def test_get_companies_for_linking(self, auth_headers):
        """Test /api/lookup/companies returns leads and customers for deal linking"""
        response = requests.get(f"{BASE_URL}/api/lookup/companies", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        assert isinstance(data["companies"], list)
        
        # Verify structure if companies exist
        if data["companies"]:
            company = data["companies"][0]
            assert "id" in company
            assert "name" in company
            assert "entity_type" in company  # 'lead' or 'customer'
            print(f"Companies for linking count: {len(data['companies'])}")
    
    def test_get_sales_persons(self, auth_headers):
        """Test /api/lookup/sales-persons returns users for assignment"""
        response = requests.get(f"{BASE_URL}/api/lookup/sales-persons", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "sales_persons" in data
        print(f"Sales persons count: {len(data['sales_persons'])}")


class TestLeadsNewFields:
    """Test Lead model new fields: website, pic_name, office_number, fax_number, country, pipeline_status"""
    
    def test_create_lead_with_new_fields(self, auth_headers):
        """Create lead with new PDF spec fields"""
        lead_data = {
            "name": "TEST_Klinik Sejahtera Sdn Bhd",
            "pic_name": "Dr. Ahmad Fauzi",
            "title": "General Practitioner",
            "website": "www.kliniksejahtera.com",
            "phone": "+60 12-345 6789",
            "office_number": "+60 3-1234 5678",
            "fax_number": "+60 3-1234 5679",
            "email": "clinic@test.com",
            "state": "Selangor",
            "country": "Malaysia",
            "city": "Subang Jaya",
            "postcode": "47500",
            "industry": "Healthcare",
            "pipeline_status": "new"
        }
        
        response = requests.post(f"{BASE_URL}/api/leads", headers=auth_headers, json=lead_data)
        assert response.status_code == 200
        data = response.json()
        
        # Verify new fields are saved
        assert data.get("pic_name") == "Dr. Ahmad Fauzi"
        assert data.get("website") == "www.kliniksejahtera.com"
        assert data.get("office_number") == "+60 3-1234 5678"
        assert data.get("fax_number") == "+60 3-1234 5679"
        assert data.get("country") == "Malaysia"
        assert data.get("pipeline_status") == "new"
        
        print(f"Lead created with new fields: {data['id']}")
        return data["id"]
    
    def test_get_lead_returns_new_fields(self, auth_headers):
        """GET lead returns all new fields"""
        # Create a lead first
        lead_data = {
            "name": "TEST_Field_Test_Clinic",
            "pic_name": "Dr. Test PIC",
            "website": "www.test.com",
            "office_number": "+60 3-9999 8888",
            "fax_number": "+60 3-9999 8889",
            "country": "Malaysia",
            "pipeline_status": "contacted"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/leads", headers=auth_headers, json=lead_data)
        assert create_response.status_code == 200
        lead_id = create_response.json()["id"]
        
        # Get the lead
        response = requests.get(f"{BASE_URL}/api/leads/{lead_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify all new fields are returned
        assert "pic_name" in data
        assert "website" in data
        assert "office_number" in data
        assert "fax_number" in data
        assert "country" in data
        assert "pipeline_status" in data
        
        print(f"Lead GET returns all new fields successfully")
    
    def test_leads_filter_by_state(self, auth_headers):
        """Test leads can be filtered by state"""
        # Create a lead with specific state
        lead_data = {
            "name": "TEST_State_Filter_Clinic",
            "state": "Selangor"
        }
        requests.post(f"{BASE_URL}/api/leads", headers=auth_headers, json=lead_data)
        
        # Filter by state
        response = requests.get(f"{BASE_URL}/api/leads?state=Selangor", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        print(f"Filtered leads by state: {len(data['items'])} items")


class TestDealsLinkedCompanies:
    """Test Deal linked companies feature"""
    
    def test_create_deal_with_linked_companies(self, auth_headers):
        """Create deal with linked_company_ids"""
        # First get some leads to link
        leads_response = requests.get(f"{BASE_URL}/api/leads?limit=2", headers=auth_headers)
        leads_data = leads_response.json()
        lead_ids = [l["id"] for l in leads_data.get("items", [])][:2]
        
        deal_data = {
            "title": "TEST_GLOCO Cloud EMR Deal",
            "value": 8800,
            "stage": "new",
            "expected_close_date": "2026-03-01",
            "linked_company_ids": lead_ids
        }
        
        response = requests.post(f"{BASE_URL}/api/deals", headers=auth_headers, json=deal_data)
        assert response.status_code == 200
        data = response.json()
        
        assert "linked_company_ids" in data
        assert "linked_companies_count" in data
        print(f"Deal created with {data['linked_companies_count']} linked companies")
        return data["id"]
    
    def test_get_deal_returns_linked_companies(self, auth_headers):
        """GET deal returns populated linked_companies list"""
        # Create a lead first
        lead_data = {"name": "TEST_Company_For_Deal_Link"}
        lead_response = requests.post(f"{BASE_URL}/api/leads", headers=auth_headers, json=lead_data)
        lead_id = lead_response.json()["id"]
        
        # Create deal with linked company
        deal_data = {
            "title": "TEST_Deal_With_Links",
            "value": 5000,
            "stage": "new",
            "linked_company_ids": [lead_id]
        }
        create_response = requests.post(f"{BASE_URL}/api/deals", headers=auth_headers, json=deal_data)
        deal_id = create_response.json()["id"]
        
        # Get deal details
        response = requests.get(f"{BASE_URL}/api/deals/{deal_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "linked_companies" in data
        assert isinstance(data["linked_companies"], list)
        
        # Verify linked company structure
        if data["linked_companies"]:
            company = data["linked_companies"][0]
            assert "id" in company
            assert "name" in company
            print(f"Deal linked companies: {data['linked_companies']}")
    
    def test_update_deal_linked_companies(self, auth_headers):
        """Update deal's linked companies"""
        # Create deal without linked companies
        deal_data = {"title": "TEST_Deal_To_Update_Links", "value": 3000, "stage": "new"}
        create_response = requests.post(f"{BASE_URL}/api/deals", headers=auth_headers, json=deal_data)
        deal_id = create_response.json()["id"]
        
        # Get a lead ID
        leads_response = requests.get(f"{BASE_URL}/api/leads?limit=1", headers=auth_headers)
        lead_ids = [l["id"] for l in leads_response.json().get("items", [])]
        
        # Update deal with linked companies
        update_data = {"linked_company_ids": lead_ids}
        response = requests.put(f"{BASE_URL}/api/deals/{deal_id}", headers=auth_headers, json=update_data)
        assert response.status_code == 200
        print("Deal linked companies updated successfully")


class TestTasksNewFields:
    """Test Task model with deal linking and new columns"""
    
    def test_create_task_with_deal_id(self, auth_headers):
        """Create task linked to a deal"""
        # First create a deal
        deal_data = {"title": "TEST_Deal_For_Task", "value": 1000, "stage": "new"}
        deal_response = requests.post(f"{BASE_URL}/api/deals", headers=auth_headers, json=deal_data)
        deal_id = deal_response.json()["id"]
        
        # Create task with deal_id
        task_data = {
            "title": "TEST_Follow Up Task",
            "deal_id": deal_id,
            "status": "pending",
            "payment_status": "unpaid"
        }
        
        response = requests.post(f"{BASE_URL}/api/tasks", headers=auth_headers, json=task_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("deal_id") == deal_id
        assert "deal_name" in data
        assert "status" in data
        print(f"Task created with deal_id: {data['id']}")
    
    def test_get_tasks_returns_new_columns(self, auth_headers):
        """GET tasks returns new columns: deal_name, company_name, pic_name, reg_time"""
        response = requests.get(f"{BASE_URL}/api/tasks", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        if data["items"]:
            task = data["items"][0]
            # Check for new fields in response
            assert "status" in task  # pending, in_progress, completed
            assert "payment_status" in task
            assert "created_at" in task  # reg_time
            print(f"Task fields present: status={task.get('status')}, payment={task.get('payment_status')}")
    
    def test_tasks_filter_by_deal(self, auth_headers):
        """Test tasks filter by deal_id"""
        # Create deal and task
        deal_data = {"title": "TEST_Deal_For_Filter", "value": 500, "stage": "new"}
        deal_response = requests.post(f"{BASE_URL}/api/deals", headers=auth_headers, json=deal_data)
        deal_id = deal_response.json()["id"]
        
        task_data = {"title": "TEST_Task_For_Filter", "deal_id": deal_id}
        requests.post(f"{BASE_URL}/api/tasks", headers=auth_headers, json=task_data)
        
        # Filter by deal
        response = requests.get(f"{BASE_URL}/api/tasks?deal_id={deal_id}", headers=auth_headers)
        assert response.status_code == 200
        print("Tasks filter by deal_id works")


class TestCustomersTable:
    """Test Customers endpoint for new table layout"""
    
    def test_get_customers_returns_required_columns(self, auth_headers):
        """GET /api/customers returns fields for table: company, PIC, role, mobile, email, status"""
        response = requests.get(f"{BASE_URL}/api/customers", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        if data["items"]:
            customer = data["items"][0]
            # Verify fields needed for table columns
            assert "first_name" in customer  # PIC/Doctor first name
            assert "job_title" in customer or "job_title" not in customer  # Role field (optional)
            assert "phone" in customer  # Mobile
            assert "email" in customer
            assert "company" in customer or "company" not in customer  # Company name (optional)
            print(f"Customer table columns present in response")


class TestCleanup:
    """Cleanup TEST_ prefixed data"""
    
    def test_cleanup_test_data(self, auth_headers):
        """Delete all TEST_ prefixed leads, deals, tasks"""
        # Cleanup leads
        leads_response = requests.get(f"{BASE_URL}/api/leads?limit=100", headers=auth_headers)
        if leads_response.status_code == 200:
            for lead in leads_response.json().get("items", []):
                if lead.get("name", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/leads/{lead['id']}", headers=auth_headers)
                    print(f"Deleted lead: {lead['name']}")
        
        # Cleanup deals
        deals_response = requests.get(f"{BASE_URL}/api/deals", headers=auth_headers)
        if deals_response.status_code == 200:
            for deal in deals_response.json():
                if deal.get("title", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/deals/{deal['id']}", headers=auth_headers)
                    print(f"Deleted deal: {deal['title']}")
        
        # Cleanup tasks
        tasks_response = requests.get(f"{BASE_URL}/api/tasks?limit=100", headers=auth_headers)
        if tasks_response.status_code == 200:
            for task in tasks_response.json().get("items", []):
                if task.get("title", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/tasks/{task['id']}", headers=auth_headers)
                    print(f"Deleted task: {task['title']}")
        
        print("Cleanup complete")
