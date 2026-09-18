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
    // แถวเพื่อน: คนสั่งอาหาร (มีป้าย) + เพื่อนอีก 2 + เงาเพื่อนคนต่อไป
    assert.equal(await page.locator('#order .bubble img').count(), 1);
    assert.equal(await page.locator('.friend-peek').count(), 4);
    assert.equal(await page.locator('.friend-peek.next').count(), 1);
    // แตะป้ายสั่ง → เข้าเมนูนั้นทันที
    const firstOrder = await page.locator('#order').evaluate((element) => ({ friend: element.dataset.orderFriend, recipe: element.dataset.orderRecipe }));
    await page.locator('#order').click();
    assert.ok((await page.locator('.title-icon').getAttribute('src')).endsWith(`${firstOrder.recipe}.png`));
    await page.locator('#back').click();
    // ตั้งออเดอร์ให้แมวน้ำอยากกินคัพเค้ก เพื่อเทสว่าทำตามสั่งแล้วป้ายติ๊กถูก
    await page.evaluate((today) => {
      const saved = JSON.parse(localStorage.getItem('happy-little-kitchen-v1'));
      saved.order = { friend: 'seal', recipe: 'cupcake', date: today };
      localStorage.setItem('happy-little-kitchen-v1', JSON.stringify(saved));
    }, new Date().toISOString().slice(0, 10));
    await page.reload();
    await page.locator('.recipe-card').first().waitFor();
    const PREP = { egg: 'crack', tomato: 'cut', strawberry: 'cut', banana: 'cut', springonion: 'cut', bokchoy: 'cut', butter: 'cut', bread: 'cut' };
    const doPrep = async (recipe) => {
      await page.locator('#prep-item').waitFor();
      const queue = await page.locator('.queue-item').evaluateAll((items) => items.map((item) => item.dataset.queue));
      assert.ok(queue.length >= 1, `${recipe} has something to prep`);
      for (const id of queue) {
        assert.equal(await page.locator('#prep-item').getAttribute('data-action'), PREP[id], `${recipe}: ${id} prep action`);
        const box = await page.locator('#prep-item').boundingBox();
        if (PREP[id] === 'crack') {
          await page.locator('#prep-item').click();
          await page.locator('#prep-item').click();
        } else {
          // แตะเฉยๆ ต้องไม่นับ (เขย่าเตือน)
          await page.locator('#prep-item').click();
          for (let i = 0; i < 3; i++) {
            await page.mouse.move(box.x + box.width * .2, box.y + box.height * .5);
            await page.mouse.down();
            await page.mouse.move(box.x + box.width * .8, box.y + box.height * .5, { steps: 4 });
            await page.mouse.up();
          }
        }
        await page.waitForFunction((id) => document.querySelector(`[data-queue="${id}"]`)?.classList.contains('done') || !document.querySelector('#prep-item'), id);
      }
      if (recipe === 'omelet') await page.screenshot({ path: path.join(output, 'prep-mobile.png'), fullPage: true });
    };
    const reactionSrcs = [];
    page.on('request', (request) => { if (/friends\/\w+-(love|yum|sneeze|full)\.png/.test(request.url())) reactionSrcs.push(request.url()); });
    const dismissPopup = async () => {
      await page.waitForTimeout(700);
      if (await page.locator('.popup-layer').count()) {
        await page.locator('.popup-friend').waitFor();
        await page.screenshot({ path: path.join(output, 'new-friend-mobile.png'), fullPage: true });
        await page.locator('#popup-ok').click();
        await page.locator('.popup-layer').waitFor({ state: 'detached' });
      }
    };
    // ทุกรูปโหลดได้จริง (ไม่ใช่ไฟล์หาย)
    await page.waitForFunction(() => [...document.images].every((img) => img.complete));
    assert.deepEqual(await page.evaluate(() => [...document.images].filter((img) => !img.naturalWidth).map((img) => img.getAttribute('src'))), []);
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
      assert.equal(await page.locator('.progress-dots i').count(), 6);
      await doPrep(recipe);
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
      if (recipe === 'cupcake') {
        // แตะเฉยๆ ยังคืบหน้า แต่ไม่จบใน 8 ครั้ง
        for (let i = 0; i < 8; i++) await page.locator('#mix').click();
        assert.equal(await page.locator('#meter').evaluate((element) => element.style.width), '40%');
      }
      // ลากวนเป็นวงกลม (ครอบคลุมทุกท่า: มุมสะสม, ระยะ, ระยะแนวนอน)
      const mixBox = await page.locator('#mix').boundingBox();
      const mixX = mixBox.x + mixBox.width / 2;
      const mixY = mixBox.y + mixBox.height / 2;
      const mixR = Math.min(mixBox.width, mixBox.height) * .3;
      await page.mouse.move(mixX + mixR, mixY);
      await page.mouse.down();
      for (let i = 1; i <= 24 * 12 && await page.locator('#mix:not(:disabled)').count(); i++) {
        const angle = (i / 24) * Math.PI * 2;
        await page.mouse.move(mixX + mixR * Math.cos(angle), mixY + mixR * Math.sin(angle));
      }
      await page.mouse.up();
      if (recipe === 'cupcake') await page.screenshot({ path: path.join(output, 'mix-mobile.png'), fullPage: true });
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
      assert.equal(await page.locator('.topping-btn').count(), 10);
      assert.equal(await page.locator('#dish img.food-icon').count(), 1);
      assert.equal(await page.locator('#dish canvas.frosting').count(), 1);
      if (recipe === 'cake') {
        // ลากนิ้วบนจาน = วาดครีม (ไม่วางท็อปปิ้ง) และเก็บไว้ในผลงาน
        const dishBox = await page.locator('#dish').boundingBox();
        await page.mouse.move(dishBox.x + dishBox.width * .3, dishBox.y + dishBox.height * .5);
        await page.mouse.down();
        await page.mouse.move(dishBox.x + dishBox.width * .7, dishBox.y + dishBox.height * .55, { steps: 10 });
        await page.mouse.up();
        assert.equal(await page.locator('#dish img.topping').count(), 0);
        const painted = await page.locator('#frosting').evaluate((canvas) => {
          const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
          let count = 0;
          for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++;
          return count;
        });
        assert.ok(painted > 500, `frosting was drawn (${painted} px)`);
        await page.screenshot({ path: path.join(output, 'frosting-mobile.png'), fullPage: true });
      }
      await page.locator('.swatch').nth(2).click();
      if (recipe === 'cupcake') {
        const topBox = await page.locator('.topping-btn').first().boundingBox();
        const dishBox = await page.locator('#dish').boundingBox();
        await page.mouse.move(topBox.x + topBox.width / 2, topBox.y + topBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(dishBox.x + dishBox.width * .68, dishBox.y + dishBox.height * .35, { steps: 8 });
        // ตัวที่ลอยตามนิ้วต้องเป็นรูปล้วน ไม่มีพื้นขาว และขนาดเท่ารูปในปุ่ม
        const ghost = await page.locator('.drag-ghost').evaluate((element) => ({
          tag: element.tagName, background: getComputedStyle(element).backgroundColor, width: element.getBoundingClientRect().width
        }));
        assert.equal(ghost.tag, 'IMG');
        assert.equal(ghost.background, 'rgba(0, 0, 0, 0)');
        assert.ok(ghost.width < 80, `topping ghost is small (${ghost.width})`);
        await page.mouse.up();
      } else {
        await page.locator('.topping-btn').first().click();
        await page.locator('#dish').click({ position: { x: 135, y: 100 } });
      }
      assert.equal(await page.locator('#dish img.topping').count(), 1);
      if (recipe === 'cake') {
        // วางได้เกิน 8 ชิ้น พอถึง 30 ชิ้นเก่าสุดหายไปแทนที่จะวางไม่ได้
        for (let i = 0; i < 34; i++) await page.locator('#dish').click({ position: { x: 60 + (i % 5) * 12, y: 60 + (i % 7) * 10 } });
        assert.equal(await page.locator('#dish img.topping').count(), 30);
      }
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
        const foodGhost = await page.locator('.drag-ghost').evaluate((element) => element.getBoundingClientRect().width);
        assert.ok(foodGhost <= foodBox.width * 1.2 + 2, `food ghost stays food-sized (${foodGhost} vs ${foodBox.width})`);
        await page.mouse.up();
        assert.equal(await page.locator('.feed-bite').count(), 1);
        await page.waitForTimeout(260);
        await page.screenshot({ path: path.join(output, 'feeding-mobile.png'), fullPage: true });
        await page.locator('.friend-btn').first().waitFor({ state: 'visible' });
      } else {
        await page.locator('.friend-btn').first().click();
      }
      await page.locator('#finish-actions:not([hidden])').waitFor();
      assert.equal(await page.locator('.friend-btn[data-reaction]').count(), 1, `${recipe}: friend reacted`);
      await dismissPopup();
      if (recipe === 'cupcake') {
        // เพื่อนคนแรกคือแมวน้ำที่สั่งคัพเค้ก → ป้ายติ๊กถูก + ปฏิกิริยา "ชอบที่สุด"
        assert.equal(await page.locator('.friend-btn').first().getAttribute('data-friend'), 'seal');
        assert.equal(await page.locator('.friend-btn').first().getAttribute('data-reaction'), 'love');
        assert.equal(await page.locator('.friend-btn .bubble.done').count(), 1);
        assert.equal(await page.locator('.friend-btn.fed').count(), 1);
        await page.locator('.friend-btn').nth(1).click();
        await page.waitForFunction(() => document.querySelectorAll('.friend-btn.fed').length === 2);
        await dismissPopup();
        await page.locator('.friend-btn').nth(2).click();
        await page.waitForFunction(() => document.querySelectorAll('.friend-btn.fed').length === 3);
        await dismissPopup();
        await page.locator('.friend-btn').first().click();
        assert.equal(await page.locator('.friend-btn.fed').count(), 3);
        assert.equal(await page.evaluate(() => window.getSelection().toString()), '');
        await page.screenshot({ path: path.join(output, 'serve-mobile.png'), fullPage: true });
        const cupcakeSave = await page.evaluate(() => JSON.parse(localStorage.getItem('happy-little-kitchen-v1')));
        assert.equal(cupcakeSave.gallery[0].recipe, 'cupcake');
        assert.equal(cupcakeSave.gallery[0].friends.length, 3);
        assert.equal(cupcakeSave.gallery[0].toppings[0].key, 'star');
        assert.equal(cupcakeSave.served, 3);
        assert.equal(cupcakeSave.ordersDone, 1);
        assert.equal(cupcakeSave.order, null);
        // แมวน้ำมีรูปหน้าตาแล้ว: ระหว่างปฏิกิริยาต้องสลับเป็น seal-love.png (เช็กจาก log)
        assert.ok(reactionSrcs.some((src) => src.endsWith('seal-love.png')), 'expression art used');
      }
      await page.locator('#home').click();
      assert.deepEqual(errors, [], `no page errors after ${recipe}`);
    }

    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('happy-little-kitchen-v1')));
    assert.equal(saved.gallery.length, 6);
    assert.equal(saved.gallery[0].recipe, 'cake');
    assert.ok(saved.gallery[0].strokes.length >= 1 && saved.gallery[0].strokes[0].points.length > 2, 'frosting strokes saved');
    assert.equal(await page.locator('img.gallery-item').count(), 6);
    // ป้อน 11 ครั้ง → ปลดล็อกแมว (3) เพนกวิน (6) จิ้งจอก (10); หน้าครัวโชว์เพื่อน 4 + คนสั่ง + เงาคนต่อไป
    assert.equal(saved.served, 11);
    assert.ok(saved.order && saved.order.friend, 'a new order exists');
    assert.equal(await page.locator('.friends-row .friend-peek').count(), 6);
    assert.ok(await page.locator('.friends-row img[src*="fox"]').count() >= 1, 'fox unlocked');
    await page.screenshot({ path: path.join(output, 'home-friends-mobile.png'), fullPage: true });
    // หน้าเสิร์ฟมีเพื่อนสูงสุด 4 คน และคนสั่งอยู่คนแรกเสมอ
    await page.locator('[data-recipe="toast"]').click();
    await doPrep('toast');
    for (let i = 0; i < 3; i++) { await page.locator('.ingredient').nth(i).click(); await page.locator('#bowl').click(); }
    await page.locator('#mix').waitFor();
    for (let i = 0; i < 20; i++) await page.locator('#mix').click();
    await page.locator('#appliance').waitFor();
    const toasterBox = await page.locator('#appliance').boundingBox();
    await page.mouse.move(toasterBox.x + toasterBox.width / 2, toasterBox.y + toasterBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(5300);
    await page.mouse.up();
    await page.locator('#done').click();
    await page.locator('.friend-btn').first().waitFor();
    assert.equal(await page.locator('.friend-btn').count(), 4);
    assert.equal(await page.locator('.friend-btn').first().getAttribute('data-friend'), saved.order.friend);
    assert.equal(await page.evaluate(() => document.querySelector('#app').scrollWidth > innerWidth), false, 'serve screen with 4 friends fits');
    await page.screenshot({ path: path.join(output, 'serve-four-mobile.png'), fullPage: true });
    await page.locator('#back').click();

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
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.querySelector('#app').scrollWidth > innerWidth);
      assert.equal(overflow, false, `home fits ${width}px`);
    }
    // body ตรึงกับจอ (กัน iOS เด้ง) และหน้าครัวบน iPhone ที่มีแถบ Safari ยังไม่ต้องเลื่อน
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).position), 'fixed');
    await page.setViewportSize({ width: 390, height: 664 });
    await page.reload();
    await page.locator('.recipe-card').first().waitFor();
    assert.equal(await page.evaluate(() => document.querySelector('#app').scrollHeight <= document.querySelector('#app').clientHeight + 1), true, 'home fits iPhone Safari viewport');

    await page.setViewportSize({ width: 320, height: 844 });
    await page.locator('[data-recipe="cupcake"]').click();
    assert.equal(await page.locator('#language').isVisible(), true);
    assert.equal(await page.locator('#sound').isVisible(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'play screen fits 320px');
    await page.locator('#back').click();

    await page.waitForFunction(() => navigator.serviceWorker.controller);
    assert.ok((await page.evaluate(() => caches.keys())).includes('happy-little-kitchen-v12'));
    await context.setOffline(true);
    await page.reload();
    await page.locator('.recipe-card').first().waitFor();
    console.log('PASS nine recipes with prep step, frosting drawing, 10 toppings, friend orders, drawn reactions, friend unlocks, multi-friend feeding, selection protection, Thai/English, gallery migration, responsive views, and offline mode.');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
