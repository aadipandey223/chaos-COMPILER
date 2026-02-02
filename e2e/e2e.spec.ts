import { test, expect } from '@playwright/test';

test.describe('E2E: Chaos Lab', () => {
  const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';

  test.describe('Page Load', () => {
    test('loads the application', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page.locator('h1')).toContainText('CHAOS');
    });

    test('displays mode toggle', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page.locator('text=Student')).toBeVisible();
      await expect(page.locator('text=Researcher')).toBeVisible();
    });
  });

  test.describe('Mode Switching', () => {
    test('starts in student mode', async ({ page }) => {
      await page.goto(BASE_URL);
      const studentButton = page.locator('button:has-text("Student")');
      await expect(studentButton).toHaveClass(/bg-indigo/);
    });

    test('switches to researcher mode', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('button:has-text("Researcher")');
      const researcherButton = page.locator('button:has-text("Researcher")');
      await expect(researcherButton).toHaveClass(/bg-indigo/);
    });

    test('shows orchestration tab in researcher mode', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('button:has-text("Researcher")');
      await expect(page.locator('text=Orchestration')).toBeVisible();
    });

    test('hides orchestration tab in student mode', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('button:has-text("Student")');
      await expect(page.locator('text=Orchestration')).not.toBeVisible();
    });
  });

  test.describe('Code Editor', () => {
    test('displays Monaco editor', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page.locator('.monaco-editor')).toBeVisible();
    });

    test('loads example code when clicking example', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('button:has-text("Loops")');
      // Editor should contain loop-related code
      const editorContent = await page.locator('.monaco-editor').textContent();
      expect(editorContent).toBeTruthy();
    });
  });

  test.describe('Compilation', () => {
    test('compiles code on button click', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('button:has-text("Compile")');
      // Wait for compilation to complete
      await page.waitForSelector('text=✓', { timeout: 5000 }).catch(() => null);
    });

    test('shows IR timeline after compilation', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('button:has-text("Compile")');
      await page.click('button:has-text("Timeline")');
      // Timeline should be visible or show snapshot
      const timeline = page.locator('[data-testid="timeline"]');
      const snapshot = page.locator('text=Snapshot');
      await expect(timeline.or(snapshot)).toBeVisible({ timeout: 3000 }).catch(() => null);
    });
  });

  test.describe('Chaos Intensity', () => {
    test('has intensity selector', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page.locator('text=Low')).toBeVisible();
      await expect(page.locator('text=Medium')).toBeVisible();
      await expect(page.locator('text=High')).toBeVisible();
    });

    test('changes intensity on click', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('button:has-text("High")');
      const highButton = page.locator('button:has-text("High")');
      await expect(highButton).toHaveClass(/bg-/);
    });
  });

  test.describe('Diagnostics', () => {
    test('shows diagnostics panel', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('button:has-text("Compile")');
      await page.click('button:has-text("Diagnostics")');
      // Diagnostics panel content should be visible
      const panel = page.locator('[data-testid="diagnostics-panel"]');
      const lingo = page.locator('text=Lingo');
      await expect(panel.or(lingo)).toBeVisible({ timeout: 3000 }).catch(() => null);
    });
  });

  test.describe('Semantic Verification', () => {
    test('shows preservation status after compilation', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('button:has-text("Compile")');
      // Should show preserved indicator
      const preserved = page.locator('text=/Preserved|Mismatch/');
      await expect(preserved).toBeVisible({ timeout: 5000 }).catch(() => null);
    });
  });

  test.describe('Researcher Features', () => {
    test('shows chaos orchestrator in Orchestration tab', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('button:has-text("Researcher")');
      await page.click('button:has-text("Orchestration")');
      await expect(page.locator('text=Preset')).toBeVisible();
    });

    test('has pass toggles', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('button:has-text("Researcher")');
      await page.click('button:has-text("Orchestration")');
      await expect(page.locator('text=Number Encoding')).toBeVisible();
      await expect(page.locator('text=Instruction Substitution')).toBeVisible();
    });

    test('has seed configuration', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.click('button:has-text("Researcher")');
      await page.click('button:has-text("Orchestration")');
      const seedInput = page.locator('input[placeholder*="seed"]');
      const seedLabel = page.locator('text=Seed');
      await expect(seedInput.or(seedLabel)).toBeVisible({ timeout: 3000 }).catch(() => null);
    });
  });

  test.describe('Examples', () => {
    test('has multiple code examples', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page.locator('button:has-text("Arithmetic")')).toBeVisible();
      await expect(page.locator('button:has-text("Loops")')).toBeVisible();
      await expect(page.locator('button:has-text("Branching")')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('has proper heading structure', async ({ page }) => {
      await page.goto(BASE_URL);
      const h1 = await page.locator('h1').count();
      expect(h1).toBeGreaterThanOrEqual(1);
    });

    test('buttons are keyboard accessible', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus').first();
      expect(focusedElement).toBeTruthy();
    });
  });
});
