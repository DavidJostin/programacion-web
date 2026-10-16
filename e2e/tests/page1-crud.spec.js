// @ts-check
const { test, expect } = require('@playwright/test');

const NAME = `E2E Test Product ${Date.now()}`;
const UPDATED_NAME = `${NAME} (edited)`;

test.describe.configure({ mode: 'serial' });

test.describe('Page 1 - E2E CRUD', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/');
        await expect(page.locator('#productGrid .card').first()).toBeVisible();
    });

    test('real-time search filters the cards', async ({ page }) => {
        const cards = page.locator('#productGrid .card');
        const total = await cards.count();

        await page.locator('#searchInput').pressSequentially('lapt', { delay: 50 });
        await expect(cards).toHaveCount(1);
        await expect(cards.first()).toContainText('Laptop');
        await expect(page.locator('#status')).toContainText(`of ${total}`);

        await page.locator('#searchInput').fill('zzz-no-match');
        await expect(cards).toHaveCount(0);
        await expect(page.locator('#productGrid .empty')).toBeVisible();

        await page.locator('#searchInput').fill('');
        await expect(cards).toHaveCount(total);
    });

    test('create a product with "+ New product"', async ({ page }) => {
        await page.getByRole('button', { name: '+ New product' }).click();
        await expect(page.locator('#formDialog')).toBeVisible();

        await page.fill('#name', NAME);
        await page.fill('#price', '49.99');
        await page.fill('#stock', '7');
        await page.fill('#category', 'Testing');
        await page.fill('#description', 'Created by Playwright');
        await page.getByRole('button', { name: 'Save' }).click();

        await expect(page.locator('#formDialog')).toBeHidden();
        await expect(page.locator('#toast')).toHaveText('Product created');
        await expect(page.locator('.card', { hasText: NAME })).toBeVisible();
    });

    test('open the detail view of the created product', async ({ page }) => {
        await page.locator('.card', { hasText: NAME }).click();
        const detail = page.locator('#detailDialog');
        await expect(detail).toBeVisible();
        await expect(page.locator('#detailName')).toHaveText(NAME);
        await expect(page.locator('#detailPrice')).toHaveText('$49.99');
        await expect(page.locator('#detailCategory')).toHaveText('Testing');
        await expect(page.locator('#detailStock')).toHaveText('7');
        await page.screenshot({ path: 'screenshots/page1-detail.png' });
    });

    test('edit the product', async ({ page }) => {
        await page.locator('.card', { hasText: NAME }).click();
        await page.locator('#detailEdit').click();

        await expect(page.locator('#formTitle')).toHaveText('Edit product');
        await expect(page.locator('#name')).toHaveValue(NAME);
        await page.fill('#name', UPDATED_NAME);
        await page.fill('#price', '59.5');
        await page.getByRole('button', { name: 'Update' }).click();

        await expect(page.locator('#toast')).toHaveText('Product updated');
        const card = page.locator('.card', { hasText: UPDATED_NAME });
        await expect(card).toBeVisible();
        await expect(card).toContainText('$59.50');
    });

    test('delete the product confirming the dialog', async ({ page, request }) => {
        await page.locator('.card', { hasText: UPDATED_NAME }).click();
        await expect(page.locator('#detailDialog')).toBeVisible();

        let confirmMessage = '';
        page.once('dialog', async (dialog) => {
            confirmMessage = dialog.message();
            await dialog.accept();
        });
        await page.locator('#detailDelete').click();

        await expect(page.locator('#toast')).toHaveText('Product deleted');
        await expect(page.locator('.card', { hasText: UPDATED_NAME })).toHaveCount(0);
        expect(confirmMessage).toContain(UPDATED_NAME);

        // Double-check against the REST API
        const products = await (await request.get('/api/products')).json();
        expect(products.some((p) => p.name === UPDATED_NAME)).toBe(false);
    });
});
