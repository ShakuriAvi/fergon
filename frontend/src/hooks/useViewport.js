import { useState, useEffect } from 'react';
import { MOBILE_BREAKPOINT_PX, DEFAULT_VIEWPORT_WIDTH_PX } from './constants.js';

/* responsive hook — mirrors fergon.html (mobile < MOBILE_BREAKPOINT_PX) */
export function useViewport() {
  const [w, setW] = useState(
    typeof window !== 'undefined' ? window.innerWidth : DEFAULT_VIEWPORT_WIDTH_PX,
  );
  useEffect(() => {
    const onR = () => setW(window.innerWidth);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  return { w, isMobile: w < MOBILE_BREAKPOINT_PX };
}
