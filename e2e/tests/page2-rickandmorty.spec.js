// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Page 2 - Rick and Morty E2E', () => {
    test.beforeEach(async ({ page, request }) => {
        // The public API rate-limits (HTTP 429): wait until it is accepting requests again
        await expect.poll(async () => (await request.get('https://rickandmortyapi.com/api/character/1')).status(),
            { timeout: 45_000, intervals: [2_000, 5_000] }).toBe(200);

        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/rickandmorty.html');
    });

    test('loads the catalog from the external API', async ({ page }) => {
        const cards = page.locator('#characterGrid .card');
        await expect(cards).toHaveCount(20, { timeout: 30_000 });
        await expect(cards.first()).toContainText('Rick Sanchez');
        await expect(page.locator('#status')).toContainText('characters found');
        await expect(page.locator('#loadMoreButton')).toBeVisible();
        await page.screenshot({ path: 'screenshots/page2-catalog.png' });
    });

    test('real-time search filters the characters', async ({ page }) => {
        await expect(page.locator('#characterGrid .card')).toHaveCount(20, { timeout: 30_000 });

        await page.locator('#searchInput').pressSequentially('morty', { delay: 60 });
        // Status changes to "N characters found" once the API search (name=morty) answers
        // (the unfiltered catalog reports 826, so wait for a different, filtered count)
        await expect(page.locator('#status')).toHaveText(/^(?!826 )\d+ characters found$/, { timeout: 30_000 });

        const titles = page.locator('#characterGrid .card-title');
        await expect(titles.first()).toBeVisible();
        const names = await titles.allTextContents();
        expect(names.length).toBeGreaterThan(0);
        for (const name of names) {
            expect(name.toLowerCase()).toContain('morty');
        }
    });

    test('detail view hides the catalog, shows episodes and location, and Back returns', async ({ page }) => {
        await expect(page.locator('#characterGrid .card')).toHaveCount(20, { timeout: 30_000 });

        // Record which external endpoints the detail view calls
        const calls = [];
        page.on('request', (r) => {
            const m = r.url().match(/rickandmortyapi\.com\/api\/(character\/\d+|episode|location)/);
            if (m) calls.push(m[1].split('/')[0] === 'character' ? 'character/{id}' : m[1]);
        });

        await page.locator('.card', { hasText: 'Rick Sanchez' }).first().click();

        await expect(page.locator('#catalogView')).toBeHidden();
        await expect(page.locator('#detailView')).toBeVisible();
        await expect(page.locator('#detailContent h2')).toHaveText('Rick Sanchez', { timeout: 30_000 });
        expect(new Set(calls)).toEqual(new Set(['character/{id}', 'episode', 'location']));
        await expect(page.locator('#detailContent')).toContainText('Current location');
        await expect(page.locator('#detailContent')).toContainText('Dimension');
        await expect(page.locator('#detailContent')).toContainText(/Episodes \(\d+\)/);
        expect(await page.locator('.episode-list li').count()).toBeGreaterThan(0);
        await expect(page.locator('.episode-list li').first()).toContainText('S01E01');
        await page.screenshot({ path: 'screenshots/page2-detail.png', fullPage: true });

        await page.getByRole('button', { name: '← Back' }).click();
        await expect(page.locator('#detailView')).toBeHidden();
        await expect(page.locator('#catalogView')).toBeVisible();
        await expect(page.locator('#characterGrid .card')).toHaveCount(20, { timeout: 30_000 });
    });
});
