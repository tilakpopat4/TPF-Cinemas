import React, { useState, useRef, useCallback } from 'react';

interface AmberScrubberProps {
  currentTime: number;
  duration: number;
  buffered: number;
  onSeek: (seconds: number) => void;
}

export const AmberScrubber: React.FC<AmberScrubberProps> = ({
  currentTime,
  duration,
  buffered,
  onSeek,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverX, setHoverX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);

  const totalDuration = duration > 0 ? duration : 1;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / totalDuration) * 100));

  const calculateTimeFromX = useCallback(
    (clientX: number): number => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      return fraction * totalDuration;
    },
    [totalDuration]
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.min(rect.width, Math.max(0, e.clientX - rect.left));
    setHoverX(x);
    setHoverTime((x / rect.width) * totalDuration);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const newTime = calculateTimeFromX(e.clientX);
    onSeek(newTime);

    const onGlobalMouseMove = (moveEvent: MouseEvent) => {
      const seekTime = calculateTimeFromX(moveEvent.clientX);
      onSeek(seekTime);
    };

    const onGlobalMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onGlobalMouseMove);
      window.removeEventListener('mouseup', onGlobalMouseUp);
    };

    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    setIsDragging(true);
    const newTime = calculateTimeFromX(e.touches[0].clientX);
    onSeek(newTime);

    const onGlobalTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length === 0) return;
      const seekTime = calculateTimeFromX(moveEvent.touches[0].clientX);
      onSeek(seekTime);
    };

    const onGlobalTouchEnd = () => {
      setIsDragging(false);
      window.removeEventListener('touchmove', onGlobalTouchMove);
      window.removeEventListener('touchend', onGlobalTouchEnd);
    };

    window.addEventListener('touchmove', onGlobalTouchMove);
    window.addEventListener('touchend', onGlobalTouchEnd);
  };

  const formatScrubberTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${mins}:${pad(secs)}`;
  };

  return (
    <div
      ref={trackRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className="group/scrubber relative w-full py-3 cursor-pointer select-none flex items-center"
    >
      {/* Floating Hover Timestamp Tooltip */}
      {(isHovering || isDragging) && (
        <div
          className="absolute -top-7 px-2 py-0.5 rounded-md bg-black/90 border border-white/20 text-[11px] font-mono font-medium text-amber-400 shadow-xl backdrop-blur-md pointer-events-none -translate-x-1/2 z-30 transition-transform duration-75"
          style={{ left: `${isDragging ? progressPercent : (hoverX / (trackRef.current?.offsetWidth || 1)) * 100}%` }}
        >
          {formatScrubberTime(isDragging ? currentTime : hoverTime)}
        </div>
      )}

      {/* Main Track Rail */}
      <div className="relative w-full h-1.5 group-hover/scrubber:h-2.5 bg-white/20 rounded-full transition-all duration-200 overflow-hidden">
        {/* Buffered Track (Translucent White) */}
        <div
          className="absolute left-0 top-0 h-full bg-white/30 rounded-full transition-all duration-300"
          style={{ width: `${buffered}%` }}
        />

        {/* Played Progress Track (Glowing Amber Gradient) */}
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.7)] transition-all duration-75"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Scrubber Knob Thumb */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-amber-400 border-2 border-white shadow-[0_0_12px_rgba(245,158,11,0.9)] transition-transform duration-150 pointer-events-none ${
          isHovering || isDragging ? 'scale-100' : 'scale-0'
        }`}
        style={{ left: `${progressPercent}%` }}
      />
    </div>
  );
};
