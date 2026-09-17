const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const base = process.env.HAPPY_KITCHEN_URL || 'http://127.0.0.1:5174';
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
    assert.equal(await page.locator('.brand h1').innerText(), 'Happy Little Kitchen');
    await page.locator('#language').click();

    for (const recipe of ['cupcake', 'pizza', 'smoothie']) {
      await page.locator(`[data-recipe="${recipe}"]`).click();
      const ingredients = page.locator('.ingredient');
      if (recipe === 'cupcake') {
        const ingredientBox = await ingredients.first().boundingBox();
        const bowlBox = await page.locator('#bowl').boundingBox();
        await page.mouse.move(ingredientBox.x + ingredientBox.width / 2, ingredientBox.y + ingredientBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(bowlBox.x + bowlBox.width / 2, bowlBox.y + bowlBox.height / 2, { steps: 8 });
        await page.mouse.up();
        assert.equal(await ingredients.first().evaluate((element) => element.classList.contains('used')), true);
        const secondBox = await ingredients.nth(1).boundingBox();
        await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(secondBox.x + secondBox.width / 2 + 25, secondBox.y + secondBox.height / 2, { steps: 3 });
        await page.mouse.up();
        assert.equal(await ingredients.nth(1).evaluate((element) => element.classList.contains('used')), false);
        await ingredients.nth(1).click();
        assert.equal(await ingredients.nth(1).evaluate((element) => element.classList.contains('selected')), true);
        await page.locator('#bowl').click();
        assert.equal(await ingredients.nth(1).evaluate((element) => element.classList.contains('used')), true);
        await ingredients.nth(2).click();
        await page.locator('#bowl').click();
      } else {
        for (let i = 0; i < 3; i++) {
          await ingredients.nth(i).click();
          await page.locator('#bowl').click();
        }
      }
      await page.locator('#mix').waitFor();
      for (let i = 0; i < 4; i++) await page.locator('#mix').press('Enter');
      await page.locator('#cook').waitFor();
      assert.equal(await page.locator(recipe === 'smoothie' ? '.blender-machine' : '.oven-machine').count(), 1);
      await page.locator('#cook').click();
      if (recipe === 'cupcake') await page.screenshot({ path: path.join(output, 'oven-running-mobile.png'), fullPage: true });
      await page.locator('.topping-btn').first().waitFor();
      await page.locator('.swatch').nth(2).click();
      if (recipe === 'cupcake') {
        const topBox = await page.locator('.topping-btn').first().boundingBox();
        const dishBox = await page.locator('#dish').boundingBox();
        await page.mouse.move(topBox.x + topBox.width / 2, topBox.y + topBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(dishBox.x + dishBox.width * .68, dishBox.y + dishBox.height * .35, { steps: 8 });
        await page.mouse.up();
      } else {
        await page.locator('.topping-btn').first().click();
        await page.locator('#dish').click({ position: { x: 135, y: 100 } });
      }
      assert.equal(await page.locator('#dish .topping').count(), 1);
      if (recipe === 'cupcake') await page.screenshot({ path: path.join(output, 'decorate-mobile.png'), fullPage: true });
      await page.locator('#done').click();
      await page.locator('.friend-btn').first().click();
      await page.locator('#finish-actions:not([hidden])').waitFor();
      if (recipe === 'cupcake') await page.screenshot({ path: path.join(output, 'serve-mobile.png'), fullPage: true });
      await page.locator('#home').click();
    }

    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('happy-little-kitchen-v1')));
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
    assert.ok((await page.evaluate(() => caches.keys())).includes('happy-little-kitchen-v4'));
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
