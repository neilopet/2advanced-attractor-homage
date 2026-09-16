# Contribution and release guide

This repository is a compact, public snapshot of the Attractor homage. Keep changes focused on the experience, its documentation, and its versioned media. Read the relevant source and documentation before changing behavior.

## Scope

- Preserve the homage's six-world journey, atmospheric entrance, shutter navigation, soundscape, preview film, and accessible controls.
- Reuse the existing React, TypeScript, Vinext, Rive, and Web Audio primitives. Do not add a new framework, workflow, CMS, database, or general animation system for a local improvement.
- Treat this checkout as the public development repository and v0.1.0 baseline. Keep its source, docs, tests, and versioned runtime media coherent; a future deployed Site is a separate concern.
- GitHub source publishing is separate from website deployment. Do not create hosting configuration, register a Site, or publish a website as part of repository work.
- Keep the lockfile in sync with dependency changes. Prefer `npm ci` for a clean local install.

## Runtime invariants

- Keep the any-to-any decoded-scene gate: every destination scene must decode before an opening can reveal it.
- Update the palette only while the viewport is covered and release clipping after compatible inset animation endpoints, so menus and popovers remain usable.
- Release the cover from Rive's Advance-to-`requestAnimationFrame` first-painted opening frame. Rive Canvas does not provide the prior Draw event; do not reintroduce a Draw-only gate.
- In `app/page.tsx`, `Shutters.onStart` uses the render-captured `boot === 'revealing'` (not `bootRef.current`) to call `startMusic(1270, 510)`. Child/parent callback ordering makes that distinction important.
- The splash `<video>`'s `onPlaying` starts the original assembly one-shot (ID 143); the film Dialog's `onOpenChangeComplete` triggers `windowTitle` (ID 450) and starts its silent video.
- Keep music as one decoded Web Audio buffer with one continuous loop. Loading ambience, assembly, shutters, and interface cues stay independent.
- Preserve the first-reveal music envelope: a 510 ms hold followed by a 1270 ms fade.
- Keep arrival timers cancellable. Sequence completion must not depend on hidden, removed, or responsive elements being present.
- Preserve replay, mute and saved volume, reduced motion, keyboard navigation, focus restoration, Escape handling, and rapid-input guards.
- Preserve the shutter's source study: 41 fps, close 34 frames (about 0.829 s), and open 73 frames (about 1.780 s), unless a documented reconstruction decision changes it.

## Source and asset rules

- Keep public runtime paths stable. Version `public/**`, including `public/rive/canvas.wasm`, `public/rive/*.riv`, scenes, audio, and film media.
- Edit Rive sources under `assets/rive/**`. Generated Rive build output belongs under `assets/rive/build/` and is ignored.
- When intentionally changing compiled Rive output, compile from the editable source and update the corresponding versioned file in `public/rive/`.
- Preserve original scene images, original splash files, and original extracted audio beside any remaster or reconstruction. Do not replace originals with interpretations.
- Document asset provenance, dimensions, processing, and known caveats in [`docs/ASSET-CREDITS.md`](docs/ASSET-CREDITS.md) or the relevant asset note.
- Label AI-assisted remasters as interpretations. They are lossless returned-size outputs, not recovered historical detail or 4K originals.
- Do not guess rights, invent original credits, or imply affiliation, ownership, or license grants for 2Advanced media, branding, artwork, audio, or source files.
- Keep the Rive runtime license scoped to the runtime. [`third_party/rive-LICENSE.txt`](third_party/rive-LICENSE.txt) does not license the rest of this repository.
- Keep the shadcn/ui notice scoped to the reusable primitives. [`third_party/shadcn-LICENSE.txt`](third_party/shadcn-LICENSE.txt) does not license the rest of this repository.
- Keep curated reusable notes, examples, and studies in `docs/` or `assets/`. Do not add raw downloaded studies, screenshots, logs, deployment tarballs, or local evidence to the public snapshot.
- Local evidence belongs under ignored `artifacts/`, `scratch/`, `evidence/`, or `review/` while it is being inspected.
- Never include private user data, credentials, tokens, private keys, private account identifiers, or owner-specific hosting/deployment IDs in source, docs, media metadata, or examples. Public GitHub owner links and intentional noreply commit identity are allowed.

## Documentation

- Keep the root README welcoming and concise: what the experience is, how to run it, the repository map, credits, and scope.
- Put timing measurements, browser findings, audio counts, reconstruction caveats, and other detailed evidence in [`docs/EXPERIENCE.md`](docs/EXPERIENCE.md).
- Put source links, media provenance, rights boundaries, and third-party notices in [`docs/ASSET-CREDITS.md`](docs/ASSET-CREDITS.md).
- Keep remaster candidates and review artifacts out of public references when the files are not shipped. The adopted files and source distinctions are recorded in [`assets/remasters/README.md`](assets/remasters/README.md).
- Use relative links for repository files. Check that every local Markdown link resolves from the document that contains it.
- Do not add CI badges or claim checks are passing unless a real, reproducible check supports the claim.

## Validation

Run the checks appropriate to the change and report failures clearly:

```bash
npm test
npx tsc --noEmit
npx oxlint app lib tests
npm run build
```

- The generated starter includes unused UI components and `hooks/use-mobile.ts` with old lint failures. The product scope is `app`, `lib`, and `tests`; do not conceal unrelated scaffold failures by weakening lint configuration.
- For UI changes, also check a real browser path: initial loading, visible first opening, any-to-any navigation, preview video, replay, mute, keyboard focus, Escape, narrow layout, and reduced motion.
- For media changes, verify dimensions, encoding, duration, channel count, sample rate, and intended source/remaster distinction. Preserve exact source sample counts and documented caveats.
- Do not run a build or install merely to edit documentation when another authorized preflight owns that work; document checks that were intentionally not run.

## Releases and security

- A public release requires explicit task authorization. Before publishing, inspect the staged file list and the full history for secrets or private identifiers.
- Use environment placeholders in examples. Never commit auth tokens, cookies, private keys, private account IDs, owner-specific deployment project IDs, or machine-specific absolute paths.
- Use reproducible source and inspect generated output before release. Do not force-push or move an existing tag.
- Use annotated SemVer tags for intentional releases. Keep release notes factual and link to the relevant documentation.
- A GitHub source release does not authorize website deployment. Treat deployment as a separate task with its own scope.

## Delegated work

For bounded delegated changes, the coordinator sets a clear plan and acceptance checks, gives the executor exclusive paths and exact targets or commands for sensitive or irreversible work, and uses GPT-5.6 Luna at xhigh when that route is available. The coordinator independently reviews and validates the result. If the requested route is unavailable, disclose that constraint rather than silently substituting another route.
