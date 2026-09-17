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
    const RECIPES = ['cupcake', 'pizza', 'smoothie', 'omelet', 'noodles', 'cookie', 'icecream', 'toast', 'cake'];
    const APPLIANCE = { cupcake: 'oven', pizza: 'oven', smoothie: 'blender', omelet: 'pan', noodles: 'pot', cookie: 'oven', icecream: 'freezer', toast: 'toaster', cake: 'oven' };
    assert.equal(await page.locator('.recipe-card').count(), 9);
    assert.equal(await page.locator('.recipe-card img.recipe-icon').count(), 9);
    // ทุกรูปโหลดได้จริง (ไม่ใช่ไฟล์หาย)
    await page.waitForFunction(() => [...document.images].every((img) => img.complete));
    assert.deepEqual(await page.evaluate(() => [...document.images].filter((img) => !img.naturalWidth).map((img) => img.getAttribute('src'))), []);
    assert.equal(await page.locator('.friend-peek').count(), 3);
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).userSelect), 'none');
    assert.equal(await page.evaluate(() => {
      const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
      document.body.dispatchEvent(event);
      return event.defaultPrevented;
    }), true);
    await page.screenshot({ path: path.join(output, 'home-mobile.png'), fullPage: true });

    await page.locator('#language').click();
    assert.equal(await page.locator('.brand h1').innerText(), 'Happy Little Kitchen');
    await page.locator('#language').click();

    for (const recipe of RECIPES) {
      await page.locator(`[data-recipe="${recipe}"]`).click();
      const ingredients = page.locator('.ingredient');
      assert.equal(await ingredients.count(), 3);
      assert.equal(await page.locator('.ingredient img').count(), 3);
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
      assert.equal(await page.locator('#mix img.mix-icon').count(), 1);
      for (let i = 0; i < 8; i++) await page.locator('#mix').click();
      await page.locator('#appliance').waitFor();
      assert.equal(await page.locator('#appliance').getAttribute('data-appliance'), APPLIANCE[recipe]);
      assert.equal(await page.locator(`#appliance img.machine[src$="${APPLIANCE[recipe]}.png"]`).count(), 1);
      await page.waitForFunction(() => [...document.querySelectorAll('#appliance img')].every((img) => img.complete && img.naturalWidth > 0));
      const applianceBox = await page.locator('#appliance').boundingBox();
      await page.mouse.move(applianceBox.x + applianceBox.width / 2, applianceBox.y + applianceBox.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(300);
      assert.equal(await page.locator('#appliance.running').count(), 1, `${recipe} appliance runs while held`);
      if (['cupcake', 'omelet', 'noodles', 'icecream', 'toast', 'smoothie'].includes(recipe)) await page.screenshot({ path: path.join(output, `cook-${APPLIANCE[recipe]}-mobile.png`), fullPage: true });
      if (recipe === 'cupcake') {
        await page.waitForTimeout(700);
        await page.mouse.up();
        const pausedWidth = await page.locator('#meter').evaluate((element) => element.style.width);
        await page.waitForTimeout(400);
        assert.equal(await page.locator('#meter').evaluate((element) => element.style.width), pausedWidth);
        await page.mouse.down();
        await page.waitForTimeout(4300);
        await page.mouse.up();
      } else {
        await page.waitForTimeout(5000);
        await page.mouse.up();
      }
      if (recipe === 'toast') {
        await page.locator('#appliance.finished').waitFor();
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(output, 'toast-popped-mobile.png'), fullPage: true });
      }
      await page.locator('.topping-btn').first().waitFor();
      assert.equal(await page.locator('.topping-btn').count(), 5);
      assert.equal(await page.locator('#dish img.food-icon').count(), 1);
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
      assert.equal(await page.locator('#dish img.topping').count(), 1);
      if (recipe === 'cupcake') await page.screenshot({ path: path.join(output, 'decorate-mobile.png'), fullPage: true });
      await page.locator('#done').click();
      assert.equal(await page.locator('#finish-actions').isVisible(), false);
      if (recipe === 'cupcake') {
        assert.equal(await page.locator('#feed-food').evaluate((element) => getComputedStyle(element).userSelect), 'none');
        const foodBox = await page.locator('#feed-food').boundingBox();
        const friendBox = await page.locator('.friend-btn').first().boundingBox();
        await page.mouse.move(foodBox.x + foodBox.width / 2, foodBox.y + foodBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(friendBox.x + friendBox.width / 2, friendBox.y + friendBox.height / 2, { steps: 10 });
        await page.mouse.up();
        assert.equal(await page.locator('.feed-bite').count(), 1);
        await page.waitForTimeout(260);
        await page.screenshot({ path: path.join(output, 'feeding-mobile.png'), fullPage: true });
        await page.locator('.friend-btn').first().waitFor({ state: 'visible' });
      } else {
        await page.locator('.friend-btn').first().click();
      }
      await page.locator('#finish-actions:not([hidden])').waitFor();
      if (recipe === 'cupcake') {
        assert.equal(await page.locator('.friend-btn.fed').count(), 1);
        await page.locator('.friend-btn').nth(1).click();
        await page.waitForFunction(() => document.querySelectorAll('.friend-btn.fed').length === 2);
        await page.locator('.friend-btn').nth(2).click();
        await page.waitForFunction(() => document.querySelectorAll('.friend-btn.fed').length === 3);
        await page.locator('.friend-btn').first().click();
        assert.equal(await page.locator('.friend-btn.fed').count(), 3);
        assert.equal(await page.evaluate(() => window.getSelection().toString()), '');
        await page.screenshot({ path: path.join(output, 'serve-mobile.png'), fullPage: true });
        const cupcakeSave = await page.evaluate(() => JSON.parse(localStorage.getItem('happy-little-kitchen-v1')));
        assert.equal(cupcakeSave.gallery[0].recipe, 'cupcake');
        assert.equal(cupcakeSave.gallery[0].friends.length, 3);
        assert.equal(cupcakeSave.gallery[0].toppings[0].key, 'star');
      }
      await page.locator('#home').click();
      assert.deepEqual(errors, [], `no page errors after ${recipe}`);
    }

    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('happy-little-kitchen-v1')));
    assert.equal(saved.gallery.length, 6);
    assert.equal(saved.gallery[0].recipe, 'cake');
    assert.equal(await page.locator('img.gallery-item').count(), 6);

    // ผลงานเก่าที่เก็บท็อปปิ้งเป็น emoji ต้องยังโหลดได้
    await page.evaluate(() => {
      const legacy = { lang: 'th', sound: false, gallery: [{ recipe: 'cupcake', color: '#ef6f61', toppings: ['⭐', { icon: '🍓', x: 40, y: 40 }], friend: 'seal', friends: ['seal'], at: 1 }] };
      localStorage.setItem('happy-little-kitchen-v1', JSON.stringify(legacy));
    });
    await page.reload();
    await page.locator('.recipe-card').first().waitFor();
    assert.equal(await page.locator('img.gallery-item').count(), 1);
    const migrated = await page.evaluate(() => JSON.parse(localStorage.getItem('happy-little-kitchen-v1')));
    assert.equal(migrated.gallery[0].toppings[0].key, 'star');
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
    assert.ok((await page.evaluate(() => caches.keys())).includes('happy-little-kitchen-v9'));
    await context.setOffline(true);
    await page.reload();
    await page.locator('.recipe-card').first().waitFor();
    console.log('PASS nine recipes with illustrated assets, six appliances, multi-friend feeding, selection protection, Thai/English, gallery migration, responsive views, and offline mode.');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
