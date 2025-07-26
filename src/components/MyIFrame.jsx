import React, { useRef, useEffect, useState } from 'react';

export function MyIFrame({ videoId}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);

  function extractYouTubeId(url) {
        return url.split('v=')[1];
    }
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      onYouTubeIframeAPIReady();
    } else {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
      document.body.appendChild(script);
    }
  }, []);

  // Called when API is ready
  const onYouTubeIframeAPIReady = () => {
    if (playerRef.current || !containerRef.current) return;
    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '100%',
      width: '100%',
      videoId: extractYouTubeId(videoId),
      playerVars: {
        autoplay: 0,
        controls: 0,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: () => setPlayerReady(true),
      },
    });
  };

  // Click handler to toggle playback
  const handlePointerDown = (e) => {
    if (e.button === 0 && playerReady && playerRef.current) {
      const state = playerRef.current.getPlayerState();
      if (state === 1) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
      }}
    >
      {/* YouTube will insert the iframe here */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          zIndex: 1,
        }}
      />

      {/* Transparent overlay to capture click */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          pointerEvents: 'auto',
        }}
        onPointerDown={handlePointerDown}
      />
    </div>
  );
}
