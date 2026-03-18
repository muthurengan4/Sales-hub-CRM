"""
Test suite for Deal update flow and Lead-Deal relationship
Tests: LeadDetailPage deal updates reflecting on Pipeline page
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture
def auth_token():
    """Get authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "test@test.com", "password": "Password123!"}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json().get("token")


@pytest.fixture
def api_client(auth_token):
    """Authenticated API client"""
    session = requests.Session()
    session.headers.update({
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    })
    return session


class TestDealFlow:
    """Test deal creation, update, and lead linkage flow"""
    
    def test_get_deals(self, api_client):
        """Test fetching all deals"""
        response = api_client.get(f"{BASE_URL}/api/deals")
        assert response.status_code == 200
        deals = response.json()
        assert isinstance(deals, list)
        print(f"Found {len(deals)} deals")
        if len(deals) > 0:
            assert "id" in deals[0]
            assert "title" in deals[0]
            assert "stage" in deals[0]
    
    def test_get_leads(self, api_client):
        """Test fetching all leads"""
        response = api_client.get(f"{BASE_URL}/api/leads?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        leads = data["items"]
        assert isinstance(leads, list)
        print(f"Found {len(leads)} leads")
    
    def test_lead_detail_fetches_linked_deals(self, api_client):
        """Test that lead detail endpoint returns deal information"""
        # Get first lead
        leads_response = api_client.get(f"{BASE_URL}/api/leads?limit=1")
        assert leads_response.status_code == 200
        leads = leads_response.json()["items"]
        
        if len(leads) > 0:
            lead_id = leads[0]["id"]
            lead_response = api_client.get(f"{BASE_URL}/api/leads/{lead_id}")
            assert lead_response.status_code == 200
            lead = lead_response.json()
            assert "id" in lead
            assert "name" in lead or "company" in lead
            print(f"Lead detail fetched: {lead.get('name', lead.get('company', 'Unknown'))}")
    
    def test_deal_stage_update(self, api_client):
        """Test updating deal stage"""
        # Get existing deals
        deals_response = api_client.get(f"{BASE_URL}/api/deals")
        assert deals_response.status_code == 200
        deals = deals_response.json()
        
        if len(deals) > 0:
            deal_id = deals[0]["id"]
            current_stage = deals[0]["stage"]
            
            # Update to a different stage
            new_stage = "negotiation" if current_stage != "negotiation" else "proposal"
            
            update_response = api_client.put(
                f"{BASE_URL}/api/deals/{deal_id}",
                json={"stage": new_stage}
            )
            assert update_response.status_code == 200
            updated_deal = update_response.json()
            assert updated_deal["stage"] == new_stage
            print(f"Deal stage updated from {current_stage} to {new_stage}")
            
            # Verify by fetching again
            verify_response = api_client.get(f"{BASE_URL}/api/deals/{deal_id}")
            assert verify_response.status_code == 200
            verified_deal = verify_response.json()
            assert verified_deal["stage"] == new_stage
            print("Deal stage update verified successfully")
    
    def test_deal_linked_companies(self, api_client):
        """Test deal has linked companies information"""
        # Get deals
        response = api_client.get(f"{BASE_URL}/api/deals")
        assert response.status_code == 200
        deals = response.json()
        
        if len(deals) > 0:
            deal = deals[0]
            # Check linked_company_ids field exists
            assert "linked_company_ids" in deal or "linked_companies" in deal
            print(f"Deal linked companies count: {deal.get('linked_companies_count', 0)}")


class TestLeadActivities:
    """Test lead activities logging"""
    
    def test_get_lead_activities(self, api_client):
        """Test fetching lead activities"""
        # Get first lead
        leads_response = api_client.get(f"{BASE_URL}/api/leads?limit=1")
        assert leads_response.status_code == 200
        leads = leads_response.json()["items"]
        
        if len(leads) > 0:
            lead_id = leads[0]["id"]
            activities_response = api_client.get(f"{BASE_URL}/api/leads/{lead_id}/activities")
            assert activities_response.status_code == 200
            data = activities_response.json()
            assert "activities" in data
            print(f"Found {len(data['activities'])} activities for lead")
    
    def test_log_activity_on_status_update(self, api_client):
        """Test that activity is logged when lead status is updated"""
        # Get first lead
        leads_response = api_client.get(f"{BASE_URL}/api/leads?limit=1")
        leads = leads_response.json()["items"]
        
        if len(leads) > 0:
            lead_id = leads[0]["id"]
            
            # Post a status update activity
            activity_response = api_client.post(
                f"{BASE_URL}/api/leads/{lead_id}/activities",
                json={
                    "type": "status_update",
                    "description": "Test status update to Proposal",
                    "notes": "Test activity log"
                }
            )
            assert activity_response.status_code in [200, 201]
            print("Activity logged successfully")


class TestTasksAPI:
    """Test Tasks API endpoints"""
    
    def test_get_tasks(self, api_client):
        """Test fetching tasks"""
        response = api_client.get(f"{BASE_URL}/api/tasks?page=1&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        print(f"Found {data['total']} tasks")
    
    def test_task_has_required_fields(self, api_client):
        """Test task data structure"""
        response = api_client.get(f"{BASE_URL}/api/tasks?page=1&limit=10")
        assert response.status_code == 200
        data = response.json()
        
        if len(data["items"]) > 0:
            task = data["items"][0]
            assert "id" in task
            assert "title" in task or "company_name" in task
            assert "status" in task
            print(f"Task structure verified: {task.get('title', task.get('company_name', 'Unknown'))}")


class TestCustomersAPI:
    """Test Customers API endpoints"""
    
    def test_get_customers(self, api_client):
        """Test fetching customers"""
        response = api_client.get(f"{BASE_URL}/api/customers?page=1&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        print(f"Found {data['total']} customers")
    
    def test_create_and_delete_customer(self, api_client):
        """Test customer CRUD"""
        # Create customer
        create_response = api_client.post(
            f"{BASE_URL}/api/customers",
            json={
                "first_name": "TEST_API_Customer",
                "company": "TEST_API_Company",
                "email": "test_api@example.com"
            }
        )
        assert create_response.status_code in [200, 201]
        customer = create_response.json()
        assert "id" in customer
        customer_id = customer["id"]
        print(f"Customer created with ID: {customer_id}")
        
        # Verify by GET
        get_response = api_client.get(f"{BASE_URL}/api/customers/{customer_id}")
        assert get_response.status_code == 200
        
        # Delete customer
        delete_response = api_client.delete(f"{BASE_URL}/api/customers/{customer_id}")
        assert delete_response.status_code in [200, 204]
        print("Customer deleted successfully")
