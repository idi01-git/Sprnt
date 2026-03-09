'use client';

import { useEffect, useRef, useState } from 'react';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  onProgress?: (progress: { currentTime: number; duration: number; percent: number }) => void;
  onEnded?: () => void;
  autoPlay?: boolean;
  startTime?: number;
  playbackRate?: number;
}

const poppins: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };

export function VideoPlayer({
  src,
  poster,
  title,
  onProgress,
  onEnded,
  autoPlay = false,
  startTime = 0,
  playbackRate = 1
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const Video = require('video.js');
    
    playerRef.current = Video(videoRef.current, {
      controls: true,
      responsive: true,
      fluid: true,
      playbackRates: [0.5, 1, 1.25, 1.5, 2],
      poster: poster,
      sources: [{ src, type: 'application/x-mpegURL' }],
      html5: {
        vhs: {
          overrideNative: true,
        },
      },
      controlBar: {
        children: [
          'playToggle',
          'volumePanel',
          'currentTimeDisplay',
          'timeDivider',
          'durationDisplay',
          'progressControl',
          'playbackRateMenuButton',
          'fullscreenToggle',
        ],
      },
    });

    playerRef.current.on('ready', () => {
      setIsReady(true);
      if (startTime > 0) {
        playerRef.current.currentTime(startTime);
      }
      if (playbackRate !== 1) {
        playerRef.current.playbackRate(playbackRate);
      }
      if (autoPlay) {
        playerRef.current.play().catch(() => {});
      }
    });

    playerRef.current.on('timeupdate', () => {
      if (onProgress && playerRef.current) {
        const currentTime = playerRef.current.currentTime() || 0;
        const duration = playerRef.current.duration() || 0;
        const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
        onProgress({ currentTime, duration, percent });
      }
    });

    playerRef.current.on('ended', () => {
      onEnded?.();
    });

    playerRef.current.on('error', () => {
      setError('Failed to load video. Please try again.');
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, poster, autoPlay, startTime, playbackRate]);

  return (
    <div className="relative">
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-big-play-centered vjs-theme-sprintern"
          playsInline
        />
      </div>
      
      {title && isReady && (
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <h3 className="text-white font-semibold" style={poppins}>{title}</h3>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <p className="text-white" style={poppins}>{error}</p>
        </div>
      )}

      <style jsx global>{`
        .vjs-theme-sprintern .vjs-control-bar {
          background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
        }
        .vjs-theme-sprintern .vjs-big-play-button {
          background-color: rgba(147, 51, 234, 0.9) !important;
          border: none !important;
          border-radius: 50% !important;
          width: 80px !important;
          height: 80px !important;
          line-height: 80px !important;
        }
        .vjs-theme-sprintern .vjs-progress-control .vjs-play-progress {
          background-color: #9333ea !important;
        }
        .vjs-theme-sprintern .vjs-slider {
          background-color: rgba(255,255,255,0.3) !important;
        }
      `}</style>
    </div>
  );
}

export function VideoProgress({
  currentTime,
  duration,
  percent
}: {
  currentTime: number;
  duration: number;
  percent: number;
}) {
  return (
    <div className="w-full">
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500" style={poppins}>
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds === 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default VideoPlayer;
