import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Joystick } from 'react-nipple'

export default function MobileControls({ onMove, onRaise, onLower, onLook }) {
  const joyRef = useRef(null)
  useEffect(() => {
    const j = new Joystick({
      zone: joyRef.current,
      mode: 'static',
      position: { left: '50px', bottom: '50px' },
      color: 'white',
      size: 100
    })
    j.on('move', (_, data) => {
      if (!data) return
      const { angle, distance } = data
      const rad = angle.radian
      const x = Math.cos(rad) * distance
      const y = Math.sin(rad) * distance
      onMove(x, y)
    })
    j.on('end', () => onMove(0, 0))
    return () => j.destroy()
  }, [onMove])
  useEffect(() => {
    let active = false, sx = 0, sy = 0
    const move = e => {
      if (!active) return
      const dx = (e.touches ? e.touches[0].clientX : e.clientX) - sx
      const dy = (e.touches ? e.touches[0].clientY : e.clientY) - sy
      onLook(dx, dy)
      sx = e.touches ? e.touches[0].clientX : e.clientX
      sy = e.touches ? e.touches[0].clientY : e.clientY
    }
    const start = e => {
      active = true
      sx = e.touches ? e.touches[0].clientX : e.clientX
      sy = e.touches ? e.touches[0].clientY : e.clientY
    }
    const end = () => (active = false)
    document.addEventListener('mousedown', start)
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', end)
    document.addEventListener('touchstart', start, { passive: false })
    document.addEventListener('touchmove', move, { passive: false })
    document.addEventListener('touchend', end)
    return () => {
      document.removeEventListener('mousedown', start)
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', end)
      document.removeEventListener('touchstart', start)
      document.removeEventListener('touchmove', move)
      document.removeEventListener('touchend', end)
    }
  }, [onLook])
  return createPortal(
    <>
      <div ref={joyRef} className="joy-zone" />
      <button className="raise-btn" onTouchStart={onRaise}>▲</button>
      <button className="lower-btn" onTouchStart={onLower}>▼</button>
    </>,
    document.body
  )
}
