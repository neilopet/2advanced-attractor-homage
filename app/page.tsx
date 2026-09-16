'use client';

import {
  useState,
  useEffect,
  useReducer,
  useRef,
  type AnimationEvent as ReactAnimationEvent,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type FocusEvent as ReactFocusEvent,
  type SVGProps,
} from 'react';
import { Button } from '@/components/ui/button';
import NextImage from 'next/image';
import {
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  ArrowUpRight,
} from 'lucide-react';

import {
  worlds,
  journeyReducer,
  initialJourney,
  type WorldId,
} from '@/lib/journey';
import { Soundscape, type InterfaceCue } from '@/lib/soundscape';
import {
  interfaceArrivalEndMs,
  startInterfaceArrival,
  type ArrivalMarker,
} from '@/lib/interface-arrival';
import { Shutters } from './shutters';
import { FeaturedPreview } from './motion-details';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';

function Mark({ className, ...props }: SVGProps<SVGSVGElement> = {}) {
  return (
    <svg
      {...props}
      className={`mark ${className ?? ''}`}
      viewBox="0 0 60 60"
      aria-hidden="true"
    >
      <circle cx="30" cy="30" r="27" />
      <circle cx="30" cy="30" r="22" />
      <path d="M16 36h28M19 29h22M23 22h14M16 36v7h28v-7M19 29v7M41 29v7M23 22v7M37 22v7" />
    </svg>
  );
}

export default function Home() {
  const [journey, dispatch] = useReducer(journeyReducer, initialJourney);
  const world = worlds.find((w) => w.id === journey.current)!;
  const [boot, setBoot] = useState<
    'loading' | 'covered' | 'revealing' | 'entered'
  >('loading');
  const [loaded, setLoaded] = useState(0);
  const [splashAssembled, setSplashAssembled] = useState(false);
  const [splashLoaderElapsed, setSplashLoaderElapsed] = useState(false);
  const [splashVectorReady, setSplashVectorReady] = useState(false);
  const [assetsFailed, setAssetsFailed] = useState(false);
  const [riveReady, setRiveReady] = useState(false);
  const [motionError, setMotionError] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [openingPainted, setOpeningPainted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [arrived, setArrived] = useState<ReadonlySet<ArrivalMarker>>(
    () => new Set(),
  );
  const [arrivalComplete, setArrivalComplete] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [panel, setPanel] = useState<'about' | 'work' | null>(null);
  const [volume, setVolume] = useState(35);
  const sound = useRef<Soundscape | null>(null);
  const sceneImages = useRef<Partial<Record<WorldId, HTMLImageElement>>>({});
  const readyScenes = useRef(new Set<WorldId>());
  const previousWorld = useRef<WorldId>('blue');
  const [muted, setMuted] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const navRoot = useRef<HTMLElement | null>(null);
  const navToggle = useRef<HTMLButtonElement | null>(null);
  const navCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerInsideNav = useRef(false);
  const keyboardFocusInsideNav = useRef(false);
  const suppressNavFocusOpen = useRef(false);
  const navOpenRef = useRef(false);
  useEffect(
    () => () => {
      if (navCloseTimer.current) clearTimeout(navCloseTimer.current);
    },
    [],
  );
  const bootRef = useRef(boot);
  useEffect(() => {
    bootRef.current = boot;
  }, [boot]);
  const busy = journey.phase !== 'idle';
  const progress = Math.round(
    ((loaded + (riveReady || motionError || reducedMotion ? 1 : 0)) / 7) * 100,
  );
  const interfacePhase =
    boot !== 'entered'
      ? 'hidden'
      : reducedMotion || motionError || arrivalComplete
        ? 'complete'
        : arrived.has('utility-rule')
          ? 'assembling'
          : 'quiet';
  const arrivalProps = (marker: ArrivalMarker) => ({
    'data-arrival': marker,
    'data-arrived': arrived.has(marker),
  });
  const navigationReady =
    interfacePhase === 'complete' || arrived.has('navigation-toggle');
  useEffect(() => {
    let alive = true;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener('change', update);
    const audio = new Soundscape(
      () => {
        if (alive) setAudioError(true);
      },
      (blocked) => {
        if (alive) setSoundBlocked(blocked);
      },
    );
    const unlockSound = (event: Event) => {
      if ((event.target as HTMLElement)?.closest?.('[data-sound-toggle]'))
        return;
      void audio.unlock().catch(() => {
        if (alive) setAudioError(true);
      });
    };
    document.addEventListener('pointerdown', unlockSound);
    document.addEventListener('keydown', unlockSound);
    sound.current = audio;
    try {
      const saved = Number(localStorage.getItem('attractor-volume') ?? 35);
      if (Number.isFinite(saved)) {
        const v = Math.max(0, Math.min(100, saved));
        // oxlint-disable-next-line react/react-compiler -- Restore the saved browser preference after hydration.
        setVolume(v);
        audio.setVolume(v / 100);
      }
    } catch {}
    // Start the loading sequence immediately. Browsers that block audible
    // autoplay keep the visuals running and offer the sound button instead.
    void audio.autoplayIntro().catch(() => {
      if (alive) setAudioError(true);
    });
    return () => {
      alive = false;
      preference.removeEventListener('change', update);
      document.removeEventListener('pointerdown', unlockSound);
      document.removeEventListener('keydown', unlockSound);
      audio.dispose();
      sound.current = null;
    };
  }, []);
  function prepareScene(id: WorldId, image: HTMLImageElement | null) {
    if (!image || sceneImages.current[id] === image) return;
    sceneImages.current[id] = image;
    void image
      .decode()
      .then(() => {
        readyScenes.current.add(id);
        setLoaded(readyScenes.current.size);
      })
      .catch(() => setAssetsFailed(true));
  }
  useEffect(() => {
    if (boot !== 'loading') return;
    const loaderTimer = setTimeout(
      () => setSplashLoaderElapsed(true),
      reducedMotion ? 0 : 2000,
    );
    const assemblyFallback = reducedMotion
      ? null
      : setTimeout(() => setSplashAssembled(true), 6500);
    const timer = setTimeout(
      () => setMinimumElapsed(true),
      reducedMotion ? 0 : 7500,
    );
    return () => {
      clearTimeout(timer);
      clearTimeout(loaderTimer);
      if (assemblyFallback) clearTimeout(assemblyFallback);
    };
  }, [boot, reducedMotion]);
  useEffect(() => {
    if (boot !== 'entered' || reducedMotion || motionError) return;
    const cancelArrivals = startInterfaceArrival((marker) => {
      setArrived((current) => {
        if (current.has(marker)) return current;
        const next = new Set(current);
        next.add(marker);
        return next;
      });
      if (marker === 'navigation-toggle' && pointerInsideNav.current) {
        if (!navOpenRef.current) sound.current?.interaction('navigationOpen');
        navOpenRef.current = true;
        setNavOpen(true);
      }
    });
    // Some final pieces are hidden by responsive layout or Hide content.
    // Completion must not depend on an animationend from a visible element.
    const completion = setTimeout(
      () => setArrivalComplete(true),
      interfaceArrivalEndMs + 50,
    );
    return () => {
      cancelArrivals();
      clearTimeout(completion);
    };
  }, [boot, reducedMotion, motionError]);
  useEffect(() => {
    if (
      boot !== 'loading' ||
      !minimumElapsed ||
      loaded !== 6 ||
      assetsFailed ||
      (!reducedMotion && !riveReady && !motionError)
    )
      return;
    if (reducedMotion || motionError) {
      // oxlint-disable-next-line react/react-compiler -- Advance entrance after external assets and the minimum intro interval are ready.
      setBoot('entered');
      void sound.current?.startMusic().catch(() => setAudioError(true));
    } else {
      setOpeningPainted(false);
      setBoot('covered');
    }
  }, [
    boot,
    minimumElapsed,
    loaded,
    riveReady,
    motionError,
    reducedMotion,
    assetsFailed,
  ]);
  useEffect(() => {
    if (boot !== 'covered') return;
    const timer = setTimeout(() => setBoot('revealing'), 600);
    return () => clearTimeout(timer);
  }, [boot]);
  useEffect(() => {
    if (journey.phase !== 'covered') return;
    let cancelled = false;
    // Decode the actual, persistent DOM image, not a discarded preload object.
    // Keep the entire viewport black through both readiness and a paint of the
    // incoming theme. The opening timeline is the only thing that reveals it.
    const image = sceneImages.current[journey.current];
    void Promise.all([
      image?.decode() ?? Promise.reject(new Error('Missing scene')),
      new Promise((resolve) => setTimeout(resolve, 2700)),
    ])
      .then(() => {
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (!cancelled) dispatch({ type: 'reveal' });
          }),
        );
      })
      .catch(() => {
        if (!cancelled) {
          // Retain the last visible scene if a browser discards decoded data.
          setAssetsFailed(true);
          setMotionError(true);
          dispatch({ type: 'recover' });
          dispatch({
            type: 'select',
            target: previousWorld.current,
            immediate: true,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [journey]);
  useEffect(() => {
    if (boot === 'loading' && !reducedMotion && !riveReady && !motionError) {
      const timer = setTimeout(() => setMotionError(true), 15000);
      return () => clearTimeout(timer);
    }
  }, [boot, reducedMotion, riveReady, motionError]);
  useEffect(() => {
    if (!busy && boot !== 'revealing') return;
    // Recover from a lost graphics context or missing completion signal.
    const timer = setTimeout(() => {
      setMotionError(true);
      dispatch({ type: 'recover' });
      if (bootRef.current === 'revealing') {
        setBoot('entered');
        void sound.current?.startMusic().catch(() => setAudioError(true));
      }
    }, 9000);
    return () => clearTimeout(timer);
  }, [busy, boot]);
  function motionFailed() {
    setMotionError(true);
    setOpeningPainted(false);
    dispatch({ type: 'recover' });
    if (bootRef.current === 'revealing') {
      setBoot('entered');
      void sound.current?.startMusic().catch(() => setAudioError(true));
    }
  }
  function selectWorld(
    item: { id: WorldId },
    cue: InterfaceCue = 'navigation',
  ) {
    if (busy || boot !== 'entered' || item.id === journey.current) return;
    setPanel(null);
    previousWorld.current = journey.current;
    setOpeningPainted(false);
    sound.current?.interaction(cue);
    dispatch({
      type: 'select',
      target: item.id,
      immediate: reducedMotion || motionError,
    });
  }
  function setNavigationOpen(open: boolean, arrivalGranted = false) {
    if (open && !navigationReady && !arrivalGranted) return;
    if (open && !navOpenRef.current)
      sound.current?.interaction('navigationOpen');
    navOpenRef.current = open;
    setNavOpen(open);
  }
  function clearNavigationClose() {
    if (navCloseTimer.current) {
      clearTimeout(navCloseTimer.current);
      navCloseTimer.current = null;
    }
  }
  function scheduleNavigationClose() {
    clearNavigationClose();
    navCloseTimer.current = setTimeout(() => {
      navCloseTimer.current = null;
      if (!pointerInsideNav.current && !keyboardFocusInsideNav.current)
        setNavigationOpen(false);
    }, 260);
  }
  function handleNavigationPointerEnter(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    pointerInsideNav.current = true;
    clearNavigationClose();
    setNavigationOpen(true);
  }
  function handleNavigationPointerLeave(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    pointerInsideNav.current = false;
    scheduleNavigationClose();
  }
  function handleNavigationFocus(event: ReactFocusEvent<HTMLElement>) {
    if (suppressNavFocusOpen.current) {
      suppressNavFocusOpen.current = false;
      return;
    }
    if (
      event.target instanceof HTMLElement &&
      event.target.matches(':focus-visible')
    ) {
      keyboardFocusInsideNav.current = true;
      clearNavigationClose();
      setNavigationOpen(true);
    }
  }
  function handleNavigationBlur(event: ReactFocusEvent<HTMLElement>) {
    if (
      event.relatedTarget instanceof Node &&
      navRoot.current?.contains(event.relatedTarget)
    )
      return;
    keyboardFocusInsideNav.current = false;
    if (!pointerInsideNav.current) scheduleNavigationClose();
  }
  function closeNavigationOnEscape(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key !== 'Escape' || !navOpenRef.current) return;
    event.preventDefault();
    clearNavigationClose();
    keyboardFocusInsideNav.current = false;
    const active = document.activeElement;
    if (
      active instanceof HTMLElement &&
      navRoot.current?.contains(active) &&
      active !== navToggle.current
    ) {
      suppressNavFocusOpen.current = true;
      navToggle.current?.focus();
    }
    setNavigationOpen(false);
  }
  function settleArrival(event: ReactAnimationEvent<HTMLDivElement>) {
    if (event.animationName !== 'instrument-arrive') return;
    const target = event.target;
    if (!(target instanceof Element) || !target.hasAttribute('data-arrival'))
      return;
    target.setAttribute('data-arrived', 'settled');
  }
  function playControlCue(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return;
    const control = target.closest('button, a, [role="slider"]');
    if (!control || control.hasAttribute('data-interface-sound-handled'))
      return;
    const cue: InterfaceCue = control.matches('.world-button')
      ? 'navigation'
      : control.closest('.utility, .navigation')
        ? 'mini'
        : 'item';
    sound.current?.interaction(cue);
  }
  async function toggleSound() {
    const next = soundBlocked ? false : !muted;
    setMuted(next);
    setAudioError(false);
    try {
      await sound.current?.enable(!next);
    } catch {
      setAudioError(true);
      setMuted(true);
      void sound.current?.enable(false);
    }
  }
  function replay() {
    if (busy) return;
    clearNavigationClose();
    pointerInsideNav.current = false;
    keyboardFocusInsideNav.current = false;
    setNavigationOpen(false);
    setArrived(new Set());
    setArrivalComplete(false);
    sound.current?.reset();
    setMinimumElapsed(false);
    setSplashLoaderElapsed(false);
    setOpeningPainted(false);
    dispatch({ type: 'select', target: 'blue', immediate: true });
    setPanel(null);
    setBoot('loading');
    setSplashAssembled(false);
    setSplashVectorReady(false);
    void sound.current?.startIntro().catch(() => setAudioError(true));
  }
  const command =
    boot === 'revealing'
      ? 'open'
      : journey.phase === 'closing'
        ? 'close'
        : journey.phase === 'opening'
          ? 'open'
          : null;
  const covered =
    boot === 'covered' ||
    (boot === 'revealing' && !openingPainted) ||
    journey.phase === 'covered' ||
    (journey.phase === 'opening' && !openingPainted);

  return (
    <main
      className="experience"
      data-phase={boot === 'entered' ? journey.phase : boot}
      data-interface-phase={interfacePhase}
      data-world={world.id}
      onKeyDownCapture={closeNavigationOnEscape}
      style={
        {
          '--scene-accent': world.accent,
          '--scene-rgb': world.rgb,
        } as CSSProperties
      }
    >
      <a className="skip-link" href="#navigation">
        Skip to navigation
      </a>
      <div className="world-backdrop">
        {worlds.map((item) => (
          <NextImage
            key={item.id}
            ref={(image) => prepareScene(item.id, image)}
            width={item.scene.width}
            height={item.scene.height}
            unoptimized
            loading="eager"
            fetchPriority={item.id === 'blue' ? 'high' : 'auto'}
            src={item.scene.src}
            alt={item.id === world.id ? item.description : ''}
            aria-hidden={item.id !== world.id}
            data-scene={item.id}
            className={item.id === world.id ? 'scene-active' : ''}
          />
        ))}
      </div>
      {!reducedMotion && !motionError && command === 'open' && (
        <div className="reveal-flare" aria-hidden="true">
          <span />
        </div>
      )}
      {!motionError && (
        <div className={`stage-curtain ${covered ? 'covered' : ''}`}>
          <Shutters
            command={command}
            onReady={() => setRiveReady(true)}
            onStart={(phase) => {
              if (phase === 'open' && boot === 'revealing') {
                // Begin the crossfade at the first visible slit (21/41 s),
                // reaching full music level as the opening finishes.
                void sound.current
                  ?.startMusic(1270, 510)
                  .catch(() => setAudioError(true));
              }
              void sound.current
                ?.transition(phase)
                .catch(() => setAudioError(true));
            }}
            onError={motionFailed}
            onOpeningPainted={() => setOpeningPainted(true)}
            onClosed={() => {
              setOpeningPainted(false);
              dispatch({ type: 'closed' });
            }}
            onOpened={() => {
              if (bootRef.current === 'revealing') {
                setBoot('entered');
              } else dispatch({ type: 'opened' });
            }}
          />
        </div>
      )}
      {boot !== 'entered' && boot !== 'revealing' && (
        <section
          className={`splash ${boot === 'covered' ? 'splash-covered' : ''}`}
          data-splash-stage={
            reducedMotion || splashLoaderElapsed ? 'assembled' : 'loader'
          }
          aria-label="Loading Attractor"
        >
          <div
            className="splash-atmosphere"
            data-assembled={
              (splashAssembled && splashVectorReady) || reducedMotion
            }
            aria-hidden="true"
          >
            {reducedMotion ? (
              <NextImage
                unoptimized
                loading="eager"
                src="/scenes/splash-vector.svg"
                alt=""
                width="1894"
                height="1620"
              />
            ) : (
              <video
                onPlaying={() => {
                  if (boot === 'loading') void sound.current?.startAssembly();
                }}
                onEnded={() => setSplashAssembled(true)}
                onError={() => setSplashAssembled(true)}
                src={
                  splashLoaderElapsed
                    ? '/scenes/original-splash.mp4'
                    : undefined
                }
                poster={
                  splashLoaderElapsed
                    ? '/scenes/original-splash.webp'
                    : undefined
                }
                width="1894"
                height="1620"
                autoPlay={splashLoaderElapsed}
                muted
                playsInline
                preload={splashLoaderElapsed ? 'auto' : 'none'}
              />
            )}
            {!reducedMotion && (
              <NextImage
                src="/scenes/splash-vector.svg"
                alt=""
                width={1894}
                height={1620}
                unoptimized
                loading="eager"
                className="splash-vector"
                onLoad={(event) => {
                  void event.currentTarget
                    .decode()
                    .then(() => setSplashVectorReady(true))
                    .catch(() => {});
                }}
              />
            )}
            <NextImage
              src="/scenes/attractor-logotype.svg"
              alt=""
              width="681"
              height="67"
              unoptimized
              loading="eager"
              className="splash-wordmark"
            />
            <svg className="splash-edge-light" viewBox="0 0 947 810">
              <defs>
                <radialGradient id="edge-glow">
                  <stop offset="0" stopColor="#fff" />
                  <stop offset=".12" stopColor="#b9eeff" stopOpacity=".9" />
                  <stop offset=".4" stopColor="#43b8e8" stopOpacity=".3" />
                  <stop offset="1" stopColor="#168bb8" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle
                r="21"
                fill="url(#edge-glow)"
                className="edge-light edge-light-one"
              />
              <circle
                r="16"
                fill="url(#edge-glow)"
                className="edge-light edge-light-two"
              />
            </svg>
          </div>
          <div className="splash-instrument">
            <span className="splash-edition">
              AN INDEPENDENT TRIBUTE / V.05
            </span>
            <h1 className="sr-only">Attractor — Six Worlds</h1>
            <div className="loading-console">
              <div className="loading-readout">
                <span>
                  {progress === 100
                    ? 'CONNECTION ESTABLISHED'
                    : 'INITIALIZING ENVIRONMENTS'}
                </span>
                <output>{progress}%</output>
              </div>
              <Progress
                value={progress}
                aria-label="Environment loading progress"
                className="loading-progress"
              />
            </div>
            <Button
              variant="ghost"
              className="splash-sound micro-button"
              data-sound-toggle
              onClick={() => void toggleSound()}
            >
              {muted ? <VolumeX /> : <Volume2 />}
              {soundBlocked
                ? 'Tap to start sound'
                : muted
                  ? 'Enable ambient sound'
                  : 'Ambient sound on'}
            </Button>
            {assetsFailed && (
              <p role="alert" className="load-error">
                A landscape could not load.{' '}
                <button onClick={() => location.reload()}>Retry</button>
              </p>
            )}
            {motionError && (
              <p className="load-error">
                Motion is unavailable. You can still explore the worlds.
              </p>
            )}
          </div>
          <span className="splash-credit">INSPIRED BY 2ADVANCED STUDIOS</span>
        </section>
      )}
      <div
        className="frame"
        data-arriving={boot === 'entered'}
        data-interface-phase={interfacePhase}
        data-arrival-step={arrived.size}
        inert={boot !== 'entered' || busy}
        onAnimationEnd={settleArrival}
        onMouseOver={(e) => {
          const control = (e.target as HTMLElement).closest(
            'button, a, [role="slider"]',
          );
          if (control && !control.contains(e.relatedTarget as Node | null))
            playControlCue(e.target);
        }}
        onFocus={(e) => playControlCue(e.target)}
      >
        {(motionError || audioError || assetsFailed) && (
          <output className="experience-notice">
            {assetsFailed ? (
              <>
                A landscape could not load.{' '}
                <button onClick={() => location.reload()}>
                  Reload to try again.
                </button>
              </>
            ) : audioError ? (
              'Sound could not load. Reload the page to try again.'
            ) : (
              'Motion is unavailable; navigation remains available.'
            )}
          </output>
        )}
        <header
          className="utility rule"
          {...arrivalProps('utility-rule')}
          data-rule-arrival="utility-rule"
        >
          <div className="utility-links">
            <Button
              className="micro-button"
              variant="ghost"
              {...arrivalProps('utility-home')}
              onClick={() => {
                selectWorld(worlds[0], 'mini');
                setPanel(null);
              }}
            >
              Home
            </Button>
            <Button
              className="micro-button"
              variant="ghost"
              {...arrivalProps('utility-about')}
              onClick={() => setPanel(panel === 'about' ? null : 'about')}
            >
              About
            </Button>
          </div>
          <div className="identity">
            <Mark {...arrivalProps('identity-mark')} />
            <h1 {...arrivalProps('identity-title')}>ATTRACTOR</h1>
            <span {...arrivalProps('identity-subtitle')}>
              AN INTERACTIVE HOMAGE
            </span>
          </div>
          <div className="sound-controls">
            <Button
              className="micro-button sound-button"
              variant="ghost"
              {...arrivalProps('sound-button')}
              data-sound-toggle
              onClick={() => void toggleSound()}
              aria-label={
                soundBlocked
                  ? 'Start sound'
                  : muted
                    ? 'Enable sound'
                    : 'Mute sound'
              }
              aria-pressed={!muted && !soundBlocked}
            >
              {soundBlocked ? 'Start sound' : 'Soundscape'}{' '}
              {muted ? <VolumeX /> : <Volume2 />}
            </Button>
            <Slider
              {...arrivalProps('volume-slider')}
              value={[volume]}
              onValueChange={(value) => {
                const v = Array.isArray(value) ? value[0] : value;
                // oxlint-disable-next-line react/react-compiler -- Restore the saved browser preference after hydration.
                setVolume(v);
                sound.current?.setVolume(v / 100);
                try {
                  localStorage.setItem('attractor-volume', String(v));
                } catch {}
              }}
              min={0}
              max={100}
              step={1}
              aria-label="Sound volume"
              className="sound-volume"
            />
          </div>
        </header>
        <nav
          ref={navRoot}
          id="navigation"
          className="navigation rule"
          aria-label="Worlds"
          data-rule-arrival="navigation-rule"
          {...arrivalProps('navigation-rule')}
          onPointerEnter={handleNavigationPointerEnter}
          onPointerLeave={handleNavigationPointerLeave}
          onFocusCapture={handleNavigationFocus}
          onBlurCapture={handleNavigationBlur}
          data-navigation-open={navOpen}
        >
          <Button
            ref={navToggle}
            className="nav-toggle micro-button"
            variant="ghost"
            aria-expanded={navOpen}
            aria-controls="world-list"
            {...arrivalProps('navigation-toggle')}
            onClick={() => setNavigationOpen(!navOpenRef.current)}
          >
            {navOpen ? <ChevronUp /> : <ChevronDown />} Navigation array
          </Button>
          <div
            id="world-list"
            className="world-list"
            data-open={navOpen}
            aria-hidden={!navOpen}
            inert={!navOpen}
          >
            {worlds.map((item, index) => (
              <Button
                variant="ghost"
                disabled={busy}
                className={`world-button ${item.id === world.id ? 'selected' : ''}`}
                key={item.id}
                data-arrival={`navigation-world-${item.id}`}
                data-arrived={navOpen}
                style={{ '--nav-order': index } as CSSProperties}
                onClick={() => {
                  selectWorld(item);
                  setPanel(null);
                }}
                aria-pressed={item.id === world.id}
              >
                <span
                  style={{ background: item.accent }}
                  className="world-swatch"
                />
                <span>{item.name}</span>
                <small>{item.code}</small>
              </Button>
            ))}
          </div>
        </nav>
        <section
          className="scenic-stage"
          aria-label={world.name}
          aria-busy={busy}
        >
          {panel && (
            <div className="content-panel">
              <div className="content-title">
                <h2>
                  {panel === 'about'
                    ? 'About this journey'
                    : 'Attractor / six worlds'}
                </h2>
                <Button
                  variant="ghost"
                  className="micro-button"
                  onClick={() => setPanel(null)}
                >
                  Close ×
                </Button>
              </div>
              <p>
                {panel === 'about'
                  ? 'A personal tribute to the immersive worlds of 2Advanced Studios. The scenery is faithfully reconstructed with AI assistance for larger displays; the music and interface sounds come from the original Flash files. Explore a world, preview the film, and move into another atmosphere.'
                  : 'Six environments share one instrument panel. Choose any destination in the navigation array to travel between them.'}
              </p>
              <a
                href="https://www.behance.net/gallery/19738001/2Advanced-V5-Website-Attractor-%282010%29"
                target="_blank"
                rel="noreferrer"
              >
                Explore the original work <ArrowUpRight />
              </a>
            </div>
          )}
          <div className="scene-caption">
            <span {...arrivalProps('caption-environment')}>
              ENVIRONMENT {world.code} / 06
            </span>
            <h2 {...arrivalProps('caption-title')}>{world.title}</h2>
            <span
              className="coordinates"
              {...arrivalProps('caption-coordinate')}
            >
              {world.name.toUpperCase()} · SIGNAL ESTABLISHED
            </span>
          </div>
        </section>
        <div
          className="action-strip"
          data-arrival="action-strip-rule"
          data-arrived={arrived.has('action-strip-rule')}
        >
          <Button
            variant="ghost"
            className="micro-button"
            {...arrivalProps('action-project')}
            onClick={() => setPanel('work')}
          >
            <ChevronUp />
            Explore the project
          </Button>
          <Button
            variant="ghost"
            className="micro-button"
            {...arrivalProps('action-about')}
            onClick={() => setPanel('about')}
          >
            <ChevronUp />
            About this homage
          </Button>
          <Button
            variant="ghost"
            className="micro-button"
            {...arrivalProps('action-hide')}
            onClick={() => setPanel(null)}
          >
            <ChevronUp />
            Hide content
          </Button>
          <Button
            variant="ghost"
            className="micro-button"
            {...arrivalProps('action-replay')}
            onClick={replay}
          >
            <ChevronUp />
            Replay introduction
          </Button>
        </div>
        <div className="release-band" {...arrivalProps('release-band')}>
          <span />
          <div>
            <Mark />
            <b>RELEASE FIVE</b>
            <strong>ATTRACTOR</strong>
          </div>
          <span />
        </div>
        <div className="information-grid">
          <section
            className="information-cell"
            data-column-visible={
              interfacePhase === 'complete' || arrived.has('column-1-heading')
            }
          >
            <FeaturedPreview
              poster="/scenes/blue-remaster.webp"
              accent={world.accent}
              rgb={world.rgb}
              onCue={(cue) => sound.current?.interaction(cue)}
              arrivalMarker="column-1-heading"
              arrived={arrived.has('column-1-heading')}
            />
            <div
              className="project-thumbnail"
              {...arrivalProps('column-1-thumbnail')}
            >
              <span>01—06</span>
              <strong>ATTRACTOR</strong>
            </div>
            <h3 {...arrivalProps('column-1-title')}>
              One interface. Six worlds.
            </h3>
            <p {...arrivalProps('column-1-copy')}>
              An exploration of atmosphere, sound, and motion.
            </p>
            <Button
              variant="ghost"
              className="panel-link micro-button"
              {...arrivalProps('column-1-action')}
              onClick={() => setPanel('work')}
            >
              View project <ArrowUpRight />
            </Button>
          </section>
          <section
            className="information-cell"
            data-column-visible={
              interfacePhase === 'complete' || arrived.has('column-2-heading')
            }
          >
            <h2 {...arrivalProps('column-2-heading')}>Field notes</h2>
            <span className="eyebrow" {...arrivalProps('column-2-eyebrow')}>
              A TRIBUTE TO THE FLASH ERA
            </span>
            <h3 {...arrivalProps('column-2-title')}>
              The web as a destination
            </h3>
            <p {...arrivalProps('column-2-copy')}>
              Monumental scenery. Precise controls. A moment of anticipation
              between every world.
            </p>
            <Button
              variant="ghost"
              className="panel-link micro-button"
              {...arrivalProps('column-2-action')}
              onClick={() => setPanel('about')}
            >
              Read more <ArrowUpRight />
            </Button>
          </section>
          <section
            className="information-cell"
            data-column-visible={
              interfacePhase === 'complete' || arrived.has('column-3-heading')
            }
          >
            <h2 {...arrivalProps('column-3-heading')}>Current environment</h2>
            <div
              className="signal-display"
              {...arrivalProps('column-3-signal')}
            >
              <span className="signal-dot" />
              <span>CONNECTED</span>
              <strong>{world.code}</strong>
            </div>
            <h3 {...arrivalProps('column-3-title')}>{world.name}</h3>
            <p {...arrivalProps('column-3-copy')}>
              {world.title}. Select your next destination above.
            </p>
            <span className="panel-link" {...arrivalProps('column-3-status')}>
              6 destinations available
            </span>
          </section>
          <section
            className="information-cell"
            data-column-visible={
              interfacePhase === 'complete' || arrived.has('column-4-heading')
            }
          >
            <h2 {...arrivalProps('column-4-heading')}>Origins &amp; credits</h2>
            <span className="eyebrow" {...arrivalProps('column-4-eyebrow')}>
              2ADVANCED STUDIOS
            </span>
            <h3 {...arrivalProps('column-4-title')}>V5 “Attractor”</h3>
            <p {...arrivalProps('column-4-copy')}>
              Inspired by the work of Eric Jordan, Shane Mielke, and the
              2Advanced team.
            </p>
            <a
              className="panel-link"
              {...arrivalProps('column-4-action')}
              href="https://2advanced.com"
              target="_blank"
              rel="noreferrer"
            >
              Visit 2Advanced <ArrowUpRight />
            </a>
          </section>
        </div>
        <footer
          className="footer rule"
          data-arrival="footer-rule"
          data-arrived={arrived.has('footer-rule')}
          data-rule-arrival="footer-rule"
        >
          <span {...arrivalProps('footer-left')}>INDEPENDENT HOMAGE</span>
          <p {...arrivalProps('footer-center')}>
            Inspired by 2Advanced V5 · Attractor
            <br />
            <span {...arrivalProps('footer-detail')}>
              Original design: 2Advanced / AI-assisted scenic remasters.
            </span>
          </p>
          <span {...arrivalProps('footer-right')}>EXPLORE / DISCOVER</span>
        </footer>
      </div>
      <p className="sr-only" aria-live="polite">
        {boot === 'entered' && journey.phase === 'idle'
          ? `${world.name}. ${world.title}.`
          : ''}
      </p>
    </main>
  );
}
