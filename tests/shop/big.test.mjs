// ระดับ 7–8: เค้ก/น้ำปั่น, แบงก์ 50/100, ทอนแบบนับต่อทีละสิบ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshShop, makeOrder, commitSale, orderTotal, productsFor, noteFor, countOnStops, suggestChange, canRestock, greedyCoins, addStock } from '../../js/shop/core.js';
import { buildSteps } from '../../js/shop/column.js';

function seeded(seed = 1) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
const customers = ['seal', 'turtle', 'rabbit'];
const full = { cookie: 6, cupcake: 6, pizza: 4, cake: 8, smoothie: 4 };
const at = (level, stock = full) => ({ ...freshShop(), level, ordersDone: [0, 0, 5, 10, 16, 24, 32, 42, 54][level], stock: { ...stock } });

test('cake and smoothie are sold only from level 7', () => {
  assert.deepEqual(productsFor(6), ['cookie', 'cupcake', 'pizza']);
  assert.deepEqual(productsFor(7), ['cookie', 'cupcake', 'pizza', 'cake', 'smoothie']);
  const random = seeded(3);
  for (let level = 1; level <= 6; level++) {
    for (let i = 0; i < 200; i++) {
      const order = makeOrder(at(level), { customers, random });
      assert.ok(order.lines.every((line) => !['cake', 'smoothie'].includes(line.recipe)), `level ${level}`);
    }
  }
  assert.equal(canRestock(at(6), 'cake'), false);
  assert.equal(canRestock(at(7), 'cake'), true);
});

test('the paying note is the smallest one above the total', () => {
  assert.equal(noteFor(7), 10);
  assert.equal(noteFor(13), 20);
  assert.equal(noteFor(43), 50);
  assert.equal(noteFor(60), 100);
  assert.equal(noteFor(99), 100);
});

test('level 7 pays with a 50 note and level 8 with a 100 note', () => {
  const random = seeded(8);
  const notes = { 7: new Set(), 8: new Set() };
  for (const level of [7, 8]) {
    for (let i = 0; i < 400; i++) {
      const order = makeOrder(at(level), { customers, random });
      const total = orderTotal(order);
      assert.ok(total <= 99, `total ${total}`);
      if (order.checkpoint === 'change') {
        notes[level].add(order.payment.paid);
        assert.equal(order.payment.change, order.payment.paid - total);
        const settled = { ...order, status: 'paying', payment: { ...order.payment, changeCoins: greedyCoins(order.payment.change, [20, 10, 5, 2, 1]) } };
        assert.equal(commitSale(at(level), settled).committed, true);
      }
      if (order.checkpoint === 'price') assert.doesNotThrow(() => buildSteps(order.math.problem));
      if (['change', 'price'].includes(order.checkpoint)) assert.ok(order.lines.some((line) => ['cake', 'smoothie'].includes(line.recipe)));
    }
  }
  assert.ok(notes[7].has(50), [...notes[7]].join(','));
  assert.ok(notes[8].has(100), [...notes[8]].join(','));
});

test('counting on by tens reaches the paid note', () => {
  assert.deepEqual(countOnStops(63, 100), [70, 80, 90, 100]);
  assert.deepEqual(countOnStops(40, 50), [50]);
  assert.deepEqual(countOnStops(43, 50), [50]);
  assert.deepEqual(countOnStops(37, 50), [40, 50]);
  assert.equal(suggestChange(63, 100), 5, 'fill up to the next ten first');
  assert.equal(suggestChange(68, 100), 2);
  assert.equal(suggestChange(70, 100), 20, 'then tens');
  assert.equal(suggestChange(90, 100), 10);
  assert.equal(suggestChange(100, 100), null);
});

test('cake slices restock by eight and smoothies by four', () => {
  const shop = { ...at(7), stock: { ...full, cake: 0, smoothie: 0 } };
  assert.equal(addStock(shop, 'cake', 'r1').added, 8);
  assert.equal(addStock(shop, 'smoothie', 'r2').added, 4);
});

test('early levels never pay change with notes above 20', () => {
  const random = seeded(12);
  for (let level = 3; level <= 6; level++) {
    for (let i = 0; i < 200; i++) {
      const order = makeOrder(at(level), { customers, random });
      if (order.checkpoint === 'change') assert.ok(order.payment.paid <= 20, `level ${level} paid ${order.payment.paid}`);
    }
  }
});
