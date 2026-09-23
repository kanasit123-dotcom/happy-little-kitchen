// ตั้งบวก/ตั้งลบของร้าน (js/shop/column.js) — โจทย์บังคับในแผน + ตรวจทุกโจทย์ 0–99 ว่าขั้นตอนให้คำตอบถูก
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSteps, layout, normalizeProblem, MINUS } from '../../js/shop/column.js';

// เล่นขั้นตอนตามจริง แล้วอ่านคำตอบจากช่องที่เขียน
function play(problem) {
  const answer = { tens: null, units: null };
  let carry = null;
  for (const step of buildSteps(problem)) {
    if (step.type === 'write' && step.slot === 'answer') answer[step.col] = step.value;
    if (step.type === 'write' && step.slot === 'carry') carry = step.value;
    if (step.type === 'borrow') carry = step.to;
  }
  return { answer, carry, text: `${answer.tens ?? ''}${answer.units ?? ''}` };
}

test('8 + 7 = 15 carries one and never shows 08 or asks 1 + 0', () => {
  const steps = buildSteps({ a: 8, op: '+', b: 7 });
  const L = layout({ a: 8, op: '+', b: 7 });
  assert.equal(L.showTopTens, false, 'top is 8 not 08');
  assert.equal(L.showAnswerTens, true);
  assert.deepEqual(steps.map((s) => s.type), ['ask', 'write', 'write', 'write']);
  assert.equal(steps[0].answer, 15);
  assert.deepEqual(steps[2], { type: 'write', col: 'tens', slot: 'carry', value: 1, why: 'carry' });
  assert.equal(steps[3].why, 'carryDown', 'carried one comes straight down');
  assert.equal(steps.some((s) => s.type === 'ask' && s.col === 'tens'), false);
  assert.equal(play({ a: 8, op: '+', b: 7 }).text, '15');
});

test('12 − 5 = 7 borrows and shows no leading zero', () => {
  const steps = buildSteps({ a: 12, op: '-', b: 5 });
  assert.equal(steps[0].type, 'borrow');
  assert.equal(steps[0].units, 12);
  assert.equal(steps[0].to, 0);
  assert.equal(steps[1].answer, 7);
  assert.equal(steps.at(-1).type, 'zero');
  assert.equal(layout({ a: 12, op: '-', b: 5 }).showAnswerTens, false);
  assert.equal(play({ a: 12, op: '-', b: 5 }).text, '7');
});

test('20 − 13 = 7 borrows from the tens and shows no leading zero', () => {
  const steps = buildSteps({ a: 20, op: '−', b: 13 });
  assert.deepEqual(steps.map((s) => s.type), ['borrow', 'ask', 'write', 'zero']);
  assert.equal(steps[0].units, 10);
  assert.equal(steps[1].answer, 7);
  assert.deepEqual(steps[3].terms, [1, 1]);
  assert.equal(play({ a: 20, op: '−', b: 13 }).text, '7');
});

test('6 − 2 = 4 is a single-digit subtraction', () => {
  const steps = buildSteps({ a: 6, op: '-', b: 2 });
  assert.deepEqual(steps.map((s) => s.type), ['ask', 'write']);
  assert.equal(play({ a: 6, op: '-', b: 2 }).text, '4');
});

test('minus signs are normalized', () => {
  assert.equal(normalizeProblem({ a: 9, op: '-', b: 3 }).op, MINUS);
  assert.equal(normalizeProblem({ a: 9, op: MINUS, b: 3 }).op, MINUS);
  assert.throws(() => normalizeProblem({ a: 3, op: '-', b: 9 }), /unsupported/);
  assert.throws(() => normalizeProblem({ a: 60, op: '+', b: 50 }), /unsupported/);
});

test('every problem up to 99 gives the right answer with no leading zero', () => {
  for (let a = 0; a <= 99; a++) {
    for (let b = 0; b <= 99; b++) {
      if (a + b <= 99) {
        const { text } = play({ a, op: '+', b });
        assert.equal(text, String(a + b), `${a} + ${b}`);
      }
      if (a - b >= 0) {
        const { text } = play({ a, op: '-', b });
        assert.equal(text, String(a - b), `${a} - ${b}`);
      }
    }
  }
});

test('asks never add a zero term and borrowing only happens when the ones are too small', () => {
  for (let a = 0; a <= 99; a++) {
    for (let b = 0; b <= 99; b++) {
      if (a + b <= 99) for (const step of buildSteps({ a, op: '+', b })) if (step.type === 'ask' && step.col === 'tens') assert.ok(step.terms.every((n) => n > 0), `${a} + ${b}`);
      if (a - b >= 0) {
        const borrow = buildSteps({ a, op: '-', b }).some((step) => step.type === 'borrow');
        assert.equal(borrow, a % 10 < b % 10, `${a} - ${b}`);
      }
    }
  }
});
