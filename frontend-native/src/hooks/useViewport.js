import { useWindowDimensions } from 'react-native';
import { MOBILE_BREAKPOINT } from '../theme';

/* responsive hook — RN equivalent of the original web useViewport.
   useWindowDimensions re-renders on resize/rotate across web + native. */
export function useViewport() {
  const { width } = useWindowDimensions();
  return { w: width, isMobile: width < MOBILE_BREAKPOINT };
}
