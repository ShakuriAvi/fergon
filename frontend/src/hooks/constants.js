/* Constants for the hooks/ folder.

   Magic numbers/strings shared by the responsive hooks live here so the mobile
   breakpoint is defined once. */

/* Below this width (px) the UI switches to the mobile layout (mirrors
   fergon.html). */
export const MOBILE_BREAKPOINT_PX = 880;

/* Fallback viewport width used during SSR / before the first measurement. */
export const DEFAULT_VIEWPORT_WIDTH_PX = 1200;
