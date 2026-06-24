/* Lightweight client session (#34, hardened).
   The access token is NOT stored here: the backend delivers it in an HttpOnly
   cookie that JavaScript cannot read (so an XSS cannot exfiltrate it). This
   module only holds a non-sensitive UI marker (e.g. access_level, email) used
   to gate the admin panel; it grants no real access — the server authorizes
   every request from the cookie.

   Falls back to an in-memory store when localStorage is unavailable (SSR / some
   test environments) so the session API never throws. */
import { STORAGE_KEY, COOKIE } from './constants.js';

const SESSION_KEY = STORAGE_KEY.SESSION;

const memoryStore = new Map();

function backend() {
  try {
    if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
  } catch {
    /* access can throw in sandboxed contexts */
  }
  return {
    getItem: (k) => (memoryStore.has(k) ? memoryStore.get(k) : null),
    setItem: (k, v) => memoryStore.set(k, v),
    removeItem: (k) => memoryStore.delete(k),
  };
}

function read() {
  try {
    return JSON.parse(backend().getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export function getSession() {
  return read();
}

export function setSession(session) {
  backend().setItem(SESSION_KEY, JSON.stringify(session || {}));
}

export function clearSession() {
  backend().removeItem(SESSION_KEY);
}

/* True when a local session marker exists. The real credential is the HttpOnly
   cookie set by the server at login; this only gates the UI. */
export function isAuthed() {
  return !!read();
}

/* Read the readable (non-HttpOnly) CSRF cookie the server set at login, to echo
   back in the X-CSRF-Token header on state-changing requests (double-submit). */
export function getCsrfToken() {
  if (typeof document === 'undefined' || !document.cookie) return '';
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE.CSRF}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : '';
}

/* The single source of truth for "may this user reach the admin panel". */
export function isAdmin(user) {
  return user?.access_level === 'admin';
}
