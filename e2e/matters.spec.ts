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

test.describe('Matters Module', () => {
  let matters: any[] = [];

  test.beforeEach(async ({ page }) => {
    matters = [];
    await page.addInitScript((value) => {
      window.localStorage.setItem('pocketbase_auth', JSON.stringify(value));
    }, MOCK_USER);

    // Mock Matters Collection
    await page.route(/\/api\/collections\/matters\/records.*/, async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          json: {
            page: 1,
            perPage: 200,
            totalItems: matters.length,
            totalPages: 1,
            items: matters
          }
        });
      } else if (method === 'POST') {
        const data = route.request().postDataJSON();
        const newMatter = {
          id: `matter_${Date.now()}`,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          expand: {},
          ...data
        };
        matters.push(newMatter);
        await route.fulfill({ json: newMatter });
      } else {
        await route.continue();
      }
    });
  });

  test('should create a new matter', async ({ page }) => {
    await page.goto('/matters');
    
    await page.click('text=Nuevo Asunto');
    
    await expect(page.getByRole('heading', { name: 'Nuevo Asunto' })).toBeVisible();
    
    // Fill form
    await page.getByLabel('Título').fill('E2E Test Matter');
    await page.locator('.ProseMirror').fill('This is a test matter description');
    
    // Select status if needed, usually defaults to active
    
    // Submit
    await page.click('button:has-text("Crear Asunto")');
    
    // Verify modal closed
    await expect(page.getByRole('heading', { name: 'Nuevo Asunto' })).not.toBeVisible();
    
    // Verify matter in list
    await expect(page.getByText('E2E Test Matter')).toBeVisible();
  });
});
