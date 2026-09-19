import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from fastapi.testclient import TestClient
from app.main import app

def test_full_system():
    with TestClient(app) as client:
        print(">>> 1. Health check...")
        res = client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("Health response:", res.json())

        print("\n>>> 2. Demo Login - Admin...")
        res = client.post("/api/v1/auth/demo-login/admin")
        assert res.status_code == 200, f"Admin login failed: {res.text}"
        admin_token = res.json()["access_token"]
        print("Admin logged in successfully:", res.json()["email"])

        print("\n>>> 3. Admin Analytics...")
        headers_admin = {"Authorization": f"Bearer {admin_token}"}
        res = client.get("/api/v1/admin/analytics", headers=headers_admin)
        assert res.status_code == 200, f"Analytics failed: {res.text}"
        print("Analytics:", res.json())

        print("\n>>> 4. Demo Login - Passenger...")
        res = client.post("/api/v1/auth/demo-login/passenger")
        assert res.status_code == 200, f"Passenger login failed: {res.text}"
        passenger_token = res.json()["access_token"]
        headers_passenger = {"Authorization": f"Bearer {passenger_token}"}
        print("Passenger logged in successfully:", res.json()["email"])

        print("\n>>> 5. Notifications check...")
        res = client.get("/api/v1/notifications", headers=headers_passenger)
        assert res.status_code == 200, f"Notifications failed: {res.text}"
        notifications = res.json()
        assert len(notifications) > 0, "Expected at least 1 notification"
        print(f"Passenger received {len(notifications)} notifications.")

        print("\n>>> 6. RYDO AI Chatbot...")
        ai_req = {"message": "How much does a ride to SFO airport cost?"}
        res = client.post("/api/v1/ai/chat", json=ai_req, headers=headers_passenger)
        assert res.status_code == 200, f"AI chat failed: {res.text}"
        ai_resp = res.json()
        assert "SFO" in ai_resp["response"] or "airport" in ai_resp["response"].lower()
        print("RYDO AI Response received:", ai_resp["response"][:80], "...")

        print("\n>>> 7. Fare Estimation...")
        estimate_payload = {
            "pickup_lat": 37.7749,
            "pickup_lng": -122.4194,
            "dropoff_lat": 37.7897,
            "dropoff_lng": -122.3972
        }
        res = client.post("/api/v1/rides/estimate", json=estimate_payload)
        assert res.status_code == 200, f"Estimate failed: {res.text}"
        est = res.json()
        print(f"Estimated Distance: {est['distance_km']} km, Duration: {est['duration_minutes']} min")
        for tier in est["tiers"]:
            print(f"  - {tier['name']} ({tier['vehicle_type']}): ₹{tier['estimated_fare']} (ETA: {tier['eta_minutes']} min)")

        print("\n>>> 8. Request Ride...")
        req_ride = {
            "pickup_address": "Market St & 5th St, San Francisco, CA",
            "pickup_lat": 37.7831,
            "pickup_lng": -122.4065,
            "dropoff_address": "Oracle Park, 24 Willie Mays Plaza, SF",
            "dropoff_lat": 37.7786,
            "dropoff_lng": -122.3893,
            "vehicle_type": "GO",
            "payment_method": "CARD"
        }
        res = client.post("/api/v1/rides/request", json=req_ride, headers=headers_passenger)
        assert res.status_code == 200, f"Ride request failed: {res.text}"
        ride_data = res.json()
        ride_id = ride_data["id"]
        otp_code = ride_data["otp_code"]
        print(f"Ride #{ride_id} created in status '{ride_data['status']}', OTP: {otp_code}")

        print("\n>>> 9. Demo Login - Driver...")
        res = client.post("/api/v1/auth/demo-login/driver")
        assert res.status_code == 200, f"Driver login failed: {res.text}"
        driver_token = res.json()["access_token"]
        headers_driver = {"Authorization": f"Bearer {driver_token}"}
        print("Driver logged in successfully:", res.json()["email"])

        print("\n>>> 10. Driver checks offers and accepts ride...")
        res = client.get("/api/v1/drivers/offers", headers=headers_driver)
        assert res.status_code == 200
        offers = res.json()
        print(f"Driver found {len(offers)} offers.")

        res = client.post(f"/api/v1/drivers/accept/{ride_id}", headers=headers_driver)
        assert res.status_code == 200, f"Driver accept failed: {res.text}"
        print(f"Driver accepted ride #{ride_id}. Status: {res.json()['status']}")

        print("\n>>> 11. Driver arrives at pickup...")
        res = client.post(f"/api/v1/drivers/arrived/{ride_id}", headers=headers_driver)
        assert res.status_code == 200
        print(f"Driver marked arrived. Status: {res.json()['status']}")

        print("\n>>> 12. Driver enters passenger OTP and starts trip...")
        res = client.post(f"/api/v1/drivers/start/{ride_id}", json={"otp_code": otp_code}, headers=headers_driver)
        assert res.status_code == 200, f"Driver start failed: {res.text}"
        print(f"Trip started! Status: {res.json()['status']}")

        print("\n>>> 13. Driver completes trip...")
        res = client.post(f"/api/v1/drivers/complete/{ride_id}", headers=headers_driver)
        assert res.status_code == 200, f"Driver complete failed: {res.text}"
        comp = res.json()
        print(f"Trip completed! Fare: ₹{comp['final_fare']}, Payment: {comp['payment']}")

        print("\n>>> 14. Passenger rates driver...")
        rate_payload = {
            "ride_id": ride_id,
            "rating": 5,
            "comment": "Awesome, quick and smooth ride!"
        }
        res = client.post("/api/v1/rides/rate", json=rate_payload, headers=headers_passenger)
        assert res.status_code == 200, f"Rate ride failed: {res.text}"
        print("Rating submitted:", res.json())

        print("\n>>> 15. Passenger checks history...")
        res = client.get("/api/v1/rides/history", headers=headers_passenger)
        assert res.status_code == 200
        history = res.json()
        print(f"Passenger history count: {len(history)}")

        print("\n>>> 16. Admin verifies drivers and rides list...")
        res = client.get("/api/v1/admin/drivers", headers=headers_admin)
        assert res.status_code == 200
        print(f"Admin drivers count: {len(res.json())}")

        res = client.get("/api/v1/admin/rides", headers=headers_admin)
        assert res.status_code == 200
        print(f"Admin rides count: {len(res.json())}")

        print("\n ALL 16 BACKEND SYSTEM & AI VERIFICATIONS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    test_full_system()
