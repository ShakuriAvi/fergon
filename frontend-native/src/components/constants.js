/* Constants for the components/ folder.

   Centralizes i18n translation *keys* used by more than one component (or more
   than once in a component); the Hebrew copy still lives in locales/he.json.
   View identifiers are re-exported from the app-level constants. */

export { VIEW, GIVE_TAB } from '../constants.js';

/* Repeated i18n keys. */
export const I18N = Object.freeze({
  COMMON_LOADING: 'common.loading',
  COMMON_ERROR: 'common.error',
  COMMON_GIVE: 'common.give',
  COMMON_SAVE: 'common.save',
  COMMON_POINTS: 'common.points',
  APP_BRAND: 'app.brand',
  ADMIN_MANAGE: 'admin.manage',
  ADMIN_SHOW_INACTIVE: 'admin.showInactive',
  DEVLOGIN_PLACEHOLDER: 'devLogin.placeholder',
});
