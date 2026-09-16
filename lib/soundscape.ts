export type InterfaceCue =
  | 'navigation'
  | 'item'
  | 'panel'
  | 'mini'
  | 'navigationOpen'
  | 'windowTitle';

// Music loops in one decoded audio buffer: no media-element seek between loops.
// Loading ambience and shutter cues remain independent, persistent players.
export class Soundscape {
  private intro = new Audio('/audio/original-loading.wav');
  private assemblyCue = new Audio('/audio/root-id-143-source-count.wav');
  private closeCue = new Audio('/audio/original-shutter-close.wav');
  private openCue = new Audio('/audio/original-shutter-open.wav');
  private activeCue: HTMLAudioElement | null = null;
  private context = new AudioContext();
  private musicVolume = this.context.createGain();
  private musicEnvelope = this.context.createGain();
  private musicBuffer: Promise<AudioBuffer | null>;
  private musicSource: AudioBufferSourceNode | null = null;
  private muted = false;
  private blocked = false;
  private disposed = false;
  private volume = 0.35;
  private musicStarted = false;
  private introStarted = false;
  private assemblyRequested = false;
  private assemblyStarted = false;
  private assemblyPending = false;
  private assemblyStarting = false;
  private introLevel = 1;
  private fadeFrame = 0;
  private generation = 0;
  private lastHover = 0;
  private interfaceBuffers = new Map<InterfaceCue, AudioBuffer>();
  private interfaceSources = new Set<AudioBufferSourceNode>();

  private onError?: () => void;
  private onBlocked?: (blocked: boolean) => void;

  constructor(onError?: () => void, onBlocked?: (blocked: boolean) => void) {
    this.onError = onError;
    this.onBlocked = onBlocked;
    this.intro.loop = true;
    this.assemblyCue.loop = false;
    const cues: [InterfaceCue, string][] = [
      ['navigation', '/audio/nav-hover.wav'],
      ['item', '/audio/item-hover.wav'],
      ['panel', '/audio/panel-open.wav'],
      ['mini', '/audio/mini-hover.wav'],
      ['navigationOpen', '/audio/navigation-open.wav'],
      ['windowTitle', '/audio/window-title.wav'],
    ];
    for (const [name, url] of cues) {
      void fetch(url)
        .then((response) => {
          if (!response.ok) throw new Error('Interface sound unavailable');
          return response.arrayBuffer();
        })
        .then((data) => this.context.decodeAudioData(data))
        .then((buffer) => {
          if (!this.disposed) this.interfaceBuffers.set(name, buffer);
        })
        .catch(() => {});
    }
    this.musicEnvelope.connect(this.musicVolume);
    this.musicVolume.connect(this.context.destination);
    this.musicBuffer = fetch('/audio/original-music.wav')
      .then((response) => {
        if (!response.ok) throw new Error('Music could not load');
        return response.arrayBuffer();
      })
      .then((data) => this.context.decodeAudioData(data))
      .catch(() => {
        if (!this.disposed) this.onError?.();
        return null;
      });
    this.context.onstatechange = () => {
      if (this.context.state === 'running') this.setBlocked(false);
    };
    for (const cue of [this.closeCue, this.openCue]) {
      const release = () => {
        if (this.activeCue === cue) this.activeCue = null;
      };
      cue.onended = release;
      cue.onerror = () => {
        release();
        this.onError?.();
      };
    }
    this.intro.onerror = () => this.onError?.();
    for (const audio of this.players) {
      audio.preload = 'auto';
      // Avoid extensions moving a detached element during its first play.
      audio.hidden = true;
      document.body.appendChild(audio);
    }
    this.applyVolume();
  }
  private get players() {
    return [this.intro, this.assemblyCue, this.closeCue, this.openCue];
  }
  private setBlocked(blocked: boolean) {
    if (this.disposed) return;
    this.blocked = blocked;
    this.onBlocked?.(blocked);
  }
  private applyVolume() {
    this.musicVolume.gain.setValueAtTime(
      this.muted ? 0 : this.volume * 0.7,
      this.context.currentTime,
    );
    this.intro.volume = this.volume * this.introLevel;
    this.assemblyCue.volume = this.volume;
    this.closeCue.volume = this.openCue.volume = this.volume * 0.8;
    for (const audio of this.players) audio.muted = this.muted;
  }
  private resumeContext() {
    // A blocked resume may stay pending until a gesture. Never block the UI.
    void this.context.resume().catch(() => {
      if (!this.disposed) this.onError?.();
    });
  }
  private async play(audio: HTMLAudioElement) {
    const generation = this.generation;
    try {
      await audio.play();
      if (this.disposed || generation !== this.generation) return;
      if (this.introStarted) this.setBlocked(false);
    } catch (error) {
      // Replay/disposal deliberately interrupt pending media playback.
      if (this.disposed || generation !== this.generation) return;
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        this.setBlocked(true);
      } else throw error;
    }
  }
  async enable(enabled: boolean) {
    this.muted = !enabled;
    this.applyVolume();
    if (!enabled) {
      for (const source of this.interfaceSources) source.stop();
      this.interfaceSources.clear();
      return;
    }
    this.resumeContext();
    if (this.introStarted && this.intro.paused) await this.play(this.intro);
    if (this.assemblyPending) void this.startAssembly();
    if (this.musicStarted) {
      this.setBlocked(this.context.state !== 'running');
    }
  }
  async unlock() {
    // Browser restrictions must not silently turn an enabled preference off.
    if (this.blocked && !this.muted) await this.enable(true);
  }
  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    this.applyVolume();
  }
  async autoplayIntro() {
    return this.startIntro();
  }
  async startIntro() {
    this.introStarted = true;
    this.introLevel = 1;
    this.intro.currentTime = 0;
    this.applyVolume();
    if (!this.muted) {
      this.resumeContext();
      await this.play(this.intro);
    }
  }
  async startAssembly() {
    if (this.musicStarted) return;
    this.assemblyRequested = true;
    if (this.disposed) return;
    if (this.muted) {
      this.fadeIntroOut(300);
      return;
    }
    if (this.assemblyStarted || this.assemblyStarting) return;
    this.assemblyStarting = true;
    this.assemblyPending = false;
    const generation = this.generation;
    this.fadeIntroOut(300);
    this.assemblyCue.currentTime = 0;
    try {
      await this.assemblyCue.play();
      if (
        this.disposed ||
        generation !== this.generation ||
        this.musicStarted
      ) {
        if (generation !== this.generation || this.musicStarted)
          this.assemblyCue.pause();
        return;
      }
      this.assemblyStarted = true;
    } catch (error) {
      if (this.disposed || generation !== this.generation || this.musicStarted)
        return;
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        this.assemblyPending = true;
        this.setBlocked(true);
      } else if (!this.disposed) {
        this.onError?.();
      }
    } finally {
      if (generation === this.generation) this.assemblyStarting = false;
    }
    if (this.disposed || generation !== this.generation || this.musicStarted)
      return;
  }
  private fadeIntroOut(durationMs: number) {
    cancelAnimationFrame(this.fadeFrame);
    const startedAt = performance.now();
    const startLevel = this.introLevel;
    const fade = () => {
      const progress = Math.max(
        0,
        Math.min(1, (performance.now() - startedAt) / durationMs),
      );
      this.introLevel = startLevel * (1 - progress);
      this.applyVolume();
      if (progress < 1) this.fadeFrame = requestAnimationFrame(fade);
      else {
        this.fadeFrame = 0;
        this.intro.pause();
        this.introStarted = false;
      }
    };
    fade();
  }
  async startMusic(fadeMs = 0, delayMs = 0) {
    if (this.musicStarted || this.disposed) return;
    if (this.assemblyRequested && !this.assemblyStarted) {
      this.generation++;
      this.assemblyPending = false;
      this.assemblyStarting = false;
      this.assemblyCue.pause();
    }
    this.musicStarted = true;
    const generation = this.generation;
    const startedAt = performance.now();
    if (!this.muted) this.resumeContext();
    const buffer = await this.musicBuffer;
    if (this.disposed || generation !== this.generation) return;
    if (!buffer) {
      this.musicStarted = false;
      this.intro.pause();
      this.introStarted = false;
      throw new Error('Music could not decode');
    }
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.musicEnvelope);
    this.musicSource = source;
    const now = this.context.currentTime;
    const elapsed = performance.now() - startedAt;
    const remainingDelay = Math.max(0, delayMs - elapsed);
    const remainingFade = Math.max(0, fadeMs - Math.max(0, elapsed - delayMs));
    this.musicEnvelope.gain.cancelScheduledValues(now);
    this.musicEnvelope.gain.setValueAtTime(fadeMs ? 0 : 1, now);
    if (fadeMs) {
      this.musicEnvelope.gain.setValueAtTime(0, now + remainingDelay / 1000);
      this.musicEnvelope.gain.linearRampToValueAtTime(
        1,
        now + (remainingDelay + remainingFade) / 1000,
      );
    }
    source.start();
    if (!this.muted) this.setBlocked(this.context.state !== 'running');
    if (!this.assemblyRequested) {
      const fadeIntro = () => {
        const elapsed = performance.now() - startedAt - delayMs;
        const progress = fadeMs
          ? Math.max(0, Math.min(1, elapsed / fadeMs))
          : 1;
        this.introLevel = 1 - progress;
        this.applyVolume();
        if (progress < 1) this.fadeFrame = requestAnimationFrame(fadeIntro);
        else {
          this.fadeFrame = 0;
          this.intro.pause();
          this.introStarted = false;
        }
      };
      this.fadeFrame = 0;
      fadeIntro();
    }
  }
  async transition(phase: 'close' | 'open' = 'close') {
    if (this.muted) return;
    const cue = phase === 'close' ? this.closeCue : this.openCue;
    this.activeCue?.pause();
    this.activeCue = cue;
    cue.currentTime = 0;
    await this.play(cue);
  }
  interaction(cue: InterfaceCue) {
    if (this.muted || this.disposed || this.context.state !== 'running') return;
    const now = this.context.currentTime;
    const isHover = cue === 'navigation' || cue === 'item' || cue === 'mini';
    if (isHover && now - this.lastHover < 0.09) return;
    if (isHover) this.lastHover = now;
    const buffer = this.interfaceBuffers.get(cue);
    if (!buffer) return;
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    gain.gain.value = this.volume * (cue === 'panel' ? 0.55 : 0.45);
    source.connect(gain);
    gain.connect(this.context.destination);
    this.interfaceSources.add(source);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      this.interfaceSources.delete(source);
    };
    source.start();
  }
  hover(select = false) {
    this.interaction(select ? 'item' : 'navigation');
  }
  reset() {
    this.generation++;
    for (const source of this.interfaceSources) source.stop();
    this.interfaceSources.clear();
    cancelAnimationFrame(this.fadeFrame);
    this.fadeFrame = 0;
    this.musicSource?.stop();
    this.musicSource?.disconnect();
    this.musicSource = null;
    this.musicStarted = false;
    this.introStarted = false;
    this.assemblyRequested = false;
    this.assemblyStarted = false;
    this.assemblyPending = false;
    this.assemblyStarting = false;
    this.introLevel = 1;
    this.activeCue = null;
    for (const audio of this.players) {
      audio.pause();
      audio.currentTime = 0;
    }
  }
  dispose() {
    this.disposed = true;
    this.reset();
    for (const audio of this.players) {
      audio.onerror = audio.onended = null;
      audio.removeAttribute('src');
      audio.load();
      audio.remove();
    }
    this.context.onstatechange = null;
    void this.context.close();
  }
}
