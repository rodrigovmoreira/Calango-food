from playwright.sync_api import sync_playwright

def verify_feature(page):
    # Register a new user to ensure we have a store and can view it
    page.goto("http://localhost:5173/")
    page.wait_for_timeout(2000)
    page.evaluate("window.localStorage.setItem('token', 'dummy-token'); window.localStorage.setItem('user', JSON.stringify({id: 'dummy', role: 'admin'}));")

    # Verify cardapio
    page.goto("http://localhost:5173/cardapio/calango-food")
    page.wait_for_timeout(4000)
    page.screenshot(path="/home/jules/verification/verification_cardapio.png", full_page=True)
    page.wait_for_timeout(2000)

    # Verify settings
    page.goto("http://localhost:5173/settings")
    page.wait_for_timeout(3000)
    page.screenshot(path="/home/jules/verification/verification_settings.png", full_page=True)

    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="/home/jules/verification/video", viewport={"width": 375, "height": 812})
        page = context.new_page()
        try:
            verify_feature(page)
        finally:
            context.close()
            browser.close()