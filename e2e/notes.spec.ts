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

test.describe('Notes Module', () => {
  let notes: any[] = [];

  test.beforeEach(async ({ page }) => {
    notes = [];
    await page.addInitScript((value) => {
      window.localStorage.setItem('pocketbase_auth', JSON.stringify(value));
    }, MOCK_USER);

    // Mock Notes Collection
    await page.route(/\/api\/collections\/notes\/records.*/, async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          json: {
            page: 1,
            perPage: 200,
            totalItems: notes.length,
            totalPages: 1,
            items: notes
          }
        });
      } else if (method === 'POST') {
        const data = route.request().postDataJSON();
        const newNote = {
          id: `note_${Date.now()}`,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          expand: {},
          ...data
        };
        notes.push(newNote);
        await route.fulfill({ json: newNote });
      } else {
        await route.continue();
      }
    });

    // Mock Matters for dropdown (if applicable)
    await page.route(/\/api\/collections\/matters\/records.*/, async (route) => {
        await route.fulfill({
            json: { items: [] }
        });
    });
  });

  test('should create a new note', async ({ page }) => {
    await page.goto('/notes');
    
    // Check if empty state or header button is present
    // Assuming "Nueva Nota" button text
    await page.click('text=Nueva Nota');
    
    await expect(page.getByRole('heading', { name: 'Nueva Nota' })).toBeVisible();
    
    // Fill form
    // Assuming title input has id="title" or label "Título"
    await page.getByLabel('Título').fill('E2E Test Note');
    await page.locator('.ProseMirror').fill('This is a test note content');
    
    // Submit
    await page.click('button:has-text("Crear Nota")');
    
    // Verify modal closed
    await expect(page.getByRole('heading', { name: 'Nueva Nota' })).not.toBeVisible();
    
    // Verify note in list
    await expect(page.getByText('E2E Test Note')).toBeVisible();
  });
});
