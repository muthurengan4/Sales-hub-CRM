#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class HubSpotCRMTester:
    def __init__(self, base_url="https://crm-automation-ref.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_lead_id = None
        self.created_deal_id = None

    def log(self, message, success=None):
        """Log test results with colored output"""
        if success is True:
            print(f"✅ {message}")
        elif success is False:
            print(f"❌ {message}")
        else:
            print(f"🔍 {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        self.log(f"Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"Passed - Status: {response.status_code}", True)
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                self.log(f"Failed - Expected {expected_status}, got {response.status_code}", False)
                try:
                    error_data = response.json()
                    self.log(f"Error response: {error_data}")
                except:
                    self.log(f"Response text: {response.text[:200]}")
                return False, {}

        except requests.exceptions.RequestException as e:
            self.log(f"Failed - Network error: {str(e)}", False)
            return False, {}
        except Exception as e:
            self.log(f"Failed - Error: {str(e)}", False)
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_registration(self):
        """Test user registration"""
        test_user_data = {
            "name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "email": f"test{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            self.log(f"Registered user: {response['user']['name']}", True)
            return True
        return False

    def test_login(self):
        """Test user login with existing credentials"""
        # Create a test user first
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"logintest{timestamp}@example.com"
        test_password = "TestPass123!"
        
        # Register first
        register_data = {
            "name": f"Login Test User {timestamp}",
            "email": test_email,
            "password": test_password
        }
        
        reg_success, _ = self.run_test(
            "Pre-Login Registration",
            "POST",
            "auth/register",
            200,
            data=register_data
        )
        
        if not reg_success:
            return False
            
        # Now test login
        login_data = {
            "email": test_email,
            "password": test_password
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            # Don't override main token, just verify login works
            self.log(f"Login successful for: {response['user']['name']}", True)
            return True
        return False

    def test_get_me(self):
        """Test get current user endpoint"""
        if not self.token:
            self.log("No token available for authentication test", False)
            return False
            
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        
        if success and 'email' in response:
            self.log(f"User profile retrieved: {response['name']}", True)
            return True
        return False

    def test_create_lead(self):
        """Test creating a new lead"""
        if not self.token:
            self.log("No token available for lead creation", False)
            return False
            
        lead_data = {
            "name": "John Doe Test",
            "email": "john.doe@testcompany.com",
            "phone": "+1-555-0123",
            "company": "Test Company Inc",
            "title": "VP Sales",
            "company_size": "51-200",
            "industry": "Technology",
            "source": "linkedin"
        }
        
        success, response = self.run_test(
            "Create Lead",
            "POST",
            "leads",
            200,
            data=lead_data
        )
        
        if success and 'id' in response:
            self.created_lead_id = response['id']
            self.log(f"Lead created with AI score: {response.get('ai_score', 'N/A')}", True)
            return True
        return False

    def test_get_leads(self):
        """Test retrieving leads list"""
        if not self.token:
            return False
            
        success, response = self.run_test(
            "Get Leads List",
            "GET", 
            "leads",
            200
        )
        
        if success and isinstance(response, list):
            self.log(f"Retrieved {len(response)} leads", True)
            return True
        return False

    def test_get_lead_by_id(self):
        """Test retrieving specific lead"""
        if not self.token or not self.created_lead_id:
            return False
            
        success, response = self.run_test(
            "Get Lead by ID",
            "GET",
            f"leads/{self.created_lead_id}",
            200
        )
        
        if success and 'name' in response:
            self.log(f"Lead details: {response['name']} - Score: {response.get('ai_score')}", True)
            return True
        return False

    def test_update_lead(self):
        """Test updating lead"""
        if not self.token or not self.created_lead_id:
            return False
            
        update_data = {
            "status": "contacted",
            "notes": "Follow up scheduled"
        }
        
        success, response = self.run_test(
            "Update Lead",
            "PUT",
            f"leads/{self.created_lead_id}",
            200,
            data=update_data
        )
        
        if success and response.get('status') == 'contacted':
            self.log(f"Lead status updated to: {response['status']}", True)
            return True
        return False

    def test_refresh_lead_score(self):
        """Test AI score refresh for lead"""
        if not self.token or not self.created_lead_id:
            return False
            
        success, response = self.run_test(
            "Refresh Lead AI Score",
            "POST",
            f"leads/{self.created_lead_id}/refresh-score",
            200
        )
        
        if success and 'score' in response:
            self.log(f"AI score refreshed: {response['score']}", True)
            return True
        return False

    def test_create_deal(self):
        """Test creating a new deal"""
        if not self.token:
            return False
            
        deal_data = {
            "title": "Enterprise Software License",
            "value": 50000.0,
            "company": "Test Corp",
            "contact_name": "Jane Smith",
            "stage": "qualified",
            "expected_close_date": "2024-12-31",
            "notes": "High priority deal"
        }
        
        success, response = self.run_test(
            "Create Deal",
            "POST",
            "deals",
            200,
            data=deal_data
        )
        
        if success and 'id' in response:
            self.created_deal_id = response['id']
            self.log(f"Deal created with health score: {response.get('ai_health_score', 'N/A')}", True)
            return True
        return False

    def test_get_deals(self):
        """Test retrieving deals list"""
        if not self.token:
            return False
            
        success, response = self.run_test(
            "Get Deals List",
            "GET",
            "deals",
            200
        )
        
        if success and isinstance(response, list):
            self.log(f"Retrieved {len(response)} deals", True)
            return True
        return False

    def test_update_deal(self):
        """Test updating deal stage"""
        if not self.token or not self.created_deal_id:
            return False
            
        update_data = {
            "stage": "proposal",
            "notes": "Proposal sent to client"
        }
        
        success, response = self.run_test(
            "Update Deal Stage",
            "PUT",
            f"deals/{self.created_deal_id}",
            200,
            data=update_data
        )
        
        if success and response.get('stage') == 'proposal':
            self.log(f"Deal stage updated to: {response['stage']}", True)
            return True
        return False

    def test_analytics(self):
        """Test analytics endpoint"""
        if not self.token:
            return False
            
        success, response = self.run_test(
            "Get Analytics",
            "GET",
            "analytics",
            200
        )
        
        if success and 'total_leads' in response:
            self.log(f"Analytics: {response['total_leads']} leads, {response['total_deals']} deals", True)
            return True
        return False

    def test_delete_lead(self):
        """Test deleting the created lead"""
        if not self.token or not self.created_lead_id:
            return False
            
        success, response = self.run_test(
            "Delete Lead",
            "DELETE",
            f"leads/{self.created_lead_id}",
            200
        )
        
        if success:
            self.log("Lead deleted successfully", True)
            return True
        return False

    def test_delete_deal(self):
        """Test deleting the created deal"""
        if not self.token or not self.created_deal_id:
            return False
            
        success, response = self.run_test(
            "Delete Deal",
            "DELETE",
            f"deals/{self.created_deal_id}",
            200
        )
        
        if success:
            self.log("Deal deleted successfully", True)
            return True
        return False

def main():
    print("🚀 Starting HubSpot CRM API Testing...")
    print(f"📍 Testing against: https://crm-automation-ref.preview.emergentagent.com")
    print("=" * 60)
    
    tester = HubSpotCRMTester()
    
    # Test sequence
    tests = [
        ("Root API", tester.test_root_endpoint),
        ("User Registration", tester.test_registration),
        ("User Login", tester.test_login),
        ("Get Current User", tester.test_get_me),
        ("Create Lead", tester.test_create_lead),
        ("Get Leads", tester.test_get_leads),
        ("Get Lead by ID", tester.test_get_lead_by_id),
        ("Update Lead", tester.test_update_lead),
        ("Refresh Lead Score", tester.test_refresh_lead_score),
        ("Create Deal", tester.test_create_deal),
        ("Get Deals", tester.test_get_deals),
        ("Update Deal", tester.test_update_deal),
        ("Get Analytics", tester.test_analytics),
        ("Delete Lead", tester.test_delete_lead),
        ("Delete Deal", tester.test_delete_deal)
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        print()
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"❌ Failed tests: {', '.join(failed_tests)}")
        return 1
    else:
        print("✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())