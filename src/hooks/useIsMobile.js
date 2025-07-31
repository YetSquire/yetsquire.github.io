import { useEffect, useState } from 'react';

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(
      /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(
        navigator.userAgent,
      ),
    );
  }, []);
  return isMobile;
};
