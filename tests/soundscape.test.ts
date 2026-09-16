import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { Soundscape } from '../lib/soundscape.ts';

function fixture() {
  const audio: FakeAudio[] = [];
  const sources: FakeSource[] = [];
  const gains: FakeGain[] = [];
  let allowed = true;
  let introDeferred = false;
  let rejectIntroPlay: ((error: Error) => void) | null = null;
  let assemblyDeferred = false;
  let resolveAssemblyPlay: (() => void) | null = null;
  let now = 0;
  let frameId = 0;
  const frames = new Map<number, FrameRequestCallback>();
  class FakeAudio {
    currentTime = 0;
    muted = false;
    volume = 1;
    paused = true;
    playCount = 0;
    loop = false;
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    readonly src: string;
    constructor(src: string) {
      this.src = src;
      audio.push(this);
    }
    async play() {
      this.playCount++;
      if (this.src.endsWith('/original-loading.wav') && introDeferred) {
        introDeferred = false;
        return new Promise<void>((_resolve, reject) => {
          rejectIntroPlay = reject;
        });
      }
      if (!allowed)
        throw new DOMException('Gesture required', 'NotAllowedError');
      if (
        this.src.endsWith('/root-id-143-source-count.wav') &&
        assemblyDeferred
      )
        return new Promise<void>((resolve) => {
          resolveAssemblyPlay = () => {
            this.paused = false;
            resolve();
          };
        });
      this.paused = false;
    }
    pause() {
      this.paused = true;
    }
    removeAttribute() {}
    remove() {}
    load() {}
  }
  class FakeGain {
    gain = {
      value: 1,
      events: [] as { kind: string; value: number; time: number }[],
      setValueAtTime(value: number, time: number) {
        this.value = value;
        this.events.push({ kind: 'set', value, time });
      },
      linearRampToValueAtTime(value: number, time: number) {
        this.events.push({ kind: 'ramp', value, time });
      },
      cancelScheduledValues() {
        this.events = [];
      },
    };
    constructor() {
      gains.push(this);
    }
    connect() {}
    disconnect() {}
  }
  class FakeSource {
    loop = false;
    buffer: unknown;
    starts = 0;
    stops = 0;
    constructor() {
      sources.push(this);
    }
    connect() {}
    disconnect() {}
    start() {
      this.starts++;
    }
    stop() {
      this.stops++;
    }
  }
  const contexts: FakeContext[] = [];
  class FakeContext {
    state = 'suspended';
    currentTime = 10;
    destination = {};
    onstatechange: (() => void) | null = null;
    constructor() {
      contexts.push(this);
    }
    async resume() {
      if (allowed) {
        this.state = 'running';
        this.onstatechange?.();
      } else return new Promise<void>(() => {});
    }
    async close() {
      this.state = 'closed';
    }
    async decodeAudioData() {
      return { duration: 9.142857 };
    }
    createGain() {
      return new FakeGain();
    }
    createBufferSource() {
      return new FakeSource();
    }
  }
  const originals = Object.fromEntries(
    [
      'Audio',
      'AudioContext',
      'document',
      'fetch',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
    ].map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
  );
  const attached: unknown[] = [];
  const replacements = {
    Audio: FakeAudio,
    AudioContext: FakeContext,
    document: {
      body: { appendChild: (element: unknown) => attached.push(element) },
    },
    fetch: async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    }),
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      frames.set(++frameId, callback);
      return frameId;
    },
    cancelAnimationFrame: (id: number) => frames.delete(id),
    performance: { now: () => now },
  };
  for (const [key, value] of Object.entries(replacements))
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  return {
    audio,
    sources,
    gains,
    attached,
    allow(value: boolean) {
      allowed = value;
    },
    deferIntro() {
      introDeferred = true;
    },
    abortIntro() {
      rejectIntroPlay?.(new DOMException('Playback interrupted', 'AbortError'));
      rejectIntroPlay = null;
    },
    deferAssembly() {
      assemblyDeferred = true;
    },
    resolveAssembly() {
      resolveAssemblyPlay?.();
      resolveAssemblyPlay = null;
    },
    context: () => contexts[0],
    advance(time: number) {
      now = time;
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback(now));
    },
    restore() {
      for (const [key, descriptor] of Object.entries(originals)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
    },
  };
}

void test('one continuous music source survives navigation and mute; replay alone restarts it', async () => {
  const f = fixture();
  const sound = new Soundscape();
  try {
    await sound.autoplayIntro();
    assert.equal(f.audio[0].muted, false, 'ambience is enabled by default');
    assert.equal(f.audio[0].paused, false);
    assert.equal(f.attached.length, 4);
    await sound.startMusic();
    const source = f.sources[0];
    assert.equal(source.loop, true);
    assert.equal(source.starts, 1);
    const gain = f.gains[0].gain.value;
    for (let n = 0; n < 30; n++) {
      await sound.transition('close');
      await sound.transition('open');
      assert.equal(source.stops, 0);
      assert.equal(f.gains[0].gain.value, gain);
    }
    await sound.enable(false);
    const cues = f.audio.map((a) => a.playCount);
    await sound.transition('open');
    assert.deepEqual(
      f.audio.map((a) => a.playCount),
      cues,
    );
    assert.equal(f.gains[0].gain.value, 0);
    await sound.enable(true);
    await sound.startMusic();
    assert.equal(f.sources.length, 1);
    assert.equal(source.stops, 0);
    sound.reset();
    assert.equal(source.stops, 1);
    await sound.startIntro();
    await sound.startMusic();
    assert.equal(f.sources.length, 2);
  } finally {
    sound.dispose();
    f.restore();
  }
});

void test('music fades in during the first opening as loading ambience fades out', async () => {
  const f = fixture();
  const sound = new Soundscape();
  try {
    await sound.startIntro();
    await sound.startMusic(1270, 510);
    assert.equal(f.audio[0].volume, 0.35);
    const envelope = f.gains[1].gain;
    assert.deepEqual(envelope.events, [
      { kind: 'set', value: 0, time: 10 },
      { kind: 'set', value: 0, time: 10.51 },
      { kind: 'ramp', value: 1, time: 11.78 },
    ]);
    f.advance(1145);
    assert.ok(Math.abs(f.audio[0].volume - 0.175) < 0.00001);
    f.advance(1780);
    assert.equal(f.audio[0].paused, true);
    assert.equal(f.audio[0].volume, 0);
    const schedule = [...envelope.events];
    await sound.transition('close');
    await sound.transition('open');
    assert.deepEqual(
      envelope.events,
      schedule,
      'navigation never fades the music',
    );
  } finally {
    sound.dispose();
    f.restore();
  }
});

void test('autoplay denial keeps sound enabled for the first gesture, while manual mute stays muted', async () => {
  const f = fixture();
  f.allow(false);
  let blocked = false;
  const sound = new Soundscape(undefined, (value) => {
    blocked = value;
  });
  try {
    await sound.autoplayIntro();
    assert.equal(blocked, true);
    assert.equal(f.audio[0].muted, false);
    f.allow(true);
    await sound.unlock();
    assert.equal(blocked, false);
    assert.equal(f.audio[0].paused, false);
    await sound.startMusic();
    await sound.enable(false);
    await sound.unlock();
    assert.equal(f.gains[0].gain.value, 0);
    assert.ok(f.audio.every((a) => a.muted));
  } finally {
    sound.dispose();
    f.restore();
  }
});

void test('replay and disposal invalidate music starts that are still decoding', async () => {
  const f = fixture();
  const sound = new Soundscape();
  try {
    const pending = sound.startMusic(1270, 510);
    sound.reset();
    await pending;
    assert.equal(f.sources.length, 0);
    const second = sound.startMusic();
    sound.dispose();
    await second;
    assert.equal(f.sources.length, 0);
    assert.equal(f.context().state, 'closed');
  } finally {
    f.restore();
  }
});

void test('interface cues overlap music, throttle hover bursts, and respect mute', async () => {
  const f = fixture();
  const sound = new Soundscape();
  try {
    await sound.startIntro();
    await sound.startMusic();
    const music = f.sources[0];
    sound.interaction('navigation');
    assert.equal(f.sources.length, 2);
    assert.equal(f.sources[1].loop, false);
    sound.interaction('navigation');
    assert.equal(f.sources.length, 2, 'a hover burst produces one cue');
    sound.interaction('navigationOpen');
    sound.interaction('windowTitle');
    assert.equal(
      f.sources.length,
      4,
      'structural sounds are not swallowed by hover throttling',
    );
    f.context().currentTime += 0.2;
    sound.interaction('item');
    sound.interaction('panel');
    assert.equal(
      f.sources.length,
      6,
      'panel opening is not swallowed by hover throttling',
    );
    assert.equal(music.stops, 0);
    await sound.enable(false);
    assert.deepEqual(
      f.sources.map((source) => source.stops),
      [0, 1, 1, 1, 1, 1],
    );
    sound.interaction('panel');
    assert.equal(f.sources.length, 6);
    await sound.enable(true);
    sound.interaction('panel');
    assert.equal(f.sources.length, 7);
    assert.equal(music.stops, 0);
  } finally {
    sound.dispose();
    f.restore();
  }
});

void test('assembly cue plays once, fades only the loader, and cannot leak across replay or music start', async () => {
  const f = fixture();
  const sound = new Soundscape();
  try {
    await sound.startIntro();
    f.deferAssembly();
    const pendingAssembly = sound.startAssembly();
    assert.equal(f.audio[1].loop, false);
    assert.equal(f.audio[1].src, '/audio/root-id-143-source-count.wav');
    f.advance(150);
    assert.ok(Math.abs(f.audio[0].volume - 0.175) < 0.00001);
    sound.reset();
    await sound.startIntro();
    f.resolveAssembly();
    await pendingAssembly;
    f.advance(300);
    assert.equal(
      f.audio[0].paused,
      false,
      'a late prior run cannot fade replay ambience',
    );
    assert.equal(f.audio[0].volume, 0.35);
    assert.equal(
      f.audio[1].paused,
      true,
      'the cancelled one-shot stays stopped',
    );

    f.deferAssembly();
    const secondPending = sound.startAssembly();
    await sound.startMusic();
    f.resolveAssembly();
    await secondPending;
    assert.equal(
      f.audio[1].paused,
      true,
      'a late assembly cannot outlive soundtrack start',
    );
    assert.equal(f.sources[0].loop, true);
  } finally {
    sound.dispose();
    f.restore();
  }
});

void test('replay ignores cancellation of the previous pending loading sound', async () => {
  const f = fixture();
  const sound = new Soundscape();
  try {
    f.deferIntro();
    const oldIntro = sound.startIntro();
    sound.reset();
    await sound.startIntro();
    f.abortIntro();
    await assert.doesNotReject(oldIntro);
    assert.equal(f.audio[0].paused, false);
    assert.equal(f.audio[0].volume, 0.35);
  } finally {
    sound.dispose();
    f.restore();
  }
});
