/* Minimal fetch-based API client for the fergoni backend (#34, hardened).
   Base URL comes from VITE_API_URL. Auth rides on the HttpOnly session cookie
   the server set at login, so requests are sent with credentials: 'include' and
   carry no Bearer header. State-changing requests echo the CSRF cookie back in
   the X-CSRF-Token header (double-submit). Errors are normalized to ApiError so
   callers can show i18n'd messages. Admin endpoints live under /admin and are
   admin-only on the server. */
import { getCsrfToken } from './auth.js';
import { HTTP, HEADER, API_PREFIX, DEFAULT_API_URL } from './constants.js';

const UNSAFE_METHODS = new Set([HTTP.POST, HTTP.PUT, HTTP.PATCH, HTTP.DELETE]);

// Vite only statically replaces (and tree-shakes) the direct
// `import.meta.env.VITE_*` member-access pattern at build time — optional
// chaining here would silently defeat that, leaving every build pinned to
// the localhost fallback regardless of VITE_API_URL.
const BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, detail) {
    super(detail || `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

function buildUrl(path, params) {
  const url = new URL(BASE_URL + path);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function request(path, { method = HTTP.GET, body, params } = {}) {
  const headers = { [HEADER.CONTENT_TYPE]: 'application/json' };
  // Cookie auth is ambient, so unsafe methods must prove same-origin intent by
  // echoing the readable CSRF cookie back in a header the server compares.
  if (UNSAFE_METHODS.has(method)) {
    const csrf = getCsrfToken();
    if (csrf) headers[HEADER.CSRF] = csrf;
  }

  const res = await fetch(buildUrl(path, params), {
    method,
    headers,
    credentials: 'include', // send/receive the HttpOnly session cookie
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let detail;
    try {
      const data = await res.json();
      detail = data?.detail ?? data?.message;
    } catch {
      detail = undefined;
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/* Generic CRUD helpers for a top-level admin collection. */
function crud(resource) {
  const base = `${API_PREFIX.ADMIN}/${resource}`;
  return {
    list: (params) => request(base, { params }),
    get: (id) => request(`${base}/${id}`),
    create: (body) => request(base, { method: HTTP.POST, body }),
    update: (id, body) => request(`${base}/${id}`, { method: HTTP.PUT, body }),
    remove: (id) => request(`${base}/${id}`, { method: HTTP.DELETE }),
    reactivate: (id) => request(`${base}/${id}/reactivate`, { method: HTTP.POST }),
  };
}

export const api = {
  me: () => request('/auth/me'),
  // TEMPORARY (#39/#43): dev-only email login; replaced by Google OAuth later.
  devLogin: (email) => request('/auth/dev-login', { method: HTTP.POST, body: { email } }),
  logout: () => request('/auth/logout', { method: HTTP.POST }),

  // Consumer (non-admin) reads + actions (#41/#43).
  feed: (params) => request('/feed', { params }),
  wallet: () => request('/me/wallet'),
  consumerRewards: () => request('/rewards'),
  leaderboard: () => request('/leaderboard'),
  orgMembers: () => request('/org/members'),
  orgValueOptions: () => request('/org/values'),
  givePost: (body) => request('/posts', { method: HTTP.POST, body }),
  redeem: (rewardId) => request('/redemptions', { method: HTTP.POST, body: { reward_id: rewardId } }),

  organizations: crud('organizations'),
  roles: crud('roles'),
  users: crud('users'),
  recognitionValues: crud('recognition-values'),
  rewards: crud('rewards'),

  // Per-organization config (#31, #32).
  orgValues: {
    list: (orgId, params) =>
      request(`${API_PREFIX.ADMIN}/organizations/${orgId}/recognition-values`, { params }),
    available: (orgId) =>
      request(`${API_PREFIX.ADMIN}/organizations/${orgId}/recognition-values/available`),
    add: (orgId, recognitionValueId) =>
      request(`${API_PREFIX.ADMIN}/organizations/${orgId}/recognition-values`, {
        method: HTTP.POST,
        body: { recognition_value_id: recognitionValueId },
      }),
    remove: (orgId, recognitionValueId) =>
      request(
        `${API_PREFIX.ADMIN}/organizations/${orgId}/recognition-values/${recognitionValueId}`,
        { method: HTTP.DELETE },
      ),
  },
  orgAllowances: {
    list: (orgId) => request(`${API_PREFIX.ADMIN}/organizations/${orgId}/role-allowances`),
    set: (orgId, roleId, monthlyPoints) =>
      request(`${API_PREFIX.ADMIN}/organizations/${orgId}/role-allowances`, {
        method: HTTP.PUT,
        body: { role_id: roleId, monthly_points: monthlyPoints },
      }),
    remove: (orgId, roleId) =>
      request(`${API_PREFIX.ADMIN}/organizations/${orgId}/role-allowances/${roleId}`, {
        method: HTTP.DELETE,
      }),
  },
};
