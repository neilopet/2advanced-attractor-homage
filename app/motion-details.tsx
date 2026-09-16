'use client';

import { useRef, useState, type CSSProperties } from 'react';
import NextImage from 'next/image';
import { Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import type { InterfaceCue } from '@/lib/soundscape';
import { withBasePath } from '@/lib/base-path';

export function FeaturedPreview({
  poster,
  accent,
  rgb,
  onCue,
  arrivalMarker,
  arrived,
}: {
  poster: string;
  accent: string;
  rgb: string;
  onCue: (cue: InterfaceCue) => void;
  arrivalMarker: string;
  arrived: boolean;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [filmOpen, setFilmOpen] = useState(false);
  const [filmTitleDecoded, setFilmTitleDecoded] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const style = {
    '--scene-accent': accent,
    '--scene-rgb': rgb,
  } as CSSProperties;
  function changeFilm(open: boolean) {
    setFilmOpen(open);
    setPreviewOpen(false);
    if (open) setFilmTitleDecoded(false);
    else video.current?.pause();
  }
  return (
    <>
      <Popover
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (open) onCue('panel');
        }}
      >
        <h2
          className="preview-heading"
          data-arrival={arrivalMarker}
          data-arrived={arrived}
        >
          <PopoverTrigger
            ref={trigger}
            openOnHover
            delay={180}
            closeDelay={220}
            className="preview-heading-button"
            aria-label="Preview featured project"
            data-interface-sound-handled
          >
            <span>Featured project</span>
            <span className="preview-heading-mark">+</span>
          </PopoverTrigger>
        </h2>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={8}
          className="project-preview"
          style={style}
        >
          <span className="preview-kicker">FEATURED / MOTION STUDY</span>
          <Button
            variant="ghost"
            className="film-preview-button"
            onClick={() => changeFilm(true)}
            aria-label="Play Six Worlds film"
          >
            <NextImage
              src={poster}
              alt=""
              width={1954}
              height={805}
              unoptimized
            />
            <span className="film-play-icon">
              <Play fill="currentColor" />
            </span>
            <span className="film-play-label">PLAY FILM</span>
          </Button>
          <div className="preview-caption">
            <strong>Attractor / Six worlds</strong>
            <span>00:24</span>
          </div>
          <p>A passage through six imagined landscapes.</p>
        </PopoverContent>
      </Popover>
      <Dialog
        open={filmOpen}
        onOpenChange={changeFilm}
        onOpenChangeComplete={(open) => {
          if (open) {
            setFilmTitleDecoded(true);
            onCue('windowTitle');
            void video.current?.play().catch(() => {});
          }
        }}
      >
        <DialogContent
          className="film-window"
          style={style}
          showCloseButton={false}
          finalFocus={trigger}
        >
          <div className="film-titlebar">
            <DialogTitle data-decoding={filmTitleDecoded}>
              [ SIX WORLDS / FILM ]
            </DialogTitle>
            <DialogClose
              render={
                <Button variant="ghost" className="micro-button film-close" />
              }
              aria-label="Close film"
            >
              CLOSE <X size={12} />
            </DialogClose>
          </div>
          <DialogDescription className="sr-only">
            An animated tour of the six Attractor worlds. Use the video controls
            to play, pause, seek, or enter full screen.
          </DialogDescription>
          <video
            ref={video}
            className="world-film"
            src={withBasePath('/films/six-worlds.mp4')}
            poster={poster}
            controls
            playsInline
            muted
            preload="none"
          />
          <div className="film-footnote">
            <span>ATTRACTOR / AN INDEPENDENT HOMAGE</span>
            <span>06 ENVIRONMENTS</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
