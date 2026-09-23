// ร้านของหนู end-to-end (Chrome): ขายระดับ 1–3, ตอบไม่ตรงแล้วเข้าโหมดช่วย, reload กลางออร์เดอร์, ทำอาหารเติมสต็อก,
// เซฟครัวไม่ถูกแตะ, หน้าจอพอดีทุกขนาด — รัน: node tests/shop.cjs (ต้องเปิด python -m http.server 5174 ไว้)
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SHOP_KEY = 'happy-little-kitchen-shop-v1';
const KITCHEN_KEY = 'happy-little-kitchen-v1';

(async () => {
  const base = process.env.HAPPY_KITCHEN_URL || 'http://127.0.0.1:5174';
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const output = path.join(__dirname, 'screenshots');
  fs.mkdirSync(output, { recursive: true });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 664 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    const missing = [];
    page.on('response', (response) => { if (response.status() === 404) missing.push(response.url()); });

    const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'kitchen-save-v31.json'), 'utf8'));
    delete fixture._note;
    fixture.sound = false;   // ไม่ต้องรอเสียงพูดในเทส
    await page.goto(base);
    await page.evaluate(([key, save]) => { localStorage.clear(); localStorage.setItem(key, JSON.stringify(save)); }, [KITCHEN_KEY, fixture]);
    await page.reload();
    await page.locator('#shop').waitFor();
    const kitchenBefore = await page.evaluate((key) => localStorage.getItem(key), KITCHEN_KEY);

    const readShop = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SHOP_KEY);
    const writeShop = (shop) => page.evaluate(([key, value]) => localStorage.setItem(key, JSON.stringify(value)), [SHOP_KEY, shop]);
    const shot = (name) => page.screenshot({ path: path.join(output, `shop-${name}.png`) });
    const fits = async (tag) => {
      const result = await page.evaluate(() => ({
        sideways: document.documentElement.scrollWidth > innerWidth || document.querySelector('#app').scrollWidth > innerWidth,
        scroll: document.querySelector('#app').scrollHeight - document.querySelector('#app').clientHeight
      }));
      assert.equal(result.sideways, false, `${tag}: no sideways scroll`);
      assert.ok(result.scroll <= 1, `${tag}: fits 390x664 without scrolling (${result.scroll}px)`);
    };
    const openShop = async () => {
      await page.locator('#shop').click();
      await page.locator('.shop #desk .stock-card, .shop #desk .coins, .shop .cook-card').first().waitFor();
    };
    const backHome = async () => {
      await page.locator('#back').click();
      await page.locator('#shop').waitFor();
    };

    // --- เปิดร้านครั้งแรก: มีคุกกี้ 6 ชิ้น ลูกค้ามาทันที (ระดับ 1 = นับของ)
    await fits('home');
    await openShop();
    let shop = await readShop();
    assert.deepEqual(shop.stock, { cookie: 6, cupcake: 0, pizza: 0 });
    let order = shop.activeOrder;
    assert.equal(order.checkpoint, 'count');
    assert.equal(order.lines[0].recipe, 'cookie');
    await page.locator('#tray').waitFor();
    await shot('picking');
    await fits('picking');
    assert.equal(await page.locator('.order-bubble .want img').count(), order.lines[0].qty, 'bubble shows one picture per item');

    // แตะของที่ลูกค้าไม่ได้ขอ: ไม่ลงถาด
    await page.locator('[data-product="cupcake"]').click();
    assert.equal(await page.locator('#tray .tray-item').count(), 0);

    // หยิบเกิน 1 ชิ้นแล้วส่ง → ! (เกิน) ไม่มีสีแดง ไม่ขาย
    const qty = order.lines[0].qty;
    for (let i = 0; i < qty + 1; i++) await page.locator('[data-product="cookie"]').click();
    await page.locator('#give').click();
    await page.waitForFunction(() => document.querySelector('#mark')?.classList.contains('over'));
    assert.equal((await readShop()).ordersDone, 0);
    assert.equal((await readShop()).activeOrder.math.attempts, 1);
    assert.equal(await page.locator('.shop .slot').count(), 0, 'first miss keeps the child counting alone');
    // หยิบคืน 1 ชิ้น แล้วลองส่งแบบขาด → ครั้งที่สองเปิดโหมดช่วย (ช่องมีเลขกำกับ)
    if (qty >= 2) {
      await page.locator('#tray .tray-item').first().click();
      await page.locator('#tray .tray-item').first().click();
    } else {
      await page.locator('[data-product="cookie"]').click();   // สั่ง 1 ชิ้น: ลองเกินอีกรอบแทน
    }
    await page.locator('#give').click();
    await page.locator('.shop .slot').first().waitFor();
    assert.equal((await readShop()).activeOrder.math.guided, true);
    await shot('guided-count');
    // ไม่มีสีแดงหรือ ✕ บนจอร้าน
    const redOrCross = await page.evaluate(() => [...document.querySelectorAll('.shop *')].some((element) => {
      const style = getComputedStyle(element);
      return /rgb\(2(0|1|2|3|4|5)\d, [0-6]?\d, [0-6]?\d\)/.test(style.color) || element.textContent.trim() === '✕';
    }));
    assert.equal(redOrCross, false, 'no red and no ✕ in the shop');

    // reload กลางออร์เดอร์: ลูกค้าคนเดิม ของในถาดยังอยู่
    const pickedBefore = (await readShop()).activeOrder.picked.length;
    await page.reload();
    await openShop();
    shop = await readShop();
    assert.equal(shop.activeOrder.id, order.id, 'same order after reload');
    assert.equal(shop.activeOrder.picked.length, pickedBefore);
    // เติมช่องที่เหลือ (โหมดช่วยไปต่อเองเมื่อครบ)
    // เกินอยู่ → หยิบคืนจนพอดี, ขาดอยู่ → หยิบเพิ่ม (โหมดช่วยไปต่อเองเมื่อพอดีช่อง)
    while ((await readShop()).activeOrder?.picked.length > qty) await page.locator('#tray .tray-item').last().click();
    while ((await readShop()).activeOrder?.picked.length < qty) await page.locator('[data-product="cookie"]').click();
    await page.locator('#next').waitFor({ timeout: 15000 });
    await shot('thanks');
    shop = await readShop();
    assert.equal(shop.ordersDone, 1);
    assert.equal(shop.stock.cookie, 6 - qty);
    assert.equal(shop.piggy, 5 * qty);
    assert.equal(shop.transactions.length, 1);
    assert.equal(shop.transactions[0].usedHelp, false);
    assert.equal(shop.transactions[0].attempts, 2);

    // --- ระดับ 2: รับเงินพอดีจากกระเป๋าลูกค้า
    shop.ordersDone = 5;
    shop.stock = { cookie: 6, cupcake: 6, pizza: 4 };
    shop.activeOrder = {
      id: 'order-test-collect', customer: 'rabbit', lines: [{ recipe: 'cupcake', qty: 1, unitPrice: 7 }], total: 7,
      checkpoint: 'collect', status: 'paying', picked: ['cupcake'],
      payment: { mode: 'collect', offered: [], purse: [10, 5, 1, 2, 2], paid: 7, change: 0, changeCoins: [] },
      math: { attempts: 0, usedHelp: false, guided: false }, createdAt: 1
    };
    await writeShop(shop);
    await backHome();
    await openShop();
    await page.locator('#purse .coin').first().waitFor();
    await fits('collect');
    await shot('collect');
    // หยิบ 10 → เกิน (ลูกค้าทำหน้าตกใจ) แล้วหยิบคืน
    await page.locator('#purse .coin[data-v="10"]').click();
    await page.waitForFunction(() => document.querySelector('#mark')?.classList.contains('over'));
    await page.locator('#counter .coin').first().click();
    // ขอความช่วยเหลือ → เหรียญที่ควรหยิบเรืองแสง
    await page.locator('#help').click();
    await page.locator('#purse .coin.hint').first().waitFor();
    const hinted = await page.locator('#purse .coin.hint').evaluateAll((coins) => coins.map((coin) => Number(coin.dataset.v)));
    assert.equal(hinted.reduce((a, b) => a + b, 0), 7, 'hinted coins make exactly 7');
    await shot('collect-help');
    await page.locator('#purse .coin[data-v="5"]').click();
    await page.locator('#purse .coin[data-v="2"]').first().click();
    await page.locator('#next').waitFor({ timeout: 15000 });
    shop = await readShop();
    assert.equal(shop.transactions[0].id, 'order-test-collect');
    assert.equal(shop.transactions[0].usedHelp, true);
    assert.equal(shop.piggy, 5 * qty + 7);
    assert.equal(shop.stock.cupcake, 5);

    // --- ระดับ 3: ทอนแบบนับต่อ ราคา 7 ลูกค้าให้ 10
    shop.ordersDone = 10;
    shop.activeOrder = {
      id: 'order-test-change', customer: 'seal', lines: [{ recipe: 'cupcake', qty: 1, unitPrice: 7 }], total: 7,
      checkpoint: 'change', status: 'paying', picked: ['cupcake'],
      payment: { mode: 'change', offered: [10], paid: 10, change: 3, changeCoins: [] },
      math: { attempts: 0, usedHelp: false, guided: false }, createdAt: 2
    };
    await writeShop(shop);
    await backHome();
    await openShop();
    await page.locator('#drawer .coin').first().waitFor();
    await fits('change');
    await shot('change');
    assert.equal((await page.locator('#running').innerText()).startsWith('7'), true, 'counting starts at the price');
    // วาง 5 → เกิน, หยิบคืน, วาง 1 แล้วส่ง → ยังขาด → ครั้งที่สองเปิดเส้นนับ
    await page.locator('#drawer .coin[data-v="5"]').click();
    await page.waitForFunction(() => document.querySelector('#mark')?.classList.contains('over'));
    await page.locator('#counter .coin').first().click();
    await page.locator('#drawer .coin[data-v="1"]').click();
    await page.locator('#give').click();
    await page.locator('#line').waitFor();
    assert.equal(await page.locator('#line i.on').count(), 1, 'number line shows 8 as counted');
    assert.equal(await page.locator('#drawer .coin.hint').getAttribute('data-v'), '2', 'suggests the 2-baht coin for the last 2');
    await shot('change-help');
    await fits('change-help');
    // แตะรัว 2 ครั้ง: ขายครั้งเดียว
    await page.locator('#drawer .coin[data-v="2"]').dblclick();
    await page.locator('#next').waitFor({ timeout: 15000 });
    shop = await readShop();
    assert.equal(shop.transactions.filter((entry) => entry.id === 'order-test-change').length, 1, 'sold once');
    assert.equal(shop.transactions[0].change, 3);
    assert.equal(shop.piggy, shop.totals.sales - shop.totals.spent);
    assert.equal(shop.totals.customerPaid - shop.totals.changeGiven, shop.totals.sales);

    // --- ภาษาอังกฤษในร้าน
    await page.locator('#next').click();
    await page.locator('.shop #desk .stock-card, .shop #desk .coins').first().waitFor();
    await page.locator('#language').click();
    await page.waitForFunction(() => document.querySelector('.topbar-title')?.textContent.includes('My shop'));
    await page.locator('#language').click();
    await page.waitForFunction(() => document.querySelector('.topbar-title')?.textContent.includes('ร้านของหนู'));

    // --- ของหมด: ร้านบอกให้ไปทำเพิ่ม
    shop = await readShop();
    shop.activeOrder = null;
    shop.stock = { cookie: 0, cupcake: 0, pizza: 0 };
    await writeShop(shop);
    await backHome();
    await openShop();
    await page.locator('.shop .cook-card').first().waitFor();
    assert.equal(await page.locator('.shop .cook-card').count(), 3);
    await fits('empty');
    await shot('empty');

    // --- ทำคุกกี้ไปเติมร้าน: ขั้นตอนเหมือนเดิม จบแล้วของขึ้นชั้น 6 ชิ้น เก็บรูปในสมุด แต่ไม่นับว่าป้อนเพื่อน
    const kitchenMid = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KITCHEN_KEY);
    await page.locator('.shop .cook-card[data-cook="cookie"]').click();
    await page.locator('#step').waitFor();
    const center = async (locator) => { const box = await locator.boundingBox(); return { x: box.x + box.width / 2, y: box.y + box.height / 2, box }; };
    const swipe = async (locator, dx) => {
      const { box } = await center(locator);
      await page.mouse.move(box.x + box.width * .2, box.y + box.height * .5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * .2 + dx, box.y + box.height * .5, { steps: 6 });
      await page.mouse.up();
    };
    for (let guard = 0; guard < 20 && await page.locator('#step').count(); guard++) {
      const type = await page.locator('#step').getAttribute('data-type');
      const index = await page.locator('#step').getAttribute('data-index');
      if (type === 'prep') {
        while (await page.locator('#prep-item').count()) {
          const action = await page.locator('#prep-item').getAttribute('data-action');
          if (action === 'crack') { await page.locator('#prep-item').click(); await page.locator('#prep-item').click(); } else { for (let i = 0; i < 3; i++) await swipe(page.locator('#prep-item'), 90); }
          await page.waitForTimeout(300);
          if ((await page.locator('#step').getAttribute('data-index')) !== index) break;
        }
      } else if (type === 'add') {
        const count = await page.locator('.ingredient').count();
        for (let i = 0; i < count; i++) { await page.locator('.ingredient').nth(i).click(); await page.locator('#target').click(); }
      } else if (type === 'mix') {
        const { x, y, box } = await center(page.locator('#mix'));
        const r = Math.min(box.width, box.height) * .3;
        await page.mouse.move(x + r, y);
        await page.mouse.down();
        for (let i = 1; i <= 24 * 12 && await page.locator('#mix:not(:disabled)').count(); i++) {
          const angle = (i / 24) * Math.PI * 2;
          await page.mouse.move(x + r * Math.cos(angle), y + r * Math.sin(angle));
        }
        await page.mouse.up();
      } else if (type === 'shape') {
        for (let i = 0; i < 6; i++) await page.locator('#dish').click({ position: { x: 60 + (i % 3) * 70, y: 70 + Math.floor(i / 3) * 70 } });
      } else if (type === 'cook') {
        await page.waitForFunction(() => [...document.querySelectorAll('#appliance img')].every((img) => img.complete && img.naturalWidth > 0));
        const { x, y } = await center(page.locator('#appliance'));
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.waitForTimeout(6300);
        await page.mouse.up();
      } else if (type === 'decorate') {
        await page.locator('.topping-btn:not(.pen-btn)').first().click();
        await page.locator('#dish').click({ position: { x: 120, y: 100 } });
        await page.locator('#done').click();
      } else if (type === 'serve') {
        break;
      }
      await page.waitForFunction((i) => document.querySelector('#step')?.getAttribute('data-index') !== i || document.querySelector('#to-shop'), index, { timeout: 20000 });
      if (await page.locator('#to-shop').count()) break;
    }
    await page.locator('#to-shop').waitFor({ timeout: 20000 });
    assert.equal(await page.locator('.stock-batch img').count(), 6, 'six cookies made');
    await fits('stock-done');
    await shot('stock-done');
    await page.waitForFunction(([key, made]) => JSON.parse(localStorage.getItem(key)).made === made + 1, [KITCHEN_KEY, kitchenMid.made]);
    const kitchenAfter = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KITCHEN_KEY);
    assert.equal(kitchenAfter.served, kitchenMid.served, 'cooking for the shop is not feeding a friend');
    assert.equal(kitchenAfter.gallery[0].recipe, 'cookie');
    assert.deepEqual(kitchenAfter.gallery[0].friends, []);
    assert.ok(kitchenAfter.gallery[0].photo?.startsWith('data:image/jpeg'), 'photo saved in the book');
    assert.equal((await readShop()).stock.cookie, 6);
    // แตะซ้ำ/reload หน้าจบ ไม่เติมซ้ำ
    await page.locator('#to-shop').click();
    await page.locator('.shop #desk .stock-card').first().waitFor();
    assert.equal((await readShop()).stock.cookie, 6);
    assert.equal((await readShop()).activeOrder?.lines[0].recipe, 'cookie', 'a customer comes for the new cookies');

    // --- ทุกขนาดจอ: ไม่ล้นด้านข้าง
    for (const [width, height] of [[390, 844], [768, 950], [834, 1100], [1024, 660], [1280, 900]]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(80);
      const wide = await page.evaluate(() => [...document.querySelectorAll('#app *')].filter((element) => element.getBoundingClientRect().right > innerWidth + .5).length);
      assert.equal(wide, 0, `shop fits ${width}x${height}`);
      await page.screenshot({ path: path.join(output, `shop-${width}.png`) });
    }
    await page.setViewportSize({ width: 390, height: 664 });

    // --- หน้าผู้ปกครอง: สถิติร้าน + ล้างร้านไม่แตะเซฟครัว
    await backHome();
    const kitchenBeforeReset = await page.evaluate((key) => localStorage.getItem(key), KITCHEN_KEY);
    const parent = page.locator('#parent');
    const pbox = await parent.boundingBox();
    await page.mouse.move(pbox.x + pbox.width / 2, pbox.y + pbox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(2200);
    await page.mouse.up();
    await page.locator('#reset-shop').waitFor();
    const sold = String((await readShop()).ordersDone);
    assert.ok((await page.locator('.stat').allInnerTexts()).some((text) => text.includes('🏪') && text.includes(sold)), `shop orders sold shown (${sold})`);
    const rbox = await page.locator('#reset-shop').boundingBox();
    await page.mouse.move(rbox.x + rbox.width / 2, rbox.y + rbox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(2200);
    await page.mouse.up();
    await page.waitForFunction((key) => localStorage.getItem(key) === null, SHOP_KEY);
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), KITCHEN_KEY), kitchenBeforeReset, 'clearing the shop leaves the kitchen save alone');

    // --- ข้อมูลร้านเสีย: เริ่มร้านใหม่ ไม่แตะเซฟครัว
    await page.evaluate((key) => localStorage.setItem(key, '{broken'), SHOP_KEY);
    await page.locator('#back').click();
    await openShop();
    assert.equal(await page.evaluate(() => localStorage.getItem('happy-little-kitchen-shop-broken')), '{broken');
    assert.deepEqual((await readShop()).stock, { cookie: 6, cupcake: 0, pizza: 0 });

    // เซฟครัวเดิม (ตัวอย่าง v31) ไม่ถูกแตะตลอดการเล่นร้าน ยกเว้นส่วนที่ทำอาหารเพิ่ม (made + รูปในสมุด)
    const original = JSON.parse(kitchenBefore);
    const now = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KITCHEN_KEY);
    assert.equal(now.served, original.served);
    assert.equal(now.ordersDone, original.ordersDone);
    assert.deepEqual(now.order, original.order);
    assert.deepEqual(now.gallery.slice(1), original.gallery);
    assert.equal(Object.keys(now).some((key) => /shop|stock|piggy/.test(key)), false, 'no shop fields in the kitchen save');

    assert.deepEqual(missing.filter((url) => !url.endsWith('favicon.ico')), [], 'no missing files');
    assert.deepEqual(errors, []);
    console.log('PASS shop: first visit with seeded cookies, count/collect/change with gentle retries and help, reload keeps the order, sells once, cooking restocks once, parent stats and reset, broken shop data, kitchen save untouched, all screen sizes.');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
