// useAudio.js
import { useEffect, useRef } from 'react';

export function useAudio(url, { loop = false, volume = 1 } = {}) {
  const audioRef = useRef(null);

  useEffect(() => {
    const a = new Audio(url);
    a.loop = loop;
    a.volume = volume;
    audioRef.current = a;
  }, [url, loop, volume]);

  const play = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
  };

  const pause = () => {
    const a = audioRef.current;
    if (a && !a.paused) a.pause();
  };

  const stop = () => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
  };

  const isPlaying = () => {
    const a = audioRef.current;
    return !!a && !a.paused;
  };

  return { play, pause, stop, isPlaying, audio: audioRef };
}
