# Attractor scene remasters

These six images are reference-guided, AI-assisted remaster interpretations for the homage. Each keeps the broad composition and major landmarks of its corresponding original scene while reconstructing fine texture. They are not recovered historical pixels or 4K originals.

The adopted runtime files are lossless WebP files in [`public/scenes/`](../../public/scenes/). The original source images remain beside them. Intermediate candidate PNGs and the reduced review contact sheet were used during selection and are intentionally not included in this public repository.

| Scene | Original source | Adopted runtime file | Native dimensions |
| --- | --- | --- | ---: |
| Blue | [`blue.webp`](../../public/scenes/blue.webp), 1600×659 | [`blue-remaster.webp`](../../public/scenes/blue-remaster.webp) | 1954×805 |
| Green | [`green.webp`](../../public/scenes/green.webp), 1600×612 | [`green-remaster.webp`](../../public/scenes/green-remaster.webp) | 2027×776 |
| Yellow | [`yellow.webp`](../../public/scenes/yellow.webp), 1600×629 | [`yellow-remaster.webp`](../../public/scenes/yellow-remaster.webp) | 2001×786 |
| Red | [`red.webp`](../../public/scenes/red.webp), 1600×624 | [`red-remaster.webp`](../../public/scenes/red-remaster.webp) | 2008×783 |
| Pink | [`pink.jpg`](../../public/scenes/pink.jpg), 1600×659 | [`pink-remaster.webp`](../../public/scenes/pink-remaster.webp) | 1954×805 |
| White | [`white.jpg`](../../public/scenes/white.jpg), 1600×659 | [`white-remaster.webp`](../../public/scenes/white-remaster.webp) | 1954×805 |

No output was resized after generation, and the final lossless WebP conversion added no sharpening or image-service recompression. The generator returned about 1.2× the source width despite larger requested canvases. Full-screen cover therefore still crops and magnifies the panoramas on tall or high-density displays. Pink has somewhat stronger blossoms and a more visible moon; small texture and silhouette differences in every remaster are expected.

The five non-Blue images were made with the built-in image generation edit workflow using one local source image per call. Blue was created by the coordinator. The reusable prompts are kept in [`PROMPTS.md`](PROMPTS.md) and [`BLUE-PROMPT.md`](BLUE-PROMPT.md); they document intent, constraints, and the requested canvas, not the final returned dimensions.

The 1920×800, 30 fps, 24-second [`six-worlds.mp4`](../../public/films/six-worlds.mp4) is a new silent scenic film assembled from these remasters. It is not the historical Attractor demo reel.
