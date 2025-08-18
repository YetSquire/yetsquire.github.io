import React, { useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import nipplejs from 'nipplejs';

export function MobileControls({ directionRef, onRaise, onLower, style }) {
  const zoneRef = useRef(null);
  const mgrRef = useRef(null);
  const holdRef = useRef(null);

  const stop = e => {
    e.stopPropagation();
    e.preventDefault();
  };

  const startHold = (fn) => {
    fn(); // fire immediately
    holdRef.current = setInterval(fn, 100); // repeat every 100ms
  };

  const stopHold = () => {
    if (holdRef.current) {
      clearInterval(holdRef.current);
      holdRef.current = null;
    }
  };

  const createJoystick = useCallback(() => {
    const z = zoneRef.current;
    if (!z) return;

    // Get the zone’s center in *page* coordinates (works on iOS visual viewport too)
    const rect = z.getBoundingClientRect();
    const pageLeft = (window.visualViewport?.pageLeft ?? window.scrollX ?? window.pageXOffset ?? 0);
    const pageTop  = (window.visualViewport?.pageTop  ?? window.scrollY ?? window.pageYOffset ?? 0);
    mgrRef.current?.destroy();
    const mgr = nipplejs.create({
      zone: z,
      mode: 'static',
      position: { left: '50%', top: '50%'},
      size: 120,
      color: 'white',
      threshold: 0.2,
      multitouch: false,
      restJoystick: true,
    });
    mgr.on('move', (_, data) => { directionRef.current = data?.direction?.angle ?? null; });
    mgr.on('end', () => { directionRef.current = null; });
    mgrRef.current = mgr;
  }, [directionRef]);

  useLayoutEffect(() => {
    createJoystick();

    const recenter = () => createJoystick();
    window.addEventListener('resize', recenter);
    window.visualViewport?.addEventListener('resize', recenter);
    window.visualViewport?.addEventListener('scroll', recenter);

    return () => {
      window.removeEventListener('resize', recenter);
      window.visualViewport?.removeEventListener('resize', recenter);
      window.visualViewport?.removeEventListener('scroll', recenter);
      mgrRef.current?.destroy();
    };
  }, [createJoystick]);

  const wrapperStyle = {
    position: 'fixed',
    inset: 0,
    zIndex: 2147483647,
    pointerEvents: 'none',
    ...style,
  };

  return createPortal(
    <div style={wrapperStyle}>
      {/* Joystick zone — fixed box so math is stable */}
      <div
        ref={zoneRef}
        style={{
          position: 'fixed',
          left: 20,
          bottom: 20,
          width: 120,
          height: 120,
          pointerEvents: 'auto',
          touchAction: 'none',
          // background: 'rgba(255,0,0,.2)', // debug
        }}
        onTouchStart={stop}
        onTouchMove={stop}
        onTouchEnd={stop}
      />

      {/* Raise/Lower buttons */}
      <div
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          size: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          pointerEvents: 'auto',
        }}
      >
      <button onTouchStart={() => startHold(onRaise)}
              onTouchEnd={stopHold}
              style={{
                height:40,
                width:40
              }}
      >▲</button>
      <button onTouchStart={() => startHold(onLower)}
              onTouchEnd={stopHold}
              style={{
                height:40,
                width:40
              }}
      >▼</button>
      </div>
    </div>,
    document.body
  );
}

const btn = {
  fontSize: '1.8rem',
  width: '35rem',
  height: '3.4rem',
  color: '#fff',
  background: 'rgba(0,0,0,.6)',
  border: '1px solid #fff',
  borderRadius: '0.6rem',
  backdropFilter: 'blur(4px)',
};
