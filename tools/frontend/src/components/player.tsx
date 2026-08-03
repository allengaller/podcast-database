'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { Transcript } from './transcript';

interface PlayerProps {
  src: string;
  podcastId: string;
  transcript?: string;
  initialProgress?: number;
}

const WaveformBar = memo(function WaveformBar({
  height,
  active,
}: {
  height: number;
  active: boolean;
}) {
  return (
    <div
      className={`w-1.5 rounded-full transition-all duration-300 ${
        active ? 'bg-white/90' : 'bg-white/30'
      }`}
      style={{ height: `${height}%` }}
    />
  );
});

// Pre-compute random heights so they don't change on re-render
const WAVEFORM_HEIGHTS = Array.from({ length: 40 }, () => 20 + Math.random() * 60);

export const Player = memo(function Player({
  src,
  podcastId,
  transcript,
  initialProgress = 0,
}: PlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef(0);

  const saveProgress = useCallback(
    async (time: number, completed = false) => {
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ podcastId, progress: Math.floor(time), completed }),
        });
      } catch {
        // silently ignore — will retry on next save cycle
      }
    },
    [podcastId]
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = initialProgress;
  }, [initialProgress]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const update = () => {
      setProgress(audio.currentTime);
      progressRef.current = audio.currentTime;
      setDuration(audio.duration || 0);
    };

    const onEnded = () => {
      setIsPlaying(false);
      void saveProgress(audio.duration, true);
    };

    audio.addEventListener('timeupdate', update);
    audio.addEventListener('loadedmetadata', update);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('play', () => setIsPlaying(true));

    return () => {
      audio.removeEventListener('timeupdate', update);
      audio.removeEventListener('loadedmetadata', update);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('pause', () => setIsPlaying(false));
      audio.removeEventListener('play', () => setIsPlaying(true));
    };
  }, [saveProgress]);

  // Debounced save: only save after 10 seconds of continuous playback
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveProgress(progressRef.current);
    }, 10_000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [progress, saveProgress]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      void audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setProgress(time);
  }, []);

  const skip = useCallback(
    (seconds: number) => {
      seek(Math.max(0, Math.min(duration, progress + seconds)));
    },
    [seek, duration, progress]
  );

  const formatTime = useCallback((t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  const progressPercent = duration ? (progress / duration) * 100 : 0;

  return (
    <div className="w-full rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 sm:p-8 text-white shadow-2xl">
      <audio ref={audioRef} src={src} />

      {/* Waveform visualization */}
      <div className="flex items-end justify-center gap-1 h-24 mb-6">
        {WAVEFORM_HEIGHTS.map((h, i) => {
          const active = (i / 40) * 100 <= progressPercent;
          return <WaveformBar key={i} height={h} active={active} />;
        })}
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <Slider
          value={[progress]}
          max={duration || 1}
          step={1}
          onValueChange={(v) => {
            const val: number = Array.isArray(v)
              ? ((v as readonly number[])[0] ?? 0)
              : (v as number);
            seek(val);
          }}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-sm text-white/70 mt-2">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-center gap-6 mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 rounded-full h-12 w-12"
          onClick={() => skip(-15)}
        >
          <SkipBack className="h-6 w-6" />
        </Button>

        <Button
          className="h-16 w-16 rounded-full bg-white text-indigo-600 hover:bg-white/90 shadow-lg"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="h-7 w-7 fill-current" />
          ) : (
            <Play className="h-7 w-7 fill-current ml-1" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 rounded-full h-12 w-12"
          onClick={() => skip(15)}
        >
          <SkipForward className="h-6 w-6" />
        </Button>
      </div>

      {/* Volume + Playback rate */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Volume2 className="h-5 w-5 text-white/70" />
          <Slider
            value={[volume * 100]}
            max={100}
            step={1}
            onValueChange={(v) => {
              const val: number = Array.isArray(v)
                ? ((v as readonly number[])[0] ?? 0)
                : (v as number);
              const vol = val / 100;
              setVolume(vol);
              if (audioRef.current) audioRef.current.volume = vol;
            }}
            className="w-24"
          />
        </div>

        <div className="flex gap-2">
          {[0.5, 1, 1.5, 2].map((rate) => (
            <button
              key={rate}
              onClick={() => {
                setPlaybackRate(rate);
                if (audioRef.current) audioRef.current.playbackRate = rate;
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                playbackRate === rate
                  ? 'bg-white text-indigo-600'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {transcript && (
        <div className="mt-8 max-h-80 overflow-y-auto rounded-2xl bg-black/20 p-5 backdrop-blur-sm">
          <Transcript content={transcript} />
        </div>
      )}
    </div>
  );
});
