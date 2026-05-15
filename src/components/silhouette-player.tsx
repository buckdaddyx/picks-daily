"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  src: string;
  poster?: string;
  /** Optional caption shown over the video, e.g. "Spot the player in red". */
  caption?: string;
  /** When true the play graphic on top is hidden (e.g. inside dialogs). */
  autoPlay?: boolean;
  className?: string;
};

/**
 * Vertical 9:16 silhouette video player styled like a short-form clip.
 * Tap to play / pause, double-tap to restart, mute toggle in the corner.
 *
 * Falls back to a static placeholder graphic when the video file 404s — useful
 * during development before real silhouette MP4s are dropped in /public/videos.
 */
export function SilhouettePlayer({
  src,
  poster,
  caption,
  autoPlay = true,
  className,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [errored, setErrored] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      setProgress(v.currentTime);
      setDuration(v.duration || 0);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setShowOverlay(true);
    };
    const onError = () => setErrored(true);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);
    v.addEventListener("error", onError);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("error", onError);
    };
  }, []);

  // Autoplay attempt on mount (browser must allow muted autoplay).
  useEffect(() => {
    if (!autoPlay) return;
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = async () => {
      try {
        await v.play();
        setShowOverlay(false);
      } catch {
        /* user gesture required — overlay stays */
      }
    };
    tryPlay();
  }, [autoPlay, src]);

  const toggle = async () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      try {
        await v.play();
        setShowOverlay(false);
      } catch {}
    } else {
      v.pause();
      setShowOverlay(true);
    }
  };

  const restart = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const pct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  return (
    <div
      className={cn(
        "group relative w-full overflow-hidden rounded-3xl border border-border bg-zinc-950 select-none",
        "aspect-[9/16] max-h-[72dvh]",
        "shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      {/* Background grain / vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(120%_80%_at_50%_50%,transparent_60%,rgba(0,0,0,0.55)_100%)]"
      />

      {!errored ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          playsInline
          loop
          muted={muted}
          preload="metadata"
          onClick={toggle}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <FallbackArt onClick={toggle} />
      )}

      {/* Caption */}
      {caption && (
        <div className="absolute left-3 top-3 z-20 max-w-[80%]">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent pulse-red" />
            {caption}
          </div>
        </div>
      )}

      {/* Mute toggle */}
      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        className="absolute right-3 top-3 z-20 rounded-full bg-black/60 p-2 text-white/90 backdrop-blur hover:bg-black/80 transition-colors"
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>

      {/* Replay button */}
      <button
        type="button"
        onClick={restart}
        aria-label="Replay"
        className="absolute right-3 bottom-6 z-20 rounded-full bg-black/60 p-2 text-white/90 backdrop-blur hover:bg-black/80 transition-colors"
      >
        <RotateCcw className="h-4 w-4" />
      </button>

      {/* Center play overlay */}
      <AnimatePresence>
        {showOverlay && !playing && (
          <motion.button
            type="button"
            onClick={toggle}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-20 m-auto flex h-20 w-20 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur ring-1 ring-white/15"
            aria-label="Play"
          >
            <Play className="ml-0.5 h-9 w-9" fill="currentColor" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Pause hint while playing (subtle) */}
      {playing && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Pause"
          className="absolute inset-0 z-10 cursor-pointer"
        >
          <span className="sr-only">Pause</span>
          <Pause className="absolute right-3 bottom-16 h-4 w-4 text-white/0 group-hover:text-white/80 transition-colors" />
        </button>
      )}

      {/* Progress bar */}
      <div className="absolute inset-x-3 bottom-2 z-20 h-1 rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-accent shadow-[0_0_10px_rgba(255,42,42,0.7)] transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Static silhouette graphic shown when no video is available. */
function FallbackArt({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-center"
    >
      {/* SVG silhouette of a player */}
      <svg
        viewBox="0 0 200 320"
        className="h-3/5 w-auto opacity-90"
        aria-hidden
      >
        <defs>
          <radialGradient id="spot" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#ff2a2a" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ff2a2a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="200" height="320" fill="url(#spot)" />
        {/* Field lines */}
        {[40, 80, 120, 160, 200, 240, 280].map((y) => (
          <line
            key={y}
            x1="0"
            x2="200"
            y1={y}
            y2={y}
            stroke="#222"
            strokeWidth="1"
          />
        ))}
        {/* Highlighted player silhouette in red */}
        <g fill="#ff2a2a">
          <circle cx="100" cy="120" r="18" />
          <path d="M70 200 Q100 150 130 200 L128 230 Q100 215 72 230 Z" />
          <rect x="78" y="225" width="14" height="42" rx="6" />
          <rect x="108" y="225" width="14" height="42" rx="6" />
          <rect x="55" y="155" width="14" height="40" rx="6" transform="rotate(-25 62 175)" />
          <rect x="131" y="155" width="14" height="40" rx="6" transform="rotate(25 138 175)" />
        </g>
        {/* Other players in dark gray silhouette */}
        <g fill="#3a3a3a">
          <circle cx="40" cy="100" r="10" />
          <rect x="33" y="110" width="14" height="28" rx="4" />
          <circle cx="160" cy="100" r="10" />
          <rect x="153" y="110" width="14" height="28" rx="4" />
          <circle cx="60" cy="260" r="10" />
          <rect x="53" y="270" width="14" height="28" rx="4" />
          <circle cx="140" cy="260" r="10" />
          <rect x="133" y="270" width="14" height="28" rx="4" />
        </g>
      </svg>
      <div className="px-6 text-xs uppercase tracking-[0.25em] text-muted-foreground">
        Drop your silhouette MP4 in{" "}
        <code className="text-foreground/90">/public/videos</code>
      </div>
    </button>
  );
}
