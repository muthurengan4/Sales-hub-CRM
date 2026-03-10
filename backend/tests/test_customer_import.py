"""
Test suite for Customer Import and CRUD functionality
Tests: Excel import on Customers page, Customer CRUD operations, Search and Pagination
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "admin@testcrm.com"
TEST_PASSWORD = "Password123!"


class TestCustomerImport:
    """Tests for Customer Excel Import functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data.get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
        yield
    
    def test_import_customers_excel(self):
        """Test importing customers from Excel file"""
        excel_file_path = "/tmp/test_customers.xlsx"
        
        # Verify file exists
        assert os.path.exists(excel_file_path), f"Test file not found: {excel_file_path}"
        
        with open(excel_file_path, "rb") as f:
            files = {"file": ("test_customers.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
            response = requests.post(
                f"{BASE_URL}/api/customers/import",
                headers=self.headers,
                files=files
            )
        
        # Should return 200 and imported count
        assert response.status_code == 200, f"Import failed: {response.text}"
        data = response.json()
        assert "imported" in data, "Response should contain 'imported' count"
        assert data["imported"] > 0, "Should import at least one customer"
        print(f"Successfully imported {data['imported']} customers")
    
    def test_import_customers_excel_file2(self):
        """Test importing customers from second Excel file"""
        excel_file_path = "/tmp/test_customers2.xlsx"
        
        # Verify file exists
        assert os.path.exists(excel_file_path), f"Test file not found: {excel_file_path}"
        
        with open(excel_file_path, "rb") as f:
            files = {"file": ("test_customers2.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
            response = requests.post(
                f"{BASE_URL}/api/customers/import",
                headers=self.headers,
                files=files
            )
        
        assert response.status_code == 200, f"Import failed: {response.text}"
        data = response.json()
        assert "imported" in data, "Response should contain 'imported' count"
        print(f"Successfully imported {data['imported']} customers from file2")
    
    def test_import_requires_auth(self):
        """Test that import endpoint requires authentication"""
        excel_file_path = "/tmp/test_customers.xlsx"
        
        with open(excel_file_path, "rb") as f:
            files = {"file": ("test_customers.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
            response = requests.post(
                f"{BASE_URL}/api/customers/import",
                files=files
            )
        
        assert response.status_code == 401, f"Should return 401 without auth, got {response.status_code}"


class TestCustomerCRUD:
    """Tests for Customer CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data.get("token")
        self.headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        self.created_ids = []
        yield
        # Cleanup created test data
        for customer_id in self.created_ids:
            try:
                requests.delete(f"{BASE_URL}/api/customers/{customer_id}", headers=self.headers)
            except:
                pass
    
    def test_create_customer(self):
        """Test creating a new customer"""
        customer_data = {
            "first_name": "TEST_NewClinic",
            "last_name": "Owner",
            "email": "test_clinic@test.com",
            "phone": "+60 123 456 789",
            "company": "TEST New Clinic Sdn Bhd",
            "address": "123 Test Street",
            "city": "Kuala Lumpur",
            "state": "Selangor",
            "postcode": "50000",
            "country": "Malaysia"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/customers",
            headers=self.headers,
            json=customer_data
        )
        
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        
        # Verify data persisted correctly
        assert data["first_name"] == customer_data["first_name"]
        assert data["email"] == customer_data["email"]
        assert "id" in data
        self.created_ids.append(data["id"])
        print(f"Created customer with ID: {data['id']}")
        
        # GET to verify persistence
        get_response = requests.get(
            f"{BASE_URL}/api/customers/{data['id']}",
            headers=self.headers
        )
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["first_name"] == customer_data["first_name"]
    
    def test_get_customers_list(self):
        """Test fetching customers list with pagination"""
        response = requests.get(
            f"{BASE_URL}/api/customers?page=1&limit=10",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Get list failed: {response.text}"
        data = response.json()
        
        # Verify pagination structure
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data
        assert "total_pages" in data
        print(f"Found {data['total']} total customers, page {data['page']}/{data['total_pages']}")
    
    def test_update_customer(self):
        """Test updating a customer"""
        # First create a customer
        customer_data = {
            "first_name": "TEST_UpdateClinic",
            "email": "test_update@test.com",
            "city": "Petaling Jaya"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/customers",
            headers=self.headers,
            json=customer_data
        )
        assert create_response.status_code == 200
        created = create_response.json()
        self.created_ids.append(created["id"])
        
        # Update the customer
        update_data = {
            "first_name": "TEST_UpdateClinic_Modified",
            "city": "Shah Alam"
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/customers/{created['id']}",
            headers=self.headers,
            json=update_data
        )
        
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        updated = update_response.json()
        assert updated["first_name"] == "TEST_UpdateClinic_Modified"
        assert updated["city"] == "Shah Alam"
        
        # Verify with GET
        get_response = requests.get(
            f"{BASE_URL}/api/customers/{created['id']}",
            headers=self.headers
        )
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["first_name"] == "TEST_UpdateClinic_Modified"
    
    def test_delete_customer(self):
        """Test deleting a customer"""
        # First create a customer
        customer_data = {
            "first_name": "TEST_DeleteClinic",
            "email": "test_delete@test.com"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/customers",
            headers=self.headers,
            json=customer_data
        )
        assert create_response.status_code == 200
        created = create_response.json()
        
        # Delete the customer
        delete_response = requests.delete(
            f"{BASE_URL}/api/customers/{created['id']}",
            headers=self.headers
        )
        
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        
        # Verify deletion with GET (should 404)
        get_response = requests.get(
            f"{BASE_URL}/api/customers/{created['id']}",
            headers=self.headers
        )
        assert get_response.status_code == 404, "Should return 404 after deletion"


class TestCustomerSearch:
    """Tests for Customer search functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data.get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
        yield
    
    def test_search_customers(self):
        """Test searching customers by name"""
        # First create a customer with a unique name
        headers_with_content = {**self.headers, "Content-Type": "application/json"}
        unique_name = "TEST_UniqueSearchName"
        
        customer_data = {
            "first_name": unique_name,
            "email": "search_test@test.com"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/customers",
            headers=headers_with_content,
            json=customer_data
        )
        
        if create_response.status_code == 200:
            created_id = create_response.json()["id"]
            
            # Search for the customer
            search_response = requests.get(
                f"{BASE_URL}/api/customers?search={unique_name}",
                headers=self.headers
            )
            
            assert search_response.status_code == 200, f"Search failed: {search_response.text}"
            data = search_response.json()
            
            # Should find at least one customer
            assert data["total"] >= 1, "Should find at least one customer with search term"
            
            # Cleanup
            requests.delete(f"{BASE_URL}/api/customers/{created_id}", headers=self.headers)
        else:
            print(f"Warning: Could not create test customer for search test: {create_response.text}")


class TestCustomerPagination:
    """Tests for Customer pagination"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data.get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
        yield
    
    def test_pagination_parameters(self):
        """Test pagination with different page sizes"""
        # Test with page size 5
        response = requests.get(
            f"{BASE_URL}/api/customers?page=1&limit=5",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Pagination failed: {response.text}"
        data = response.json()
        
        assert data["limit"] == 5
        assert len(data["items"]) <= 5
        print(f"Pagination test: {len(data['items'])} items returned, total: {data['total']}")
    
    def test_pagination_page_navigation(self):
        """Test navigating between pages"""
        # Get first page
        response1 = requests.get(
            f"{BASE_URL}/api/customers?page=1&limit=5",
            headers=self.headers
        )
        
        assert response1.status_code == 200
        data1 = response1.json()
        
        # If there are more pages, test page 2
        if data1["total_pages"] > 1:
            response2 = requests.get(
                f"{BASE_URL}/api/customers?page=2&limit=5",
                headers=self.headers
            )
            
            assert response2.status_code == 200
            data2 = response2.json()
            assert data2["page"] == 2
            
            # Items should be different between pages
            if data1["items"] and data2["items"]:
                assert data1["items"][0]["id"] != data2["items"][0]["id"], "Page 2 should have different items"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
