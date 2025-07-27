// MyIFrame.jsx
import React from 'react';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';

// Accept either a full YouTube URL or an 11-char ID
function extractId(str) {
  // handles  youtu.be/XXXX   youtube.com/watch?v=XXXX   &t=30s, playlists, etc.
  const regex = /(?:youtu\.be\/|v=)([\w-]{11})/;
  const match = str.match(regex);
  return match ? match[1] : str;
}

export function MyIFrame({ videoId, title = 'YouTube video' }) {
  const id = extractId(videoId);

  return (
    <LiteYouTubeEmbed
      id={id}               // 11-char ID
      title={title}         // for a11y
      poster="maxresdefault" // hi-res thumbnail
      webp                   // serve WEBP thumb when supported
      noCookie               // use youtube-nocookie.com
      iframeProps={{
        allow:
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
      }}
      playerClass="yt-lite"  // keeps default styling; style as you like
      style={{ width: '100%', aspectRatio: '16/9' }}
    />
  );
}
