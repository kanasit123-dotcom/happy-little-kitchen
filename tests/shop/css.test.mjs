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

// ทางกลับกัน: CSS ของครัวก็ต้องไม่ไปโดนของในร้าน — v35 เจอ .carry ของครัว (grid-area) ลากช่องทดของตั้งเลขไปผิดที่
// ชื่อ class ที่ร้านใช้ (ทั้งใน shop.css และที่ ui.js/column.js ใส่ลง HTML) ห้ามซ้ำกับของครัว ยกเว้นชื่อที่ตั้งใจใช้ร่วมกัน
const SHARED = new Set(['action-btn', 'primary', 'app-shell', 'play-screen', 'prompt', 'popup', 'popup-layer', 'popup-friend', 'free-card', 'title-icon', 'dish', 'topbar-title']);
const classesIn = (text) => {
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
  return new Set([...clean.matchAll(/([^{};]+)\{/g)].flatMap((match) => [...match[1].matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1])));
};
const kitchen = classesIn(readFileSync(new URL('../../css/app.css', import.meta.url), 'utf8'));

test('shop class names never collide with kitchen class names', () => {
  const used = new Set(classesIn(css));
  for (const file of ['../../js/shop/ui.js', '../../js/shop/column.js']) {
    const src = readFileSync(new URL(file, import.meta.url), 'utf8');
    for (const [, attr] of src.matchAll(/class="([^"]*)"/g)) {
      for (const token of attr.replace(/\$\{[^}]*\}/g, ' ').split(/\s+/)) if (/^[a-z][\w-]*$/.test(token)) used.add(token);
      // ชื่อที่เลือกด้วยเงื่อนไขใน class="…${x ? 'a' : 'b'}…"
      for (const [, expr] of attr.matchAll(/\$\{([^}]*)\}/g)) for (const [, name] of expr.matchAll(/'([a-z][\w-]*)'/g)) used.add(name);
    }
    for (const [, name] of src.matchAll(/classList\.(?:add|remove|toggle|contains)\('([\w-]+)'/g)) used.add(name);
  }
  const clashes = [...used].filter((name) => kitchen.has(name) && !SHARED.has(name)).sort();
  assert.deepEqual(clashes, []);
});
