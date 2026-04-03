'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  className?: string;
}

function extractYouTubeId(input: string): string | null {
  if (!input) return null;
  const patterns = [
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return input.length === 11 ? input : null;
}

export function VideoPlayer({ videoUrl, title = 'Video', className }: VideoPlayerProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div
        className={className}
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%',
          height: 0,
          overflow: 'hidden',
          borderRadius: '12px',
          backgroundColor: '#1a1a1a',
        }}
      />
    );
  }

  const youtubeId = extractYouTubeId(videoUrl);

  if (!youtubeId) {
    return (
      <div
        className={className}
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%',
          height: 0,
          overflow: 'hidden',
          borderRadius: '12px',
          backgroundColor: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: '#888', fontFamily: "'Poppins', sans-serif", fontSize: '14px' }}>
          Video unavailable
        </p>
      </div>
    );
  }

  // Build embed URL with parameters to minimize YouTube branding
  const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&iv_load_policy=3&fs=1&showinfo=0&controls=1&enablejsapi=1`;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '56.25%',
        height: 0,
        overflow: 'hidden',
        borderRadius: '12px',
        backgroundColor: '#000',
      }}
    >
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
        }}
      />
    </div>
  );
}
