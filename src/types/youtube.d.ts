declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId?: string;
          playerVars?: {
            autoplay?: number;
            rel?: number;
            showinfo?: number;
            iv_load_policy?: number;
            modestbranding?: number;
            playsinline?: number;
            fs?: number;
            enablejsapi?: number;
            [key: string]: any;
          };
          events?: {
            onReady?: (event: { target: YT.Player }) => void;
            onStateChange?: (event: { data: number; target: YT.Player }) => void;
            onError?: (event: { data: number; target: YT.Player }) => void;
            [key: string]: any;
          };
        }
      ) => YT.Player;
      PlayerState: {
        UNSTARTED: -1;
        ENDED: 0;
        PLAYING: 1;
        PAUSED: 2;
        BUFFERING: 3;
        CUED: 5;
      };
    };
  }

  namespace YT {
    interface Player {
      playVideo(): void;
      pauseVideo(): void;
      stopVideo(): void;
      seekTo(seconds: number, allowSeekAhead: boolean): void;
      loadVideoById(videoId: string, startSeconds?: number): void;
      cueVideoById(videoId: string, startSeconds?: number): void;
      getVideoUrl(): string;
      getVideoEmbedCode(): string;
      getPlayerState(): number;
      getCurrentTime(): number;
      getDuration(): number;
      getVolume(): number;
      setVolume(volume: number): void;
      mute(): void;
      unMute(): void;
      isMuted(): boolean;
      setSize(width: number, height: number): void;
      getVideoWidth(): number;
      getVideoHeight(): number;
      play(): void;
      pause(): void;
      stop(): void;
      destroy(): void;
      getAvailablePlaybackRates(): number[];
      setPlaybackRate(suggestedRate: number): void;
      getPlaybackRate(): number;
      getAvailableQualityLevels(): string[];
      setQualityLevel(quality: string): void;
      getPlaybackQuality(): string;
      addEventListener(event: string, listener: (event: any) => void): void;
      removeEventListener(event: string, listener: (event: any) => void): void;
      getVideoLoadedFraction(): number;
      getIframe(): HTMLIFrameElement;
    }
  }
}

export {};
