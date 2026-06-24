/* App-level shared constants (#magic-strings).

   Single source of truth for the view identifiers and the synthetic "give" tab
   id that repeat across App.js, the shell nav and the bottom tabs. Per-folder
   constants live in each folder's own `constants.js`; the responsive breakpoint
   lives in `theme.js`. StyleSheet/theme tokens are intentionally NOT duplicated
   here. */

/* The selectable consumer views. */
export const VIEW = Object.freeze({
  FEED: 'feed',
  PROFILE: 'profile',
  REWARDS: 'rewards',
  PRINCIPAL: 'principal',
  ADMIN: 'admin',
});

/* Synthetic bottom-tab id for the central "give" action button. */
export const GIVE_TAB = '__give';
