/* App-level shared constants (#magic-strings).

   Single source of truth for the "magic strings" that repeat across the app:
   view identifiers and route prefixes. Importing these instead of retyping the
   literals keeps the navigation/routing logic in sync. Per-folder constants
   live in each folder's own `constants.js`; cross-cutting ones live here.

   Note: Tailwind className strings are intentionally NOT centralized here —
   they are presentation tokens, not logic, and naming them hurts readability. */

/* The selectable consumer views (used by App, Shell nav and bottom tabs). */
export const VIEW = Object.freeze({
  FEED: 'feed',
  PROFILE: 'profile',
  REWARDS: 'rewards',
  PRINCIPAL: 'principal',
  ADMIN: 'admin',
});

/* Synthetic bottom-tab id for the central "give" action button. */
export const GIVE_TAB = '__give';

/* Path-based routing. */
export const ROUTE = Object.freeze({
  ADMIN_PREFIX: '/admin',
});
