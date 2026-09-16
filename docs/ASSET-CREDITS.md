# Asset credits, provenance, and rights

This repository is an independent homage to 2Advanced V5 Attractor. It does not claim affiliation with 2Advanced, ownership of the original artwork, audio, branding, or source files, or permission to relicense them. The presence of a file here records how it was used in this reconstruction; it is not a blanket rights grant.

## Historical references and credits

- [Eric Jordan's 2Advanced Return portfolio](https://www.ericjordan.com/portfolios/2advanced-return/) identifies Eric Jordan and Tony Novak as the founders.
- A [historical Web Designer profile](https://www.shanemielke.com/assets/pdf/028-033_WD_188.pdf) lists Tony Novak, Eric Jordan, and John Carroll as founders. This document avoids relying on a year because the profile's year information is inconsistent.
- [Shane Mielke's V5 portfolio entry](https://www.shanemielke.com/work/2advanced-v5/) documents his Animation, ActionScript, and Production Design work on the 2006 release.
- [Eric Jordan's Behance V5 art portfolio](https://www.behance.net/gallery/19738001/2Advanced-V5-Website-Attractor-%282010%29) is a primary visual reference for the V5 Attractor artwork.
- The [official restored V5 archive](https://v5attractor.2advanced.com/) identifies the original release as 2006 and thanks community preservers. It runs the official archive through Ruffle.

Credit for the original work belongs with the 2Advanced founding team, Eric Jordan's visual work, Shane Mielke's documented roles, and all original V5 artists, developers, and sound contributors. This list intentionally does not invent names or claim to be exhaustive.

## Scene images

The original panoramas were studied from the restored archive's core/matte SWFs and Eric Jordan's portfolio. Their clean source dimensions are:

| Scene | Original file | Original dimensions | Homage remaster |
| --- | --- | ---: | --- |
| Blue | `public/scenes/blue.webp` | 1600×659 | `public/scenes/blue-remaster.webp` (1954×805) |
| Green | `public/scenes/green.webp` | 1600×612 | `public/scenes/green-remaster.webp` (2027×776) |
| Yellow | `public/scenes/yellow.webp` | 1600×629 | `public/scenes/yellow-remaster.webp` (2001×786) |
| Red | `public/scenes/red.webp` | 1600×624 | `public/scenes/red-remaster.webp` (2008×783) |
| Pink | `public/scenes/pink.jpg` | 1600×659 | `public/scenes/pink-remaster.webp` (1954×805) |
| White | `public/scenes/white.jpg` | 1600×659 | `public/scenes/white-remaster.webp` (1954×805) |

The six remasters are AI-assisted interpretations made with an image generation edit workflow, using the corresponding original scene as the sole composition reference. They preserve the broad composition and landmarks while reconstructing fine texture. The tool returned roughly 1.2× source width despite larger requested canvases. No output was resized after generation; the final lossless WebP conversion added no sharpening or image-service recompression. These are not recovered 4K originals. Original files are preserved beside the remasters.

Blue was created by the coordinator; Luna generated and reviewed the other five. The prompts and selection notes are in [`assets/remasters/`](../assets/remasters/). Intermediate candidate PNGs and the review contact sheet are not included in this public repository.

## Splash and motion media

| File | Provenance and processing |
| --- | --- |
| `public/scenes/original-splash.mp4` | Core frames 60–108, cropped to 947×810 artwork bounds and rendered at 2×; 41 fps, 1.195 s. Original vector assembly and central light, with the baked status layer removed. One failed frame export uses its adjacent frame. Silent in this repository. |
| `public/scenes/original-splash.webp` | 1894×1620 poster from the same original artwork. The embedded cloud texture remains natively 945×810; vector layers render at 2×. |
| `public/scenes/splash-vector.svg` | Original core frame 108 SVG, cropped to artwork bounds; baked loader/wordmark removed, with original vector glow retained and a subtle opacity pulse added. |
| `public/scenes/attractor-logotype.svg` | Vector wordmark from the official archive gate, restored as a separate overlay. |
| `public/films/six-worlds.mp4` | New 1920×800, 30 fps, 24-second motion study of the six remasters with gentle pans and fades. It has no embedded audio track and is not the historical demo reel. |

## Audio

The WAV files below were independently decoded from original Flash core or matte sources, trimmed to SWF sample counts, and kept as separate runtime cues. MP3 padding was removed; no music-containing video recording was used as an audio source.

| File | Source identity and exact measurement |
| --- | --- |
| `public/audio/original-loading.wav` | Core `myLoop01`; mono 44.1 kHz, 284160 samples after 1633 seek samples, 6.443537 s. |
| `public/audio/original-music.wav` | Core `sndSoundtrack`; stereo 44.1 kHz, 403200 samples after 1673 seek samples, 9.142857 s. |
| `public/audio/root-id-143-source-count.wav` | Core assembly one-shot at root frame 61; mono 44.1 kHz, exact 8.3235-second source count after the 1633-sample MP3 seek. |
| `public/audio/nav-hover.wav`, `item-hover.wav`, `mini-hover.wav` | Original core rollover sounds 166, 251, and 391, with MP3 latency removed and exact SWF sample counts retained. |
| `public/audio/navigation-open.wav`, `panel-open.wav` | Original core sounds 95 and 336. The full navigation show uses 95; the preview panel adapts source hover-panel sound 336. |
| `public/audio/window-title.wav` | Original core sound 450. The source MultiBox / ComponentShell / Decoder call chain triggers it after the opening resize. No invented modal-close cue is included. |
| `public/audio/original-shutter-close.wav` | Matte 1 sound 10; 29888 samples plus 6454 samples of original timeline offset. |
| `public/audio/original-shutter-open.wav` | Matte 1 sound 4; 120832 samples plus 5378 samples of original timeline offset. |

In Brave, an earlier homage revision's HTMLAudio playback repeated at about 9.259 s instead of the 9.142857 s music asset duration, adding roughly 116 ms at each restart. The app uses one continuously looping Web Audio buffer to remove those seek/restart gaps while preserving the original quieter musical passage. The historical recording did not reliably isolate every short hover or title cue; their identification follows original source placement rather than claiming an exact recording match.

## Rive and UI runtimes

The editable shutter source is [`assets/rive/scene.rml`](../assets/rive/scene.rml); its intentionally compiled output is [`public/rive/attractor-shutters.riv`](../public/rive/attractor-shutters.riv). The shipped `public/rive/canvas.wasm` is the Canvas runtime from `@rive-app/canvas` 2.42.1, used through `@rive-app/react-canvas` 4.34.2. The Rive notices are reproduced in [`third_party/rive-LICENSE.txt`](../third_party/rive-LICENSE.txt) and the [full shipped runtime notice bundle](../public/third-party-notices.txt), and apply to that Rive code only.

The reusable primitives under [`components/ui/`](../components/ui/) and the copied helpers [`lib/utils.ts`](../lib/utils.ts) and [`hooks/use-mobile.ts`](../hooks/use-mobile.ts) are generated or customized from shadcn/ui. The applicable MIT notice is reproduced verbatim in [`third_party/shadcn-LICENSE.txt`](../third_party/shadcn-LICENSE.txt), and applies to those source portions only. The browser bundle also includes the separate Base UI, Lucide, and utility notices listed in the [full shipped runtime notice bundle](../public/third-party-notices.txt). None of these notices licenses the original or adapted scene artwork, audio, branding, or the rest of this repository. The project-wide boundary is mapped in [`LICENSING.md`](../LICENSING.md).

## Rights and contact

No guessed rights statements are made for original media. No permission is documented here for the inclusion or further distribution of original artwork, audio, branding, vector files, Flash-derived files, or other source-derived media in this snapshot. Repository publication records how the reconstruction was made; it does not grant permission, determine fair use, or relicense an underlying work. The excluded media therefore needs its own legal basis for any further distribution, commercial use, deployment, or separate asset release; this document does not determine whether one exists. The new remaster interpretations and scenic film are clearly labeled as homage material and should not be presented as official recovered V5 assets. Human selection, editing, timing, and assembly may be protectable to the extent applicable law recognizes them; the project makes no blanket copyright claim over AI-only output. See [`LICENSING.md`](../LICENSING.md) for the scope map.
