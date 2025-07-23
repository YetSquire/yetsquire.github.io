// VideoPlane.jsx
import React, { useRef, useEffect } from 'react';
import { VideoTexture } from 'three';

export function VideoPlane({
  url,
  position = [0, 1.4, 0],
  size = [3, 1.7],            // 16:9 aspect by default
}) {
  const mesh = useRef();
  const video = useRef(document.createElement('video'));

  useEffect(() => {
    const vid = video.current;
    vid.src = url;
    vid.crossOrigin = 'anonymous';
    vid.loop = true;
    vid.muted = true;
    vid.playsInline = true;
    vid.play().catch(() => { /* handle autoplay block */ });
    return () => vid.pause();
  }, [url]);

  // Create a VideoTexture from the <video> element
  const texture = new VideoTexture(video.current);

  return (
    <mesh ref={mesh} position={position}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
