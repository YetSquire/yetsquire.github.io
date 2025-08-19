// HoloPanel.jsx
import React, { useMemo, useRef, useState, useCallback } from 'react';
import { RoundedBox, Text, Mask, useMask, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// ---- Config you can tweak ----
const PANEL_W = 1.8;   // world units
const PANEL_H = 1.1;
const PADDING  = 0.08;
const TITLE_H  = 0.2;
const FONT     = undefined; // use default or point to a TTF/OTF

function youtubeIdFromAny(input) {
  if (!input) return null;
  if (/^[\w-]{11}$/.test(input)) return input; // already an ID
  try {
    const u = new URL(input);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    const v = u.searchParams.get('v'); if (v) return v;
    const m = u.pathname.match(/\/embed\/([^/]+)/); if (m) return m[1];
  } catch {}
  return null;
}

function YouTubeThumb({ videoId, size=[PANEL_W - 2*PADDING, 0.5], onClick }) {
  const [w, h] = size;
  // CORS-safe via proxy
  const tex = useTexture(`/ytimg/vi/${youtubeIdFromAny(videoId)}/hqdefault.jpg`);
  tex.colorSpace = THREE.SRGBColorSpace;

  return (
    <mesh onClick={onClick} position={[0, -PANEL_H/2 + PADDING + h/2, 0.01]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

export function HoloPanel({
  title,
  description,
  videoId,      // e.g. "kLf05NDoUnU"
  position=[0,0,0],
  rotation=[0,0,0],
  isDeactivated=false,
  isCenter=false
}) {
  const [scrollY, setScrollY] = useState(0);
  const [playing, setPlaying] = useState(false);
  const textRef = useRef();

  // description viewport (masked area)
  const descW = PANEL_W - 2 * PADDING;
  const descH = isCenter ? 0.55 : 0.55;
  const maskId = 11;
  const mask = useMask(maskId);

  const onWheel = useCallback((e) => {
    // wheel.deltaY positive -> scroll down (move text up: negative y)
    const next = THREE.MathUtils.clamp(scrollY - e.deltaY * 0.0015, -2.0, 0.0);
    setScrollY(next);
  }, [scrollY]);

  // Background frame
  return (
    <group position={position} rotation={rotation}>
      {/* Frame */}
      <RoundedBox args={[PANEL_W, PANEL_H, 0.02]} radius={0.06} smoothness={8}>
        <meshBasicMaterial transparent opacity={0.22} color="#00e6ff" />
      </RoundedBox>

      {/* Border/glow overlay */}
      <mesh renderOrder={1}>
        <planeGeometry args={[PANEL_W, PANEL_H]} />
        <meshBasicMaterial
          color="#00ffff"
          transparent
          opacity={0.18}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Title */}
      {title && (
        <Text
          position={[0, PANEL_H/2 - PADDING - TITLE_H/2, 0.01]}
          font={FONT}
          fontSize={isCenter ? 0.12 : 0.11}
          anchorX="center"
          anchorY="middle"
          maxWidth={PANEL_W - 2 * PADDING}
          color="#eaffff"
          outlineWidth={0.004}
          outlineColor="#00ffff"
        >
          {title}
        </Text>
      )}

      {/* Description mask */}
      <Mask id={maskId} position={[0, 0.08, 0.005]}>
        <mesh>
          <planeGeometry args={[descW, descH]} />
          {/* Invisible; Mask controls stencil behind the scenes */}
          <meshBasicMaterial colorWrite={false} />
        </mesh>
      </Mask>

      {/* Scrollable description (WebGL text) */}
      {description && (
        <group
          {...mask}
          position={[0, 0.08 + scrollY, 0.006]}
          onWheel={onWheel}
        >
          <Text
            ref={textRef}
            font={FONT}
            fontSize={0.07}
            lineHeight={1.45}
            anchorX={isCenter ? 'center' : 'left'}
            anchorY="top"
            maxWidth={descW}
            color="#cfffff"
            textAlign={isCenter ? 'center' : 'left'}
            // Troika Text supports overflow clipping via mask here
          >
            {description}
          </Text>
        </group>
      )}

      {videoId && !playing && (
        <YouTubeThumb
          videoId={videoId}
          onClick={() => setPlaying(true)}
        />
      )}

      {videoId && playing && (
        <Html
          // Keep this minimal: only while playing
          transform
          distanceFactor={1}  // panel-size = CSS size 1:1 with plane
          position={[0, -PANEL_H/2 + PADDING + 0.25, 0.012]}
          zIndexRange={[10, 0]}
          style={{ borderRadius: '10px', overflow: 'hidden' }}
        >
          <div style={{ width: `${(PANEL_W - 2*PADDING) * 180}px`, height: `${0.5 * 180}px`, position: 'relative' }}>
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube-nocookie.com/embed/${youtubeIdFromAny(videoId)}?autoplay=1&controls=1&rel=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
            <button
              onClick={() => setPlaying(false)}
              style={{
                position: 'absolute',
                top: 6, right: 6,
                background: 'rgba(0,0,0,0.6)',
                color: 'white', border: 'none',
                borderRadius: 6, padding: '6px 10px', cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </Html>
      )}

      {/* Deactivated overlay */}
      {isDeactivated && (
        <mesh renderOrder={2}>
          <planeGeometry args={[PANEL_W, PANEL_H]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.35} depthWrite={false}/>
        </mesh>
      )}
    </group>
  );
}
