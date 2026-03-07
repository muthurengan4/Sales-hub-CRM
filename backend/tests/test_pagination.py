#!/usr/bin/env python3
"""
Pagination API Tests
Tests the paginated responses for leads, contacts, and users endpoints
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://crm-automation-ref.preview.emergentagent.com')

# Test credentials for pagination testing
TEST_EMAIL = "pag1772866828@test.com"
TEST_PASSWORD = "test123456"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for test user with 15 leads"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers={"Content-Type": "application/json"}
    )
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.status_code}")
    data = response.json()
    return data.get("token")


@pytest.fixture(scope="module")
def api_client(auth_token):
    """Authenticated requests session"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


class TestLeadsPagination:
    """Tests for /api/leads paginated endpoint"""
    
    def test_leads_default_pagination(self, api_client):
        """Test leads endpoint returns paginated response with default limit=10"""
        response = api_client.get(f"{BASE_URL}/api/leads?page=1&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        # Verify pagination structure
        assert "items" in data, "Response should have 'items' key"
        assert "total" in data, "Response should have 'total' key"
        assert "page" in data, "Response should have 'page' key"
        assert "limit" in data, "Response should have 'limit' key"
        assert "total_pages" in data, "Response should have 'total_pages' key"
        
        # Verify values
        assert data["page"] == 1
        assert data["limit"] == 10
        assert isinstance(data["items"], list)
        assert data["total"] >= len(data["items"])
        print(f"Leads pagination: total={data['total']}, page={data['page']}, limit={data['limit']}, total_pages={data['total_pages']}")
    
    def test_leads_pagination_page_2(self, api_client):
        """Test leads endpoint page 2"""
        # First get page 1 to know total
        response1 = api_client.get(f"{BASE_URL}/api/leads?page=1&limit=10")
        data1 = response1.json()
        
        if data1["total_pages"] < 2:
            pytest.skip("Not enough leads for page 2 test")
        
        response = api_client.get(f"{BASE_URL}/api/leads?page=2&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert data["page"] == 2
        # Page 2 should have remaining items
        expected_items = data1["total"] - 10
        assert len(data["items"]) == min(10, expected_items)
        print(f"Page 2: {len(data['items'])} items (expected up to {expected_items})")
    
    def test_leads_pagination_limit_25(self, api_client):
        """Test leads endpoint with limit=25"""
        response = api_client.get(f"{BASE_URL}/api/leads?page=1&limit=25")
        assert response.status_code == 200
        
        data = response.json()
        assert data["limit"] == 25
        assert len(data["items"]) <= 25
        print(f"Limit 25: {len(data['items'])} items returned")
    
    def test_leads_pagination_limit_50(self, api_client):
        """Test leads endpoint with limit=50"""
        response = api_client.get(f"{BASE_URL}/api/leads?page=1&limit=50")
        assert response.status_code == 200
        
        data = response.json()
        assert data["limit"] == 50
        assert len(data["items"]) <= 50
        print(f"Limit 50: {len(data['items'])} items returned")
    
    def test_leads_pagination_limit_100(self, api_client):
        """Test leads endpoint with limit=100"""
        response = api_client.get(f"{BASE_URL}/api/leads?page=1&limit=100")
        assert response.status_code == 200
        
        data = response.json()
        assert data["limit"] == 100
        assert len(data["items"]) <= 100
        print(f"Limit 100: {len(data['items'])} items returned")
    
    def test_leads_total_pages_calculation(self, api_client):
        """Test that total_pages is correctly calculated"""
        response = api_client.get(f"{BASE_URL}/api/leads?page=1&limit=5")
        assert response.status_code == 200
        
        data = response.json()
        expected_pages = (data["total"] + 4) // 5  # Ceiling division
        assert data["total_pages"] == expected_pages
        print(f"Total pages calculation: {data['total']} items / 5 = {data['total_pages']} pages")


class TestContactsPagination:
    """Tests for /api/contacts paginated endpoint"""
    
    def test_contacts_pagination_structure(self, api_client):
        """Test contacts endpoint returns paginated response structure"""
        response = api_client.get(f"{BASE_URL}/api/contacts?page=1&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        # Verify pagination structure
        assert "items" in data, "Response should have 'items' key"
        assert "total" in data, "Response should have 'total' key"
        assert "page" in data, "Response should have 'page' key"
        assert "limit" in data, "Response should have 'limit' key"
        assert "total_pages" in data, "Response should have 'total_pages' key"
        
        assert isinstance(data["items"], list)
        print(f"Contacts pagination: total={data['total']}, page={data['page']}, limit={data['limit']}")
    
    def test_contacts_pagination_limit_variations(self, api_client):
        """Test contacts endpoint with different limits"""
        for limit in [10, 25, 50, 100]:
            response = api_client.get(f"{BASE_URL}/api/contacts?page=1&limit={limit}")
            assert response.status_code == 200
            data = response.json()
            assert data["limit"] == limit
            print(f"Contacts limit={limit}: OK")


class TestUsersPagination:
    """Tests for /api/users paginated endpoint"""
    
    def test_users_pagination_structure(self, api_client):
        """Test users endpoint returns paginated response structure"""
        response = api_client.get(f"{BASE_URL}/api/users?page=1&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        # Verify pagination structure
        assert "items" in data, "Response should have 'items' key"
        assert "total" in data, "Response should have 'total' key"
        assert "page" in data, "Response should have 'page' key"
        assert "limit" in data, "Response should have 'limit' key"
        assert "total_pages" in data, "Response should have 'total_pages' key"
        
        assert isinstance(data["items"], list)
        print(f"Users pagination: total={data['total']}, page={data['page']}, limit={data['limit']}")
    
    def test_users_pagination_limit_variations(self, api_client):
        """Test users endpoint with different limits"""
        for limit in [10, 25, 50, 100]:
            response = api_client.get(f"{BASE_URL}/api/users?page=1&limit={limit}")
            assert response.status_code == 200
            data = response.json()
            assert data["limit"] == limit
            print(f"Users limit={limit}: OK")


class TestPaginationEdgeCases:
    """Tests for pagination edge cases"""
    
    def test_invalid_page_defaults_to_1(self, api_client):
        """Test that invalid page parameter defaults to page 1"""
        response = api_client.get(f"{BASE_URL}/api/leads?page=0&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1  # Should default to 1
    
    def test_limit_capped_at_100(self, api_client):
        """Test that limit is capped at 100"""
        response = api_client.get(f"{BASE_URL}/api/leads?page=1&limit=500")
        assert response.status_code == 200
        data = response.json()
        assert data["limit"] == 100  # Should cap at 100
    
    def test_page_beyond_total_returns_empty(self, api_client):
        """Test that requesting page beyond total returns empty items"""
        response = api_client.get(f"{BASE_URL}/api/leads?page=999&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
