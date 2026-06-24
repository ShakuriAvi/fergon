/* Lightweight client session (#37, mirrors the web client).
   Holds the access token + the current user's access_level so the UI can gate
   the admin panel. Uses an in-memory store with an optional localStorage backend
   (web build); on native localStorage is absent so the in-memory store is used. */
import { STORAGE_KEY } from './constants';

const SESSION_KEY = STORAGE_KEY.SESSION;

const memoryStore = new Map();

function backend() {
  try {
    if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
  } catch {
    /* ignore */
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

export function getToken() {
  return read()?.token || '';
}

export function isAdmin(user) {
  return user?.access_level === 'admin';
}
