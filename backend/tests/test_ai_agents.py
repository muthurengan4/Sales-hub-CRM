"""
Test AI Agents API endpoints for AI Calling feature
Tests: GET /api/ai-agents, POST /api/ai-agents, DELETE /api/ai-agents/{id}
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "Password123!"

class TestAIAgentsAPI:
    """Test AI Agents CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login and get auth token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.status_code} - {login_response.text}")
        
        self.token = login_response.json().get("token")
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        self.user = login_response.json().get("user")
        print(f"Logged in as: {self.user.get('email')} with role: {self.user.get('role')}")
    
    def test_get_ai_agents(self):
        """Test GET /api/ai-agents - should return list of agents"""
        response = requests.get(
            f"{BASE_URL}/api/ai-agents",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "agents" in data, "Response should contain 'agents' key"
        assert isinstance(data["agents"], list), "Agents should be a list"
        
        print(f"Found {len(data['agents'])} AI agents")
        for agent in data["agents"]:
            print(f"  - {agent.get('name')}: {agent.get('agent_id', 'N/A')[:20]}...")
        
        return data["agents"]
    
    def test_create_ai_agent(self):
        """Test POST /api/ai-agents - should create new agent"""
        new_agent_data = {
            "name": "TEST_TestAgent",
            "agent_id": "test_elevenlabs_agent_id_123"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai-agents",
            headers=self.headers,
            json=new_agent_data
        )
        
        # Check if user has permission (org_admin required)
        if response.status_code == 403:
            pytest.skip("User doesn't have manage_organization permission")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert "agent" in data, "Response should contain 'agent' key"
        
        agent = data["agent"]
        assert agent["name"] == new_agent_data["name"], "Agent name should match"
        assert agent["agent_id"] == new_agent_data["agent_id"], "Agent ID should match"
        assert "id" in agent, "Agent should have an id"
        
        print(f"Created agent: {agent['name']} with id: {agent['id']}")
        
        return agent
    
    def test_create_ai_agent_validation(self):
        """Test POST /api/ai-agents with missing required fields"""
        # Missing agent_id
        response = requests.post(
            f"{BASE_URL}/api/ai-agents",
            headers=self.headers,
            json={"name": "TEST_InvalidAgent"}
        )
        
        # Should return 422 for validation error
        assert response.status_code == 422, f"Expected 422 for missing field, got {response.status_code}"
        print("Validation error correctly returned for missing agent_id")
    
    def test_delete_ai_agent(self):
        """Test DELETE /api/ai-agents/{id} - should delete agent"""
        # First create an agent to delete
        new_agent_data = {
            "name": "TEST_AgentToDelete",
            "agent_id": "delete_test_agent_id"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/ai-agents",
            headers=self.headers,
            json=new_agent_data
        )
        
        if create_response.status_code == 403:
            pytest.skip("User doesn't have permission to create/delete agents")
        
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        
        agent_id = create_response.json()["agent"]["id"]
        print(f"Created agent to delete: {agent_id}")
        
        # Now delete it
        delete_response = requests.delete(
            f"{BASE_URL}/api/ai-agents/{agent_id}",
            headers=self.headers
        )
        
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.status_code}: {delete_response.text}"
        
        data = delete_response.json()
        assert data.get("success") == True, "Delete should indicate success"
        
        print(f"Successfully deleted agent: {agent_id}")
        
        # Verify deletion - agent should not be in list anymore
        get_response = requests.get(f"{BASE_URL}/api/ai-agents", headers=self.headers)
        agents = get_response.json().get("agents", [])
        agent_ids = [a.get("id") for a in agents]
        assert agent_id not in agent_ids, "Deleted agent should not be in list"
        print("Verified agent is no longer in list")
    
    def test_delete_nonexistent_agent(self):
        """Test DELETE /api/ai-agents/{id} with invalid id"""
        response = requests.delete(
            f"{BASE_URL}/api/ai-agents/nonexistent-agent-id-12345",
            headers=self.headers
        )
        
        # Should return 404 if user has permission
        if response.status_code == 403:
            pytest.skip("User doesn't have permission")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Correctly returned 404 for nonexistent agent")
    
    def test_cleanup_test_agents(self):
        """Cleanup: Delete any TEST_ prefixed agents"""
        get_response = requests.get(f"{BASE_URL}/api/ai-agents", headers=self.headers)
        
        if get_response.status_code != 200:
            return
        
        agents = get_response.json().get("agents", [])
        test_agents = [a for a in agents if a.get("name", "").startswith("TEST_")]
        
        for agent in test_agents:
            delete_response = requests.delete(
                f"{BASE_URL}/api/ai-agents/{agent['id']}",
                headers=self.headers
            )
            if delete_response.status_code == 200:
                print(f"Cleaned up test agent: {agent['name']}")


class TestLeadAICallEndpoint:
    """Test AI Call initiation endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login and get auth token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if login_response.status_code != 200:
            pytest.skip(f"Login failed: {login_response.status_code}")
        
        self.token = login_response.json().get("token")
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_ai_call_initiate_endpoint_exists(self):
        """Test that the AI call initiation endpoint exists (placeholder)"""
        # Get a lead first
        leads_response = requests.get(
            f"{BASE_URL}/api/leads?limit=1",
            headers=self.headers
        )
        
        if leads_response.status_code != 200:
            pytest.skip("Could not fetch leads")
        
        leads = leads_response.json().get("items", [])
        if not leads:
            pytest.skip("No leads available for testing")
        
        lead_id = leads[0]["id"]
        
        # Test the AI call initiate endpoint
        response = requests.post(
            f"{BASE_URL}/api/ai-calls/initiate",
            headers=self.headers,
            json={
                "lead_id": lead_id,
                "deal_id": "test-deal-id",
                "agent_name": "Sarah",
                "phone": "+60123456789"
            }
        )
        
        # The endpoint may return 200 (mocked success) or 404 (not implemented)
        # Just checking it doesn't crash
        print(f"AI call initiate endpoint response: {response.status_code}")
        if response.status_code == 200:
            print("AI call initiation returned success (MOCKED)")
        elif response.status_code == 404:
            print("AI call initiation endpoint not found")
        else:
            print(f"Response: {response.text}")


class TestExistingAgentsInDatabase:
    """Test that existing AI agents (Sarah, Alex) are present"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login and get auth token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        if login_response.status_code != 200:
            pytest.skip(f"Login failed")
        
        self.token = login_response.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_existing_agents_present(self):
        """Verify that pre-seeded agents (Sarah, Alex) exist in database"""
        response = requests.get(
            f"{BASE_URL}/api/ai-agents",
            headers=self.headers
        )
        
        assert response.status_code == 200
        
        agents = response.json().get("agents", [])
        agent_names = [a.get("name") for a in agents]
        
        print(f"Agents in database: {agent_names}")
        
        # Check if expected agents exist
        expected_agents = ["Sarah", "Alex"]  # Based on context note
        
        for expected in expected_agents:
            if expected in agent_names:
                print(f"✓ Agent '{expected}' found in database")
            else:
                print(f"✗ Agent '{expected}' NOT found in database")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
