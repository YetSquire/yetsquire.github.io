import { useEffect, useRef, useState } from 'react';

export function useAudio(url, { loop = false, volume = 1 } = {}) {
  const audioCtxRef = useRef(null);
  const bufferRef = useRef(null);
  const gainRef = useRef(null);
  const sourceRef = useRef(null);

  const startTimeRef = useRef(0);     // When the current play started
  const pausedAtRef = useRef(0);      // Where it was paused
  const isPlayingRef = useRef(false);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    gainRef.current = audioCtxRef.current.createGain();
    gainRef.current.gain.value = volume;
    gainRef.current.connect(audioCtxRef.current.destination);

    fetch(url)
      .then(res => res.arrayBuffer())
      .then(data => audioCtxRef.current.decodeAudioData(data))
      .then(buffer => {
        bufferRef.current = buffer;
        setIsReady(true);
      });

    return () => {
      stop();
      audioCtxRef.current.close();
    };
  }, [url]);

  const createAndPlaySource = (offset = 0) => {
    const source = audioCtxRef.current.createBufferSource();
    source.buffer = bufferRef.current;
    source.loop = loop;
    source.connect(gainRef.current);
    if (offset < 0) offset = 0;
    source.start(0, offset);
    source.onended = () => {
      if (!loop) isPlayingRef.current = false;
    };
    sourceRef.current = source;
    startTimeRef.current = audioCtxRef.current.currentTime - offset;
    isPlayingRef.current = true;
  };

  const play = () => {
    if (!isReady || isPlayingRef.current) return;
    createAndPlaySource(pausedAtRef.current);
  };

  const pause = () => {
    if (!isPlayingRef.current) return;

    const currentTime = audioCtxRef.current.currentTime;
    const gain = gainRef.current.gain;

    // Fade out over 0.2 seconds
    gain.cancelScheduledValues(currentTime);
    gain.setValueAtTime(gain.value, currentTime);
    gain.linearRampToValueAtTime(0, currentTime + 0.2);

    // Schedule pause after fade
    setTimeout(() => {
      const elapsed = currentTime - startTimeRef.current;
      pausedAtRef.current = elapsed % bufferRef.current.duration;
      stop();

      gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }, 200);
  };

  const stop = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    isPlayingRef.current = false;
  };

  const isPlaying = () => isPlayingRef.current;

  return { play, pause, stop, isPlaying, isReady };
}
