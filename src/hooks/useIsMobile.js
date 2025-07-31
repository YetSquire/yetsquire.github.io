import { useEffect, useState } from 'react'

export const useIsMobile = () => {
  const [m, setM] = useState(false)
  useEffect(() => {
    setM(/iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(navigator.userAgent))
  }, [])
  return m
}
