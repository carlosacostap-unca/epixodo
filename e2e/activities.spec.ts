import { test, expect } from '@playwright/test';

const MOCK_USER = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxMjMiLCJleHAiOjk5OTk5OTk5OTl9.signature",
  model: {
    id: "user123",
    email: "test@example.com",
    name: "Test User",
    collectionId: "_pb_users_auth_",
    collectionName: "users"
  }
};

test.describe('Activities Module', () => {
  let activities: any[] = [];

  test.beforeEach(async ({ page }) => {
    activities = [];
    await page.addInitScript((value) => {
      window.localStorage.setItem('pocketbase_auth', JSON.stringify(value));
    }, MOCK_USER);

    // Mock Activities Collection
    await page.route(/\/api\/collections\/activities\/records.*/, async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          json: {
            page: 1,
            perPage: 200,
            totalItems: activities.length,
            totalPages: 1,
            items: activities
          }
        });
      } else if (method === 'POST') {
        const data = route.request().postDataJSON();
        const newActivity = {
          id: `activity_${Date.now()}`,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          expand: {},
          ...data
        };
        activities.push(newActivity);
        await route.fulfill({ json: newActivity });
      } else {
        await route.continue();
      }
    });

    // Mock Matters
    await page.route(/\/api\/collections\/matters\/records.*/, async (route) => {
        await route.fulfill({
            json: { items: [] }
        });
    });
  });

  test('should create a new activity', async ({ page }) => {
    await page.goto('/activities');
    
    await page.click('text=Nueva Actividad');
    
    await expect(page.getByRole('heading', { name: 'Nueva Actividad' })).toBeVisible();
    
    // Fill form
    await page.getByLabel('Título').fill('E2E Test Activity');
    await page.locator('.ProseMirror').fill('This is a test activity description');
    
    // Fill dates if required or optional
    // startDate, endDate
    // Note: Browser dependent date format, but YYYY-MM-DDTHH:mm usually works for value
    // await page.fill('#startDate', '2025-01-01T10:00');
    
    // Submit
    await page.click('button:has-text("Crear Actividad")');
    
    // Verify modal closed
    await expect(page.getByRole('heading', { name: 'Nueva Actividad' })).not.toBeVisible();
    
    // Verify activity in list
    await expect(page.getByText('E2E Test Activity')).toBeVisible();
  });
});
