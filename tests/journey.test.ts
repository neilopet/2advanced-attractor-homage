import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { worlds, journeyReducer, type Journey } from '../lib/journey.ts';

void test('all 30 directed routes conceal the scene change until the shutter is closed', () => {
  for (const from of worlds)
    for (const to of worlds) {
      if (from.id === to.id) continue;
      const idle: Journey = { current: from.id, target: null, phase: 'idle' };
      const closing = journeyReducer(idle, { type: 'select', target: to.id });
      assert.equal(closing.current, from.id);
      assert.equal(closing.phase, 'closing');
      const covered = journeyReducer(closing, { type: 'closed' });
      assert.equal(covered.current, to.id);
      assert.equal(covered.phase, 'covered');
      const opening = journeyReducer(covered, { type: 'reveal' });
      assert.equal(opening.phase, 'opening');
      const settled = journeyReducer(opening, { type: 'opened' });
      assert.deepEqual(settled, {
        current: to.id,
        target: null,
        phase: 'idle',
      });
    }
});
void test('rapid navigation cannot change an active destination', () => {
  const closing = journeyReducer(
    { current: 'blue', target: null, phase: 'idle' },
    { type: 'select', target: 'pink' },
  );
  for (const state of [
    closing,
    journeyReducer(closing, { type: 'closed' }),
    journeyReducer(journeyReducer(closing, { type: 'closed' }), {
      type: 'reveal',
    }),
  ]) {
    assert.equal(
      journeyReducer(state, { type: 'select', target: 'red' }),
      state,
    );
  }
});
void test('same destination and stale callbacks do nothing', () => {
  const idle: Journey = { current: 'green', target: null, phase: 'idle' };
  for (const type of ['closed', 'reveal', 'opened'] as const)
    assert.equal(journeyReducer(idle, { type }), idle);
  assert.equal(journeyReducer(idle, { type: 'select', target: 'green' }), idle);
});
void test('reduced motion navigates directly and remains usable', () => {
  let state: Journey = { current: 'blue', target: null, phase: 'idle' };
  for (const w of worlds) {
    state = journeyReducer(state, {
      type: 'select',
      target: w.id,
      immediate: true,
    });
    assert.equal(state.current, w.id);
    assert.equal(state.phase, 'idle');
  }
});
void test('recovery keeps the currently rendered scene and unlocks navigation', () => {
  assert.deepEqual(
    journeyReducer(
      { current: 'red', target: 'pink', phase: 'closing' },
      { type: 'recover' },
    ),
    { current: 'red', target: null, phase: 'idle' },
  );
});
