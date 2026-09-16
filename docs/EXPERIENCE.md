# Experience and reconstruction notes

This document keeps the detailed implementation and reconstruction record separate from the welcoming project overview in the root README. Measurements describe this homage and its source study; they do not claim to reproduce every behavior of the historical Flash site.

## Entrance sequence

The historical recording at [1:19–1:33](https://www.youtube.com/watch?v=9AnIknxdeS8&t=79s) guided the small loader, source assembly, glow hold, flare, and staged Home interface. The implemented schedule keeps these stages distinct:

1. A small central loader appears immediately for about 2 seconds.
2. The original splash assembly plays as a 1894×1620 silent video, then hands off to an original-source SVG with animated glow and reconstructed edge highlights.
3. Source SVG decoding, scene decoding, and animation readiness gate the handoff. A failed or stalled splash video can recover to the SVG; reduced motion uses the SVG without animation.
4. A concealed pause of about 600 ms leads into the 1.78-second opening shutter.
5. The first landscape appears, followed by a 700 ms quiet interval and individual framing lines, header controls, navigation toggle, captions, action buttons, and column contents. The last interface elements finish about 4.6 seconds after opening.

The embedded cloud texture in the source splash is natively 945×810. Only its vector layers scale to the 2× 1894×1620 presentation. The cover waits for the first visible Rive opening frame; this avoids exposing an unready scene.

The six remaster images are eager, persistent scene nodes. They use proportional cover scaling on narrow screens, so side cropping preserves the panorama instead of stretching it. A destination must decode again before opening. Text panels use a dark backing for legibility over enlarged art.

## Shutters and timing

The source matte movie runs at 41 fps. Its hide sequence starts at frame 87, begins movement at 92, triggers sound at 93, and reaches black at 121. Its show sequence starts at 10, triggers sound at 15, first reveals at 32, and finishes by frames 79–83.

The editable Rive timelines use the same rate: close is 34 frames (about 0.829 s), and open is 73 frames (about 1.780 s). The opening holds a narrow slit before widening through measured pose anchors. The covered wait is at least 2.7 s and can extend while a destination scene decodes. This is an approximation of the source motion curve scaled to the full viewport.

The original close and show sound offsets, 146 ms and 122 ms, are represented as prepended silence in their WAV files. That lets the cue players and animation start together. The reveal sound starts before visible opening and its natural tail continues over the revealed scene.

The curtain covers the scenery and themed interface during a scene change. The palette changes only after closing, and the cover releases after Rive's first opening frame has rendered. Rive Canvas emits `Advance`; it does not emit the `Draw` event used by an earlier release, so the first painted frame is observed through `requestAnimationFrame` instead.

The editable source is [`assets/rive/scene.rml`](../assets/rive/scene.rml). With the official Rive CLI, compile it and copy the resulting `attractor-rive.riv` into `public/rive/attractor-shutters.riv`. The Canvas2D renderer and matching self-hosted WASM avoid the WebGL2 failure observed in Brave.

## Sound and interaction

The original music is decoded once into a Web Audio buffer and looped with one `AudioBufferSourceNode`. Loading ambience, the assembly one-shot, shutter cues, and interface cues stay independent. This removes the roughly 116 ms restart gap that appeared when an earlier homage revision's HTMLAudio playback repeated at about 9.259 s instead of the 9.142857 s asset duration in Brave.

When the source assembly one-shot starts, the loading ambience fades down. During the first opening, music starts at zero, holds for 510 ms, and fades to its normal level over 1270 ms. The fade aligns with the first visible slit and the end of the shutter opening. Navigation never changes music volume, pauses it, or resets its playhead. The original cue tails remain intact.

The navigation tray begins closed and unfolds on pointer hover, keyboard focus, or tap. Its opening follows the source TopNav durations of about 0.49 s and closing about 0.24 s. Pointer travel, Escape, focus, and tap toggling remain safe. Navigation becomes available when its toggle arrives.

Hovering or tapping Featured project opens a rich preview. Its play button opens a keyboard-accessible video window containing the new silent Six Worlds film. The splash video's `onPlaying` event starts the root ID143 assembly one-shot; when the film window has finished opening, its `onOpenChangeComplete` path starts title cue 450 and the silent film. Closing restores focus while the background music continues.

Mute and saved volume apply to the independent players. Replay, keyboard navigation, rapid-input guards, reduced-motion navigation, and disposal during pending decoding are covered by the behavior tests. Arrival timers are cancellable, and sequence completion does not depend on whether a responsive layout or Hide content control leaves an element visible.

## Source and asset record

The [official restored V5 archive](https://v5attractor.2advanced.com/) supplies the original core and matte SWF studies and credits community preservation of the original 2006 Flash site. The preserved panoramas were compared with the [V5 art portfolio](https://www.behance.net/gallery/19738001/2Advanced-V5-Website-Attractor-%282010%29). The clean source dimensions are 1600×659 (Blue), 1600×612 (Green), 1600×629 (Yellow), 1600×624 (Red), and 1600×659 (Pink and White).

The default scenes are faithful AI-assisted reconstructions guided by those originals. They retain composition while reinterpreting fine texture. They are stored as lossless WebP at the generator's returned sizes and are not recovered historical detail. Original files remain available in [`public/scenes/`](../public/scenes/). Full per-asset provenance and rights notes are in [`ASSET-CREDITS.md`](ASSET-CREDITS.md).

## Audio measurements

Audio was decoded and trimmed to the SWF sample counts, removing MP3 padding. These exact source counts are retained in the shipped WAVs:

| File | Source identity and measurement |
| --- | --- |
| `original-loading.wav` | Core `myLoop01`; mono 44.1 kHz, 284160 samples after 1633 seek samples, 6.443537 s. |
| `original-music.wav` | Core `sndSoundtrack`; stereo 44.1 kHz, 403200 samples after 1673 seek samples, 9.142857 s. |
| `root-id-143-source-count.wav` | Core assembly one-shot at root frame 61; mono 44.1 kHz, exact 8.3235-second source count after the 1633-sample MP3 seek. |
| `nav-hover.wav`, `item-hover.wav`, `mini-hover.wav` | Core rollover sounds 166, 251, and 391, with MP3 latency removed and exact SWF sample counts retained. |
| `navigation-open.wav`, `panel-open.wav` | Core sounds 95 and 336. The full navigation show uses 95; the preview panel adapts source hover-panel sound 336. |
| `window-title.wav` | Core sound 450. The source MultiBox / ComponentShell / Decoder call chain triggers it after the opening resize; no invented modal-close cue is claimed. |
| `original-shutter-close.wav` | Matte 1 sound 10; 29888 samples plus 6454 samples of original timeline offset. |
| `original-shutter-open.wav` | Matte 1 sound 4; 120832 samples plus 5378 samples of original timeline offset. |

These are independently extracted source effects, not excerpts from a music-containing video recording. The mixed historical recording did not reliably isolate every short hover or title cue, so those identifications follow source placement and call order rather than claiming an exact recording match. The continuing edge shimmer and horizontal reveal flare are modern reconstructions.

## Validation notes

The focused behavior tests cover all 30 directed routes, conceal scene changes until the shutter is closed, input guards, reduced motion, recovery, continuous music identity across navigation and mute, first-reveal crossfade timing, default-enabled autoplay recovery, replay, disposal during decoding, stale media-play cancellation, assembly one-shot lifecycle, independent interface cue playback, mute, and hover throttling.

Browser checks inspect the opaque DOM overlay, whole-viewport coverage, persistent image nodes, and the actual visible opening. Canvas-only alpha sampling was insufficient to catch a previous overlay defect. A forced 3.5 s image decode delay confirms the page remains concealed until ready. Responsive layouts and Hide content do not remove the shared arrival completion schedule.

This is a compact homage, not the full restored Flash site. Environmental layers remain still, content and layout are adaptations, and the scenic preview is a new study. No Ruffle runtime, database, CMS, custom Rive scripting, or general animation framework is included.
