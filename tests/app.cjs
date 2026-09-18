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
    const missing404 = [];
    page.on('response', (response) => { if (response.status() === 404) missing404.push(response.url()); });
    await page.goto(base);
    await page.locator('.recipe-card').first().waitFor();
    await page.locator('#sound').click();
    const RECIPES = ['omelet', 'pizza', 'noodles', 'cupcake', 'cookie', 'cake', 'icecream', 'toast', 'smoothie'];
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

    const reactionSrcs = [];
    page.on('request', (request) => { if (/friends\/\w+-(love|yum|sneeze|full)\.png/.test(request.url())) reactionSrcs.push(request.url()); });
    const PREP = { egg: 'crack', tomato: 'cut', strawberry: 'cut', banana: 'cut', springonion: 'cut', bokchoy: 'cut', butter: 'cut', bread: 'cut' };
    const seen = new Set();
    const shots = new Set();
    const center = async (locator) => {
      const box = await locator.boundingBox();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
    };
    const swipe = async (locator, dx, dy, from = { x: .5, y: .5 }) => {
      const { box } = await center(locator);
      await page.mouse.move(box.x + box.width * from.x, box.y + box.height * from.y);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * from.x + dx, box.y + box.height * from.y + dy, { steps: 6 });
      await page.mouse.up();
    };
    const hold = async (locator, ms) => {
      const { x, y } = await center(locator);
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.waitForTimeout(ms);
      await page.mouse.up();
    };
    const dragTo = async (fromLocator, toLocator) => {
      const from = await center(fromLocator);
      const to = await center(toLocator);
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(to.x, to.y, { steps: 10 });
      await page.mouse.up();
    };
    const dismissPopup = async () => {
      await page.waitForTimeout(700);
      if (await page.locator('.popup-layer').count()) {
        await page.locator('.popup-friend').waitFor();
        await page.screenshot({ path: path.join(output, 'new-friend-mobile.png'), fullPage: true });
        await page.locator('#popup-ok').click();
        await page.locator('.popup-layer').waitFor({ state: 'detached' });
      }
    };
    const shot = async (name) => {
      if (shots.has(name)) return;
      shots.add(name);
      await page.waitForFunction(() => [...document.images].every((img) => img.complete));
      await page.screenshot({ path: path.join(output, `${name}-mobile.png`), fullPage: true });
    };

    // แก้ขั้นปัจจุบันตามชนิด แล้วรอให้เกมไปขั้นถัดไป
    const solveStep = async (recipe) => {
      const stepElement = page.locator('#step');
      const type = await stepElement.getAttribute('data-type');
      const index = await stepElement.getAttribute('data-index');
      seen.add(type);
      if (type === 'prep') {
        const queue = await page.locator('.queue-item').evaluateAll((items) => items.map((item) => item.dataset.queue));
        for (const id of queue) {
          assert.equal(await page.locator('#prep-item').getAttribute('data-action'), PREP[id], `${recipe}: ${id} prep action`);
          if (PREP[id] === 'crack') {
            await page.locator('#prep-item').click();
            await page.locator('#prep-item').click();
          } else {
            await page.locator('#prep-item').click(); // แตะเฉยๆ ต้องไม่นับ
            for (let i = 0; i < 3; i++) await swipe(page.locator('#prep-item'), 90, 0, { x: .2, y: .5 });
          }
          await page.waitForFunction((count) => document.querySelectorAll('.queue-item.done').length >= count || !document.querySelector('#prep-item'), queue.indexOf(id) + 1);
        }
        await shot('prep');
      } else if (type === 'add') {
        const count = await page.locator('.ingredient').count();
        for (let i = 0; i < count; i++) {
          if (i === 0 && recipe === 'omelet') {
            // ลากจริง 1 ชิ้น
            await dragTo(page.locator('.ingredient').nth(0), page.locator('#target'));
            assert.equal(await page.locator('.ingredient').nth(0).evaluate((element) => element.classList.contains('used')), true);
          } else {
            await page.locator('.ingredient').nth(i).click();
            await page.locator('#target').click();
          }
        }
        await shot(`add-${await page.locator('#target').evaluate((element) => element.classList.contains('appliance') ? 'appliance' : 'bowl')}`);
      } else if (type === 'mix') {
        assert.equal(await page.locator('#mix img.mix-icon').count(), 1);
        if (recipe === 'cupcake') {
          for (let i = 0; i < 8; i++) await page.locator('#mix').click();
          assert.equal(await page.locator('#meter').evaluate((element) => element.style.width), '40%');
        }
        const { x, y, box } = await center(page.locator('#mix'));
        const r = Math.min(box.width, box.height) * .3;
        await page.mouse.move(x + r, y);
        await page.mouse.down();
        for (let i = 1; i <= 24 * 12 && await page.locator('#mix:not(:disabled)').count(); i++) {
          const angle = (i / 24) * Math.PI * 2;
          await page.mouse.move(x + r * Math.cos(angle), y + r * Math.sin(angle));
        }
        await page.mouse.up();
      } else if (type === 'cook' || type === 'dip') {
        const seconds = 6;
        const target = page.locator('#appliance');
        await page.waitForFunction(() => [...document.querySelectorAll('#appliance img')].every((img) => img.complete && img.naturalWidth > 0));
        const { x, y } = await center(target);
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.waitForTimeout(300);
        assert.equal(await page.locator('#appliance.running').count(), 1, `${recipe} ${type} runs while held`);
        await shot(`${type}-${await target.getAttribute('data-appliance')}`);
        if (recipe === 'omelet' && type === 'cook') {
          // ปล่อยแล้วแถบหยุด
          await page.mouse.up();
          const paused = await page.locator('#meter').evaluate((element) => element.style.width);
          await page.waitForTimeout(400);
          assert.equal(await page.locator('#meter').evaluate((element) => element.style.width), paused);
          await page.mouse.down();
        }
        await page.waitForTimeout(seconds * 1000);
        await page.mouse.up();
      } else if (type === 'pour') {
        await hold(page.locator('#pour-source'), 200);
        await shot('pour');
        await hold(page.locator('#pour-source'), 4000);
      } else if (type === 'flip') {
        await page.locator('#appliance').click(); // แตะเฉยๆ ไม่พลิก
        assert.equal(await stepElement.getAttribute('data-index'), index);
        await swipe(page.locator('#appliance'), 0, -120);
      } else if (type === 'move') {
        while (await page.locator('#carry:not(:disabled)').count()) {
          await dragTo(page.locator('#carry'), page.locator('#move-to'));
          await page.waitForTimeout(150);
        }
        await shot('move');
      } else if (type === 'spread') {
        const dish = page.locator('#dish');
        const { box } = await center(dish);
        for (let row = 0; row < 12 && (await stepElement.getAttribute('data-index')) === index; row++) {
          const yy = box.y + box.height * (.2 + row * .055);
          await page.mouse.move(box.x + box.width * .2, yy);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width * .8, yy, { steps: 8 });
          await page.mouse.up();
        }
        await shot('spread');
      } else if (type === 'sprinkle') {
        while (await page.locator('#shaker:not(:disabled)').count()) await page.locator('#shaker').click();
        assert.ok(await page.locator('#dish .bit').count() >= 10, 'cheese bits sprinkled');
        await shot('sprinkle');
      } else if (type === 'shape') {
        for (let i = 0; i < 6; i++) await page.locator('#dish').click({ position: { x: 60 + (i % 3) * 70, y: 70 + Math.floor(i / 3) * 70 } });
        await shot('shape');
      } else if (type === 'lid') {
        await dragTo(page.locator('#lid'), page.locator('#lid-target'));
      } else if (type === 'slice') {
        await swipe(page.locator('#dish'), 140, 0, { x: .2, y: .5 });
        await page.waitForTimeout(150);
        await swipe(page.locator('#dish'), 0, 140, { x: .5, y: .2 });
        await shot('slice');
      } else if (type === 'candles') {
        for (let i = 0; i < 3; i++) await page.locator('#dish').click({ position: { x: 70 + i * 50, y: 70 } });
        await page.waitForFunction(() => document.querySelector('#dish')?.dataset.phase === 'light');
        const candles = page.locator('#dish .candle');
        assert.equal(await candles.count(), 3);
        for (let i = 0; i < 3; i++) await candles.nth(i).click();
        await page.waitForFunction(() => document.querySelector('#dish')?.dataset.phase === 'blow');
        await shot('candles');
        await swipe(page.locator('#dish'), 150, 0, { x: .2, y: .35 });
      } else if (type === 'decorate') {
        await page.locator('.topping-btn:not(.pen-btn)').first().waitFor();
        assert.equal(await page.locator('.topping-btn:not(.pen-btn)').count(), 10);
        assert.equal(await page.locator('#dish canvas.frosting').count(), 1);
        if (await page.locator('.swatch').count()) await page.locator('.swatch').nth(2).click();
        if (recipe === 'cupcake') {
          const topBox = await page.locator('.topping-btn:not(.pen-btn)').first().boundingBox();
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
          await page.locator('.topping-btn:not(.pen-btn)').first().click();
          await page.locator('#dish').click({ position: { x: 135, y: 100 } });
        }
        assert.equal(await page.locator('#dish img.topping').count(), 1);
        if (recipe === 'cake') {
          // ลากนิ้วบนจาน = วาดครีม (ไม่วางท็อปปิ้ง) และวางได้เกิน 8 ชิ้น พอถึง 30 ชิ้นเก่าสุดหายไป
          const dishBox = await page.locator('#dish').boundingBox();
          await page.mouse.move(dishBox.x + dishBox.width * .3, dishBox.y + dishBox.height * .5);
          await page.mouse.down();
          await page.mouse.move(dishBox.x + dishBox.width * .7, dishBox.y + dishBox.height * .55, { steps: 10 });
          await page.mouse.up();
          assert.equal(await page.locator('#dish img.topping').count(), 1);
          const painted = await page.locator('#dish canvas.frosting').evaluate((canvas) => {
            const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
            let count = 0;
            for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++;
            return count;
          });
          assert.ok(painted > 500, `frosting was drawn (${painted} px)`);
          for (let i = 0; i < 34; i++) await page.locator('#dish').click({ position: { x: 60 + (i % 5) * 12, y: 60 + (i % 7) * 10 } });
          assert.equal(await page.locator('#dish img.topping').count(), 30);
        }
        if (recipe === 'omelet') {
          assert.equal(await page.locator('.pen-btn').count(), 2, 'omelet has ketchup and mayo pens');
        }
        await shot(`decorate-${recipe}`);
        await page.locator('#done').click();
      } else if (type === 'serve') {
        await page.locator('.friend-btn').first().waitFor();
        assert.equal(await page.locator('#finish-actions').isVisible(), false);
        // ทุกเพื่อนมีป้ายของที่ชอบ ❤ และไม่ชอบ ✕ ใต้ตัว
        assert.equal(await page.locator('.friend-btn .prefs i.love img').count(), await page.locator('.friend-btn').count());
        assert.equal(await page.locator('.friend-btn .prefs i.hate img').count(), await page.locator('.friend-btn').count());
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
          // เพื่อนคนแรกคือแมวน้ำที่สั่งคัพเค้ก → ป้ายติ๊กถูก + ปฏิกิริยา "ชอบที่สุด" ด้วยรูปหน้าตาที่วาดไว้
          assert.equal(await page.locator('.friend-btn').first().getAttribute('data-friend'), 'seal');
          assert.equal(await page.locator('.friend-btn').first().getAttribute('data-reaction'), 'love');
          assert.equal(await page.locator('.friend-btn .bubble.done').count(), 1);
          assert.ok(reactionSrcs.some((src) => src.endsWith('seal-love.png')), 'expression art used');
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
          assert.equal(cupcakeSave.ordersDone, 1);
          assert.equal(cupcakeSave.order, null);
        }
        await page.locator('#home').click();
        return 'done';
      } else {
        throw new Error(`unknown step type ${type}`);
      }
      await page.waitForFunction((previous) => {
        const element = document.querySelector('#step');
        return !element || element.dataset.index !== previous;
      }, index, { timeout: 20000 });
      return type;
    };

    const stepCounts = {};
    for (const recipe of RECIPES) {
      await page.locator(`[data-recipe="${recipe}"]`).click();
      await page.locator('#step').waitFor();
      stepCounts[recipe] = await page.locator('.progress-dots i').count();
      let guard = 0;
      while ((await solveStep(recipe)) !== 'done') {
        assert.ok(++guard < 20, `${recipe} finishes within 20 steps`);
      }
      assert.deepEqual(errors, [], `no page errors after ${recipe}`);
    }
    // ทุกชนิดขั้นถูกเล่นอย่างน้อยหนึ่งครั้ง และแต่ละเมนูมีขั้นตอนต่างกัน
    for (const type of ['prep', 'add', 'mix', 'cook', 'pour', 'flip', 'move', 'dip', 'spread', 'sprinkle', 'shape', 'lid', 'slice', 'candles', 'decorate', 'serve']) {
      assert.ok(seen.has(type), `step type ${type} exercised`);
    }
    assert.ok(new Set(Object.values(stepCounts)).size >= 4, `recipes differ in length ${JSON.stringify(stepCounts)}`);
    assert.deepEqual(missing404.filter((url) => !url.endsWith('favicon.ico')), [], 'no missing assets');

    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('happy-little-kitchen-v1')));
    assert.equal(saved.gallery.length, 9);
    assert.equal(saved.gallery[0].recipe, 'smoothie');
    assert.equal(await page.locator('img.gallery-item').count(), 6);
    // สมุดผลงาน: ทุกจานมีรูปถ่ายจริง (ครีม/ท็อปปิ้งที่เด็กทำ) เปิดดูใหญ่ได้ และกลับไปทำอีกได้
    for (const item of saved.gallery) assert.ok(item.photo && item.photo.startsWith('data:image/jpeg') && item.photo.length > 2000, `${item.recipe} has a photo`);
    await page.locator('#book').click();
    await page.locator('.book-card').first().waitFor();
    assert.equal(await page.locator('.book-card').count(), 9);
    assert.equal(await page.locator('.book-card .chips img').first().count(), 1);
    await page.screenshot({ path: path.join(output, 'book-mobile.png'), fullPage: true });
    await page.locator('.book-card').nth(1).click();
    await page.locator('.book-popup').waitFor();
    await page.screenshot({ path: path.join(output, 'book-popup-mobile.png'), fullPage: true });
    await page.locator('#book-again').click();
    await page.locator('#step').waitFor();
    assert.ok((await page.locator('.title-icon').getAttribute('src')).endsWith(`${saved.gallery[1].recipe}.png`), 'make again opens that recipe');
    await page.locator('#back').click();
    await page.locator('.recipe-card').first().waitFor();
    // ป้อน 11 ครั้ง → ปลดล็อกแมว (3) เพนกวิน (6) จิ้งจอก (10); หน้าครัวโชว์เพื่อนทั้ง 6 + เงาคนต่อไป
    assert.equal(saved.served, 11);
    assert.ok(saved.order && saved.order.friend, 'a new order exists');
    assert.equal(await page.locator('.friends-row .friend-peek').count(), 7);
    assert.ok(await page.locator('.friends-row img[src*="fox"]').count() >= 1, 'fox unlocked');
    await page.screenshot({ path: path.join(output, 'home-friends-mobile.png'), fullPage: true });
    // หน้าเสิร์ฟมีเพื่อนสูงสุด 4 คน และคนสั่งอยู่คนแรกเสมอ
    await page.locator('[data-recipe="toast"]').click();
    await page.locator('#step').waitFor();
    while ((await page.locator('#step').getAttribute('data-type')) !== 'serve') await solveStep('toast-again');
    assert.equal(await page.locator('.friend-btn').count(), 4);
    assert.equal(await page.locator('.friend-btn').first().getAttribute('data-friend'), saved.order.friend);
    assert.equal(await page.evaluate(() => document.querySelector('#app').scrollWidth > innerWidth), false, 'serve screen with 4 friends fits');
    await page.screenshot({ path: path.join(output, 'serve-four-mobile.png'), fullPage: true });
    await page.locator('#back').click();

    // ครัวอิสระ: ใส่อะไรก็ได้ → เลือกเครื่อง → จานลึกลับ → แต่ง (ท็อปปิ้งทั้งหมด เลื่อนได้) → เสิร์ฟ
    await page.locator('[data-recipe="free"]').click();
    await page.locator('#step[data-type="freeadd"]').waitFor();
    assert.equal(await page.locator('#done').isDisabled(), true);
    for (const id of ['egg', 'fishball', 'strawberry', 'chocchips']) {
      await page.locator(`.ingredient[data-id="${id}"]`).scrollIntoViewIfNeeded();
      await page.locator(`.ingredient[data-id="${id}"]`).click();   // แตะ = ลอยลงชาม ไม่ต้องลาก (ถาดเลื่อนได้)
    }
    await page.waitForFunction(() => document.querySelectorAll('#target .in-bowl').length === 4);
    assert.equal(await page.locator('.tray.free-tray').evaluate((tray) => getComputedStyle(tray.querySelector('.ingredient')).touchAction), 'pan-x', 'free tray items let the tray scroll');
    assert.equal(await page.locator('.tray.free-tray').evaluate((tray) => tray.scrollWidth > tray.clientWidth), true, 'free tray scrolls');
    await page.locator('#done').waitFor();
    await page.screenshot({ path: path.join(output, 'free-add-mobile.png'), fullPage: true });
    await page.locator('#done').click();
    await page.locator('#step[data-type="freecook"]').waitFor();
    assert.equal(await page.locator('.machine-btn').count(), 6);
    await page.locator('.machine-btn[data-kind="pan"]').click();
    await page.locator('#appliance').waitFor();
    {
      const { x, y } = await center(page.locator('#appliance'));
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(output, 'free-cook-mobile.png'), fullPage: true });
      await page.waitForTimeout(5200);
      await page.mouse.up();
    }
    await page.locator('#step[data-type="decorate"]').waitFor();
    // ผลลัพธ์เป็นอาหารจริง (เสมอกัน 2:2 → หวาน → แพนเค้ก) ไม่ใช่ไอคอนวัตถุดิบเรียงบนจาน; มีวัตถุดิบเล็กๆ เป็นหน้าไม่เกิน 3 ชิ้น
    assert.ok((await page.locator('#dish .food-icon').getAttribute('src')).endsWith('states/fry-pancakes.png'), 'sweet pan result uses the real pancake picture');
    assert.equal(await page.locator('#dish .bit').count(), 3);
    assert.equal(await page.locator('#dish canvas.frosting').count(), 1);
    assert.equal(await page.locator('.swatch').count(), 5);
    assert.equal(await page.locator('.pen-btn').count(), 0, 'no cream pens in the free kitchen');
    assert.equal(await page.locator('.topping-scroll .topping-btn').count(), 40);
    assert.equal(await page.evaluate(() => document.querySelector('#app').scrollWidth > innerWidth), false, 'free decorate fits');
    await page.locator('.topping-btn[data-top="shrimp"]').scrollIntoViewIfNeeded();
    await page.locator('.topping-btn[data-top="shrimp"]').click();
    await page.locator('#dish').click({ position: { x: 135, y: 100 } });
    await page.screenshot({ path: path.join(output, 'free-decorate-mobile.png'), fullPage: true });
    await page.locator('#done').click();
    await page.locator('.friend-btn').first().waitFor();
    await page.locator('.friend-btn').first().click();
    await page.locator('#finish-actions:not([hidden])').waitFor();
    await dismissPopup();
    await page.locator('#home').click();
    await page.locator('.recipe-card').first().waitFor();
    const withFree = await page.evaluate(() => JSON.parse(localStorage.getItem('happy-little-kitchen-v1')));
    assert.equal(withFree.gallery[0].recipe, 'free');
    assert.deepEqual(withFree.gallery[0].free, { items: ['egg', 'fishball', 'strawberry', 'chocchips'], machine: 'pan', taste: 'sweet', color: 'pink', burnt: false });
    // ปิ้งนานไป = ไหม้: ครัวอิสระอีกรอบ ใส่ขนมปัง เลือกเครื่องปิ้ง กดค้างเกินแถบเต็ม
    await page.locator('[data-recipe="free"]').click();
    await page.locator('#step[data-type="freeadd"]').waitFor();
    await page.locator('.ingredient[data-id="bread"]').click();
    await page.waitForFunction(() => document.querySelectorAll('#target .in-bowl').length === 1);
    await page.locator('#done').click();
    await page.locator('.machine-btn[data-kind="toaster"]').click();
    await page.locator('#appliance').waitFor();
    {
      const { x, y } = await center(page.locator('#appliance'));
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.waitForTimeout(4300);
      assert.equal(await page.locator('.meter.over').count(), 1, 'meter warns while over-holding');
      await page.waitForTimeout(3200);
      await page.mouse.up();
    }
    await page.locator('#step[data-type="decorate"]').waitFor();
    assert.equal(await page.locator('.dish.tint-burnt').count(), 1, 'burnt toast');
    assert.ok((await page.locator('#dish .food-icon').getAttribute('src')).endsWith('states/toast-burnt.png'), 'burnt toast picture');
    await page.screenshot({ path: path.join(output, 'free-burnt-mobile.png'), fullPage: true });
    await page.locator('#done').click();
    await page.locator('.friend-btn').first().click();
    await page.locator('#finish-actions:not([hidden])').waitFor();
    assert.equal(await page.locator('.friend-btn[data-reaction="yuck"]').count(), 1, 'burnt food gets a yuck face');
    await dismissPopup();
    await page.locator('#home').click();
    await page.locator('.recipe-card').first().waitFor();
    assert.ok(withFree.gallery[0].photo.startsWith('data:image/jpeg'));

    // หน้าผู้ปกครอง: กดค้าง 2 วิ → สถิติ → รีเซ็ตต้องกดค้างอีก
    {
      await page.locator('#parent').click();   // แตะเฉยๆ ไม่เปิด
      assert.equal(await page.locator('.parent').count(), 0);
      const { x, y } = await center(page.locator('#parent'));
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.waitForTimeout(2300);
      await page.mouse.up();
      await page.locator('.parent').waitFor();
      const stats = await page.locator('.stat b').allInnerTexts();
      assert.equal(stats[0], '11', 'dishes made'); // 9 เมนู + ครัวอิสระ 2
      assert.ok(stats[2].startsWith('6 /'), 'six friends unlocked');
      await page.screenshot({ path: path.join(output, 'parent-mobile.png'), fullPage: true });
      const reset = await center(page.locator('#reset-all'));
      await page.mouse.move(reset.x, reset.y);
      await page.mouse.down();
      await page.waitForTimeout(2300);
      await page.mouse.up();
      await page.waitForFunction(() => document.querySelector('.stat b')?.textContent === '0');
      const afterReset = await page.evaluate(() => JSON.parse(localStorage.getItem('happy-little-kitchen-v1')));
      assert.equal(afterReset.served, 0);
      assert.equal(afterReset.gallery.length, 0);
      await page.locator('#back').click();
      await page.locator('.recipe-card').first().waitFor();
      assert.equal(await page.locator('.friends-row .friend-peek').count(), 4, 'back to three friends + next');
    }

    // เพื่อนครบ 11 ตัว: แถวเพื่อนบนหน้าครัวต้องโชว์ทุกตัว เลื่อนซ้ายขวาได้ ไม่ล้นจอ
    await page.evaluate(() => { const saved = JSON.parse(localStorage.getItem('happy-little-kitchen-v1')); saved.served = 30; localStorage.setItem('happy-little-kitchen-v1', JSON.stringify(saved)); });
    await page.reload();
    await page.locator('.recipe-card').first().waitFor();
    assert.equal(await page.locator('.friends-row .friend-peek').count(), 11);
    assert.equal(await page.locator('.friends-row .next').count(), 0);
    assert.equal(await page.evaluate(() => document.querySelector('#app').scrollWidth > innerWidth), false, 'home does not overflow with 11 friends');
    assert.equal(await page.evaluate(() => { const row = document.querySelector('.friends-row'); return row.scrollWidth > row.clientWidth && row.classList.contains('more-right'); }), true, 'friends row scrolls');
    await page.evaluate(() => { document.querySelector('.friends-row').scrollLeft = 9999; });
    await page.waitForFunction(() => document.querySelector('.friends-row').classList.contains('more-left'));
    assert.equal(await page.locator('[data-buddy="squirrel"]').evaluate((element) => { const r = element.getBoundingClientRect(); return r.right <= innerWidth && r.left >= 0; }), true, 'last friend reachable by scrolling');
    await page.locator('[data-buddy="squirrel"]').click();
    await page.screenshot({ path: path.join(output, 'home-eleven-mobile.png'), fullPage: true });

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
    assert.ok((await page.evaluate(() => caches.keys())).includes('happy-little-kitchen-v20'));
    await context.setOffline(true);
    await page.reload();
    await page.locator('.recipe-card').first().waitFor();
    console.log(`PASS nine recipes with real cooking steps (${[...seen].length} step types), friend orders, drawn reactions, friend unlocks, multi-friend feeding, selection protection, Thai/English, gallery migration, responsive views, and offline mode.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
