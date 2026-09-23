// node --test tests/shop — logic ของร้าน (ไม่ต้องเปิด Chrome)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCTS, STOCK_MAX, LEVELS, freshShop, normalizeShop, makeOrder, startOrder, commitSale, addStock,
  coinSum, greedyCoins, purseFor, exactSubset, countOn, judge, suggestCoin, levelFor, chooseCheckpoint, orderTotal
} from '../../js/shop/core.js';

// สุ่มแบบกำหนดได้ ทดสอบซ้ำได้ผลเดิม
function seeded(seed = 1) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
const customers = ['seal', 'turtle', 'rabbit'];

// จ่ายเงิน/ทอนให้ออร์เดอร์ถูกต้อง แล้ว commit
function settle(shop, order) {
  const ready = { ...order, status: 'paying', payment: { ...order.payment, changeCoins: order.payment.mode === 'change' ? greedyCoins(order.payment.change, [5, 2, 1]) : [] } };
  return commitSale(shop, ready);
}

test('fresh shop starts with six cookies so the first customer can come at once', () => {
  const shop = freshShop();
  assert.deepEqual(shop.stock, { cookie: 6, cupcake: 0, pizza: 0 });
  assert.equal(shop.level, 1);
  assert.equal(shop.piggy, 0);
});

test('batch sizes match what the child sees while cooking', () => {
  assert.equal(PRODUCTS.cookie.batch, 6);
  assert.equal(PRODUCTS.cupcake.batch, 6);
  assert.equal(PRODUCTS.pizza.batch, 4);
});

test('orders never ask for more than the stock and use only products in stock', () => {
  const random = seeded(7);
  for (let level = 1; level <= 6; level++) {
    for (let i = 0; i < 300; i++) {
      const shop = freshShop();
      shop.level = level;
      shop.stock = { cookie: 1 + (i % 6), cupcake: i % 3, pizza: 0 };
      const order = makeOrder(shop, { customers, random });
      for (const line of order.lines) {
        assert.ok(shop.stock[line.recipe] >= line.qty, 'within stock');
        assert.notEqual(line.recipe, 'pizza');
        assert.ok(line.qty >= 1 && line.qty <= 5);
      }
      assert.ok(customers.includes(order.customer));
    }
  }
});

test('no stock means no order', () => {
  const shop = freshShop();
  shop.stock = { cookie: 0, cupcake: 0, pizza: 0 };
  assert.equal(makeOrder(shop, { customers }), null);
});

test('every order has exactly one checkpoint from its level', () => {
  const random = seeded(3);
  for (const entry of LEVELS) {
    const shop = freshShop();
    shop.level = entry.level;
    shop.stock = { cookie: 12, cupcake: 12, pizza: 12 };
    for (let i = 0; i < 100; i++) {
      const order = makeOrder(shop, { customers, random });
      assert.ok(entry.checkpoints.includes(order.checkpoint), `level ${entry.level}: ${order.checkpoint}`);
    }
  }
});

test('the same checkpoint is not used more than twice in a row', () => {
  const shop = freshShop();
  shop.level = 3;
  shop.recent = ['change', 'change'];
  for (let i = 0; i < 50; i++) assert.equal(chooseCheckpoint(shop, seeded(i + 1)), 'collect');
});

test('payments are realistic: exact, or one 10-baht coin for change', () => {
  const random = seeded(11);
  const shop = freshShop();
  shop.level = 3;
  shop.stock = { cookie: 12, cupcake: 12, pizza: 12 };
  for (let i = 0; i < 200; i++) {
    const order = makeOrder(shop, { customers, random });
    const total = orderTotal(order);
    const { mode, paid, change, offered } = order.payment;
    assert.equal(paid - change, total);
    if (mode === 'change') {
      assert.deepEqual(offered, [10]);
      assert.equal(order.lines[0].qty, 1);
      assert.ok(total < 10 && change > 0);
    } else {
      assert.equal(change, 0);
      assert.equal(paid, total);
    }
    if (mode === 'collect') assert.ok(exactSubset(order.payment.purse, total), 'purse can pay exactly');
    if (mode === 'auto') assert.equal(coinSum(offered), total);
  }
});

test('purse always contains an exact payment', () => {
  for (const price of [5, 7, 8]) {
    for (let i = 0; i < 100; i++) {
      const purse = purseFor(price, seeded(i + 2));
      const subset = exactSubset(purse, price);
      assert.ok(subset);
      assert.equal(coinSum(subset.map((index) => purse[index])), price);
    }
  }
});

test('counting on gives the running total from the price', () => {
  assert.deepEqual(countOn(7, [2, 1]), [9, 10]);
  assert.deepEqual(countOn(5, [5]), [10]);
  assert.deepEqual(countOn(8, [1, 1]), [9, 10]);
  assert.equal(judge(10, 9), 'short');
  assert.equal(judge(10, 10), 'exact');
  assert.equal(judge(10, 11), 'over');
  assert.equal(suggestCoin(3), 2);
  assert.equal(suggestCoin(5), 5);
  assert.equal(suggestCoin(1), 1);
});

test('a correct sale commits once: stock, piggy bank and totals', () => {
  let shop = freshShop();
  const order = makeOrder(shop, { customers, random: seeded(5) });
  shop = startOrder(shop, order);
  const before = shop.stock[order.lines[0].recipe];
  const first = settle(shop, order);
  assert.equal(first.committed, true);
  assert.equal(first.shop.stock[order.lines[0].recipe], before - order.lines[0].qty);
  assert.equal(first.shop.piggy, order.total);
  assert.equal(first.shop.activeOrder, null);
  assert.equal(first.shop.ordersDone, 1);
  const again = settle(first.shop, order);
  assert.equal(again.committed, false);
  assert.equal(again.reason, 'duplicate');
  assert.equal(again.shop.piggy, order.total, 'tapping confirm twice does not sell twice');
});

test('too little or too much change does not commit', () => {
  const shop = freshShop();
  shop.level = 3;
  shop.stock = { cookie: 6, cupcake: 6, pizza: 4 };
  let order;
  const random = seeded(21);
  do { order = makeOrder(shop, { customers, random }); } while (order.checkpoint !== 'change');
  const short = commitSale(shop, { ...order, payment: { ...order.payment, changeCoins: [1] } });
  const over = commitSale(shop, { ...order, payment: { ...order.payment, changeCoins: [5, 5] } });
  assert.equal(short.committed, false);
  assert.equal(over.committed, false);
  assert.equal(settle(shop, order).committed, true);
});

test('a sale without enough stock does not commit', () => {
  const shop = freshShop();
  const order = makeOrder(shop, { customers, random: seeded(9) });
  const empty = { ...shop, stock: { cookie: 0, cupcake: 0, pizza: 0 } };
  assert.equal(settle(empty, order).reason, 'stock');
});

test('money invariants hold over many sales', () => {
  let shop = freshShop();
  shop.stock = { cookie: 12, cupcake: 12, pizza: 12 };
  const random = seeded(99);
  for (let i = 0; i < 40; i++) {
    if (!Object.values(shop.stock).some((n) => n > 0)) shop = addStock(addStock(shop, 'cookie', `r${i}a`).shop, 'pizza', `r${i}b`).shop;
    const order = makeOrder(shop, { customers, random });
    shop = startOrder(shop, order);
    shop = settle(shop, order).shop;
    assert.equal(shop.piggy, shop.totals.sales - shop.totals.spent);
    assert.equal(shop.totals.customerPaid - shop.totals.changeGiven, shop.totals.sales);
  }
  assert.equal(shop.ordersDone, 40);
  assert.equal(shop.level, levelFor(40));
});

test('levels unlock by completed orders and never go down', () => {
  assert.equal(levelFor(0), 1);
  assert.equal(levelFor(4), 1);
  assert.equal(levelFor(5), 2);
  assert.equal(levelFor(10), 3);
  assert.equal(levelFor(16), 4);
  assert.equal(levelFor(24), 5);
  assert.equal(levelFor(32), 6);
  assert.equal(levelFor(500), 6);
});

test('restocking adds one batch once per restock id and stops at the shelf limit', () => {
  let shop = freshShop();
  const first = addStock(shop, 'cupcake', 'restock-1');
  assert.equal(first.added, 6);
  assert.equal(first.shop.stock.cupcake, 6);
  const again = addStock(first.shop, 'cupcake', 'restock-1');
  assert.equal(again.added, 0);
  assert.equal(again.shop.stock.cupcake, 6);
  shop = addStock(first.shop, 'cupcake', 'restock-2').shop;
  assert.equal(shop.stock.cupcake, STOCK_MAX);
  const full = addStock(shop, 'cupcake', 'restock-3');
  assert.equal(full.added, 0);
  assert.equal(full.reason, 'full');
  assert.equal(addStock(shop, 'noodles', 'restock-4').added, 0, 'only shop products');
});

test('normalizing broken or odd data gives a usable shop', () => {
  assert.deepEqual(normalizeShop(null).stock, freshShop().stock);
  assert.deepEqual(normalizeShop('nope').stock, freshShop().stock);
  const odd = normalizeShop({ stock: { cookie: -3, cupcake: 99, pizza: 'x', noodles: 5 }, piggy: -1, ordersDone: 12, activeOrder: { id: 1 } });
  assert.deepEqual(odd.stock, { cookie: 0, cupcake: STOCK_MAX, pizza: 0 });
  assert.equal(odd.piggy, 0);
  assert.equal(odd.level, 3);
  assert.equal(odd.activeOrder, null);
});

test('a saved order survives normalizing (reload keeps the same customer)', () => {
  let shop = freshShop();
  const order = makeOrder(shop, { customers, random: seeded(4) });
  shop = startOrder(shop, { ...order, status: 'picking', picked: [order.lines[0].recipe] });
  const loaded = normalizeShop(JSON.parse(JSON.stringify(shop)));
  assert.equal(loaded.activeOrder.id, order.id);
  assert.equal(loaded.activeOrder.customer, order.customer);
  assert.equal(loaded.activeOrder.status, 'picking');
  assert.deepEqual(loaded.activeOrder.picked, [order.lines[0].recipe]);
});
