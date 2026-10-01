import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize2,
  Minimize2,
  Info,
  Check,
} from 'lucide-react';
import { VideoPlayerController } from '../../hooks/useVideoPlayer';
import { AmberScrubber } from './AmberScrubber';

interface CinematicTransportHUDProps {
  controller: VideoPlayerController;
  filmTitle: string;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  showDetailsDrawer: boolean;
  onToggleDetailsDrawer: () => void;
  lastGesture: { type: 'play' | 'pause' | 'skip-forward' | 'skip-backward'; id: number } | null;
}

export const CinematicTransportHUD: React.FC<CinematicTransportHUDProps> = ({
  controller,
  filmTitle,
  isFullscreen,
  onToggleFullscreen,
  showDetailsDrawer,
  onToggleDetailsDrawer,
  lastGesture,
}) => {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const speedMenuRef = useRef<HTMLDivElement>(null);

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) {
        setShowSpeedMenu(false);
      }
    };
    if (showSpeedMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSpeedMenu]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${mins}:${pad(secs)}`;
  };

  return (
    <>
      {/* Center Screen Feedback (Architectural Sharp Badge) */}
      <AnimatePresence>
        {lastGesture && (
          <div
            key={lastGesture.id}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          >
            <motion.div
              className="h-16 w-16 bg-graphite/90 border border-signature text-signature flex flex-col items-center justify-center rounded-sm shadow-2xl"
              initial={{ scale: 0.8, opacity: 0.9 }}
              animate={{ scale: 1.1, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {lastGesture.type === 'play' && <Play className="h-8 w-8 fill-current ml-0.5" />}
              {lastGesture.type === 'pause' && <Pause className="h-8 w-8 fill-current" />}
              {lastGesture.type === 'skip-forward' && (
                <div className="flex flex-col items-center">
                  <RotateCw className="h-6 w-6" />
                  <span className="font-mono text-[9px] font-bold mt-0.5">+10s</span>
                </div>
              )}
              {lastGesture.type === 'skip-backward' && (
                <div className="flex flex-col items-center">
                  <RotateCcw className="h-6 w-6" />
                  <span className="font-mono text-[9px] font-bold mt-0.5">-10s</span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-40 px-4 sm:px-8 pb-6 pt-12 bg-gradient-to-t from-canvas via-canvas/80 to-transparent pointer-events-auto border-t border-hairline/30">
        {/* Signature Amber Scrubber */}
        <AmberScrubber
          currentTime={controller.currentTime}
          duration={controller.duration}
          buffered={controller.buffered}
          onSeek={controller.seek}
        />

        {/* Transport Toolbar Row */}
        <div className="flex items-center justify-between pt-1">
          {/* Left: Play/Pause, 10s Skips, Volume, Timecode */}
          <div className="flex items-center gap-3">
            {/* Play / Pause Toggle Button (Solid Signature Square) */}
            <button
              onClick={controller.togglePlay}
              className="h-9 w-9 rounded-sm bg-signature hover:bg-[#f79612] text-black flex items-center justify-center transition-transform hover:-translate-y-0.5 shrink-0"
              title={controller.isPlaying ? 'Pause (Space or K)' : 'Play (Space or K)'}
            >
              {controller.isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Rewind 10 Seconds */}
            <button
              onClick={() => controller.skip(-10)}
              className="p-2 text-muted hover:text-ivory hover:bg-graphite rounded-sm transition-colors relative"
              title="Rewind 10 seconds (J or ←)"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-muted">
                10
              </span>
            </button>

            {/* Fast-Forward 10 Seconds */}
            <button
              onClick={() => controller.skip(10)}
              className="p-2 text-muted hover:text-ivory hover:bg-graphite rounded-sm transition-colors relative"
              title="Forward 10 seconds (L or →)"
            >
              <RotateCw className="h-4 w-4" />
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-muted">
                10
              </span>
            </button>

            {/* Volume Control */}
            <div
              className="flex items-center gap-1.5"
              onMouseEnter={() => setIsVolumeHovered(true)}
              onMouseLeave={() => setIsVolumeHovered(false)}
            >
              <button
                onClick={controller.toggleMute}
                className="p-2 text-muted hover:text-ivory hover:bg-graphite rounded-sm transition-colors"
                title={controller.isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {controller.isMuted || controller.volume === 0 ? (
                  <VolumeX className="h-4 w-4 text-red-400" />
                ) : controller.volume < 50 ? (
                  <Volume1 className="h-4 w-4 text-ivory" />
                ) : (
                  <Volume2 className="h-4 w-4 text-signature" />
                )}
              </button>

              <div
                className={`overflow-hidden transition-all duration-150 flex items-center ${
                  isVolumeHovered ? 'w-20 opacity-100' : 'w-0 opacity-0'
                }`}
              >
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={controller.isMuted ? 0 : controller.volume}
                  onChange={(e) => controller.setVolume(Number(e.target.value))}
                  className="w-full h-1 bg-graphite accent-[#FF9F1C] cursor-pointer"
                  title="Volume"
                />
              </div>
            </div>

            {/* Timecode Readout */}
            <div className="text-xs font-mono text-muted select-none hidden sm:flex items-center gap-1.5">
              <span className="text-ivory font-medium">{formatTime(controller.currentTime)}</span>
              <span>/</span>
              <span>{formatTime(controller.duration)}</span>
            </div>
          </div>

          {/* Center: Film Title */}
          <div className="hidden lg:block font-editorial text-sm text-ivory/80 truncate max-w-sm text-center">
            {filmTitle}
          </div>

          {/* Right: Speed, 4K Badge, Info Drawer, Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Playback Speed Popover */}
            <div className="relative" ref={speedMenuRef}>
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className={`px-2 py-1 rounded-sm text-xs font-mono border transition-colors ${
                  controller.playbackRate !== 1.0
                    ? 'bg-signature text-black border-signature font-bold'
                    : 'bg-graphite hover:bg-[#25252b] border-hairline text-muted hover:text-ivory'
                }`}
                title="Playback Speed"
              >
                {controller.playbackRate}x
              </button>

              <AnimatePresence>
                {showSpeedMenu && (
                  <motion.div
                    className="absolute bottom-10 right-0 py-1 w-32 rounded-sm bg-graphite border border-hairline text-xs z-50 shadow-2xl"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.12 }}
                  >
                    <div className="px-3 py-1 text-[9px] font-mono font-bold text-muted uppercase tracking-widest border-b border-hairline">
                      Speed
                    </div>
                    {speedOptions.map((rate) => (
                      <button
                        key={rate}
                        onClick={() => {
                          controller.setPlaybackRate(rate);
                          setShowSpeedMenu(false);
                        }}
                        className={`w-full px-3 py-1.5 flex items-center justify-between text-left font-mono text-xs transition-colors ${
                          controller.playbackRate === rate
                            ? 'text-signature font-bold bg-canvas'
                            : 'text-ivory hover:bg-canvas'
                        }`}
                      >
                        <span>{rate === 1.0 ? '1.0x (Normal)' : `${rate}x`}</span>
                        {controller.playbackRate === rate && <Check className="h-3 w-3" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quality Stamp */}
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-sm font-mono text-[9px] uppercase tracking-wider bg-graphite border border-hairline text-signature">
              4K UHD
            </span>

            {/* Film Info & Notes Drawer Toggle */}
            <button
              onClick={onToggleDetailsDrawer}
              className={`p-2 rounded-sm border transition-colors ${
                showDetailsDrawer
                  ? 'bg-signature text-black border-signature'
                  : 'bg-graphite hover:bg-[#25252b] border-hairline text-muted hover:text-ivory'
              }`}
              title="Curatorial Notes (I)"
            >
              <Info className="h-4 w-4" />
            </button>

            {/* Browser Fullscreen Toggle */}
            <button
              onClick={onToggleFullscreen}
              className="p-2 rounded-sm bg-graphite hover:bg-[#25252b] text-muted hover:text-ivory border border-hairline transition-colors"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
