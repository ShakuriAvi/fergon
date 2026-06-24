/* Constants for the components/ folder.

   Centralizes i18n translation *keys* that are used by more than one component
   (or more than once in a component), so a renamed key is changed in one place.
   The actual Hebrew copy still lives in locales/he.json — only the key strings
   are centralized here. View identifiers are re-exported from the app-level
   constants so nav/tab components import them from one place. */

export { VIEW, GIVE_TAB } from '../constants.js';

/* Repeated i18n keys. Grouped by namespace for readability. */
export const I18N = Object.freeze({
  COMMON_LOADING: 'common.loading',
  COMMON_ERROR: 'common.error',
  COMMON_GIVE: 'common.give',
  COMMON_SAVE: 'common.save',
  COMMON_POINTS: 'common.points',
  APP_BRAND: 'app.brand',
  ADMIN_MANAGE: 'admin.manage',
  ADMIN_LOGOUT: 'admin.logout',
  DEVLOGIN_PLACEHOLDER: 'devLogin.placeholder',
});
