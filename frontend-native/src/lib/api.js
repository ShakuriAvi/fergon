/* Fetch-based API client for the fergon backend (#37, mirrors the web client).
   Base URL comes from EXPO_PUBLIC_API_URL; the Bearer token (when present) is
   attached from the local session. Errors are normalized to ApiError. */
import { getToken } from './auth';
import { HTTP, HEADER, API_PREFIX } from './constants';

const BASE_URL = (
  (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_API_URL) ||
  'http://localhost:8000'
).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, detail) {
    super(detail || `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

function buildUrl(path, params) {
  let url = BASE_URL + path;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }
  return url;
}

export async function request(path, { method = HTTP.GET, body, params } = {}) {
  const headers = { [HEADER.CONTENT_TYPE]: 'application/json' };
  const token = getToken();
  if (token) headers[HEADER.AUTHORIZATION] = `Bearer ${token}`;

  const res = await fetch(buildUrl(path, params), {
    method,
    headers,
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
  // TEMPORARY (#39/#44): dev-only email login; replaced by Google OAuth later.
  devLogin: (email) => request('/auth/dev-login', { method: HTTP.POST, body: { email } }),

  // Consumer (non-admin) reads + actions (#41/#44).
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
  orgValues: {
    list: (orgId, params) => request(`${API_PREFIX.ADMIN}/organizations/${orgId}/recognition-values`, { params }),
    available: (orgId) => request(`${API_PREFIX.ADMIN}/organizations/${orgId}/recognition-values/available`),
    add: (orgId, recognitionValueId) =>
      request(`${API_PREFIX.ADMIN}/organizations/${orgId}/recognition-values`, {
        method: HTTP.POST,
        body: { recognition_value_id: recognitionValueId },
      }),
    remove: (orgId, recognitionValueId) =>
      request(`${API_PREFIX.ADMIN}/organizations/${orgId}/recognition-values/${recognitionValueId}`, { method: HTTP.DELETE }),
  },
  orgAllowances: {
    list: (orgId) => request(`${API_PREFIX.ADMIN}/organizations/${orgId}/role-allowances`),
    set: (orgId, roleId, monthlyPoints) =>
      request(`${API_PREFIX.ADMIN}/organizations/${orgId}/role-allowances`, {
        method: HTTP.PUT,
        body: { role_id: roleId, monthly_points: monthlyPoints },
      }),
    remove: (orgId, roleId) =>
      request(`${API_PREFIX.ADMIN}/organizations/${orgId}/role-allowances/${roleId}`, { method: HTTP.DELETE }),
  },
};
