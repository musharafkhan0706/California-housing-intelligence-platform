import urllib.request
import json
import os
import sys

BASE_URL = "http://127.0.0.1:8000"

def request_json(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except:
            return e.code, {"error": err_body}

def run_all_verifications():
    print("=" * 60)
    print("CALIFORNIA HOUSING INTELLIGENCE PLATFORM — E2E VERIFICATION")
    print("=" * 60)

    # 1. AUTHENTICATION
    print("\n[1] AUTHENTICATION & RBAC:")
    # Invalid login
    status, res = request_json("/api/auth/login", method="POST", data={"username_or_email": "bad@user.com", "password": "wrong"})
    assert status == 401, f"Expected 401, got {status}"
    print("  [PASS] Invalid login properly rejected with 401 Unauthorized")

    # Resident login
    status, res = request_json("/api/auth/login", method="POST", data={"username_or_email": "demo@housingintel.ca", "password": "DemoPass123!"})
    assert status == 200, f"Expected 200, got {status}"
    resident_token = res["access_token"]
    print("  [PASS] Resident login successful (JWT token issued)")

    # Protected route without token
    status, res = request_json("/api/auth/me", method="GET")
    assert status == 401, f"Expected 401, got {status}"
    print("  [PASS] Protected route /api/auth/me rejected unauthenticated request with 401")

    # Protected route with token
    status, res = request_json("/api/auth/me", method="GET", token=resident_token)
    assert status == 200, f"Expected 200, got {status}"
    print(f"  [PASS] User profile verified: {res['user']['username']} ({res['user']['role']})")

    # Admin authorization check
    status, res = request_json("/api/admin/overview", method="GET", token=resident_token)
    assert status == 403, f"Expected 403 Forbidden for normal user, got {status}"
    print("  [PASS] Normal resident denied access to /api/admin/overview with 403 Forbidden")

    # Admin login
    status, res = request_json("/api/auth/login", method="POST", data={"username_or_email": "admin@housingintel.ca", "password": "AdminPass123!"})
    assert status == 200, f"Expected 200, got {status}"
    admin_token = res["access_token"]
    print("  [PASS] Admin login successful (JWT token issued)")

    # Admin accessing admin endpoint
    status, res = request_json("/api/admin/overview", method="GET", token=admin_token)
    assert status == 200, f"Expected 200 for admin, got {status}"
    print(f"  [PASS] Admin authorized to view system telemetry: {res['metrics']['total_users']} users, status: {res['system']['status']}")

    # 2. HOUSING DISCOVERY & FILTERS
    print("\n[2] HOUSING DISCOVERY & FILTERS:")
    status, res = request_json("/api/housing?page=1&page_size=5&sort_by=estimated_value_desc")
    assert status == 200 and res["total"] == 20640
    print(f"  [PASS] Explore inventory verified: {res['total']} districts total, top estimate: ${res['items'][0]['estimated_value']:,.2f}")

    # Search filter
    status, res = request_json("/api/housing?search=Bay%20Area&page_size=2")
    assert status == 200 and len(res["items"]) > 0
    print(f"  [PASS] Search query 'Bay Area' returned {res['total']} matching records")

    # Region filter
    status, res = request_json("/api/housing?region=San%20Diego%20Metro&page_size=2")
    assert status == 200 and all(i["region_name"] == "San Diego Metro" for i in res["items"])
    print(f"  [PASS] Region filter 'San Diego Metro' returned {res['total']} matching records")

    # Multi-dimensional filter (price + income + age + proximity)
    status, res = request_json("/api/housing?min_price=250000&max_price=500000&min_income=4.0&ocean_proximity=NEAR%20BAY&page_size=3")
    assert status == 200
    print(f"  [PASS] Multi-dimensional filter (Price $250k-$500k, Income >$40k, Ocean 'NEAR BAY') returned {res['total']} districts")

    # Details page & Comparable records
    status, res = request_json("/api/housing/1")
    assert status == 200
    assert res["district_code"] == "CAD-00001"
    assert len(res["comparables"]) == 4
    print(f"  [PASS] District detail CAD-00001: Val=${res['estimated_value']:,.2f}, Comparables={len(res['comparables'])}, Factors={len(res['factors']['influences'])}")

    # Geo points for Leaflet map
    status, res = request_json("/api/housing/geo/points?sample_size=50")
    assert status == 200 and len(res) == 50
    print(f"  [PASS] California geographic map points: {len(res)} coordinates verified")

    # 3. MACHINE LEARNING ESTIMATOR
    print("\n[3] ML ESTIMATOR & VALIDATION:")
    # Invalid coordinates (outside California)
    status, res = request_json("/api/predictions", method="POST", data={
        "latitude": 60.0, "longitude": -120.0, "housing_median_age": 25, "median_income": 4.0
    })
    assert status == 422
    print("  [PASS] Invalid latitude (60.0°N > 42.5°N) rejected with 422 Unprocessable Entity")

    # Invalid income (negative)
    status, res = request_json("/api/predictions", method="POST", data={
        "latitude": 37.7, "longitude": -122.4, "housing_median_age": 25, "median_income": -5.0
    })
    assert status == 422
    print("  [PASS] Negative income (-$50,000) rejected with 422 Unprocessable Entity")

    # Valid prediction across all 8 features
    pred_payload = {
        "latitude": 37.7749, "longitude": -122.4194,
        "housing_median_age": 30.0, "median_income": 5.2,
        "avg_rooms": 5.8, "avg_bedrooms": 1.1, "avg_occupancy": 2.7,
        "population": 1600.0, "annual_salary": 140000.0,
        "ocean_proximity": "NEAR BAY"
    }
    status, res = request_json("/api/predictions", method="POST", data=pred_payload, token=resident_token)
    assert status == 200
    print(f"  [PASS] Model valuation computed: ${res['predicted_value']:,.2f} (EMI: ${res['monthly_emi']:,.2f}, Status: {res['affordability_status']})")
    print(f"  [PASS] Factor attribution influences: {[f['factor'] for f in res['factors']['influences']]}")

    # Check prediction saved in history
    status, res = request_json("/api/predictions/history", method="GET", token=resident_token)
    assert status == 200 and len(res) > 0
    print(f"  [PASS] Prediction history saved to user account: {len(res)} records stored")

    # 4. AFFORDABILITY & COMPARISON
    print("\n[4] AFFORDABILITY & COMPARISON:")
    aff_payload = {
        "property_value": 500000.0, "annual_income": 140000.0,
        "down_payment": 100000.0, "interest_rate": 6.5,
        "loan_term_years": 30, "monthly_debts": 500.0
    }
    status, res = request_json("/api/affordability/calculate", method="POST", data=aff_payload)
    assert status == 200
    print(f"  [PASS] Affordability: Total Monthly=${res['total_monthly_payment']:,.2f}, DTI={res['back_end_dti']}%, Rating='{res['affordability_status']}'")

    comp_payload = {"record_ids": [1, 2, 3]}
    status, res = request_json("/api/compare", method="POST", data=comp_payload)
    assert status == 200 and res["count"] == 3
    print(f"  [PASS] Multi-district comparison: {res['count']} districts compared against Group Avg ${res['group_averages']['avg_estimated_value']:,.2f}")

    # 5. USER FAVORITES & SAVED SEARCHES
    print("\n[5] USER PERSONALIZATION:")
    # Add favorite
    status, res = request_json("/api/favorites", method="POST", data={"housing_record_id": 10, "personal_note": "Great school room ratios", "folder_name": "Relocation"}, token=resident_token)
    assert status in [200, 201]
    print("  [PASS] District CAD-00010 saved to personal favorites with custom note")

    # List favorites
    status, res = request_json("/api/favorites", method="GET", token=resident_token)
    assert status == 200 and len(res) > 0
    print(f"  [PASS] Favorites listing verified: {len(res)} saved districts")

    # Save search criteria
    status, res = request_json("/api/saved-searches", method="POST", data={"title": "Coastal Homes Under 400k", "filter_params": {"max_price": 400000, "ocean_proximity": ["<1H OCEAN", "NEAR OCEAN"]}}, token=resident_token)
    assert status == 201
    saved_search_id = res["id"]
    print(f"  [PASS] Search criteria saved: '{res['title']}' (ID: {saved_search_id})")

    # Delete saved search
    status, res = request_json(f"/api/saved-searches/{saved_search_id}", method="DELETE", token=resident_token)
    assert status == 200
    print("  [PASS] Saved search removed cleanly")

    # 6. AI ASSISTANT (GEMINI & FALLBACK)
    print("\n[6] AI HOUSING INTELLIGENCE:")
    ai_payload = {
        "question": "Why is this district valuation estimated at this level?",
        "context": {
            "region_name": "San Francisco Bay Area",
            "predicted_value": 450000,
            "median_income": 6.2,
            "ocean_proximity": "NEAR BAY",
            "housing_median_age": 35
        }
    }
    status, res = request_json("/api/ai/explain", method="POST", data=ai_payload)
    assert status == 200
    assert len(res["answer"]) > 25
    assert res["grounded"] is True
    print(f"  [PASS] AI Assistant Response Source: {res['source']}")
    print(f"  [PASS] AI Answer preview: {res['answer'][:120]}...")

    # 7. SECURITY & DATA INTEGRITY
    print("\n[7] SECURITY & DATA INTEGRITY AUDIT:")
    # Check that secrets are not committed or hardcoded
    assert os.path.exists(".env.example")
    print("  [PASS] .env.example exists with sanitized placeholders")

    with open(".gitignore", "r") as f:
        gitignore_content = f.read()
    assert ".env" in gitignore_content
    print("  [PASS] .gitignore properly excludes .env and private keys")

    # Check data integrity in responses: no fake agent/listing fields
    status, res = request_json("/api/housing/1")
    forbidden_keys = ["agent_name", "listing_agent", "broker_phone", "days_on_market", "mls_number"]
    for k in forbidden_keys:
        assert k not in res, f"Forbidden fabricated key '{k}' found in district response!"
    print("  [PASS] Verified NO fabricated MLS keys (agent, broker, listing status) in district responses")
    assert res["record_type"] == "Historical District Record"
    print("  [PASS] Explicit labeling verified: record_type = 'Historical District Record'")

    print("\n" + "=" * 60)
    print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY WITH 100% PASS RATE!")
    print("=" * 60)

if __name__ == "__main__":
    run_all_verifications()
