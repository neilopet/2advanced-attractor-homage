# Licensing scope

This repository is an independent homage to 2Advanced V5 Attractor. The root
[`LICENSE`](LICENSE) is intended to cover original project software and
documentation only, to the extent Neil Opet and contributors hold the relevant
rights. It is not a blanket license for every file in the repository.

## Scope map

| Area | License or treatment |
| --- | --- |
| `app/`, `lib/`, `hooks/`, `tests/`, configuration, and documentation | Original project software and documentation are intended to be covered by the scoped MIT license, to the extent Neil Opet and contributors hold the relevant rights. |
| `components/ui/`, `lib/utils.ts`, and `hooks/use-mobile.ts` | Generated or customized shadcn/ui source retains the separate notice in [`third_party/shadcn-LICENSE.txt`](third_party/shadcn-LICENSE.txt); project-authored changes are covered by the scoped MIT license to the extent rights are held. |
| `assets/rive/scene.rml` and `public/rive/attractor-shutters.riv` | Project-authored animation source and compiled output are intended to be covered by the scoped MIT license to the extent rights are held. The Rive file format and runtime remain separately licensed. |
| `public/rive/canvas.wasm` and Rive runtime code | Rive's MIT license and notice apply. See [`third_party/rive-LICENSE.txt`](third_party/rive-LICENSE.txt) and the [full shipped runtime notices](public/third-party-notices.txt). |
| `app/github-icon.tsx` | One Font Awesome Free 6.7.2 GitHub brand SVG path, used under CC BY 4.0; this third-party icon exception is outside the project MIT grant. See [`public/third-party-notices.txt`](public/third-party-notices.txt). |
| `public/scenes/`, `public/audio/`, and `public/films/` | Historical or source-derived media, AI-assisted remaster interpretations, and the new scenic film are outside the project MIT grant. Their provenance and rights boundary are recorded in [`docs/ASSET-CREDITS.md`](docs/ASSET-CREDITS.md). |
| `third_party/` and `public/third-party-notices.txt` | Vendor notices and license texts are included to identify third-party material. They do not relicense the project or the media. |

This scope map describes the intended boundary for the repository's own grant;
it does not determine ownership, permission, fair use, or the copyright status
of any particular work.

## Project authorship and AI-assisted material

The software and visuals were developed with AI assistance. The project
intends to license its original software and documentation only to the extent
Neil Opet and contributors hold rights in them. Human direction, selection,
arrangement, editing, timing, or other creative contributions may be
protectable to the extent applicable law recognizes them, while AI-only output
may not receive the same protection. The project makes no blanket copyright
claim over AI-generated pixels or other machine-generated output.

The original panoramas, extracted audio, original vector and Flash-derived
material, branding, and works underlying the remasters remain separate from
the project-owned code. The scenic film is a new silent selection and
arrangement built from the remaster interpretations, but this description does
not grant or determine rights in its underlying media.

Attribution, a noncommercial label, or a statement that a work is an homage is
not a permission or a relicensing grant. No permission is documented here for
the inclusion or further distribution of the original or source-derived media;
that excluded media needs its own legal basis for any distribution. This
statement does not determine whether one exists.

## Third-party runtime notices

The browser build redistributes runtime code under its vendors' licenses. The
curated, versioned notice bundle is [`public/third-party-notices.txt`](public/third-party-notices.txt);
it includes the observed Rive, React, Base UI/Floating UI, Lucide, utility,
Vinext, and related runtime closure notices. Keep it aligned with actual
browser imports when runtime versions or imported components change. Build
tools and unused scaffold packages are not automatically part of the shipped
runtime notice set.

The two existing notices under [`third_party/`](third_party/) remain useful
source-level references. Preserve each vendor's copyright and license text
when copying or redistributing the relevant code.

## Historical acknowledgments

This homage acknowledges the original 2Advanced V5 Attractor work and the
documented contributions of Eric Jordan, Tony Novak, John Carroll, Shane
Mielke, and the wider V5 artists, developers, and sound contributors. The
acknowledgment does not imply affiliation, endorsement, ownership, or a license
from any of them. See the [asset credits and provenance](docs/ASSET-CREDITS.md)
for the source references.

## Static publication

The independent GitHub Pages profile uses a `build:static` command and
`NEXT_PUBLIC_BASE_PATH`, which defaults to an empty value and can be set to the
repository base path for a project site. A build such as
`NEXT_PUBLIC_BASE_PATH=/2advanced-attractor-homage npm run build:static` writes
the static client to `dist/client`; the host mounts that output at the same
configured prefix. Website deployment remains separate from the source license
and the media rights boundary. The [browser-facing licensing page](public/licensing.html)
links to this scope map and the shipped notices.

## Open rights questions

This snapshot does not resolve who may authorize the original artwork, audio,
branding, vector files, Flash-derived files, or other underlying works, or
whether a remaster tool's terms cover a particular distribution. The project
MIT grant and its attribution do not supply that missing media basis. No
conclusion about fair use or another legal exception is made here.
