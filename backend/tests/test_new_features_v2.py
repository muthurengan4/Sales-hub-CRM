"""
Backend API Tests for New Features (Iteration 6):
- Calendar Events API: GET/POST/PUT/DELETE /api/calendar/events
- WhatsApp Messages API: GET /api/whatsapp/messages/{contact_id}, POST /api/whatsapp/send
- Customers API: GET/POST/PUT/DELETE /api/customers
- ActionDropdown verification (visual testing via frontend)
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "testadmin2@example.com"
TEST_PASSWORD = "Password123!"

class TestAuth:
    """Authentication tests"""
    
    def test_login_returns_token(self):
        """Test login returns valid token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        print(f"PASS: Login successful, got token")


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for all tests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Authentication failed: {response.text}")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestCalendarEventsAPI:
    """Tests for /api/calendar/events endpoints"""
    
    def test_get_calendar_events_requires_auth(self):
        """Calendar events endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/calendar/events")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: /api/calendar/events requires auth")
    
    def test_get_calendar_events(self, auth_headers):
        """GET /api/calendar/events returns events list"""
        # Get events for current month
        today = datetime.now()
        start_date = today.replace(day=1).strftime('%Y-%m-%d')
        end_date = (today.replace(day=28) + timedelta(days=4)).replace(day=1).strftime('%Y-%m-%d')
        
        response = requests.get(
            f"{BASE_URL}/api/calendar/events?start_date={start_date}&end_date={end_date}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "events" in data, "Response should have 'events' key"
        assert isinstance(data["events"], list), "Events should be a list"
        print(f"PASS: GET /api/calendar/events returns {len(data['events'])} events")
    
    def test_create_calendar_event(self, auth_headers):
        """POST /api/calendar/events creates new event"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        event_data = {
            "title": "TEST_Meeting with client",
            "description": "Discuss project requirements",
            "date": tomorrow,
            "start_time": "10:00",
            "end_time": "11:00",
            "location": "Office",
            "color": "#A0C4FF",
            "all_day": False,
            "attendees": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/calendar/events",
            headers=auth_headers,
            json=event_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data, "Response should have 'id'"
        assert data["title"] == event_data["title"], "Title should match"
        assert data["date"] == tomorrow, "Date should match"
        print(f"PASS: POST /api/calendar/events created event: {data['id']}")
        return data["id"]
    
    def test_get_specific_calendar_event(self, auth_headers):
        """GET /api/calendar/events/{id} returns specific event"""
        # First create an event
        event_id = self.test_create_calendar_event(auth_headers)
        
        response = requests.get(
            f"{BASE_URL}/api/calendar/events/{event_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["id"] == event_id, "Event ID should match"
        print(f"PASS: GET /api/calendar/events/{event_id} returns event details")
    
    def test_update_calendar_event(self, auth_headers):
        """PUT /api/calendar/events/{id} updates event"""
        # First create an event
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        create_response = requests.post(
            f"{BASE_URL}/api/calendar/events",
            headers=auth_headers,
            json={
                "title": "TEST_Original title",
                "date": tomorrow,
                "start_time": "09:00",
                "end_time": "10:00"
            }
        )
        event_id = create_response.json()["id"]
        
        # Update the event
        update_data = {
            "title": "TEST_Updated title",
            "location": "Conference Room B"
        }
        response = requests.put(
            f"{BASE_URL}/api/calendar/events/{event_id}",
            headers=auth_headers,
            json=update_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["title"] == "TEST_Updated title", "Title should be updated"
        print(f"PASS: PUT /api/calendar/events/{event_id} updated event")
    
    def test_delete_calendar_event(self, auth_headers):
        """DELETE /api/calendar/events/{id} deletes event"""
        # First create an event
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        create_response = requests.post(
            f"{BASE_URL}/api/calendar/events",
            headers=auth_headers,
            json={
                "title": "TEST_To be deleted",
                "date": tomorrow,
                "start_time": "14:00",
                "end_time": "15:00"
            }
        )
        event_id = create_response.json()["id"]
        
        # Delete the event
        response = requests.delete(
            f"{BASE_URL}/api/calendar/events/{event_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify it's deleted
        get_response = requests.get(
            f"{BASE_URL}/api/calendar/events/{event_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 404, "Event should not exist after deletion"
        print(f"PASS: DELETE /api/calendar/events/{event_id} removed event")


class TestWhatsAppMessagesAPI:
    """Tests for /api/whatsapp/messages endpoints - MOCKED (stores locally)"""
    
    def test_get_whatsapp_messages_requires_auth(self):
        """WhatsApp messages endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/whatsapp/messages/test-contact-id")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: /api/whatsapp/messages requires auth")
    
    def test_get_whatsapp_messages_for_contact(self, auth_headers):
        """GET /api/whatsapp/messages/{contact_id} returns messages"""
        # First get a lead to use as contact
        leads_response = requests.get(f"{BASE_URL}/api/leads?limit=1", headers=auth_headers)
        
        contact_id = "test-contact-id"
        if leads_response.status_code == 200 and leads_response.json().get("items"):
            contact_id = leads_response.json()["items"][0]["id"]
        
        response = requests.get(
            f"{BASE_URL}/api/whatsapp/messages/{contact_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "messages" in data, "Response should have 'messages' key"
        assert isinstance(data["messages"], list), "Messages should be a list"
        print(f"PASS: GET /api/whatsapp/messages/{contact_id} returns {len(data['messages'])} messages")
    
    def test_send_whatsapp_message(self, auth_headers):
        """POST /api/whatsapp/send stores message locally (MOCKED)"""
        # First get a lead to use as contact
        leads_response = requests.get(f"{BASE_URL}/api/leads?limit=1", headers=auth_headers)
        
        contact_id = "test-contact-id"
        phone = "+60123456789"
        if leads_response.status_code == 200 and leads_response.json().get("items"):
            lead = leads_response.json()["items"][0]
            contact_id = lead["id"]
            phone = lead.get("phone", phone)
        
        message_data = {
            "contact_id": contact_id,
            "message": "TEST_Hello! This is a test message.",
            "phone": phone
        }
        
        response = requests.post(
            f"{BASE_URL}/api/whatsapp/send",
            headers=auth_headers,
            json=message_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Should return success: true"
        assert "message" in data, "Should return the message object"
        print(f"PASS: POST /api/whatsapp/send - message stored locally (MOCKED integration)")
    
    def test_send_whatsapp_message_requires_auth(self):
        """POST /api/whatsapp/send requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/whatsapp/send",
            json={"contact_id": "test", "message": "test"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: POST /api/whatsapp/send requires auth")


class TestCustomersAPI:
    """Tests for /api/customers endpoints (alias for contacts)"""
    
    def test_get_customers_requires_auth(self):
        """Customers endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/customers")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: /api/customers requires auth")
    
    def test_get_customers_list(self, auth_headers):
        """GET /api/customers returns paginated list"""
        response = requests.get(f"{BASE_URL}/api/customers?limit=10", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "items" in data, "Response should have 'items'"
        assert "total" in data, "Response should have 'total'"
        assert "page" in data, "Response should have 'page'"
        assert "total_pages" in data, "Response should have 'total_pages'"
        print(f"PASS: GET /api/customers returns {data['total']} total customers")
    
    def test_create_customer(self, auth_headers):
        """POST /api/customers creates new customer"""
        customer_data = {
            "first_name": "TEST_John",
            "last_name": "Doe",
            "email": f"test_customer_{datetime.now().timestamp()}@example.com",
            "phone": "+60123456789",
            "company": "TEST_Company Inc"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/customers",
            headers=auth_headers,
            json=customer_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data, "Response should have 'id'"
        assert data["first_name"] == customer_data["first_name"], "First name should match"
        print(f"PASS: POST /api/customers created customer: {data['id']}")
        return data["id"]
    
    def test_get_specific_customer(self, auth_headers):
        """GET /api/customers/{id} returns specific customer"""
        # First create a customer
        customer_id = self.test_create_customer(auth_headers)
        
        response = requests.get(
            f"{BASE_URL}/api/customers/{customer_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["id"] == customer_id, "Customer ID should match"
        print(f"PASS: GET /api/customers/{customer_id} returns customer details")
    
    def test_update_customer(self, auth_headers):
        """PUT /api/customers/{id} updates customer"""
        # First create a customer
        customer_id = self.test_create_customer(auth_headers)
        
        update_data = {
            "first_name": "TEST_Jane",
            "company": "TEST_Updated Company"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/customers/{customer_id}",
            headers=auth_headers,
            json=update_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["first_name"] == "TEST_Jane", "First name should be updated"
        print(f"PASS: PUT /api/customers/{customer_id} updated customer")
    
    def test_delete_customer(self, auth_headers):
        """DELETE /api/customers/{id} deletes customer"""
        # First create a customer
        customer_id = self.test_create_customer(auth_headers)
        
        response = requests.delete(
            f"{BASE_URL}/api/customers/{customer_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify it's deleted
        get_response = requests.get(
            f"{BASE_URL}/api/customers/{customer_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 404, "Customer should not exist after deletion"
        print(f"PASS: DELETE /api/customers/{customer_id} removed customer")
    
    def test_search_customers(self, auth_headers):
        """GET /api/customers with search parameter"""
        # First create a customer with unique name
        unique_name = f"TEST_Unique_{datetime.now().timestamp()}"
        requests.post(
            f"{BASE_URL}/api/customers",
            headers=auth_headers,
            json={"first_name": unique_name, "email": f"{unique_name}@test.com"}
        )
        
        # Search for it
        response = requests.get(
            f"{BASE_URL}/api/customers?search={unique_name}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["total"] >= 1, "Should find at least one customer"
        print(f"PASS: GET /api/customers?search={unique_name} found {data['total']} customers")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_data(self, auth_headers):
        """Clean up TEST_ prefixed data created during tests"""
        # Clean up calendar events
        today = datetime.now()
        start_date = (today - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = (today + timedelta(days=30)).strftime('%Y-%m-%d')
        
        events_response = requests.get(
            f"{BASE_URL}/api/calendar/events?start_date={start_date}&end_date={end_date}",
            headers=auth_headers
        )
        if events_response.status_code == 200:
            events = events_response.json().get("events", [])
            for event in events:
                if event.get("title", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/calendar/events/{event['id']}", headers=auth_headers)
        
        # Clean up customers
        customers_response = requests.get(f"{BASE_URL}/api/customers?limit=100", headers=auth_headers)
        if customers_response.status_code == 200:
            customers = customers_response.json().get("items", [])
            for customer in customers:
                if customer.get("first_name", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/customers/{customer['id']}", headers=auth_headers)
        
        print("PASS: Cleanup completed for TEST_ prefixed data")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
