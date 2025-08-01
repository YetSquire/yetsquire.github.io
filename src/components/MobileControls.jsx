import React, { useRef, useEffect } from 'react';
import nipplejs from 'nipplejs';
import '../styling/nipple.css';              // ← now guaranteed to exist

export function MobileControls ({ directionRef, onRaise, onLower }) {
  const zone = useRef(null);

  /* create the joystick only once */
  useEffect(() => {
    const mgr = nipplejs.create({
      zone: zone.current,
      mode: 'static',
      position: { left: 70, bottom: 70 },   // px
      color: 'white',
      size: 120,
      threshold: 0.2                       // ← 20 % dead-zone for camera drags
    });

    mgr.on('move', (_, data) => {
      directionRef.current = data?.direction?.angle ?? null;
    });
    mgr.on('end', () => { directionRef.current = null; });

    return () => mgr.destroy();
  }, [directionRef]);

  /* stop page scroll on two-finger pinch only — keep natural scroll elsewhere */
  useEffect(() => {
    const stop = e => { if (e.touches.length === 2) e.preventDefault(); };
    document.addEventListener('touchmove', stop, { passive: false });
    return () => document.removeEventListener('touchmove', stop);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset:    0,
      zIndex:   3000           /* above everything in Three.js */
    }}>
      {/* joystick zone */}
      <div
        ref={zone}
        className="joystick-zone"
        style={{
          position:      'absolute',
          left:          20,
          bottom:        20,
          width:         140,
          height:        140,
          touchAction:   'none'   /* Safari iOS needs this for immediate events */
        }}
      />

      {/* elevation buttons */}
      <div style={{
        position:        'absolute',
        right:           20,
        bottom:          20,
        display:         'flex',
        flexDirection:   'column',
        gap:             '1rem',
      }}>
        <button onClick={onRaise} style={btn}>⬆️</button>
        <button onClick={onLower} style={btn}>⬇️</button>
      </div>
    </div>
  );
}

const btn = {
  fontSize:      '1.8rem',
  width:         '3.4rem',
  height:        '3.4rem',
  color:         '#fff',
  background:    'rgba(0,0,0,.6)',    // ← solid background so it never “blinks out”
  border:        '1px solid #fff',
  borderRadius:  '0.6rem',
  backdropFilter:'blur(4px)'          // subtle holo vibe
};
