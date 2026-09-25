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
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
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
      // ลูกค้าและลูกโป่งคำพูดต้องอยู่ในฉากร้านทั้งตัว (ไม่ถูกขอบฉากตัด)
      const cut = await page.evaluate(() => {
        const scene = document.querySelector('.shop-scene');
        if (!scene) return [];
        const box = scene.getBoundingClientRect();
        return ['#customer', '#bubble'].filter((sel) => {
          const el = document.querySelector(`.shop-scene ${sel}`);
          if (!el) return false;
          const r = el.getBoundingClientRect();
          return r.left < box.left - 1 || r.right > box.right + 1;
        });
      });
      assert.deepEqual(cut, [], `${tag}: customer and bubble inside the scene`);
      assert.ok(result.scroll <= 1, `${tag}: fits 390x664 without scrolling (${result.scroll}px)`);
    };
    const openShop = async () => {
      await page.locator('#shop').click();
      await page.locator('.shop #desk .stock-card, .shop #desk .coins, .shop .cook-card, .shop .count-row, .shop .col-flat, .shop .col-sum').first().waitFor();
    };
    // ตลาด → ร้าน → หน้าครัว (ปุ่มย้อนในตลาดพากลับร้านก่อน)
    const backHome = async () => {
      for (let i = 0; i < 3 && !(await page.locator('#shop').count()); i++) {
        await page.locator('#back').click();
        await page.waitForTimeout(150);
      }
      await page.locator('#shop').waitFor();
    };

    // --- เปิดร้านครั้งแรก: มีคุกกี้ 6 ชิ้น ลูกค้ามาทันที (ระดับ 1 = นับของ)
    await fits('home');
    await openShop();
    let shop = await readShop();
    assert.deepEqual(shop.stock, { cookie: 6, cupcake: 0, pizza: 0, cake: 0, smoothie: 0 });
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
    await page.waitForFunction(() => document.querySelector('#mark')?.classList.contains('mark-over'));
    // คำใบ้ภาพครั้งแรก: บนถาดมีกี่ชิ้น + ลูกโป่งคำพูดของลูกค้าเรืองแสง (ยังไม่ใช่โหมดช่วยเต็ม)
    assert.equal(await page.locator('#tray .tray-count').innerText(), String(order.lines[0].qty + 1));
    assert.equal(await page.locator('#bubble.bubble-hint').count(), 1);
    assert.equal((await readShop()).ordersDone, 0);
    assert.equal((await readShop()).activeOrder.math.attempts, 1);
    assert.equal(await page.locator('.shop .tray-slot').count(), 0, 'first miss keeps the child counting alone');
    // หยิบคืน 1 ชิ้น แล้วลองส่งแบบขาด → ครั้งที่สองเปิดโหมดช่วย (ช่องมีเลขกำกับ)
    if (qty >= 2) {
      await page.locator('#tray .tray-item').first().click();
      await page.locator('#tray .tray-item').first().click();
    } else {
      await page.locator('[data-product="cookie"]').click();   // สั่ง 1 ชิ้น: ลองเกินอีกรอบแทน
    }
    await page.locator('#give').click();
    await page.locator('.shop .tray-slot').first().waitFor();
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
    assert.equal(shop.transactions[0].usedHelp, true, 'guided mode opened by the game counts as help');
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
    await page.waitForFunction(() => document.querySelector('#mark')?.classList.contains('mark-over'));
    assert.equal(await page.locator('#counter .coin.hint').count(), 1, 'first hint: the coin to take back glows');
    await page.locator('#counter .coin').first().click();
    assert.equal(await page.locator('#purse .coin.hint').count(), 1, 'first hint: one coin to pick glows');
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
    await page.waitForFunction(() => document.querySelector('#mark')?.classList.contains('mark-over'));
    assert.equal(await page.locator('#counter .coin.hint').count(), 1, 'first hint: the coin to take back glows');
    assert.equal(await page.locator('#line').count(), 0, 'number line waits for the second miss');
    await page.locator('#counter .coin').first().click();
    assert.equal(await page.locator('#drawer .coin.hint').getAttribute('data-v'), '2', 'first hint: the next coin glows');
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

    // --- ระดับ 4–5: คิดราคาด้วยตั้งเลข, ของเหลือบนชั้น, แบงก์ 20 + ตั้งลบช่วย, คำถามตอนเติมของ
    const orderOf = (fields) => ({
      id: `order-test-${fields.checkpoint}-${Math.random().toString(36).slice(2, 7)}`, customer: 'turtle', status: 'picking', picked: [], createdAt: 3,
      math: { attempts: 0, usedHelp: false, guided: false, ...(fields.math || {}) },
      ...fields,
      total: fields.lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0)
    });
    const setOrder = async (order, extra = {}) => {
      const current = await readShop();
      Object.assign(current, { ordersDone: 16, stock: { cookie: 6, cupcake: 6, pizza: 4 }, activeOrder: order, restockQuiz: null }, extra);
      await writeShop(current);
      await backHome();
      await openShop();
    };
    const press = async (digits) => { for (const d of String(digits)) await page.locator(`.shop .key[data-k="${d}"]`).click(); };
    const lastSale = async () => (await readShop()).transactions[0];

    // คิดราคาแบบคิดเอง: คัพเค้ก 2 ชิ้น 7 + 7 — ตอบ 13 ก่อน (ยังขาด) แล้วตอบ 14
    await setOrder(orderOf({ checkpoint: 'price', lines: [{ recipe: 'cupcake', qty: 2, unitPrice: 7 }], payment: { mode: 'auto', offered: [10, 2, 2], paid: 14, change: 0, changeCoins: [] }, math: { problem: { a: 7, op: '+', b: 7 } } }));
    for (let i = 0; i < 2; i++) await page.locator('[data-product="cupcake"]').click();
    await page.locator('.shop .col-flat').waitFor();
    assert.equal(await page.locator('.order-bubble .priced-item').count(), 2, 'each cupcake shows its price');
    await fits('price');
    await shot('price');
    await press(13);
    await page.waitForFunction(() => document.querySelector('#mark')?.classList.contains('mark-short'));
    await press(14);
    await page.locator('#next').waitFor({ timeout: 15000 });
    assert.equal((await lastSale()).checkpoint, 'price');
    assert.equal((await lastSale()).attempts, 1);
    assert.equal((await lastSale()).total, 14);

    // คิดราคาแบบตั้งเลขช่วย: พิซซ่า + คัพเค้ก 8 + 7 = 15 (ทด 1, หลักสิบของตัวตั้งว่าง ไม่มี 08)
    await setOrder(orderOf({ checkpoint: 'price', lines: [{ recipe: 'pizza', qty: 1, unitPrice: 8 }, { recipe: 'cupcake', qty: 1, unitPrice: 7 }], payment: { mode: 'auto', offered: [10, 5], paid: 15, change: 0, changeCoins: [] }, math: { problem: { a: 8, op: '+', b: 7 } } }));
    await page.locator('[data-product="pizza"]').click();
    await page.locator('[data-product="cupcake"]').click();
    await page.locator('#col-help').click();
    await page.locator('.shop .col-sum').waitFor();
    assert.equal(await page.locator('.shop .col-sum .col-cell[data-slot="top"]').count(), 0, 'no tens digit on top: 8 not 08');
    await fits('column');
    await press(15);
    await page.locator('.shop .col-cell.pulse[data-slot="answer"][data-col="units"]').click();
    await page.locator('.shop .col-cell.pulse[data-slot="carry"]').click();
    await shot('column-carry');
    await page.locator('.shop .col-cell.pulse[data-slot="answer"][data-col="tens"]').click();
    await page.locator('#next').waitFor({ timeout: 15000 });
    assert.equal((await lastSale()).usedHelp, true);
    assert.equal((await lastSale()).lines.length, 2);

    // ของเหลือ: มีคุกกี้ 6 ขาย 2 เหลือ 4 — ตอบไม่ตรง 2 ครั้ง แล้วรูปมีเลขกำกับ
    await setOrder(orderOf({ checkpoint: 'remaining', lines: [{ recipe: 'cookie', qty: 2, unitPrice: 5 }], payment: { mode: 'auto', offered: [10], paid: 10, change: 0, changeCoins: [] }, math: { problem: { a: 6, op: '-', b: 2 }, choices: [3, 4, 5] } }));
    for (let i = 0; i < 2; i++) await page.locator('[data-product="cookie"]').click();
    await page.locator('.shop .count-row').waitFor();
    assert.equal(await page.locator('.shop .count-row .pic').count(), 6);
    assert.equal(await page.locator('.shop .count-row .pic.gone').count(), 2);
    await fits('remaining');
    await page.locator('.shop .choice[data-n="3"]').click();
    await page.locator('.shop .count-row .pic.pic-glow').first().waitFor();
    assert.equal(await page.locator('.shop .count-row .pic.pic-glow').count(), 4, 'first hint: the four left glow');
    await page.locator('.shop .choice[data-n="5"]').click();
    await page.locator('.shop .count-row .pic i').first().waitFor();
    assert.equal(await page.locator('.shop .count-row .pic i').count(), 4, 'the four left are numbered');
    await shot('remaining-help');
    await page.locator('.shop .choice[data-n="4"]').click();
    await page.locator('#next').waitFor({ timeout: 15000 });
    assert.equal((await lastSale()).checkpoint, 'remaining');
    assert.equal((await readShop()).stock.cookie, 4);

    // แบงก์ 20: พิซซ่า + คุกกี้ 13 บาท ทอน 7 — ลิ้นชักมีเหรียญ 10, ตั้งลบช่วย 20 − 13 (ยืม, ไม่มี 07)
    await setOrder(orderOf({ checkpoint: 'change', lines: [{ recipe: 'pizza', qty: 1, unitPrice: 8 }, { recipe: 'cookie', qty: 1, unitPrice: 5 }], payment: { mode: 'change', offered: [20], paid: 20, change: 7, changeCoins: [] } }), { ordersDone: 24 });
    await page.locator('[data-product="pizza"]').click();
    await page.locator('[data-product="cookie"]').click();
    await page.locator('#drawer .coin[data-v="10"]').waitFor();
    assert.equal(await page.locator('.paid-zone .coin.v20').count(), 1, 'customer paid with a 20 note');
    await page.locator('#help').click();
    await page.locator('#col-sub').click();
    await page.locator('.shop-layer .col-sum').waitFor();
    await page.locator('.shop-layer .col-cell.pulse[data-slot="top"][data-col="tens"]').click();
        for (const d of '7') await page.locator(`.shop-layer .key[data-k="${d}"]`).click();
    await page.locator('.shop-layer .col-cell.pulse[data-slot="answer"][data-col="units"]').click();
    await page.locator('.shop-layer').waitFor({ state: 'detached', timeout: 15000 });
    await page.locator('#drawer .coin[data-v="5"]').click();
    await page.locator('#drawer .coin[data-v="2"]').click();
    await page.locator('#next').waitFor({ timeout: 15000 });
    assert.equal((await lastSale()).change, 7);
    assert.equal((await lastSale()).paid, 20);
    await shot('change-20');

    // เติมของตอนมีของเดิม (ระดับ 4 ขึ้นไป): มีคุกกี้ 2 ทำเพิ่ม 6 รวมเป็นกี่ชิ้น
    await setOrder(null, { restockQuiz: { recipe: 'cookie', before: 2, added: 6 }, stock: { cookie: 8, cupcake: 6, pizza: 4 } });
    await page.locator('.shop .count-row .pic.fresh').first().waitFor();
    assert.equal(await page.locator('.shop .count-row .pic').count(), 8);
    assert.equal(await page.locator('.shop .count-row .pic.fresh').count(), 6);
    await fits('restock-quiz');
    await shot('restock-quiz');
    await page.locator('.shop .choice[data-n="8"]').click();
    await page.locator('.shop #desk .stock-card, .shop #desk .coins, .shop .col-flat, .shop .count-row').first().waitFor();
    await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key)).restockQuiz === null, SHOP_KEY);
    await page.waitForFunction((key) => !!JSON.parse(localStorage.getItem(key)).activeOrder, SHOP_KEY);

    // --- ระดับ 7–8: เค้ก/น้ำปั่น, แบงก์ 50/100, ทอนนับต่อทีละสิบ, เครื่องคิดเงินบนเคาน์เตอร์
    const bigStock = { stock: { cookie: 6, cupcake: 6, pizza: 4, cake: 8, smoothie: 4 } };
    await setOrder(orderOf({ checkpoint: 'change', lines: [{ recipe: 'cake', qty: 1, unitPrice: 35 }, { recipe: 'cookie', qty: 1, unitPrice: 5 }], payment: { mode: 'change', offered: [50], paid: 50, change: 10, changeCoins: [] } }), { ...bigStock, ordersDone: 42 });
    assert.equal(await page.locator('.shop .stock-card[data-product="cake"]').count(), 1, 'cake is on the shelf at level 7');
    assert.equal(await page.locator('.shop .stock-card[data-product="smoothie"]').count(), 1);
    assert.equal(await page.locator('.shop-scene #register').count(), 1, 'cash register on the counter');
    await page.locator('[data-product="cake"]').click();
    await page.locator('[data-product="cookie"]').click();
    await page.locator('.paid-zone .coin.v50').waitFor();
    assert.equal(await page.locator('#drawer .coin[data-v="20"]').count(), 1, '20-baht notes in the drawer for big change');
    await page.locator('#help').click();
    assert.deepEqual(await page.locator('#line.tens i').allInnerTexts(), ['50'], '40 → 50 in one ten');
    await fits('change-50');
    await shot('change-50');
    await page.locator('#drawer .coin[data-v="10"]').click();
    await page.locator('#next').waitFor({ timeout: 15000 });
    assert.equal((await lastSale()).paid, 50);
    assert.equal((await lastSale()).change, 10);

    await setOrder(orderOf({ checkpoint: 'change', lines: [{ recipe: 'cake', qty: 1, unitPrice: 35 }, { recipe: 'smoothie', qty: 1, unitPrice: 25 }], payment: { mode: 'change', offered: [100], paid: 100, change: 40, changeCoins: [] } }), { ...bigStock, ordersDone: 54 });
    await page.locator('[data-product="cake"]').click();
    await page.locator('[data-product="smoothie"]').click();
    await page.locator('.paid-zone .coin.v100').waitFor();
    await page.locator('#help').click();
    assert.deepEqual(await page.locator('#line.tens i').allInnerTexts(), ['70', '80', '90', '100'], 'count on in tens from 60');
    assert.equal(await page.locator('#col-sub').count(), 0, 'no column subtraction from 100');
    assert.equal(await page.locator('#drawer .coin.hint').getAttribute('data-v'), '20');
    await shot('change-100');
    await page.locator('#drawer .coin[data-v="20"]').click();
    await page.locator('#drawer .coin[data-v="20"]').click();
    await page.locator('#next').waitFor({ timeout: 15000 });
    assert.equal((await lastSale()).paid, 100);
    assert.equal((await lastSale()).change, 40);

    // --- ตลาด: เอาเงินในกระปุกไปซื้อของแต่งร้าน
    const setMoney = async (piggy, ordersDone) => {
      const current = await readShop();
      current.piggy = piggy;
      current.ordersDone = ordersDone;
      current.totals.sales = piggy + current.totals.spent;
      current.totals.customerPaid = current.totals.sales + current.totals.changeGiven;
      current.activePurchase = null;
      await writeShop(current);
    };
    const openMarket = async () => {
      await backHome();
      await openShop();
      await page.locator('#bank').click();
      await page.locator('.market .goods-card').first().waitFor();
    };
    // ระดับ 1: จ่ายเกินได้ คนขายทอนให้เอง
    await setMoney(40, 1);
    await openMarket();
    assert.equal(await page.locator('.goods-card').count(), 10);
    assert.equal(await page.locator('.goods-card img').evaluateAll((imgs) => imgs.filter((img) => !img.complete || !img.naturalWidth).length), 0, 'stall pictures are ready when it appears');
    await fits('market');
    await shot('market');
    await page.locator('[data-item="plant"]').click();
    await page.locator('#purse .coin').first().waitFor();
    await fits('market-pay');
    await page.locator('#purse .coin[data-v="10"]').click();
    await page.locator('.seller-change #counter .coin[data-v="2"]').waitFor();   // คนขายวางเงินทอน 2 บาทคืนพร้อมนับต่อ
    await shot('market-seller-change');
    await page.locator('#buy-more').waitFor({ timeout: 15000 });
    await shot('market-bought');
    shop = await readShop();
    assert.deepEqual(shop.decor.owned, ['plant']);
    assert.equal(shop.piggy, 32);
    assert.equal(shop.transactions[0].type, 'buy');
    assert.equal(shop.transactions[0].change, 2, 'seller gave 2 baht back');
    // ระดับ 2: ต้องจ่ายพอดี — จ่ายเกินลูกค้า(คนขาย)ทำหน้าตกใจ แล้วขอความช่วยเหลือ
    await setMoney(32, 5);
    await openMarket();
    await page.locator('[data-item="lamp"]').click();
    await page.locator('#purse .coin[data-v="20"]').click();
    await page.waitForFunction(() => document.querySelector('#mark')?.classList.contains('mark-over'));
    assert.equal((await readShop()).decor.owned.includes('lamp'), false);
    await page.locator('#counter .coin').first().click();
    await page.locator('#help').click();
    assert.equal(await page.locator('#purse .coin.hint').getAttribute('data-v'), '10');
    await page.locator('#purse .coin.hint').click();
    await page.locator('#buy-more').waitFor({ timeout: 15000 });
    shop = await readShop();
    assert.equal(shop.piggy, 22);
    assert.equal(shop.transactions[0].usedHelp, true);
    // ระดับ 3: จ่ายเหรียญ 10 แล้วตอบว่าต้องได้เงินทอนเท่าไร (พรม 9 บาท → ทอน 1)
    await setMoney(22, 10);
    await openMarket();
    await page.locator('[data-item="rug"]').click();
    await page.locator('#purse .coin.hint[data-v="10"]').click();
    await page.locator('#choices .choice').first().waitFor();
    await fits('market-change');
    await shot('market-change');
    const wrong = page.locator('#choices .choice:not([data-n="1"])');
    await wrong.first().click();
    await page.waitForFunction(() => document.querySelector('#mark')?.classList.contains('show'));
    await page.locator('#choices .choice:not([data-n="1"])').first().click();
    await page.locator('#line').waitFor();
    await shot('market-change-help');
    await page.locator('#choices .choice[data-n="1"]').click();
    await page.locator('#counter .coin[data-v="1"]').waitFor();   // คนขายวางเหรียญ 1 บาทให้ พร้อมนับต่อ
    await page.locator('#buy-more').waitFor({ timeout: 15000 });
    shop = await readShop();
    assert.equal(shop.piggy, 13);
    assert.equal(shop.transactions[0].paid, 10);
    assert.equal(shop.transactions[0].change, 1);
    // เงินไม่พอ: บอกว่าต้องเก็บอีกเท่าไร ไม่เริ่มซื้อ
    await page.locator('#buy-more').click();
    await page.locator('[data-item="awning"]').click();
    await page.locator('.order-bubble .need img').first().waitFor();
    assert.equal(await page.locator('.order-bubble .qty').innerText(), '+5');
    assert.equal((await readShop()).activePurchase, null);
    // ของที่มีแล้ว: แตะเพื่อเก็บเข้ากล่อง / เอาออกมาแต่ง
    await page.locator('[data-item="plant"]').click();
    await page.waitForFunction((key) => !JSON.parse(localStorage.getItem(key)).decor.placed.plant, SHOP_KEY);
    await page.locator('[data-item="plant"]').click();
    await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key)).decor.placed.plant === 'plant', SHOP_KEY);
    shop = await readShop();
    assert.equal(shop.piggy, shop.totals.sales - shop.totals.spent);
    // กลับร้าน: ของแต่งที่ซื้ออยู่ในร้าน
    await page.locator('#to-shop').click();
    await page.locator('.shop:not(.market) #decor').waitFor();
    assert.equal(await page.locator('#decor .decor').count(), 3);
    await fits('shop-decorated');
    await shot('decorated');

    // ของแต่งชุดที่ 2: เปิดเมื่อซื้อชุดแรกครบ, ของที่เลือกลงตะกร้า
    await page.evaluate((key) => {
      const current = JSON.parse(localStorage.getItem(key));
      const set1 = ['balloons', 'flowers', 'bunting', 'plant', 'rug', 'lamp', 'tablecloth', 'chair', 'sign', 'awning'];
      current.decor = { owned: set1, placed: Object.fromEntries(set1.map((id) => [id, id])) };
      current.piggy = 40;
      current.ordersDone = 1;
      current.totals.sales = current.totals.spent + 40;
      current.totals.customerPaid = current.totals.sales + current.totals.changeGiven;
      current.activePurchase = null;
      localStorage.setItem(key, JSON.stringify(current));
    }, SHOP_KEY);
    await openMarket();
    assert.equal(await page.locator('.goods-tab').count(), 2, 'second set tab appears');
    assert.equal(await page.locator('.goods-tab.active').getAttribute('data-set'), '2');
    assert.equal(await page.locator('[data-item="teaset"]').count(), 1);
    await fits('market-set2');
    await shot('market-set2');
    await page.locator('[data-item="stars"]').click();
    await page.locator('.order-bubble .in-basket').waitFor();
    await page.locator('#purse .coin[data-v="10"]').click();
    await page.locator('#buy-more').waitFor({ timeout: 15000 });
    assert.ok((await readShop()).decor.owned.includes('stars'));
    await page.locator('#buy-more').click();
    await page.locator('.goods-tab[data-set="1"]').click();
    assert.equal(await page.locator('[data-item="balloons"]').count(), 1, 'tab switches back to the first set');
    await page.locator('#to-shop').click();
    await page.locator('.shop:not(.market) .decor-stars').waitFor();
    await shot('decorated-set2');

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
    for (const skill of ['count', 'collect', 'change', 'price', 'remaining', 'buy']) assert.equal(await page.locator(`.parent-skills tr[data-skill="${skill}"]`).count(), 1, `parent sees the ${skill} skill`);
    await page.screenshot({ path: path.join(output, 'shop-parent.png'), fullPage: true });
    await page.locator('#reset-shop').scrollIntoViewIfNeeded();   // หน้าผู้ปกครองยาวกว่าจอ (มีตารางทักษะ)
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
    assert.deepEqual((await readShop()).stock, { cookie: 6, cupcake: 0, pizza: 0, cake: 0, smoothie: 0 });

    // เซฟครัวเดิม (ตัวอย่าง v31) ไม่ถูกแตะตลอดการเล่นร้าน ยกเว้นส่วนที่ทำอาหารเพิ่ม (made + รูปในสมุด)
    const original = JSON.parse(kitchenBefore);
    const now = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KITCHEN_KEY);
    assert.equal(now.served, original.served);
    assert.equal(now.ordersDone, original.ordersDone);
    assert.deepEqual(now.order, original.order);
    assert.deepEqual(now.gallery.slice(1), original.gallery);
    assert.equal(Object.keys(now).some((key) => /shop|stock|piggy/.test(key)), false, 'no shop fields in the kitchen save');

    // --- เปิดจากห้องพักเล่นของโลกของลิลลี่: เข้าร้านทันที ปุ่มกลับพากลับไป (เฉพาะที่อยู่ของโลกของลิลลี่)
    const lillyUrl = base.includes('github.io') ? 'https://kanasit123-dotcom.github.io/game-lilly/' : 'http://127.0.0.1:5173/';
    const kitchenUrl = base.endsWith('/') ? base : `${base}/`;
    await page.goto(`${kitchenUrl}?mode=restaurant&return=${encodeURIComponent(lillyUrl)}`);
    await page.locator('.shop #desk').waitFor();
    assert.equal(new URL(page.url()).search, '', 'launch parameters are cleaned from the address');
    await page.locator('#back').click();
    await page.waitForURL((url) => url.href.startsWith(lillyUrl), { timeout: 15000 });
    // ลิงก์กลับไปเว็บอื่น: ไม่ยอม กลับหน้าครัวแทน
    await page.goto(`${kitchenUrl}?mode=restaurant&return=${encodeURIComponent('https://example.com/')}`);
    await page.evaluate(() => sessionStorage.clear());
    await page.goto(`${kitchenUrl}?mode=restaurant&return=${encodeURIComponent('https://example.com/')}`);
    await page.locator('.shop #desk').waitFor();
    await page.locator('#back').click();
    await page.locator('#shop').waitFor();
    assert.equal(await page.locator('#to-lilly').count(), 0);
    assert.ok(page.url().startsWith(kitchenUrl));
    // หน้าครัวตอนเปิดมาจากโลกของลิลลี่: ปุ่มกลับแทนป้ายชื่อ และยังพอดีจอ
    await page.goto(`${kitchenUrl}?return=${encodeURIComponent(lillyUrl)}`);
    await page.locator('#to-lilly').waitFor();
    await fits('home-from-lilly');
    await shot('home-from-lilly');
    await page.reload();   // อัปเดตเกม/รีเฟรช: ยังจำทางกลับ
    await page.locator('#to-lilly').waitFor();
    await page.goto(kitchenUrl);   // เข้าเกมครัวตรงๆ ในแท็บเดิม: ต้องลืมทางกลับ
    await page.locator('.brand h1').waitFor();
    assert.equal(await page.locator('#to-lilly').count(), 0, 'opening the kitchen directly shows the normal title');

    // --- เสียงจริง: หลังซื้อของ ปุ่มไปต่อยังไม่โผล่จนเสียงขอบคุณ/สรุปจบ (กติกา: ห้ามข้ามเสียงพูด)
    await page.evaluate(([kitchenKey, shopKey]) => {
      const kitchen = JSON.parse(localStorage.getItem(kitchenKey));
      kitchen.sound = true;
      localStorage.setItem(kitchenKey, JSON.stringify(kitchen));
      const shop = JSON.parse(localStorage.getItem(shopKey));
      shop.piggy = 30;
      shop.ordersDone = 5;
      shop.totals.sales = shop.totals.spent + 30;
      shop.totals.customerPaid = shop.totals.sales + shop.totals.changeGiven;
      shop.decor = { owned: [], placed: {} };
      shop.activePurchase = null;
      localStorage.setItem(shopKey, JSON.stringify(shop));
    }, [KITCHEN_KEY, SHOP_KEY]);
    await page.reload();
    await page.locator('#shop').click();
    await page.locator('#bank').click();
    await page.locator('.market [data-item="lamp"]').click();
    await page.locator('#purse .coin[data-v="10"]').click();
    await page.locator('.bought-item').waitFor({ timeout: 30000 });
    assert.equal(await page.locator('#buy-more, #to-shop').count(), 0, 'no way on while the thank-you is being spoken');
    const spokenFor = Date.now();
    await page.locator('#buy-more').waitFor({ timeout: 30000 });
    assert.ok(Date.now() - spokenFor > 600, `buttons waited for the speech (${Date.now() - spokenFor} ms)`);

    assert.deepEqual(missing.filter((url) => !url.endsWith('favicon.ico')), [], 'no missing files');
    assert.deepEqual(errors, []);
    console.log('PASS shop: first visit with seeded cookies, count/collect/change with gentle retries and help, level 4-5 price/remaining/20-baht change with the column engine, restock quiz, reload keeps the order, sells once, cooking restocks once, market at levels 1-3 with decorations and the second set, levels 7-8 with 50/100 notes, parent stats and reset, broken shop data, kitchen save untouched, launch from Lilly world and back, all screen sizes.');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
