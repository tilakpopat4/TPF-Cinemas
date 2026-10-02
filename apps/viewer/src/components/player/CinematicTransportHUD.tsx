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
      {/* Center Screen Feedback */}
      <AnimatePresence>
        {lastGesture && (
          <div
            key={lastGesture.id}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          >
            <motion.div
              className="h-20 w-20 bg-black/80 backdrop-blur-xl text-amber-400 flex flex-col items-center justify-center rounded-full shadow-2xl border border-white/10"
              initial={{ scale: 0.8, opacity: 0.9 }}
              animate={{ scale: 1.1, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {lastGesture.type === 'play' && <Play className="h-9 w-9 fill-current ml-0.5" />}
              {lastGesture.type === 'pause' && <Pause className="h-9 w-9 fill-current" />}
              {lastGesture.type === 'skip-forward' && (
                <div className="flex flex-col items-center">
                  <RotateCw className="h-7 w-7" />
                  <span className="font-mono text-[10px] font-bold mt-0.5">+10s</span>
                </div>
              )}
              {lastGesture.type === 'skip-backward' && (
                <div className="flex flex-col items-center">
                  <RotateCcw className="h-7 w-7" />
                  <span className="font-mono text-[10px] font-bold mt-0.5">-10s</span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-40 px-4 sm:px-8 pb-6 pt-12 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-auto border-none">
        {/* Signature Amber Scrubber */}
        <AmberScrubber
          currentTime={controller.currentTime}
          duration={controller.duration}
          buffered={controller.buffered}
          onSeek={controller.seek}
        />

        {/* Transport Toolbar Row */}
        <div className="flex items-center justify-between pt-2">
          {/* Left: Play/Pause, 10s Skips, Volume, Timecode */}
          <div className="flex items-center gap-3">
            {/* Play / Pause Toggle Button */}
            <button
              onClick={controller.togglePlay}
              className="h-10 w-10 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shadow-lg shadow-amber-500/25 transition-transform hover:scale-105 active:scale-95 shrink-0"
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
              className="h-9 w-9 rounded-full text-white/80 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors relative"
              title="Rewind 10 seconds (J or ←)"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-white/70">
                10
              </span>
            </button>

            {/* Fast-Forward 10 Seconds */}
            <button
              onClick={() => controller.skip(10)}
              className="h-9 w-9 rounded-full text-white/80 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors relative"
              title="Forward 10 seconds (L or →)"
            >
              <RotateCw className="h-4 w-4" />
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-white/70">
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
                className="h-9 w-9 rounded-full text-white/80 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
                title={controller.isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {controller.isMuted || controller.volume === 0 ? (
                  <VolumeX className="h-4 w-4 text-rose-400" />
                ) : controller.volume < 50 ? (
                  <Volume1 className="h-4 w-4 text-white" />
                ) : (
                  <Volume2 className="h-4 w-4 text-amber-400" />
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
                  className="w-full h-1 bg-white/20 accent-[#FF9F1C] cursor-pointer"
                  title="Volume"
                />
              </div>
            </div>

            {/* Timecode Readout */}
            <div className="text-xs font-mono text-zinc-400 select-none hidden sm:flex items-center gap-1.5">
              <span className="text-white font-medium">{formatTime(controller.currentTime)}</span>
              <span>/</span>
              <span>{formatTime(controller.duration)}</span>
            </div>
          </div>

          {/* Center: Film Title */}
          <div className="hidden lg:block font-editorial text-sm text-white/80 truncate max-w-sm text-center">
            {filmTitle}
          </div>

          {/* Right: Speed, 4K Badge, Info Drawer, Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Playback Speed Popover */}
            <div className="relative" ref={speedMenuRef}>
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className={`px-2.5 py-1 rounded-full text-xs font-mono transition-all backdrop-blur-sm ${
                  controller.playbackRate !== 1.0
                    ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                    : 'bg-white/10 hover:bg-white/20 text-white/90'
                }`}
                title="Playback Speed"
              >
                {controller.playbackRate}x
              </button>

              <AnimatePresence>
                {showSpeedMenu && (
                  <motion.div
                    className="absolute bottom-11 right-0 py-1.5 w-32 rounded-2xl bg-[#141418]/95 backdrop-blur-xl border border-white/10 text-xs z-50 shadow-2xl"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.12 }}
                  >
                    <div className="px-3 py-1 text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest border-b border-white/5">
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
                            ? 'text-amber-400 font-bold bg-white/10'
                            : 'text-zinc-200 hover:bg-white/5'
                        }`}
                      >
                        <span>{rate === 1.0 ? '1.0x (Normal)' : `${rate}x`}</span>
                        {controller.playbackRate === rate && <Check className="h-3 w-3 text-amber-400" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quality Stamp */}
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wider bg-white/10 text-amber-400 font-bold">
              4K UHD
            </span>

            {/* Film Info & Notes Drawer Toggle */}
            <button
              onClick={onToggleDetailsDrawer}
              className={`h-9 w-9 rounded-full flex items-center justify-center transition-all backdrop-blur-sm ${
                showDetailsDrawer
                  ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                  : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
              }`}
              title="Curatorial Notes (I)"
            >
              <Info className="h-4 w-4" />
            </button>

            {/* Browser Fullscreen Toggle */}
            <button
              onClick={onToggleFullscreen}
              className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all backdrop-blur-sm"
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
