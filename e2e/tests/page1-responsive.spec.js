// @ts-check
const { test, expect } = require('@playwright/test');

/** Number of columns the browser actually computed for the grid. */
async function gridColumns(page) {
    return page.locator('#productGrid').evaluate((el) =>
        getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length);
}

/** Number of cards whose top edge is on the first row (independent check). */
async function cardsInFirstRow(page) {
    return page.locator('#productGrid .card').evaluateAll((cards) => {
        const tops = cards.map((c) => Math.round(c.getBoundingClientRect().top));
        const firstTop = Math.min(...tops);
        return tops.filter((t) => Math.abs(t - firstTop) < 2).length;
    });
}

const viewports = [
    { name: 'Desktop', width: 1280, height: 800, columns: 3, file: 'desktop-1280x800.png' },
    { name: 'Mobile Portrait', width: 375, height: 667, columns: 1, file: 'mobile-portrait-375x667.png' },
    { name: 'Mobile Landscape', width: 812, height: 375, columns: 4, file: 'mobile-landscape-812x375.png' }
];

test.describe('Page 1 - UI Validation (responsive grid)', () => {
    for (const vp of viewports) {
        test(`${vp.name} ${vp.width}x${vp.height} renders ${vp.columns} column(s)`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height });
            await page.goto('/');
            await expect(page.locator('#productGrid .card').first()).toBeVisible();
            expect(await page.locator('#productGrid .card').count()).toBeGreaterThanOrEqual(6);

            expect(await gridColumns(page)).toBe(vp.columns);
            expect(await cardsInFirstRow(page)).toBe(vp.columns);

            // Toast must be hidden while there is no message
            await expect(page.locator('#toast')).toBeHidden();

            // Wait for the (lazy-loaded) product images before taking the evidence screenshot
            await page.locator('#productGrid img').evaluateAll((imgs) => imgs.forEach((img) => { img.loading = 'eager'; }));
            await expect.poll(() => page.locator('#productGrid img').evaluateAll((imgs) =>
                imgs.every((img) => img.complete)), { timeout: 20_000 }).toBe(true);

            await page.screenshot({ path: `screenshots/${vp.file}`, fullPage: true });
        });
    }
});
