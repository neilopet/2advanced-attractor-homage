export type ArrivalMarker = (typeof interfaceArrivals)[number]['marker'];

export const interfaceArrivals = [
  { marker: 'utility-rule', atMs: 700 },
  { marker: 'navigation-rule', atMs: 700 },
  { marker: 'footer-rule', atMs: 700 },
  { marker: 'utility-home', atMs: 940 },
  { marker: 'utility-about', atMs: 1090 },
  { marker: 'identity-mark', atMs: 1240 },
  { marker: 'identity-title', atMs: 1390 },
  { marker: 'identity-subtitle', atMs: 1540 },
  { marker: 'sound-button', atMs: 1690 },
  { marker: 'volume-slider', atMs: 1840 },
  { marker: 'navigation-toggle', atMs: 1990 },
  { marker: 'caption-environment', atMs: 2110 },
  { marker: 'caption-title', atMs: 2230 },
  { marker: 'caption-coordinate', atMs: 2350 },
  { marker: 'action-strip-rule', atMs: 2470 },
  { marker: 'action-project', atMs: 2490 },
  { marker: 'action-about', atMs: 2565 },
  { marker: 'action-hide', atMs: 2640 },
  { marker: 'action-replay', atMs: 2715 },
  { marker: 'release-band', atMs: 2790 },
  { marker: 'column-1-heading', atMs: 2940 },
  { marker: 'column-1-thumbnail', atMs: 3015 },
  { marker: 'column-1-title', atMs: 3090 },
  { marker: 'column-1-copy', atMs: 3165 },
  { marker: 'column-1-action', atMs: 3240 },
  { marker: 'column-2-heading', atMs: 3315 },
  { marker: 'column-2-eyebrow', atMs: 3390 },
  { marker: 'column-2-title', atMs: 3465 },
  { marker: 'column-2-copy', atMs: 3540 },
  { marker: 'column-2-action', atMs: 3615 },
  { marker: 'column-3-heading', atMs: 3690 },
  { marker: 'column-3-signal', atMs: 3765 },
  { marker: 'column-3-title', atMs: 3840 },
  { marker: 'column-3-copy', atMs: 3915 },
  { marker: 'column-3-status', atMs: 3990 },
  { marker: 'column-4-heading', atMs: 4065 },
  { marker: 'column-4-eyebrow', atMs: 4140 },
  { marker: 'column-4-title', atMs: 4215 },
  { marker: 'column-4-copy', atMs: 4290 },
  { marker: 'column-4-action', atMs: 4365 },
  { marker: 'footer-left', atMs: 4140 },
  { marker: 'footer-center', atMs: 4215 },
  { marker: 'footer-detail', atMs: 4290 },
  { marker: 'footer-right', atMs: 4365 },
] as const;

export const interfaceArrivalDurationMs = 200;
export const interfaceArrivalEndMs =
  Math.max(...interfaceArrivals.map(({ atMs }) => atMs)) +
  interfaceArrivalDurationMs;

type Schedule = (callback: () => void, delayMs: number) => unknown;
type Cancel = (handle: unknown) => void;

export function startInterfaceArrival(
  onArrival: (marker: ArrivalMarker) => void,
  schedule: Schedule = (callback, delayMs) => setTimeout(callback, delayMs),
  cancel: Cancel = (handle) =>
    clearTimeout(handle as ReturnType<typeof setTimeout>),
) {
  let cancelled = false;
  const timers = interfaceArrivals.map(({ marker, atMs }) =>
    schedule(() => {
      if (!cancelled) onArrival(marker);
    }, atMs),
  );

  return () => {
    cancelled = true;
    for (const timer of timers) cancel(timer);
  };
}
