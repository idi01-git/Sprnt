declare module 'plyr' {
  export interface PlyrOptions {
    enabled?: boolean;
    autoplay?: boolean;
    autopause?: boolean;
    playsinline?: boolean;
    muted?: boolean;
    loop?: {
      active?: boolean;
    };
    speed?: {
      selected?: number;
      options?: number[];
    };
    direction?: 'ltr' | 'rtl';
    keyboard?: {
      focused?: boolean;
      global?: boolean;
    };
    tooltips?: {
      controls?: boolean;
      seek?: boolean;
    };
    captions?: {
      active?: boolean;
    };
    fullscreen?: {
      enabled?: boolean;
      fallback?: boolean;
      iosNative?: boolean;
    };
    resetOnEnd?: boolean;
    type?: 'video' | 'audio' | 'youtube';
    youtube?: {
      noCookie?: boolean;
      rel?: number;
      showinfo?: number;
      iv_load_policy?: number;
      modestbranding?: number;
      playsinline?: number;
      widget_referrer?: string;
      cc_load_policy?: number;
      color?: 'red' | 'white';
      controls?: number;
      disablekb?: number;
      enablejsapi?: number;
      end?: number;
      fs?: number;
      hl?: string;
      list?: string;
      listType?: string;
      start?: number;
    };
    controls?: string[];
    settings?: string[];
    ratio?: string;
    invertTime?: boolean;
    toggleInvert?: boolean;
    clickToPlay?: boolean;
    hideControls?: boolean;
    showPosterOnEnded?: boolean;
    resetOnEnd?: boolean;
    destroyElement?: HTMLElement;
    getThumbnail?: () => string | null;
  }

  export interface SourceInfo {
    src?: string;
    type?: string;
    provider?: string;
    title?: string;
    poster?: string;
    tracks?: {
      kind: string;
      label: string;
      srclang: string;
      src: string;
    }[];
  }

  export interface Plyr {
    source: SourceInfo | null;
    isHTML5: boolean;
    isEmbed: boolean;
    isYouTube: boolean;
    isVimeo: boolean;
    isVideo: boolean;
    isAudio: boolean;
    playing: boolean;
    paused: boolean;
    stopped: boolean;
    ended: boolean;
    currentTime: number;
    waiting: boolean;
    seeking: boolean;
    duration: number;
    buffered: number;
    seeked: boolean;
    paused: boolean;
    played: boolean;
    load: boolean;
    ready: boolean;
    volume: number;
    muted: boolean;
    keyboard: { focused: boolean; global: boolean };
    activeElement: HTMLElement | null;
    elements: {
      container: HTMLElement;
      controls?: HTMLElement | null;
      badges?: HTMLElement | null;
      wrapper?: HTMLElement | null;
      buttons: {
        play?: HTMLElement[];
        pause?: HTMLElement[];
        restart?: HTMLElement[];
        rewind?: HTMLElement[];
        fastForward?: HTMLElement[];
        mute?: HTMLElement[];
        pip?: HTMLElement[];
        airplay?: HTMLElement[];
        settings?: HTMLElement[];
        captions?: HTMLElement[];
        fullscreen?: HTMLElement[];
        playLarge?: HTMLElement;
      };
      progress?: HTMLElement;
      inputs: {
        seek?: HTMLInputElement;
        volume?: HTMLInputElement;
      };
      displays: {
        poster?: HTMLElement;
        previewThumb?: HTMLElement;
      };
      captions?: HTMLElement;
      caption?: HTMLElement;
    };
    validTypes: string[];
    supportedTypes: string[];
    providers: {
      html5: () => HTMLElement;
      youtube: () => HTMLElement;
      vimeo: () => HTMLElement;
    };

    on<K extends keyof HTMLElementEventMap>(
      event: K,
      callback: (event: Event & { detail?: { plyr?: Plyr } }) => void
    ): void;
    on(event: string, callback: (event: Event & { detail?: { plyr?: Plyr } }) => void): void;
    once<K extends keyof HTMLElementEventMap>(
      event: K,
      callback: (event: Event & { detail?: { plyr?: Plyr } }) => void
    ): void;
    once(event: string, callback: (event: Event & { detail?: { plyr?: Plyr } }) => void): void;
    off(event: string, callback?: (event: Event & { detail?: { plyr?: Plyr } }) => void): void;
    destroy(): void;
    play(): Promise<void>;
    pause(): void;
    stop(): void;
    restart(): void;
    rewind(time?: number): void;
    fastForward(time?: number): void;
    getCurrentTime(): number;
    setCurrentTime(time: number): Promise<void>;
    getDuration(): number;
    getVolume(): number;
    setVolume(volume: number): void;
    getMuted(): boolean;
    setMuted(muted: boolean): void;
    incrementVolume(delta?: number): void;
    decrementVolume(delta?: number): void;
    isPaused(): boolean;
    isPlaying(): boolean;
    isEnded(): boolean;
    isLoading(): boolean;
    isReady(): boolean;
    isComplete(): boolean;
    isSupported(): boolean;
    hasProgress(): boolean;
    hasSeek(): boolean;
    hasVolume(): boolean;
    hasFullScreen(): boolean;
    hasPictureInPicture(): boolean;
    hasCaptions(): boolean;
    hasAudio(): boolean;
    supports(type: string, provider?: string): boolean;
    support(type: string): boolean;
    enterFullscreen(target?: HTMLElement): Promise<void>;
    exitFullscreen(): Promise<void>;
    toggleFullscreen(target?: HTMLElement): Promise<void>;
    isFullscreen(): boolean;
    togglePlay(play?: boolean): void;
    playPause(): void;
    toggleCaptions(caption?: boolean): void;
    toggleMute(muted?: boolean): void;
    toggleControls(toggle?: boolean): void;
    toggleQuality(term: string): void;
    showPosterOnEnded(): void;
  }

  export interface PlyrConstructor {
    new (target: HTMLElement | string, options?: PlyrOptions): Plyr;
  }

  const Plyr: PlyrConstructor;
  export default Plyr;
}
