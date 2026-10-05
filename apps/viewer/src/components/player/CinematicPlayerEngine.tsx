import React, { useRef, useEffect } from 'react';
import { Film } from '../../types';
import { VideoPlayerController } from '../../hooks/useVideoPlayer';
import { extractYouTubeId, parseAspectRatio } from '../../lib/utils';
import { Film as FilmIcon, Loader2 } from 'lucide-react';

interface CinematicPlayerEngineProps {
  film: Film;
  controller: VideoPlayerController;
  initialProgressSeconds?: number;
  onTogglePlay: () => void;
  onDoubleTapFullscreen: () => void;
}

export const CinematicPlayerEngine: React.FC<CinematicPlayerEngineProps> = ({
  film,
  controller,
  initialProgressSeconds = 0,
  onTogglePlay,
  onDoubleTapFullscreen,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const videoId = extractYouTubeId(film.video_ref);
  const isDirectVideo = film.video_provider === 'mux' || film.video_ref?.match(/\.(mp4|webm|m3u8)($|\?)/i);

  // Freeze initial start offset on mount so the iframe src remains constant and NEVER reloads during playback
  const initialStartRef = useRef(initialProgressSeconds || 0);

  // Register iframe or video element with controller once on mount
  useEffect(() => {
    if (isDirectVideo && videoRef.current) {
      controller.registerVideoElement(videoRef.current);
    } else if (iframeRef.current) {
      controller.registerIframe(iframeRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirectVideo]);

  // Click vs Double-click gesture handler for video canvas
  const handleOverlayClick = () => {
    // Only handle if clicking the overlay backdrop itself
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      onDoubleTapFullscreen();
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        onTogglePlay();
        clickTimeoutRef.current = null;
      }, 250);
    }
  };

  const aspect = parseAspectRatio(film.aspect_ratio);
  // Largest box of the declared ratio that fits inside the screen — no cropping
  const stageStyle: React.CSSProperties = {
    aspectRatio: String(aspect),
    width: `min(100vw, calc(100vh * ${aspect}))`,
  };
  const isStandardWide = Math.abs(aspect - 16 / 9) < 0.01;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center select-none">
      {/* Native HTML5 Video Stream */}
      {isDirectVideo ? (
        <div className="relative max-h-full" style={stageStyle}>
          <video
            ref={videoRef}
            src={film.video_ref}
            autoPlay
            playsInline
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>
      ) : videoId ? (
        /* Chromeless YouTube Player inside a stage that matches the creator's aspect ratio */
        <div className="relative max-h-full overflow-hidden pointer-events-none" style={stageStyle}>
          <iframe
            ref={iframeRef}
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}&start=${initialStartRef.current}`}
            title={film.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className={`w-full h-full border-none pointer-events-none ${isStandardWide ? 'scale-[1.04]' : ''}`}
          />
        </div>
      ) : (
        /* Fallback when video stream is missing */
        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 bg-zinc-950">
          <FilmIcon className="h-16 w-16 mb-4 text-zinc-600 animate-pulse" />
          <p className="text-base font-medium text-zinc-300">Video stream not available</p>
          <p className="text-xs text-zinc-500 mt-1">Please check back shortly.</p>
        </div>
      )}

      {/* Buffering Indicator */}
      {controller.isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none z-20">
          <Loader2 className="h-14 w-14 text-amber-500 animate-spin" />
        </div>
      )}

      {/* Transparent Gesture Interceptor Overlay */}
      <div
        onClick={handleOverlayClick}
        className="absolute inset-0 z-10 cursor-pointer pointer-events-auto"
        title="Click to Play/Pause • Double-click for Fullscreen"
      />
    </div>
  );
};
