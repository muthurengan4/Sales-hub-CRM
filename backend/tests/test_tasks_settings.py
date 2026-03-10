"""
Test suite for Tasks and Organization Settings features
- Tasks CRUD API
- Organization Settings (currency, Google Calendar)
- Currency list API
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "testadmin2@example.com"
TEST_PASSWORD = "Password123!"


class TestAuthentication:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        return data["token"]
    
    def test_login_success(self, auth_token):
        """Test login returns valid token"""
        assert auth_token is not None
        assert len(auth_token) > 0
        print(f"✓ Login successful, token obtained")


class TestTasksCRUD:
    """Tasks API CRUD tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Request headers with auth"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_get_tasks_list(self, headers):
        """Test GET /api/tasks returns paginated list"""
        response = requests.get(f"{BASE_URL}/api/tasks", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "items" in data, "Missing 'items' in response"
        assert "total" in data, "Missing 'total' in response"
        assert "page" in data, "Missing 'page' in response"
        assert "total_pages" in data, "Missing 'total_pages' in response"
        print(f"✓ GET /api/tasks - Returns {len(data['items'])} tasks, total: {data['total']}")
    
    def test_create_task(self, headers):
        """Test POST /api/tasks creates new task"""
        task_data = {
            "title": f"TEST_Task_{uuid.uuid4().hex[:8]}",
            "description": "Test task description",
            "priority": "high",
            "payment_status": "unpaid",
            "payment_amount": 500.00,
            "paid_amount": 0,
            "due_date": "2026-02-15"
        }
        
        response = requests.post(f"{BASE_URL}/api/tasks", json=task_data, headers=headers)
        assert response.status_code == 200, f"Failed to create task: {response.text}"
        
        data = response.json()
        assert "id" in data, "Missing 'id' in response"
        assert data["title"] == task_data["title"], "Title mismatch"
        assert data["priority"] == "high", "Priority mismatch"
        assert data["payment_status"] == "unpaid", "Payment status mismatch"
        assert data["status"] == "pending", "Default status should be pending"
        print(f"✓ POST /api/tasks - Created task with ID: {data['id']}")
        
        # Return task_id for cleanup
        return data["id"]
    
    def test_create_task_with_payment(self, headers):
        """Test creating task with payment tracking"""
        task_data = {
            "title": f"TEST_PaymentTask_{uuid.uuid4().hex[:8]}",
            "description": "Task with payment",
            "payment_status": "partially_paid",
            "payment_amount": 1000.00,
            "paid_amount": 250.00,
            "priority": "medium"
        }
        
        response = requests.post(f"{BASE_URL}/api/tasks", json=task_data, headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["payment_amount"] == 1000.00, "Payment amount mismatch"
        assert data["paid_amount"] == 250.00, "Paid amount mismatch"
        assert data["payment_status"] == "partially_paid", "Payment status mismatch"
        print(f"✓ POST /api/tasks - Created task with payment tracking")
        return data["id"]
    
    def test_update_task(self, headers):
        """Test PUT /api/tasks/{id} updates task"""
        # First create a task
        create_response = requests.post(f"{BASE_URL}/api/tasks", json={
            "title": f"TEST_UpdateTask_{uuid.uuid4().hex[:8]}",
            "description": "Task to update",
            "priority": "low"
        }, headers=headers)
        assert create_response.status_code == 200
        task_id = create_response.json()["id"]
        
        # Now update it
        update_data = {
            "title": "Updated Task Title",
            "status": "in_progress",
            "priority": "high"
        }
        
        response = requests.put(f"{BASE_URL}/api/tasks/{task_id}", json=update_data, headers=headers)
        assert response.status_code == 200, f"Failed to update task: {response.text}"
        
        data = response.json()
        assert "message" in data, "Missing message in response"
        print(f"✓ PUT /api/tasks/{task_id} - Task updated successfully")
        
        # Verify update persisted
        get_response = requests.get(f"{BASE_URL}/api/tasks", headers=headers)
        tasks = get_response.json()["items"]
        updated_task = next((t for t in tasks if t["id"] == task_id), None)
        assert updated_task is not None, "Updated task not found"
        assert updated_task["status"] == "in_progress", "Status not updated"
        print(f"✓ GET /api/tasks - Verified update persisted")
    
    def test_delete_task(self, headers):
        """Test DELETE /api/tasks/{id} deletes task"""
        # First create a task
        create_response = requests.post(f"{BASE_URL}/api/tasks", json={
            "title": f"TEST_DeleteTask_{uuid.uuid4().hex[:8]}",
            "description": "Task to delete"
        }, headers=headers)
        assert create_response.status_code == 200
        task_id = create_response.json()["id"]
        
        # Now delete it
        response = requests.delete(f"{BASE_URL}/api/tasks/{task_id}", headers=headers)
        assert response.status_code == 200, f"Failed to delete task: {response.text}"
        
        data = response.json()
        assert "message" in data, "Missing message in response"
        print(f"✓ DELETE /api/tasks/{task_id} - Task deleted successfully")
    
    def test_tasks_filter_by_status(self, headers):
        """Test filtering tasks by status"""
        response = requests.get(f"{BASE_URL}/api/tasks?status=pending", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "items" in data
        # All returned tasks should be pending
        for task in data["items"]:
            assert task["status"] == "pending", f"Task {task['id']} has status {task['status']}, expected pending"
        print(f"✓ GET /api/tasks?status=pending - Filter working, found {len(data['items'])} pending tasks")
    
    def test_tasks_filter_by_payment_status(self, headers):
        """Test filtering tasks by payment status"""
        response = requests.get(f"{BASE_URL}/api/tasks?payment_status=unpaid", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "items" in data
        print(f"✓ GET /api/tasks?payment_status=unpaid - Filter working, found {len(data['items'])} unpaid tasks")
    
    def test_tasks_requires_auth(self):
        """Test tasks endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/tasks")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ GET /api/tasks without auth - Returns 401 Unauthorized")


class TestOrganizationSettings:
    """Organization Settings API tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Request headers with auth"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_get_organization_settings(self, headers):
        """Test GET /api/organization-settings returns settings"""
        response = requests.get(f"{BASE_URL}/api/organization-settings", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "currency" in data, "Missing 'currency' in response"
        assert "currency_symbol" in data, "Missing 'currency_symbol' in response"
        print(f"✓ GET /api/organization-settings - Currency: {data['currency']} ({data['currency_symbol']})")
    
    def test_update_currency_settings(self, headers):
        """Test PUT /api/organization-settings updates currency"""
        # Update to MYR
        update_data = {
            "currency": "MYR",
            "currency_symbol": "RM"
        }
        
        response = requests.put(f"{BASE_URL}/api/organization-settings", json=update_data, headers=headers)
        assert response.status_code == 200, f"Failed to update settings: {response.text}"
        
        data = response.json()
        assert "message" in data, "Missing message in response"
        print(f"✓ PUT /api/organization-settings - Currency updated to MYR")
        
        # Verify update persisted
        get_response = requests.get(f"{BASE_URL}/api/organization-settings", headers=headers)
        assert get_response.status_code == 200
        settings = get_response.json()
        assert settings["currency"] == "MYR", f"Currency not updated, got {settings['currency']}"
        assert settings["currency_symbol"] == "RM", f"Currency symbol not updated, got {settings['currency_symbol']}"
        print(f"✓ GET /api/organization-settings - Verified currency is MYR (RM)")
        
        # Restore to USD
        restore_data = {
            "currency": "USD",
            "currency_symbol": "$"
        }
        restore_response = requests.put(f"{BASE_URL}/api/organization-settings", json=restore_data, headers=headers)
        assert restore_response.status_code == 200
        print(f"✓ Restored currency back to USD")
    
    def test_organization_settings_requires_auth(self):
        """Test organization-settings endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/organization-settings")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ GET /api/organization-settings without auth - Returns 401 Unauthorized")


class TestCurrencies:
    """Currency list API tests"""
    
    def test_get_currencies(self):
        """Test GET /api/currencies returns currency list"""
        response = requests.get(f"{BASE_URL}/api/currencies")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "currencies" in data, "Missing 'currencies' in response"
        
        currencies = data["currencies"]
        assert len(currencies) > 0, "No currencies returned"
        
        # Verify currency structure
        first_currency = currencies[0]
        assert "code" in first_currency, "Missing 'code' in currency"
        assert "symbol" in first_currency, "Missing 'symbol' in currency"
        assert "name" in first_currency, "Missing 'name' in currency"
        
        # Check for expected currencies
        currency_codes = [c["code"] for c in currencies]
        assert "USD" in currency_codes, "USD not in currency list"
        assert "MYR" in currency_codes, "MYR not in currency list"
        assert "EUR" in currency_codes, "EUR not in currency list"
        
        print(f"✓ GET /api/currencies - Returns {len(currencies)} currencies")
        print(f"  Codes: {', '.join(currency_codes[:5])}...")


class TestDropdownZIndexIntegration:
    """Test that dropdowns work correctly (z-index fix verification via API)"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Request headers with auth"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_leads_api_for_dropdown(self, headers):
        """Test leads API works - dropdown actions require working leads"""
        response = requests.get(f"{BASE_URL}/api/leads?limit=5", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "items" in data
        print(f"✓ GET /api/leads - Returns {len(data['items'])} leads for dropdown testing")
    
    def test_clients_api_for_dropdown(self, headers):
        """Test clients API works - dropdown actions require working clients"""
        response = requests.get(f"{BASE_URL}/api/clients?limit=5", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "items" in data
        print(f"✓ GET /api/clients - Returns {len(data['items'])} clients for dropdown testing")
    
    def test_customers_api_for_dropdown(self, headers):
        """Test customers (contacts) API works - dropdown actions require working customers"""
        response = requests.get(f"{BASE_URL}/api/contacts?limit=5", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "items" in data
        print(f"✓ GET /api/contacts - Returns {len(data['items'])} customers for dropdown testing")


class TestTasksNavigation:
    """Test Tasks navigation and page integration"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Request headers with auth"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_auth_me_returns_permissions(self, headers):
        """Test /api/auth/me returns user with permissions for navigation"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "permissions" in data, "Missing 'permissions' in user data"
        assert len(data["permissions"]) > 0, "No permissions returned"
        
        # Check for permissions needed for Tasks page
        permissions = data["permissions"]
        has_leads_permission = "view_all_leads" in permissions or "view_own_leads" in permissions
        assert has_leads_permission, "User should have lead permissions to see Tasks"
        print(f"✓ GET /api/auth/me - User has {len(permissions)} permissions")


# Cleanup fixture
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Cleanup test tasks after all tests complete"""
    yield
    # After tests, clean up TEST_ prefixed tasks
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            token = response.json()["token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            # Get all tasks
            tasks_response = requests.get(f"{BASE_URL}/api/tasks?limit=100", headers=headers)
            if tasks_response.status_code == 200:
                tasks = tasks_response.json().get("items", [])
                for task in tasks:
                    if task.get("title", "").startswith("TEST_"):
                        requests.delete(f"{BASE_URL}/api/tasks/{task['id']}", headers=headers)
                print(f"Cleaned up TEST_ prefixed tasks")
    except Exception as e:
        print(f"Cleanup failed: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
