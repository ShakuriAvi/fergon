import { useState, useEffect } from 'react';

/* responsive hook — mirrors fergon.html (mobile < 880px) */
export function useViewport() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const onR = () => setW(window.innerWidth);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  return { w, isMobile: w < 880 };
}
