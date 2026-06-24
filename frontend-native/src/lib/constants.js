/* Constants for the lib/ layer (API client + auth).

   Centralizes the repeated "magic strings" used when talking to the backend:
   HTTP verbs, header names, the admin path prefix and the client-side session
   storage key. Native auth uses the Authorization: Bearer header (mobile apps
   have no cookie jar), so there is no CSRF token here. */

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
  AUTHORIZATION: 'Authorization',
});

/* Session storage key holding the token + UI marker. */
export const STORAGE_KEY = Object.freeze({
  SESSION: 'fergon_session',
});

/* Path prefix for the admin API surface. */
export const API_PREFIX = Object.freeze({
  ADMIN: '/admin',
});
