'use client';
import { useEffect, useRef } from 'react';
import {
  useRive,
  Layout,
  Fit,
  Alignment,
  EventType,
  RuntimeLoader,
} from '@rive-app/react-canvas';

RuntimeLoader.setWasmUrl('/rive/canvas.wasm');

type Props = {
  command: 'close' | 'open' | null;
  onReady: () => void;
  onStart: (phase: 'close' | 'open') => void;
  onClosed: () => void;
  onOpened: () => void;
  onError: () => void;
  onOpeningPainted: () => void;
};
export function Shutters({
  command,
  onReady,
  onStart,
  onClosed,
  onOpened,
  onError,
  onOpeningPainted,
}: Props) {
  const callbacks = useRef({
    onReady,
    onStart,
    onClosed,
    onOpened,
    onError,
    onOpeningPainted,
  });
  useEffect(() => {
    callbacks.current = {
      onReady,
      onStart,
      onClosed,
      onOpened,
      onError,
      onOpeningPainted,
    };
  }, [onReady, onStart, onClosed, onOpened, onError, onOpeningPainted]);
  const active = useRef<string | null>(null);
  const { rive, RiveComponent } = useRive({
    src: '/rive/attractor-shutters.riv',
    artboard: 'AttractorShutters',
    // oxlint-disable-next-line typescript/no-deprecated -- Two named one-shot timelines are the deliberate, bounded prototype contract.
    animations: 'CloseShutters',
    autoplay: false,
    layout: new Layout({ fit: Fit.Fill, alignment: Alignment.Center }),
    onLoadError: () => callbacks.current.onError(),
  });
  useEffect(() => {
    if (!rive) return;
    callbacks.current.onReady();
    const stopped = (event: { data?: unknown }) => {
      const names = Array.isArray(event.data) ? event.data : [event.data];
      if (!active.current || !names.includes(active.current)) return;
      const ended = active.current;
      active.current = null;
      if (ended === 'CloseShutters') callbacks.current.onClosed();
      else callbacks.current.onOpened();
    };
    rive.on(EventType.Stop, stopped);
    return () => rive.off(EventType.Stop, stopped);
  }, [rive]);
  useEffect(() => {
    if (!rive || !command) return;
    // Clear the paused initial animation before replaying a fresh one-shot.
    active.current = null;
    rive.stop();
    const name = command === 'close' ? 'CloseShutters' : 'OpenShutters';
    active.current = name;
    let paintFrame = 0;
    const advanced = () => {
      rive.off(EventType.Advance, advanced);
      // Canvas emits Advance, but not Draw. Wait until the next browser frame:
      // the first closed-pose render has then finished and can take over from
      // the opaque cover without hiding the entire opening animation.
      paintFrame = requestAnimationFrame(() =>
        callbacks.current.onOpeningPainted(),
      );
    };
    if (command === 'open') rive.on(EventType.Advance, advanced);
    rive.play(name);
    callbacks.current.onStart(command);
    return () => {
      rive.off(EventType.Advance, advanced);
      cancelAnimationFrame(paintFrame);
    };
  }, [rive, command]);
  return <RiveComponent className="shutter-canvas" aria-hidden="true" />;
}
