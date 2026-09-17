const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const base = process.env.LILLY_PLAYHOUSE_URL || 'http://127.0.0.1:5174';
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const output = path.join(__dirname, 'screenshots');
  fs.mkdirSync(output, { recursive: true });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(base);
    await page.locator('.recipe-card').first().waitFor();
    await page.locator('#sound').click();
    assert.equal(await page.locator('.recipe-card').count(), 3);
    assert.equal(await page.locator('.friend-peek').count(), 3);
    await page.screenshot({ path: path.join(output, 'home-mobile.png'), fullPage: true });

    await page.locator('#language').click();
    assert.match(await page.locator('.brand h1').innerText(), /Lilly/);
    await page.locator('#language').click();

    for (const recipe of ['cupcake', 'pizza', 'smoothie']) {
      await page.locator(`[data-recipe="${recipe}"]`).click();
      const ingredients = page.locator('.ingredient');
      for (let i = 0; i < 3; i++) await ingredients.nth(i).click();
      await page.locator('#mix').waitFor();
      for (let i = 0; i < 4; i++) await page.locator('#mix').press('Enter');
      await page.locator('#cook').waitFor();
      await page.locator('#cook').click();
      await page.locator('.topping-btn').first().waitFor();
      await page.locator('.swatch').nth(2).click();
      await page.locator('.topping-btn').first().click();
      await page.locator('#done').click();
      await page.locator('.friend-btn').first().click();
      await page.locator('#finish-actions:not([hidden])').waitFor();
      if (recipe === 'cupcake') await page.screenshot({ path: path.join(output, 'serve-mobile.png'), fullPage: true });
      await page.locator('#home').click();
    }

    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('lilly-playhouse-v1')));
    assert.equal(saved.gallery.length, 3);
    assert.equal(await page.locator('.gallery-item').count(), 3);
    assert.deepEqual(errors, []);

    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 });
      await page.reload();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false, `home fits ${width}px`);
    }

    await page.setViewportSize({ width: 320, height: 844 });
    await page.locator('[data-recipe="cupcake"]').click();
    assert.equal(await page.locator('#language').isVisible(), true);
    assert.equal(await page.locator('#sound').isVisible(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'play screen fits 320px');
    await page.locator('#back').click();

    await page.waitForFunction(() => navigator.serviceWorker.controller);
    assert.ok((await page.evaluate(() => caches.keys())).includes('lilly-playhouse-v1'));
    await context.setOffline(true);
    await page.reload();
    await page.locator('.recipe-card').first().waitFor();
    console.log('PASS three recipes, Thai/English, saved gallery, responsive views, and offline mode.');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
