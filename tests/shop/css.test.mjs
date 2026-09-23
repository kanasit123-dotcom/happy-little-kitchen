// CSS ของร้านต้องไม่รั่วไปหน้าครัว — v33 เคยใช้ .tray / .running / .pop / .nudge ไม่ได้ scope
// ทำให้ถาดวัตถุดิบเพี้ยนและเตาอบเลื่อนตอนกดค้าง ทุก selector ใน css/shop.css ต้องขึ้นต้นด้วยชื่อที่เป็นของร้านเท่านั้น
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../../css/shop.css', import.meta.url), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
// ชื่อที่อยู่นอกหน้าร้านโดยตั้งใจ และไม่มีในเกมครัว
const ALLOWED = [/^\.shop\b/, /^\.app-shell\.shop\b/, /^\.shop-layer\b/, /^\.home-extras\b/, /^\.shop-card\b/, /^\.flying-coin\b/, /^\.stock-zone\b/, /^\.stock-batch\b/];

test('every shop.css selector is scoped to the shop', () => {
  const selectors = [...css.matchAll(/([^{};]+)\{/g)]
    .map((match) => match[1].trim())
    .filter((selector) => selector && !selector.startsWith('@') && !/^(from|to|\d+%)/.test(selector))
    .flatMap((selector) => selector.split(',').map((part) => part.trim()));
  assert.ok(selectors.length > 50, 'found the rules');
  const leaking = selectors.filter((selector) => !ALLOWED.some((pattern) => pattern.test(selector)));
  assert.deepEqual(leaking, []);
});

test('shop-only class names used outside .shop do not exist in the kitchen stylesheet', () => {
  const app = readFileSync(new URL('../../css/app.css', import.meta.url), 'utf8');
  for (const name of ['home-extras', 'shop-card', 'flying-coin', 'stock-zone', 'stock-batch', 'shop-layer']) {
    assert.equal(new RegExp(`\\.${name}\\b`).test(app), false, name);
  }
});
