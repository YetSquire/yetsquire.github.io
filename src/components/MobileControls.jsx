import React, { useRef, useEffect } from 'react';
import nipplejs from 'nipplejs';
import '../styling/nipple.css';

export function MobileControls({ directionRef, onRaise, onLower }) {
  const zone = useRef(null);

  /* create joystick */
  useEffect(() => {
    const mgr = nipplejs.create({
      zone: zone.current,
      mode: 'static',
      position: { left: '60px', bottom: '60px' },
      color: 'white',
    });

    mgr.on('move', (_, data) => {
      directionRef.current = data?.direction?.angle ?? null;  // 'up' | 'down' | ...
    });
    mgr.on('end', () => { directionRef.current = null; });

    return () => mgr.destroy();
  }, [directionRef]);

  /* lock page scroll while touching */
  useEffect(() => {
    const stopScroll = e => e.preventDefault();
    document.body.addEventListener('touchmove', stopScroll, { passive: false });
    return () => document.body.removeEventListener('touchmove', stopScroll);
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 100 }}>
      {/* joystick zone */}
      <div ref={zone}
           style={{ position: 'absolute', left: 20, bottom: 20,
                    width: 140, height: 140, pointerEvents: 'auto' }} />

      {/* elevation buttons */}
      <div style={{ position: 'absolute', right: 20, bottom: 20,
                    display: 'flex', flexDirection: 'column', gap: '1rem',
                    pointerEvents: 'auto' }}>
        <button onClick={onRaise} style={btn}>⬆️</button>
        <button onClick={onLower} style={btn}>⬇️</button>
      </div>
    </div>
  );
}

const btn = {
  fontSize: '1.6rem',
  width: '3.2rem',
  height: '3.2rem',
  background: '#333',
  color: '#fff',
  border: 'none',
  borderRadius: '0.6rem',
};
