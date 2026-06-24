/* Constants for the lib/ layer (API client + auth).

   Centralizes the repeated "magic strings" used when talking to the backend:
   HTTP verbs, header names, the admin path prefix, and the client-side storage
   / cookie keys. Keeping these here prevents subtle drift (e.g. a typo'd header
   name silently disabling CSRF). */

/* HTTP methods. */
export const HTTP = Object.freeze({
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
});

/* Request header names. */
export const HEADER = Object.freeze({
  CONTENT_TYPE: 'Content-Type',
  CSRF: 'X-CSRF-Token',
});

/* localStorage key holding the non-sensitive UI session marker. */
export const STORAGE_KEY = Object.freeze({
  SESSION: 'fergon_session',
});

/* Readable cookie the server sets for double-submit CSRF. */
export const COOKIE = Object.freeze({
  CSRF: 'csrf_token',
});

/* Path prefix for the admin API surface. */
export const API_PREFIX = Object.freeze({
  ADMIN: '/admin',
});
