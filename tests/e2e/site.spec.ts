import { test, expect } from '@playwright/test';

const TODAY = '2026-07-24';

test.describe('PauzaLogica.ro core flows', () => {
  test('home page loads with the day\'s challenges and no account UI', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Provocările de astăzi' })).toBeVisible();
    await expect(page.getByText('Joacă gratuit, fără cont.')).toBeVisible();

    // No authentication / account elements anywhere.
    for (const forbidden of ['Autentificare', 'Înregistrare', 'Contul meu', 'Profil', 'Log in', 'Sign up']) {
      await expect(page.getByText(forbidden, { exact: false })).toHaveCount(0);
    }
  });

  test('opens Sudoku from the home page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Joacă Sudoku' }).first().click();
    await expect(page).toHaveURL(/\/sudoku\/\d{4}-\d{2}-\d{2}\//);
    await expect(page.getByRole('grid', { name: 'Grilă Sudoku' })).toBeVisible();
  });

  test('Sudoku input is saved locally and survives a reload', async ({ page }) => {
    await page.goto(`/sudoku/${TODAY}/`);
    const emptyCell = page.getByRole('gridcell', { name: /gol/ }).first();
    const label = await emptyCell.getAttribute('aria-label');
    const prefix = label!.split(',').slice(0, 2).join(',');
    await emptyCell.click();
    await page.keyboard.press('5');
    const filled = page.getByRole('gridcell', { name: new RegExp(`${prefix}, valoare 5`) });
    await expect(filled).toBeVisible();

    await page.reload();
    await expect(page.getByRole('gridcell', { name: new RegExp(`${prefix}, valoare 5`) })).toBeVisible();
  });

  test('a hint can be revealed', async ({ page }) => {
    await page.goto(`/sudoku/${TODAY}/`);
    await page.getByRole('button', { name: 'Folosește un indiciu' }).click();
    await expect(page.getByText('1/3')).toBeVisible();
  });

  test('finishing a logic-sequence shows completion + shareable result', async ({ page }) => {
    // 2026-07-04 has the rotating "secvențe logice" game.
    await page.goto('/secvente-logice/2026-07-04/');
    await expect(page.getByText('Ce număr urmează în șir?')).toBeVisible();
    // Click each option; the correct one completes the game.
    const options = page.locator('div.grid > button', { hasText: /^\d+$/ });
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      await options.nth(i).click();
      if (await page.getByText('Felicitări! Ai terminat.').isVisible().catch(() => false)) break;
    }
    await expect(page.getByText('Felicitări! Ai terminat.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Distribuie rezultatul' })).toBeVisible();
  });

  test('archive is navigable and filters by game', async ({ page }) => {
    await page.goto('/arhiva/');
    await expect(page.getByRole('heading', { name: 'Arhivă' })).toBeVisible();
    await page.getByLabel('Joc').selectOption('sudoku');
    await expect(page.getByRole('link', { name: /Sudoku ·/ }).first()).toBeVisible();
    // Open a day.
    await page.getByRole('link', { name: /iulie|august/ }).first().click();
    await expect(page).toHaveURL(/\/arhiva\/\d{4}-\d{2}-\d{2}\//);
  });

  test('theme can be toggled to dark', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /modul întunecat|modul luminos/ }).first().click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});

test.describe('resilience', () => {
  test('ads are only sized placeholders (no ad network) and the site works', async ({ page }) => {
    const adRequests: string[] = [];
    page.on('request', (req) => {
      if (/googlesyndication|adservice|doubleclick/.test(req.url())) adRequests.push(req.url());
    });
    await page.goto('/');
    await expect(page.getByText('RECLAMĂ').first()).toBeVisible();
    await page.goto(`/sudoku/${TODAY}/`);
    await expect(page.getByRole('grid', { name: 'Grilă Sudoku' })).toBeVisible();
    expect(adRequests).toHaveLength(0);
  });

  test('no OpenAI or backend API calls happen at runtime', async ({ page }) => {
    const apiCalls: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (/openai|api\.careu|\/api\//.test(url)) apiCalls.push(url);
    });
    await page.goto('/');
    await page.goto(`/nonograme/${TODAY}/`);
    await page.goto('/arhiva/');
    expect(apiCalls).toHaveLength(0);
  });
});
