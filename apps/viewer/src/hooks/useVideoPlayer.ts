import { useState, useEffect, useRef, useCallback } from 'react';

export interface VideoPlayerController {
  currentTime: number;
  duration: number;
  buffered: number;
  isPlaying: boolean;
  isBuffering: boolean;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  skip: (deltaSeconds: number) => void;
  setVolume: (level: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  registerIframe: (iframe: HTMLIFrameElement | null) => void;
  registerVideoElement: (video: HTMLVideoElement | null) => void;
}

export function useVideoPlayer(initialDuration: number = 0): VideoPlayerController {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration);
  const [buffered, setBuffered] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolumeState] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1.0);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const tickerRef = useRef<NodeJS.Timeout | null>(null);

  // Send command to YouTube iframe
  const sendYouTubeCommand = useCallback((func: string, args: any[] = []) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    }
  }, []);

  const play = useCallback(() => {
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    } else {
      sendYouTubeCommand('playVideo');
    }
  }, [sendYouTubeCommand]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    } else {
      sendYouTubeCommand('pauseVideo');
    }
  }, [sendYouTubeCommand]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback(
    (seconds: number) => {
      const clamped = Math.max(0, Math.min(seconds, duration || 999999));
      setCurrentTime(clamped);
      if (videoRef.current) {
        videoRef.current.currentTime = clamped;
      } else {
        sendYouTubeCommand('seekTo', [clamped, true]);
      }
    },
    [duration, sendYouTubeCommand]
  );

  const skip = useCallback(
    (deltaSeconds: number) => {
      seek(currentTime + deltaSeconds);
    },
    [currentTime, seek]
  );

  const setVolume = useCallback(
    (level: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(level)));
      setVolumeState(clamped);
      if (clamped > 0 && isMuted) {
        setIsMuted(false);
      }
      if (videoRef.current) {
        videoRef.current.volume = clamped / 100;
        videoRef.current.muted = clamped === 0;
      } else {
        sendYouTubeCommand('setVolume', [clamped]);
        if (clamped === 0) {
          sendYouTubeCommand('mute');
        } else {
          sendYouTubeCommand('unMute');
        }
      }
    },
    [isMuted, sendYouTubeCommand]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (videoRef.current) {
        videoRef.current.muted = next;
      } else {
        if (next) {
          sendYouTubeCommand('mute');
        } else {
          sendYouTubeCommand('unMute');
          sendYouTubeCommand('setVolume', [volume || 80]);
        }
      }
      return next;
    });
  }, [sendYouTubeCommand, volume]);

  const setPlaybackRate = useCallback(
    (rate: number) => {
      setPlaybackRateState(rate);
      if (videoRef.current) {
        videoRef.current.playbackRate = rate;
      } else {
        sendYouTubeCommand('setPlaybackRate', [rate]);
      }
    },
    [sendYouTubeCommand]
  );

  const registerIframe = useCallback((iframe: HTMLIFrameElement | null) => {
    iframeRef.current = iframe;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: 'listening', id: 'tpf-cinema-player' }),
        '*'
      );
    }
  }, []);

  const registerVideoElement = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video;
  }, []);

  // Listen to messages from YouTube iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (typeof e.data !== 'string') return;
      try {
        const payload = JSON.parse(e.data);
        if (payload.event === 'infoDelivery' && payload.info) {
          const info = payload.info;
          if (typeof info.currentTime === 'number') {
            setCurrentTime(info.currentTime);
          }
          if (typeof info.duration === 'number' && info.duration > 0) {
            setDuration(info.duration);
          }
          if (typeof info.videoLoadedFraction === 'number') {
            setBuffered(Math.min(100, Math.round(info.videoLoadedFraction * 100)));
          }
          if (typeof info.playerState === 'number') {
            // 1 = playing, 2 = paused, 3 = buffering
            if (info.playerState === 1) {
              setIsPlaying(true);
              setIsBuffering(false);
            } else if (info.playerState === 2) {
              setIsPlaying(false);
              setIsBuffering(false);
            } else if (info.playerState === 3) {
              setIsBuffering(true);
            }
          }
          if (typeof info.muted === 'boolean') {
            setIsMuted(info.muted);
          }
        }
      } catch {
        // Not a JSON payload from YouTube
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Smooth local ticker when playing to update scrubber smoothly
  useEffect(() => {
    if (isPlaying) {
      tickerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (duration > 0 && prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prev + 0.25 * playbackRate;
        });
      }, 250);
    } else {
      if (tickerRef.current) clearInterval(tickerRef.current);
    }

    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, [isPlaying, duration, playbackRate]);

  return {
    currentTime,
    duration,
    buffered,
    isPlaying,
    isBuffering,
    volume,
    isMuted,
    playbackRate,
    play,
    pause,
    togglePlay,
    seek,
    skip,
    setVolume,
    toggleMute,
    setPlaybackRate,
    registerIframe,
    registerVideoElement,
  };
}
