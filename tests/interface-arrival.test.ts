import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  interfaceArrivals,
  startInterfaceArrival,
} from '../lib/interface-arrival.ts';

function fakeClock() {
  let now = 0;
  let nextId = 0;
  const pending = new Map<number, { at: number; run: () => void }>();
  return {
    schedule(run: () => void, delayMs: number) {
      const id = ++nextId;
      pending.set(id, { at: now + delayMs, run });
      return id;
    },
    cancel(id: unknown) {
      pending.delete(id as number);
    },
    advanceTo(target: number) {
      while (true) {
        const due = [...pending.entries()]
          .filter(([, timer]) => timer.at <= target)
          .sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
        if (!due) break;
        pending.delete(due[0]);
        now = due[1].at;
        due[1].run();
      }
      now = target;
    },
    get now() {
      return now;
    },
  };
}

void test('interface pieces arrive in distinct timed stages after the quiet hold', () => {
  const clock = fakeClock();
  const arrived: { marker: string; at: number }[] = [];
  startInterfaceArrival(
    (marker) => arrived.push({ marker, at: clock.now }),
    (run, delay) => clock.schedule(run, delay),
    (handle) => clock.cancel(handle),
  );

  clock.advanceTo(699);
  assert.equal(arrived.length, 0, 'the panorama gets a quiet hold');
  clock.advanceTo(700);
  assert.deepEqual(
    arrived.map(({ marker }) => marker),
    ['utility-rule', 'navigation-rule', 'footer-rule'],
  );
  clock.advanceTo(3315);
  assert.ok(arrived.find(({ marker }) => marker === 'column-1-heading'));
  assert.ok(
    arrived.find(({ marker }) => marker === 'column-2-heading')!.at >
      arrived.find(({ marker }) => marker === 'column-1-heading')!.at,
    'column headings do not arrive as one parent fade',
  );
  assert.equal(interfaceArrivals.at(-1)?.atMs, 4365);
});

void test('replay cancellation prevents old entrance timers from leaking into the next run', () => {
  const clock = fakeClock();
  const firstRun: string[] = [];
  const cancelFirst = startInterfaceArrival(
    (marker) => firstRun.push(marker),
    (run, delay) => clock.schedule(run, delay),
    (handle) => clock.cancel(handle),
  );
  clock.advanceTo(1200);
  cancelFirst();
  const firstRunCount = firstRun.length;

  const replay: string[] = [];
  startInterfaceArrival(
    (marker) => replay.push(marker),
    (run, delay) => clock.schedule(run, delay),
    (handle) => clock.cancel(handle),
  );
  clock.advanceTo(1899);
  assert.equal(firstRun.length, firstRunCount);
  assert.equal(replay.length, 0, 'replay starts its own quiet hold');
  clock.advanceTo(1900);
  assert.deepEqual(replay, ['utility-rule', 'navigation-rule', 'footer-rule']);
});
