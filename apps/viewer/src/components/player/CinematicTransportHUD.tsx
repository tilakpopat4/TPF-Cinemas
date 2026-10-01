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
import { useReducedMotion, springSnappy } from '../../lib/motion';

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
  const reduced = useReducedMotion();
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const speedMenuRef = useRef<HTMLDivElement>(null);

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  // Close speed menu when clicking outside
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
      {/* Center Screen Feedback Ripple Animation */}
      <AnimatePresence>
        {lastGesture && (
          <div
            key={lastGesture.id}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          >
            <motion.div
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-black/60 border border-amber-500/40 text-amber-400 backdrop-blur-xl flex flex-col items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.5)]"
              initial={{ scale: 0.7, opacity: 0.9 }}
              animate={{ scale: 1.35, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {lastGesture.type === 'play' && <Play className="h-10 w-10 fill-current ml-1" />}
              {lastGesture.type === 'pause' && <Pause className="h-10 w-10 fill-current" />}
              {lastGesture.type === 'skip-forward' && (
                <div className="flex flex-col items-center">
                  <RotateCw className="h-7 w-7" />
                  <span className="text-[10px] font-bold mt-0.5">+10s</span>
                </div>
              )}
              {lastGesture.type === 'skip-backward' && (
                <div className="flex flex-col items-center">
                  <RotateCcw className="h-7 w-7" />
                  <span className="text-[10px] font-bold mt-0.5">-10s</span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-40 px-4 sm:px-8 pb-6 pt-12 bg-gradient-to-t from-black/95 via-black/70 to-transparent pointer-events-auto">
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
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Play / Pause Toggle Button */}
            <motion.button
              onClick={controller.togglePlay}
              className="h-10 w-10 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-colors shrink-0"
              title={controller.isPlaying ? 'Pause (Space or K)' : 'Play (Space or K)'}
              whileHover={reduced ? {} : { scale: 1.1, transition: springSnappy }}
              whileTap={reduced ? {} : { scale: 0.9, transition: springSnappy }}
            >
              {controller.isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current ml-0.5" />
              )}
            </motion.button>

            {/* Rewind 10 Seconds */}
            <motion.button
              onClick={() => controller.skip(-10)}
              className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition-colors relative"
              title="Rewind 10 seconds (J or ←)"
              whileHover={reduced ? {} : { scale: 1.1 }}
              whileTap={reduced ? {} : { scale: 0.9, transition: springSnappy }}
            >
              <RotateCcw className="h-5 w-5" />
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-zinc-300">
                10
              </span>
            </motion.button>

            {/* Fast-Forward 10 Seconds */}
            <motion.button
              onClick={() => controller.skip(10)}
              className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition-colors relative"
              title="Forward 10 seconds (L or →)"
              whileHover={reduced ? {} : { scale: 1.1 }}
              whileTap={reduced ? {} : { scale: 0.9, transition: springSnappy }}
            >
              <RotateCw className="h-5 w-5" />
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-zinc-300">
                10
              </span>
            </motion.button>

            {/* Volume Control Cluster */}
            <div
              className="flex items-center gap-1.5"
              onMouseEnter={() => setIsVolumeHovered(true)}
              onMouseLeave={() => setIsVolumeHovered(false)}
            >
              <motion.button
                onClick={controller.toggleMute}
                className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title={controller.isMuted ? 'Unmute (M)' : 'Mute (M)'}
                whileHover={reduced ? {} : { scale: 1.1 }}
                whileTap={reduced ? {} : { scale: 0.9, transition: springSnappy }}
              >
                {controller.isMuted || controller.volume === 0 ? (
                  <VolumeX className="h-5 w-5 text-red-400" />
                ) : controller.volume < 50 ? (
                  <Volume1 className="h-5 w-5 text-zinc-200" />
                ) : (
                  <Volume2 className="h-5 w-5 text-amber-400" />
                )}
              </motion.button>

              {/* Expandable Amber Volume Slider */}
              <div
                className={`overflow-hidden transition-all duration-200 flex items-center ${
                  isVolumeHovered ? 'w-20 sm:w-24 opacity-100' : 'w-0 opacity-0'
                }`}
              >
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={controller.isMuted ? 0 : controller.volume}
                  onChange={(e) => controller.setVolume(Number(e.target.value))}
                  className="w-full h-1 bg-white/20 accent-amber-500 rounded-lg cursor-pointer"
                  title="Volume"
                />
              </div>
            </div>

            {/* Timecode Readout */}
            <div className="text-xs font-mono text-zinc-300 select-none hidden sm:flex items-center gap-1">
              <span className="text-white font-medium">{formatTime(controller.currentTime)}</span>
              <span className="text-zinc-500">/</span>
              <span>{formatTime(controller.duration)}</span>
            </div>
          </div>

          {/* Center: Film Title (Desktop) */}
          <div className="hidden lg:block text-xs font-medium text-zinc-400 truncate max-w-xs text-center">
            {filmTitle}
          </div>

          {/* Right: Speed, Quality, Details Drawer, Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Playback Speed Popover */}
            <div className="relative" ref={speedMenuRef}>
              <motion.button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium border backdrop-blur-md transition-all ${
                  controller.playbackRate !== 1.0
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                    : 'bg-white/10 hover:bg-white/15 border-white/10 text-zinc-200'
                }`}
                title="Playback Speed"
                whileHover={reduced ? {} : { scale: 1.05 }}
                whileTap={reduced ? {} : { scale: 0.95 }}
              >
                {controller.playbackRate}x
              </motion.button>

              {/* Speed Dropdown Menu */}
              <AnimatePresence>
                {showSpeedMenu && (
                  <motion.div
                    className="absolute bottom-10 right-0 py-2 w-32 rounded-xl bg-[#0e1118]/95 border border-white/15 shadow-2xl backdrop-blur-2xl text-xs space-y-0.5 z-50"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="px-3 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-white/5">
                      Speed
                    </div>
                    {speedOptions.map((rate) => (
                      <button
                        key={rate}
                        onClick={() => {
                          controller.setPlaybackRate(rate);
                          setShowSpeedMenu(false);
                        }}
                        className={`w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors ${
                          controller.playbackRate === rate
                            ? 'text-amber-400 font-bold bg-amber-500/10'
                            : 'text-zinc-300 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <span>{rate === 1.0 ? '1.0x (Normal)' : `${rate}x`}</span>
                        {controller.playbackRate === rate && <Check className="h-3 w-3 stroke-[3]" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quality Badge */}
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-white/10 text-amber-400/90 border border-white/10">
              4K HD
            </span>

            {/* Film Info & Discussion Drawer Toggle */}
            <motion.button
              onClick={onToggleDetailsDrawer}
              className={`p-2 rounded-full border backdrop-blur-md transition-all ${
                showDetailsDrawer
                  ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                  : 'bg-white/10 hover:bg-white/15 border-white/10 text-zinc-200'
              }`}
              title="Film Info & Discussion (I)"
              whileHover={reduced ? {} : { scale: 1.08 }}
              whileTap={reduced ? {} : { scale: 0.9, transition: springSnappy }}
            >
              <Info className="h-4 w-4" />
            </motion.button>

            {/* Browser Fullscreen Toggle */}
            <motion.button
              onClick={onToggleFullscreen}
              className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-zinc-200 border border-white/10 backdrop-blur-md transition-colors"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
              whileHover={reduced ? {} : { scale: 1.08 }}
              whileTap={reduced ? {} : { scale: 0.9, transition: springSnappy }}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
};
