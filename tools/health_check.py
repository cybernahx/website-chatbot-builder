import requests
import sys
import time

# Configuration
SERVICES = {
    'Backend API': 'http://localhost:5000/api/health',
    'Frontend (Local)': 'http://localhost:3000', # Assuming standard React/Static port
}

def check_service(name, url):
    print(f"Checking {name}...", end=" ")
    try:
        response = requests.get(url, timeout=3)
        if response.status_code == 200:
            print(f"✅ UP ({response.status_code})")
            return True
        else:
            print(f"⚠️ WARN ({response.status_code})")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ DOWN (Connection Refused)")
        return False
    except Exception as e:
        print(f"❌ ERROR ({str(e)})")
        return False

if __name__ == "__main__":
    print("\n🏥 Chatbot Builder - Health Check")
    print("=================================")
    
    all_healthy = True
    for name, url in SERVICES.items():
        if not check_service(name, url):
            all_healthy = False
            
    print("\nSummary:")
    if all_healthy:
        print("✅ All systems operational!")
        sys.exit(0)
    else:
        print("❌ Some systems are down.")
        sys.exit(1)
