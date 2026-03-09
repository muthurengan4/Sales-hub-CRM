"""
Test suite for new CRM features:
- Worklist Dashboard
- Customer Profile (Lead/Contact)
- Notifications
- AI Calls (placeholder)
- Filter Options

Test credentials: pag1772866828@test.com / test123456
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://crm-automation-ref.preview.emergentagent.com').rstrip('/')
TEST_EMAIL = "pag1772866828@test.com"
TEST_PASSWORD = "test123456"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in response"
    return data["token"]


@pytest.fixture
def auth_headers(auth_token):
    """Get headers with authentication"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestWorklistDashboard:
    """Worklist Dashboard endpoint tests"""

    def test_worklist_basic_fetch(self, auth_headers):
        """Test basic worklist fetch with default pagination"""
        response = requests.get(f"{BASE_URL}/api/worklist", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data
        assert "total_pages" in data

    def test_worklist_pagination(self, auth_headers):
        """Test worklist pagination"""
        response = requests.get(f"{BASE_URL}/api/worklist?page=1&limit=5", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["items"]) <= 5
        assert data["page"] == 1
        assert data["limit"] == 5

    def test_worklist_item_structure(self, auth_headers):
        """Test worklist item has correct structure"""
        response = requests.get(f"{BASE_URL}/api/worklist?limit=1", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        if data["items"]:
            item = data["items"][0]
            # Check required fields
            assert "id" in item
            assert "customer_name" in item
            assert "status" in item
            assert "lifecycle_stage" in item
            assert "entity_type" in item
            assert "entity_id" in item

    def test_worklist_status_filter(self, auth_headers):
        """Test worklist filtering by status"""
        response = requests.get(f"{BASE_URL}/api/worklist?status=new", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        for item in data["items"]:
            assert item["status"] == "new"

    def test_worklist_lifecycle_filter(self, auth_headers):
        """Test worklist filtering by lifecycle stage"""
        response = requests.get(f"{BASE_URL}/api/worklist?lifecycle_stage=lead", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        for item in data["items"]:
            assert item["lifecycle_stage"] == "lead"


class TestNotifications:
    """Notifications endpoint tests"""

    def test_notifications_fetch(self, auth_headers):
        """Test fetching notifications"""
        response = requests.get(f"{BASE_URL}/api/notifications", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "items" in data
        assert "unread_count" in data
        assert isinstance(data["unread_count"], int)

    def test_notifications_with_limit(self, auth_headers):
        """Test notifications with limit parameter"""
        response = requests.get(f"{BASE_URL}/api/notifications?limit=5", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["items"]) <= 5

    def test_mark_all_notifications_read(self, auth_headers):
        """Test marking all notifications as read"""
        response = requests.put(f"{BASE_URL}/api/notifications/read-all", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data


class TestFilterOptions:
    """Filter options endpoint tests"""

    def test_filter_options_fetch(self, auth_headers):
        """Test fetching filter options"""
        response = requests.get(f"{BASE_URL}/api/filter-options", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        # Check all expected filter categories
        assert "statuses" in data
        assert "lifecycle_stages" in data
        assert "users" in data
        assert "pipeline_stages" in data
        assert "date_presets" in data

    def test_filter_options_has_valid_statuses(self, auth_headers):
        """Test filter options has valid statuses"""
        response = requests.get(f"{BASE_URL}/api/filter-options", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "new" in data["statuses"]
        assert "contacted" in data["statuses"]
        assert "qualified" in data["statuses"]

    def test_filter_options_has_valid_lifecycle_stages(self, auth_headers):
        """Test filter options has valid lifecycle stages"""
        response = requests.get(f"{BASE_URL}/api/filter-options", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        expected_stages = ["lead", "ai_contacted", "interested", "opportunity", "customer", "repeat_customer"]
        for stage in expected_stages:
            assert stage in data["lifecycle_stages"]


class TestCustomerProfile:
    """Customer Profile endpoint tests"""

    @pytest.fixture
    def sample_lead_id(self, auth_headers):
        """Get a sample lead ID from worklist"""
        response = requests.get(f"{BASE_URL}/api/worklist?limit=1", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        if data["items"]:
            return data["items"][0]["entity_id"]
        pytest.skip("No leads available for testing")

    def test_lead_profile_fetch(self, auth_headers, sample_lead_id):
        """Test fetching lead profile"""
        response = requests.get(f"{BASE_URL}/api/profile/lead/{sample_lead_id}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "profile" in data
        assert "activities" in data
        assert "ai_calls" in data
        assert "deals" in data
        assert "stats" in data

    def test_lead_profile_structure(self, auth_headers, sample_lead_id):
        """Test lead profile has correct structure"""
        response = requests.get(f"{BASE_URL}/api/profile/lead/{sample_lead_id}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        profile = data["profile"]
        # Check required profile fields
        assert "id" in profile
        assert "name" in profile
        assert "email" in profile
        assert "phone" in profile
        assert "status" in profile

    def test_lead_profile_stats(self, auth_headers, sample_lead_id):
        """Test lead profile stats structure"""
        response = requests.get(f"{BASE_URL}/api/profile/lead/{sample_lead_id}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        stats = data["stats"]
        assert "total_activities" in stats
        assert "total_calls" in stats
        assert "total_deals" in stats

    def test_lead_profile_not_found(self, auth_headers):
        """Test 404 for non-existent lead"""
        response = requests.get(f"{BASE_URL}/api/profile/lead/non-existent-id", headers=auth_headers)
        assert response.status_code == 404


class TestAICalls:
    """AI Calls (placeholder) endpoint tests"""

    def test_ai_calls_list_fetch(self, auth_headers):
        """Test fetching AI calls list"""
        response = requests.get(f"{BASE_URL}/api/ai-calls", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)

    def test_ai_call_initiate_placeholder(self, auth_headers):
        """Test initiating AI call (placeholder)"""
        # Get a lead ID first
        worklist_response = requests.get(f"{BASE_URL}/api/worklist?limit=1", headers=auth_headers)
        assert worklist_response.status_code == 200
        worklist_data = worklist_response.json()
        
        if not worklist_data["items"]:
            pytest.skip("No leads available for testing")
        
        lead_id = worklist_data["items"][0]["entity_id"]
        
        # Initiate AI call
        response = requests.post(f"{BASE_URL}/api/ai-calls", headers=auth_headers, json={
            "phone_number": "+60123456789",
            "lead_id": lead_id
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert "status" in data
        assert data["status"] == "pending"
        assert "message" in data
        assert "placeholder" in data["message"].lower()


class TestUnauthorized:
    """Test unauthorized access"""

    def test_worklist_unauthorized(self):
        """Test worklist without auth"""
        response = requests.get(f"{BASE_URL}/api/worklist")
        assert response.status_code == 401

    def test_notifications_unauthorized(self):
        """Test notifications without auth"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 401

    def test_filter_options_unauthorized(self):
        """Test filter options without auth"""
        response = requests.get(f"{BASE_URL}/api/filter-options")
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
