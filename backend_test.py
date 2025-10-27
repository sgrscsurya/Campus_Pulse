import requests
import sys
import json
from datetime import datetime, timedelta

class CampusPulseAPITester:
    def __init__(self, base_url="https://campus-pulse-80.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tokens = {}  # Store tokens for different users
        self.users = {}   # Store user data
        self.events = {}  # Store created events
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.content:
                    try:
                        error_detail = response.json()
                        print(f"   Error: {error_detail}")
                    except:
                        print(f"   Response: {response.text}")
                self.failed_tests.append({
                    'test': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'endpoint': endpoint
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'test': name,
                'error': str(e),
                'endpoint': endpoint
            })
            return False, {}

    def test_user_registration(self, role, email_suffix=""):
        """Test user registration for different roles"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "name": f"Test {role.title()} {timestamp}",
            "email": f"test_{role}_{timestamp}{email_suffix}@college.edu",
            "password": "TestPass123!",
            "role": role
        }
        
        success, response = self.run_test(
            f"Register {role}",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success and 'token' in response:
            self.tokens[role] = response['token']
            self.users[role] = response['user']
            return True
        return False

    def test_user_login(self, role):
        """Test user login"""
        if role not in self.users:
            return False
            
        user = self.users[role]
        login_data = {
            "email": user['email'],
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            f"Login {role}",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.tokens[role] = response['token']
            return True
        return False

    def test_get_current_user(self, role):
        """Test getting current user info"""
        if role not in self.tokens:
            return False
            
        success, response = self.run_test(
            f"Get current user ({role})",
            "GET",
            "auth/me",
            200,
            token=self.tokens[role]
        )
        return success

    def test_update_profile(self, role):
        """Test profile update"""
        if role not in self.tokens:
            return False
            
        profile_data = {
            "bio": f"Updated bio for {role}",
            "phone": "+1234567890"
        }
        
        success, response = self.run_test(
            f"Update profile ({role})",
            "PUT",
            "users/profile",
            200,
            data=profile_data,
            token=self.tokens[role]
        )
        return success

    def test_get_user_stats(self, role):
        """Test getting user stats"""
        if role not in self.tokens:
            return False
            
        success, response = self.run_test(
            f"Get user stats ({role})",
            "GET",
            "users/stats",
            200,
            token=self.tokens[role]
        )
        return success

    def test_create_event(self, organizer_role="organizer"):
        """Test event creation"""
        if organizer_role not in self.tokens:
            return False
            
        start_date = (datetime.now() + timedelta(days=7)).isoformat()
        end_date = (datetime.now() + timedelta(days=7, hours=3)).isoformat()
        
        event_data = {
            "title": f"Test Event {datetime.now().strftime('%H%M%S')}",
            "description": "This is a test event for Campus Pulse testing",
            "category": "technical",
            "start_date": start_date,
            "end_date": end_date,
            "venue": "Test Auditorium",
            "capacity": 100,
            "cost": 0.0,
            "tags": ["test", "automation"]
        }
        
        success, response = self.run_test(
            f"Create event ({organizer_role})",
            "POST",
            "events",
            200,
            data=event_data,
            token=self.tokens[organizer_role]
        )
        
        if success and 'id' in response:
            self.events[organizer_role] = response
            return True
        return False

    def test_get_events(self):
        """Test getting all events"""
        success, response = self.run_test(
            "Get all events",
            "GET",
            "events",
            200
        )
        return success

    def test_get_event_by_id(self, role="organizer"):
        """Test getting single event"""
        if role not in self.events:
            return False
            
        event_id = self.events[role]['id']
        success, response = self.run_test(
            f"Get event by ID",
            "GET",
            f"events/{event_id}",
            200
        )
        return success

    def test_get_my_events(self, role="organizer"):
        """Test getting organizer's events"""
        if role not in self.tokens:
            return False
            
        success, response = self.run_test(
            f"Get my events ({role})",
            "GET",
            "events/organizer/my-events",
            200,
            token=self.tokens[role]
        )
        return success

    def test_event_registration(self):
        """Test student registering for event"""
        if 'student' not in self.tokens or 'organizer' not in self.events:
            return False
            
        event_id = self.events['organizer']['id']
        success, response = self.run_test(
            "Student register for event",
            "POST",
            f"registrations/{event_id}",
            200,
            token=self.tokens['student']
        )
        return success

    def test_get_my_registrations(self):
        """Test getting student's registrations"""
        if 'student' not in self.tokens:
            return False
            
        success, response = self.run_test(
            "Get my registrations",
            "GET",
            "registrations/my-registrations",
            200,
            token=self.tokens['student']
        )
        return success

    def test_get_event_registrations(self, role="organizer"):
        """Test getting event registrations (organizer/admin only)"""
        if role not in self.tokens or role not in self.events:
            return False
            
        event_id = self.events[role]['id']
        success, response = self.run_test(
            f"Get event registrations ({role})",
            "GET",
            f"registrations/event/{event_id}",
            200,
            token=self.tokens[role]
        )
        return success

    def test_get_notifications(self, role):
        """Test getting notifications"""
        if role not in self.tokens:
            return False
            
        success, response = self.run_test(
            f"Get notifications ({role})",
            "GET",
            "notifications",
            200,
            token=self.tokens[role]
        )
        return success

    def test_event_analytics(self, role="organizer"):
        """Test getting event analytics"""
        if role not in self.tokens or role not in self.events:
            return False
            
        event_id = self.events[role]['id']
        success, response = self.run_test(
            f"Get event analytics ({role})",
            "GET",
            f"analytics/event/{event_id}",
            200,
            token=self.tokens[role]
        )
        return success

    def test_dashboard_analytics(self):
        """Test admin dashboard analytics"""
        if 'admin' not in self.tokens:
            return False
            
        success, response = self.run_test(
            "Get dashboard analytics (admin)",
            "GET",
            "analytics/dashboard",
            200,
            token=self.tokens['admin']
        )
        return success

    def test_search_and_filter_events(self):
        """Test event search and filtering"""
        # Test search
        success1, _ = self.run_test(
            "Search events",
            "GET",
            "events",
            200,
            params={"search": "test"}
        )
        
        # Test category filter
        success2, _ = self.run_test(
            "Filter events by category",
            "GET",
            "events",
            200,
            params={"category": "technical"}
        )
        
        return success1 and success2

def main():
    print("🚀 Starting Campus Pulse API Testing...")
    tester = CampusPulseAPITester()
    
    # Test user registration and authentication for all roles
    print("\n" + "="*50)
    print("TESTING USER AUTHENTICATION")
    print("="*50)
    
    roles = ['student', 'organizer', 'admin']
    for role in roles:
        if not tester.test_user_registration(role):
            print(f"❌ Registration failed for {role}, stopping tests")
            return 1
    
    # Test login for all users
    for role in roles:
        if not tester.test_user_login(role):
            print(f"❌ Login failed for {role}")
    
    # Test getting current user
    for role in roles:
        tester.test_get_current_user(role)
    
    # Test profile updates
    print("\n" + "="*50)
    print("TESTING USER PROFILE MANAGEMENT")
    print("="*50)
    
    for role in roles:
        tester.test_update_profile(role)
        tester.test_get_user_stats(role)
    
    # Test event management
    print("\n" + "="*50)
    print("TESTING EVENT MANAGEMENT")
    print("="*50)
    
    # Create events (organizer and admin can create)
    tester.test_create_event("organizer")
    tester.test_create_event("admin")
    
    # Test event retrieval
    tester.test_get_events()
    tester.test_get_event_by_id("organizer")
    tester.test_get_my_events("organizer")
    tester.test_search_and_filter_events()
    
    # Test event registration
    print("\n" + "="*50)
    print("TESTING EVENT REGISTRATION")
    print("="*50)
    
    tester.test_event_registration()
    tester.test_get_my_registrations()
    tester.test_get_event_registrations("organizer")
    
    # Test notifications
    print("\n" + "="*50)
    print("TESTING NOTIFICATIONS")
    print("="*50)
    
    for role in roles:
        tester.test_get_notifications(role)
    
    # Test analytics
    print("\n" + "="*50)
    print("TESTING ANALYTICS")
    print("="*50)
    
    tester.test_event_analytics("organizer")
    tester.test_dashboard_analytics()
    
    # Print final results
    print("\n" + "="*50)
    print("TEST RESULTS SUMMARY")
    print("="*50)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"📈 Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ Failed tests ({len(tester.failed_tests)}):")
        for failed in tester.failed_tests:
            print(f"  - {failed['test']}: {failed.get('error', f'Expected {failed.get(\"expected\")}, got {failed.get(\"actual\")}')}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())