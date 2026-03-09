"""
Test Sales Workflow Features (Fixed version):
- Assignment Settings API (4 modes: round_robin, territory, manual, default_agent)
- Pipeline stages (call-based: new, contacted, no_answer, interested, follow_up, booked, won, lost)
- Lead to Client conversion
- Clients API
- Pipeline stage update for leads
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
TEST_USER_EMAIL = "pag1772866828@test.com"
TEST_USER_PASSWORD = "test123456"


class TestAuth:
    """Authentication for test user"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for test user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()['token']


class TestAssignmentSettings(TestAuth):
    """Test Assignment Settings CRUD operations"""
    
    def test_get_assignment_settings(self, auth_token):
        """GET /api/assignment-settings - Returns settings for org"""
        response = requests.get(
            f"{BASE_URL}/api/assignment-settings",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "mode" in data, "Should have 'mode' field"
        assert "organization_id" in data, "Should have 'organization_id' field"
        print(f"✓ GET /api/assignment-settings: mode={data['mode']}")
    
    def test_update_assignment_settings_manual(self, auth_token):
        """PUT /api/assignment-settings - Update to manual mode"""
        response = requests.put(
            f"{BASE_URL}/api/assignment-settings",
            headers={"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"},
            json={"mode": "manual"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        # Response format: {"message": "...", "settings": {...}}
        settings = data.get('settings', data)
        assert settings['mode'] == 'manual', f"Mode should be 'manual', got {settings['mode']}"
        print("✓ PUT assignment settings to 'manual' mode")
    
    def test_update_assignment_settings_round_robin(self, auth_token):
        """PUT /api/assignment-settings - Update to round_robin mode"""
        response = requests.put(
            f"{BASE_URL}/api/assignment-settings",
            headers={"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"},
            json={"mode": "round_robin"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        settings = data.get('settings', data)
        assert settings['mode'] == 'round_robin', f"Mode should be 'round_robin', got {settings['mode']}"
        print("✓ PUT assignment settings to 'round_robin' mode")
    
    def test_update_assignment_settings_territory(self, auth_token):
        """PUT /api/assignment-settings - Update to territory mode with mapping"""
        # First get a user ID for territory mapping
        users_response = requests.get(
            f"{BASE_URL}/api/users?limit=1",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert users_response.status_code == 200
        users_data = users_response.json()
        if users_data['items']:
            agent_id = users_data['items'][0]['id']
        else:
            pytest.skip("No users found for territory test")
            return
        
        response = requests.put(
            f"{BASE_URL}/api/assignment-settings",
            headers={"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"},
            json={
                "mode": "territory",
                "territories": [
                    {"state": "Selangor", "agent_id": agent_id},
                    {"state": "Kuala Lumpur", "city": "KL City", "agent_id": agent_id}
                ]
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        settings = data.get('settings', data)
        assert settings['mode'] == 'territory', f"Mode should be 'territory', got {settings['mode']}"
        assert len(settings.get('territories', [])) >= 1, "Should have territories"
        print("✓ PUT assignment settings to 'territory' mode with mappings")
    
    def test_update_assignment_settings_default_agent(self, auth_token):
        """PUT /api/assignment-settings - Update to default_agent mode"""
        # First get a user ID for default agent
        users_response = requests.get(
            f"{BASE_URL}/api/users?limit=1",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert users_response.status_code == 200
        users_data = users_response.json()
        if users_data['items']:
            agent_id = users_data['items'][0]['id']
        else:
            pytest.skip("No users found for default agent test")
            return
        
        response = requests.put(
            f"{BASE_URL}/api/assignment-settings",
            headers={"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"},
            json={
                "mode": "default_agent",
                "default_agent_id": agent_id
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        settings = data.get('settings', data)
        assert settings['mode'] == 'default_agent', f"Mode should be 'default_agent', got {settings['mode']}"
        assert settings.get('default_agent_id') == agent_id, "Should have default_agent_id set"
        print("✓ PUT assignment settings to 'default_agent' mode")
    
    def test_assignment_settings_unauthorized(self):
        """Assignment settings should require authentication"""
        response = requests.get(f"{BASE_URL}/api/assignment-settings")
        assert response.status_code == 401, "Should return 401 without auth"
        print("✓ Assignment settings returns 401 without auth")


class TestPipelineStages(TestAuth):
    """Test Pipeline stages (call-based)"""
    
    def test_pipeline_page_loads_stages(self, auth_token):
        """GET /api/deals - Pipeline should work and allow call-based stages"""
        response = requests.get(
            f"{BASE_URL}/api/deals",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Deals should be a list"
        print(f"✓ GET /api/deals: {len(data)} deals found")
    
    def test_create_deal_with_call_stage(self, auth_token):
        """POST /api/deals - Create deal with call-based stage"""
        response = requests.post(
            f"{BASE_URL}/api/deals",
            headers={"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"},
            json={
                "title": "TEST_Pipeline Deal",
                "value": 5000,
                "stage": "contacted",  # Call-based stage
                "company": "Test Corp"
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data['stage'] == 'contacted', f"Stage should be 'contacted', got {data['stage']}"
        deal_id = data['id']
        print(f"✓ Created deal with stage 'contacted': {deal_id}")
        
        # Cleanup - delete the deal
        requests.delete(
            f"{BASE_URL}/api/deals/{deal_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )


class TestLeadPipelineStage(TestAuth):
    """Test Lead pipeline stage update"""
    
    def test_update_lead_pipeline_stage(self, auth_token):
        """PUT /api/leads/{id}/pipeline-stage?stage=X - Update lead's pipeline stage (using query param)"""
        # First create a lead
        create_response = requests.post(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"},
            json={
                "name": "TEST_Pipeline Lead",
                "email": "test_pipeline@example.com",
                "phone": "+60123456789"
            }
        )
        assert create_response.status_code == 200, f"Failed to create lead: {create_response.text}"
        lead_id = create_response.json()['id']
        
        try:
            # Update pipeline stage using query parameter (NOT body)
            response = requests.put(
                f"{BASE_URL}/api/leads/{lead_id}/pipeline-stage?stage=contacted",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert response.status_code == 200, f"Failed: {response.text}"
            data = response.json()
            assert data.get('pipeline_stage') == 'contacted', f"Pipeline stage should be 'contacted'"
            print(f"✓ Updated lead pipeline stage to 'contacted'")
            
            # Test all call-based stages
            for stage in ['no_answer', 'interested', 'follow_up', 'booked', 'won']:
                response = requests.put(
                    f"{BASE_URL}/api/leads/{lead_id}/pipeline-stage?stage={stage}",
                    headers={"Authorization": f"Bearer {auth_token}"}
                )
                assert response.status_code == 200, f"Failed to set stage '{stage}': {response.text}"
            print(f"✓ All call-based pipeline stages work correctly")
            
        finally:
            # Cleanup
            requests.delete(
                f"{BASE_URL}/api/leads/{lead_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )


class TestLeadToClientConversion(TestAuth):
    """Test Lead to Client conversion workflow"""
    
    def test_convert_lead_to_client(self, auth_token):
        """POST /api/leads/{id}/convert - Convert lead to client"""
        # First create a lead to convert
        create_response = requests.post(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"},
            json={
                "name": "TEST_Convert Lead",
                "email": "test_convert@example.com",
                "phone": "+60123456789",
                "company": "Convert Corp"
            }
        )
        assert create_response.status_code == 200, f"Failed to create lead: {create_response.text}"
        lead_id = create_response.json()['id']
        
        try:
            # Convert to client
            response = requests.post(
                f"{BASE_URL}/api/leads/{lead_id}/convert",
                headers={"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"},
                json={
                    "lead_id": lead_id,
                    "services": [
                        {"name": "Premium Plan", "amount": 1000, "status": "active"},
                        {"name": "Support Package", "amount": 500, "status": "active"}
                    ],
                    "notes": "Test conversion notes"
                }
            )
            assert response.status_code == 200, f"Failed: {response.text}"
            data = response.json()
            assert "client" in data, "Response should contain 'client'"
            assert data['client'].get('total_value') == 1500, f"Total value should be 1500, got {data['client'].get('total_value')}"
            print(f"✓ Converted lead to client with total value $1500")
            
            # Verify lead is marked as converted
            lead_response = requests.get(
                f"{BASE_URL}/api/leads/{lead_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            if lead_response.status_code == 200:
                lead_data = lead_response.json()
                assert lead_data.get('converted_to_client') == True, "Lead should be marked as converted"
                print(f"✓ Lead marked as converted_to_client=True")
            
        finally:
            # Note: Lead might not be deletable after conversion
            pass


class TestClientsAPI(TestAuth):
    """Test Clients API endpoints"""
    
    def test_get_clients_paginated(self, auth_token):
        """GET /api/clients - Returns paginated clients list"""
        response = requests.get(
            f"{BASE_URL}/api/clients?page=1&limit=10",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "items" in data, "Should have 'items' field"
        assert "total" in data, "Should have 'total' field"
        assert "page" in data, "Should have 'page' field"
        assert "total_pages" in data, "Should have 'total_pages' field"
        print(f"✓ GET /api/clients: {data['total']} total clients")
        
        # Verify client structure if any exist
        if data['items']:
            client = data['items'][0]
            assert 'customer_name' in client, "Client should have 'customer_name'"
            assert 'services' in client, "Client should have 'services'"
            assert 'total_value' in client, "Client should have 'total_value'"
            print(f"✓ Client structure validated: {client['customer_name']}")
    
    def test_get_client_detail(self, auth_token):
        """GET /api/clients/{id} - Get single client details"""
        # First get clients list
        clients_response = requests.get(
            f"{BASE_URL}/api/clients?page=1&limit=1",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert clients_response.status_code == 200
        clients = clients_response.json().get('items', [])
        
        if not clients:
            pytest.skip("No clients found for detail test")
            return
        
        client_id = clients[0]['id']
        response = requests.get(
            f"{BASE_URL}/api/clients/{client_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "client" in data, "Should have 'client' field"
        print(f"✓ GET /api/clients/{client_id}: Retrieved client detail")
    
    def test_clients_unauthorized(self):
        """Clients API should require authentication"""
        response = requests.get(f"{BASE_URL}/api/clients")
        assert response.status_code == 401, "Should return 401 without auth"
        print("✓ Clients API returns 401 without auth")


class TestContactsAPI(TestAuth):
    """Test that Contacts API works (backend uses 'contacts', UI shows as 'Customers')"""
    
    def test_contacts_api_exists(self, auth_token):
        """GET /api/contacts - Verify contacts endpoint works (UI shows as Customers)"""
        response = requests.get(
            f"{BASE_URL}/api/contacts?page=1&limit=10",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Contacts API failed: {response.text}"
        data = response.json()
        assert "items" in data, "Should have 'items' field"
        print(f"✓ GET /api/contacts works (UI shows as 'Customers'): {data['total']} contacts")


# Run with: pytest /app/backend/tests/test_sales_workflow.py -v
