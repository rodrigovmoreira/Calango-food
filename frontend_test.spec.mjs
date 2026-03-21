import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Verify products page features', async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Create a page and inject dummy auth tokens
  const page = await context.newPage();

  // Route mocks must be set up before goto
  const fakeCategory = { _id: 'cat-1', name: 'Massas', description: 'Pratos Italianos', isActive: true, tenantId: 'dummy-id', __v: 0 };
  const fakeProduct = { _id: 'prod-1', name: 'Pizza', description: 'Deliciosa pizza de mussarela', price: 45.00, category: fakeCategory, imageUrl: '', isAvailable: true, attributeGroups: [], tenantId: 'dummy-id', __v: 0 };

  await page.route('**/api/categories', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([fakeCategory])
    });
  });

  await page.route('**/api/products', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([fakeProduct])
    });
  });


  await page.goto('http://localhost:5173/'); // Go to the app first so localstorage works for this origin
  await page.evaluate(() => {
    localStorage.setItem('token', 'dummy-token');
    localStorage.setItem('user', JSON.stringify({ id: 'dummy-id', name: 'Test Admin', email: 'test@example.com' }));
    localStorage.setItem('tenantId', 'dummy-id');
  });

  // Now go directly to the products page
  await page.goto('http://localhost:5173/products');
  await page.waitForTimeout(2000); // Wait for optimistic load

  // Take screenshot of the products page
  await page.screenshot({ path: path.join(__dirname, 'verification/products_page.png'), fullPage: true });

  // Look for the "Preview as Client" eye icon button and click it
  const rows = await page.locator('tbody tr');
  if (await rows.count() > 0) {
     const previewButton = rows.first().locator('button:has(svg)').nth(1); // The second button is the "Eye" icon
     await previewButton.click();
     await page.waitForTimeout(1000);
     await page.screenshot({ path: path.join(__dirname, 'verification/product_preview_modal.png') });
  }

  await browser.close();
});
