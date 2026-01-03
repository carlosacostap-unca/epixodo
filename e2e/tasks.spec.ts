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

test.describe('Tasks Module', () => {
  let tasks: any[] = [];

  test.beforeEach(async ({ page }) => {
    tasks = [];
    await page.addInitScript((value) => {
      window.localStorage.setItem('pocketbase_auth', JSON.stringify(value));
    }, MOCK_USER);

    // Mock Tasks Collection
    await page.route(/\/api\/collections\/tasks\/records.*/, async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          json: {
            page: 1,
            perPage: 200,
            totalItems: tasks.length,
            totalPages: 1,
            items: tasks
          }
        });
      } else if (method === 'POST') {
        const data = route.request().postDataJSON();
        const newTask = {
          id: `task_${Date.now()}`,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          completed: false,
          expand: {},
          ...data
        };
        tasks.push(newTask);
        await route.fulfill({ json: newTask });
      } else {
        await route.continue();
      }
    });
    
    // Handle PATCH for individual task updates
    await page.route('**/api/collections/tasks/records/*', async (route) => {
        const method = route.request().method();
        if (method === 'PATCH') {
            const url = route.request().url();
            const id = url.split('/').pop();
            const data = route.request().postDataJSON();
            const taskIndex = tasks.findIndex(t => t.id === id);
            if (taskIndex > -1) {
               tasks[taskIndex] = { ...tasks[taskIndex], ...data };
               await route.fulfill({ json: tasks[taskIndex] });
            } else {
                await route.fulfill({ status: 404 });
            }
        } else {
            await route.continue();
        }
    });

    // Mock Matters for dropdown
    await page.route(/\/api\/collections\/matters\/records.*/, async (route) => {
        await route.fulfill({
            json: { items: [] }
        });
    });
  });

  test('should create a new task', async ({ page }) => {
    await page.goto('/tasks');
    
    // Click "Crear nueva tarea"
    await page.click('text=Crear nueva tarea');
    
    // Wait for modal input to be visible (using placeholder as it's the main visual cue now)
    await expect(page.getByPlaceholder('Título de la tarea')).toBeVisible();
    
    // Fill form
    await page.getByPlaceholder('Título de la tarea').fill('E2E Test Task');
    await page.locator('.ProseMirror').fill('This is a test task description');
    
    // Submit
    await page.click('button:has-text("Crear Tarea")');
    
    // Verify modal closed
    await expect(page.getByPlaceholder('Título de la tarea')).not.toBeVisible();
    
    // Verify task in list
    await expect(page.getByText('E2E Test Task')).toBeVisible();
  });
});
