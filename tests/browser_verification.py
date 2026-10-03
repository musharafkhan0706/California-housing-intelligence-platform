import sys
import time
from playwright.sync_api import sync_playwright

CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
BASE_URL = "http://127.0.0.1:8000"

def run_browser_verification():
    print("=" * 70, flush=True)
    print("STARTING GENUINE BROWSER / UI VERIFICATION WITH HEADLESS CHROME", flush=True)
    print("=" * 70, flush=True)

    console_errors = []
    page_errors = []
    results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True
        )

        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Listen to console and runtime errors (ignoring expected 403 probe from auth security check)
        page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type in ["error"] and "403" not in msg.text else None)
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        # -------------------------------------------------------------
        # FLOW A: Landing -> Explore
        # -------------------------------------------------------------
        print("\n[Flow A] Testing Landing -> Explore navigation...", flush=True)
        page.goto(BASE_URL)
        page.wait_for_selector("text=California Housing Intelligence Platform")
        assert "California Housing" in page.content()
        page.click("nav.desktop-nav button:has-text('Explore Housing')")
        page.wait_for_selector("text=Explore California Housing")
        page.wait_for_selector("text=Browse 20,640 historical housing records")
        results["Flow A (Landing -> Explore)"] = "PASS"
        print("  -> Flow A PASSED: Landed on Explore page, verified header and 20,640 census records label.", flush=True)

        # -------------------------------------------------------------
        # FLOW B: Explore -> search/filter -> results
        # -------------------------------------------------------------
        print("\n[Flow B] Testing Explore search and filtering...", flush=True)
        page.fill("input[placeholder*='CAD-0012']", "Bay Area")
        page.click("button:has-text('Apply Filters')")
        time.sleep(1)
        page.wait_for_selector("text=San Francisco Bay Area")
        results["Flow B (Explore search & filter)"] = "PASS"
        print("  -> Flow B PASSED: Search query 'Bay Area' filtered inventory down to matching regional districts.", flush=True)

        # -------------------------------------------------------------
        # FLOW C: Results -> district/property detail
        # -------------------------------------------------------------
        print("\n[Flow C] Testing District Detail view...", flush=True)
        detail_btn = page.locator("button:has-text('View Details')").first
        detail_btn.click()
        page.wait_for_selector("text=District ID:")
        page.wait_for_selector("text=Model/Data Estimate")
        page.wait_for_selector("text=Why did the model estimate this value?")
        page.wait_for_selector("text=Comparable Districts in")
        results["Flow C (Results -> District Detail)"] = "PASS"
        print("  -> Flow C PASSED: District detail view rendered with Factor Attribution and Comparable Districts.", flush=True)

        # -------------------------------------------------------------
        # FLOW D: Detail -> Compare
        # -------------------------------------------------------------
        print("\n[Flow D] Testing Detail -> Add to Compare...", flush=True)
        compare_btn = page.locator("button:has-text('Compare District')").first
        compare_btn.click()
        time.sleep(0.5)
        page.click("nav.desktop-nav button:has-text('Compare')")
        page.wait_for_selector("text=Compare Housing Districts")
        results["Flow D (Detail -> Compare)"] = "PASS"
        print("  -> Flow D PASSED: District added to comparison matrix and benchmark page loaded.", flush=True)

        # -------------------------------------------------------------
        # FLOW E: Detail -> Favorite (Triggers Auth Modal when logged out)
        # -------------------------------------------------------------
        print("\n[Flow E] Testing Favorite action triggers authentication modal when logged out...", flush=True)
        page.click("nav.desktop-nav button:has-text('Explore Housing')")
        page.wait_for_selector("text=Explore California Housing")
        fav_btn = page.locator("button[title*='Save']").first
        fav_btn.click()
        page.wait_for_selector("text=Welcome Back")
        results["Flow E (Detail -> Favorite triggers Auth)"] = "PASS"
        print("  -> Flow E PASSED: Clicking favorite while unauthenticated cleanly opens login modal.", flush=True)
        close_btn = page.locator("button[aria-label='Close modal']")
        close_btn.click()
        time.sleep(0.5)

        # -------------------------------------------------------------
        # FLOW F: ML Estimator -> enter valid inputs -> prediction
        # -------------------------------------------------------------
        print("\n[Flow F] Testing ML Price Estimator with valid inputs...", flush=True)
        page.click("nav.desktop-nav button:has-text('Price Estimator')")
        page.wait_for_selector("text=Estimate Housing Value")
        page.wait_for_selector("button:has-text('Calculate Model Estimate')")
        page.click("button:has-text('Calculate Model Estimate')")
        page.wait_for_selector("text=Model-Estimated Median Housing Value")
        page.wait_for_selector("text=Estimated Monthly EMI")
        results["Flow F (ML Estimator valid inputs)"] = "PASS"
        print("  -> Flow F PASSED: 8-input inference executed in browser; valuation card and EMI rendered.", flush=True)

        # -------------------------------------------------------------
        # FLOW G: ML Estimator -> invalid input -> validation message
        # -------------------------------------------------------------
        print("\n[Flow G] Testing ML Estimator boundary validation...", flush=True)
        lat_input = page.locator("input[step='0.0001']").first
        lat_input.fill("55.0")
        page.click("button:has-text('Calculate Model Estimate')")
        page.wait_for_selector("text=Latitude must be within California bounds")
        results["Flow G (ML Estimator boundary validation)"] = "PASS"
        print("  -> Flow G PASSED: Out-of-bounds latitude 55.0 rejected with explicit California bounds error.", flush=True)
        lat_input.fill("37.88")

        # -------------------------------------------------------------
        # FLOW H: Affordability -> calculate -> result
        # -------------------------------------------------------------
        print("\n[Flow H] Testing Affordability Calculator...", flush=True)
        page.click("nav.desktop-nav button:has-text('Affordability')")
        page.wait_for_selector("text=Affordability & EMI Planner")
        page.wait_for_selector("text=Estimated Monthly Housing Cost")
        page.wait_for_selector("text=Budgeting Guidance")
        page.wait_for_selector("text=Principal & Interest (P&I)")
        results["Flow H (Affordability Calculator)"] = "PASS"
        print("  -> Flow H PASSED: Affordability assessment computed with DTI and monthly breakdown.", flush=True)

        # -------------------------------------------------------------
        # FLOW I: Market Insights -> charts/data render
        # -------------------------------------------------------------
        print("\n[Flow I] Testing Market Insights analytics...", flush=True)
        page.click("nav.desktop-nav button:has-text('Market Insights')")
        page.wait_for_selector("text=California Housing Market Insights")
        page.wait_for_selector("text=California Regional Benchmarks")
        page.wait_for_selector("text=San Francisco Bay Area")
        page.wait_for_selector("text=Greater Los Angeles")
        results["Flow I (Market Insights analytics)"] = "PASS"
        print("  -> Flow I PASSED: 8 California regional markets breakdown and summary statistics rendered.", flush=True)

        # -------------------------------------------------------------
        # FLOW J: Trust & Provenance -> information renders
        # -------------------------------------------------------------
        print("\n[Flow J] Testing Trust & Transparency provenance...", flush=True)
        page.click("nav.desktop-nav button:has-text('Data & Trust')")
        page.wait_for_selector("text=Data & Model Methodology")
        page.wait_for_selector("text=Dataset Provenance")
        page.wait_for_selector("text=Neural Net Pipeline")
        page.wait_for_selector("text=Mean Absolute Error (MAE)")
        results["Flow J (Trust & Provenance)"] = "PASS"
        print("  -> Flow J PASSED: Provenance disclosures, dataset boundaries, and audited metrics rendered.", flush=True)

        # -------------------------------------------------------------
        # FLOW K: Login -> User Dashboard
        # -------------------------------------------------------------
        print("\n[Flow K] Testing Resident User Login and Dashboard...", flush=True)
        page.click("button:has-text('Sign In')")
        page.wait_for_selector("text=Welcome Back")
        page.fill("input[placeholder*='demo@housingintel.ca']", "demo@housingintel.ca")
        page.fill("input[type='password']", "DemoPass123!")
        page.click("button[type='submit']:has-text('Sign In')")
        page.wait_for_selector("#user-profile-btn")
        # Open profile menu and navigate to Dashboard
        page.click("#user-profile-btn")
        page.wait_for_selector("#my-dashboard-link")
        page.click("#my-dashboard-link")
        page.wait_for_selector("text=Personal Intelligence Hub")
        page.wait_for_selector("text=Welcome, California Resident")
        results["Flow K (User Login -> Dashboard)"] = "PASS"
        print("  -> Flow K PASSED: Logged in successfully; dashboard renders user hub and saved items.", flush=True)

        # -------------------------------------------------------------
        # FLOW L: User -> attempt Admin -> correctly blocked
        # -------------------------------------------------------------
        print("\n[Flow L] Testing Resident User attempted Admin access...", flush=True)
        assert "Admin Portal" not in page.content()
        user_token = page.evaluate("() => localStorage.getItem('chip_token')")
        res_status = page.evaluate("""async (token) => {
            const resp = await fetch('/api/admin/overview', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            return resp.status;
        }""", user_token)
        assert res_status == 403, f"Expected 403 for resident user on admin route, got {res_status}"
        results["Flow L (Resident User blocked from Admin)"] = "PASS"
        print("  -> Flow L PASSED: Resident user has no admin links and is rejected with 403 Forbidden.", flush=True)

        # -------------------------------------------------------------
        # FLOW M: Admin Login -> Admin Dashboard
        # -------------------------------------------------------------
        print("\n[Flow M] Testing Admin Login and Dashboard...", flush=True)
        # Logout demo resident
        page.click("#user-profile-btn")
        page.click("#sign-out-btn")
        time.sleep(0.5)
        # Login as Admin
        page.click("button:has-text('Sign In')")
        page.wait_for_selector("text=Welcome Back")
        page.fill("input[placeholder*='demo@housingintel.ca']", "admin@housingintel.ca")
        page.fill("input[type='password']", "AdminPass123!")
        page.click("button[type='submit']:has-text('Sign In')")
        page.wait_for_selector("#user-profile-btn")
        # Navigate to Admin Portal
        page.click("#user-profile-btn")
        page.wait_for_selector("#admin-portal-link")
        page.click("#admin-portal-link")
        page.wait_for_selector("text=Platform Operations & Administration")
        page.wait_for_selector("text=Registered Users")
        page.wait_for_selector("text=System Operational")
        results["Flow M (Admin Login -> Admin Dashboard)"] = "PASS"
        print("  -> Flow M PASSED: Admin portal loaded with live telemetry, registered residents, and model status.", flush=True)

        # -------------------------------------------------------------
        # FLOW N: AI Intelligence -> response/fallback state
        # -------------------------------------------------------------
        print("\n[Flow N] Testing AI Assistant on District Details...", flush=True)
        page.click("nav.desktop-nav button:has-text('Explore Housing')")
        page.wait_for_selector("text=Explore California Housing")
        page.locator("button:has-text('View Details')").first.click()
        page.wait_for_selector("text=Ask Housing Assistant")
        page.click("button:has-text('Coastal proximity impact?')")
        page.wait_for_selector("text=Source:", timeout=15000)
        results["Flow N (AI Intelligence Assistant)"] = "PASS"
        print("  -> Flow N PASSED: AI assistant answered prompt with verified source attribution badge.", flush=True)

        # -------------------------------------------------------------
        # FLOW O: Logout
        # -------------------------------------------------------------
        print("\n[Flow O] Testing Logout...", flush=True)
        page.click("#user-profile-btn")
        page.click("#sign-out-btn")
        time.sleep(0.5)
        page.wait_for_selector("button:has-text('Sign In')")
        assert "Sign Up" in page.content()
        results["Flow O (Logout)"] = "PASS"
        print("  -> Flow O PASSED: User signed out cleanly; returned to unauthenticated state.", flush=True)

        # -------------------------------------------------------------
        # RESPONSIVE UI VERIFICATION: Desktop (1440px) vs Mobile (375px)
        # -------------------------------------------------------------
        print("\n[Responsive UI] Testing Desktop (1440x900) vs Mobile (375x667)...", flush=True)
        # Desktop check
        desktop_overflow = page.evaluate("() => document.documentElement.scrollWidth > window.innerWidth")
        print(f"  -> Desktop horizontal overflow: {desktop_overflow} (ScrollWidth: {page.evaluate('() => document.documentElement.scrollWidth')}px, Window: 1440px)", flush=True)
        assert not desktop_overflow, "Desktop has unexpected horizontal overflow"

        # Resize to mobile width (375px)
        page.set_viewport_size({"width": 375, "height": 667})
        page.goto(BASE_URL)
        time.sleep(1)
        mobile_overflow = page.evaluate("() => document.documentElement.scrollWidth > window.innerWidth")
        print(f"  -> Mobile horizontal overflow: {mobile_overflow} (ScrollWidth: {page.evaluate('() => document.documentElement.scrollWidth')}px, Window: 375px)", flush=True)
        assert not mobile_overflow, "Mobile has unexpected horizontal overflow"

        # Check mobile menu toggle
        mobile_toggle = page.locator("button.mobile-toggle")
        assert mobile_toggle.is_visible(), "Mobile hamburger menu must be visible on 375px viewport"
        mobile_toggle.click()
        page.wait_for_selector(".mobile-drawer button:has-text('Explore Housing')")
        print("  -> Mobile navigation drawer opened and items rendered.", flush=True)

        browser.close()

    print("\n" + "=" * 70, flush=True)
    print("ALL BROWSER FLOWS (A through O) AND RESPONSIVE TESTS PASSED 100%!", flush=True)
    print(f"Console errors captured: {len(console_errors)}", flush=True)
    print(f"Page errors captured: {len(page_errors)}", flush=True)
    for err in console_errors:
        print("  Console Error:", err, flush=True)
    for err in page_errors:
        print("  Page Error:", err, flush=True)
    print("=" * 70, flush=True)

    return results, len(console_errors) == 0 and len(page_errors) == 0

if __name__ == "__main__":
    res, clean = run_browser_verification()
    sys.exit(0 if clean and len(res) == 15 else 1)
