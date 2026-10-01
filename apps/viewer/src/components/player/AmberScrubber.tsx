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
      {/* Timecode Hover Stamp */}
      {(isHovering || isDragging) && (
        <div
          className="absolute -top-7 px-2 py-0.5 rounded-sm bg-graphite border border-hairline font-mono text-[10px] text-signature pointer-events-none -translate-x-1/2 z-30 shadow-lg"
          style={{ left: `${isDragging ? progressPercent : (hoverX / (trackRef.current?.offsetWidth || 1)) * 100}%` }}
        >
          {formatScrubberTime(isDragging ? currentTime : hoverTime)}
        </div>
      )}

      {/* Main Track Rail (Architectural 2px hairline, expands to 4px on hover) */}
      <div className="relative w-full h-[2px] group-hover/scrubber:h-[4px] bg-graphite transition-all duration-150 overflow-hidden">
        {/* Buffered Track (Ivory 15%) */}
        <div
          className="absolute left-0 top-0 h-full bg-ivory/15"
          style={{ width: `${buffered}%` }}
        />

        {/* Played Progress Track (Solid Electric Amber #FF9F1C, No gradients) */}
        <div
          className="absolute left-0 top-0 h-full bg-signature"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Scrubber Knob Thumb: Sharp 2px Square */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 bg-signature border border-black shadow-md transition-transform duration-100 pointer-events-none ${
          isHovering || isDragging ? 'scale-100' : 'scale-0'
        }`}
        style={{ left: `${progressPercent}%` }}
      />
    </div>
  );
};
