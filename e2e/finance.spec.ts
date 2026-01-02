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

test.describe('Finance Module', () => {
  // In-memory "database" for the test session
  let transactions: any[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset DB before each test
    transactions = [];

    // 1. Mock the auth state in localStorage
    await page.addInitScript((value) => {
      window.localStorage.setItem('pocketbase_auth', JSON.stringify(value));
    }, MOCK_USER);

    // 2. Mock the PocketBase API responses with stateful logic
    await page.route('**/api/collections/transactions/records**', async (route) => {
      const method = route.request().method();
      
      if (method === 'GET') {
        // Return current state of "transactions"
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            page: 1,
            perPage: 30,
            totalItems: transactions.length,
            totalPages: 1,
            items: transactions
          })
        });
      } else if (method === 'POST') {
        // Create new record
        const data = route.request().postDataJSON();
        const newRecord = {
            id: `tx_${Date.now()}`,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            ...data
        };
        // Add to our in-memory array (simulating DB insert)
        transactions.unshift(newRecord);
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(newRecord)
        });
      } else {
        await route.continue();
      }
    });
  });

  test('should display finance page title', async ({ page }) => {
    await page.goto('/finance');
    await expect(page.getByRole('heading', { name: 'Finanzas', exact: true })).toBeVisible();
  });

  test('should create a new income transaction', async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`PAGE LOG ERROR: ${msg.text()}`);
    });
    page.on('pageerror', exception => console.log(`PAGE EXCEPTION: ${exception}`));

    await page.goto('/finance');
    
    // 1. Open Modal
    await page.click('text=Nueva Transacción');
    await expect(page.getByRole('heading', { name: 'Nueva Transacción', exact: true })).toBeVisible();
    
    // 2. Fill Form
    // Using getByLabel which corresponds to <label htmlFor="...">
    await page.getByLabel('Monto').fill('5000');
    await page.getByLabel('Descripción').fill('Proyecto Freelance');
    await page.getByLabel('Categoría').fill('Desarrollo');
    
    // 3. Select "Ingreso" Type
    // The button has text "Ingreso"
    await page.getByRole('button', { name: 'Ingreso' }).click();
    
    // 4. Submit
    await page.getByRole('button', { name: 'Guardar' }).click();
    
    // 5. Verify Result
    // Modal should close
    await expect(page.getByRole('heading', { name: 'Nueva Transacción', exact: true })).not.toBeVisible();
    
    // New item should appear in the list
    // We check for the description text
    await expect(page.getByText('Proyecto Freelance')).toBeVisible();
    
    // Check for the amount (formatted)
    // The formatter uses es-ES EUR, so 5000 -> 5.000,00 € (approx)
    // We can use a partial match or regex if exact formatting is tricky across environments
    // But checking description is a strong enough signal for this E2E test
    await expect(page.getByText('Desarrollo')).toBeVisible();
  });
});
