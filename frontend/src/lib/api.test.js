import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, ApiError } from './api.js';
import { setSession, clearSession } from './auth.js';

function mockFetch(impl) {
  global.fetch = vi.fn().mockImplementation(impl);
}

describe('api client', () => {
  beforeEach(() => {
    clearSession();
    // Clear any CSRF cookie left by a prior test.
    document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    vi.restoreAllMocks();
  });

  it('builds URL with query params and returns JSON', async () => {
    mockFetch(async () => ({ ok: true, status: 200, json: async () => ({ items: [], total: 0 }) }));
    const res = await api.organizations.list({ q: 'herzl', limit: 20 });
    expect(res).toEqual({ items: [], total: 0 });
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('/admin/organizations');
    expect(url).toContain('q=herzl');
    expect(url).toContain('limit=20');
  });

  it('sends credentials (cookie auth) and no Bearer header', async () => {
    setSession({ access_level: 'admin' });
    mockFetch(async () => ({ ok: true, status: 200, json: async () => ({}) }));
    await api.me();
    const opts = global.fetch.mock.calls[0][1];
    expect(opts.credentials).toBe('include');
    expect(opts.headers.Authorization).toBeUndefined();
  });

  it('echoes the CSRF cookie in the X-CSRF-Token header on unsafe methods', async () => {
    document.cookie = 'csrf_token=csrf-xyz';
    mockFetch(async () => ({ ok: true, status: 200, json: async () => ({}) }));
    await api.organizations.create({ name: 'X' });
    const opts = global.fetch.mock.calls[0][1];
    expect(opts.method).toBe('POST');
    expect(opts.headers['X-CSRF-Token']).toBe('csrf-xyz');
  });

  it('does not send a CSRF header on safe (GET) requests', async () => {
    document.cookie = 'csrf_token=csrf-xyz';
    mockFetch(async () => ({ ok: true, status: 200, json: async () => ({}) }));
    await api.roles.list();
    const opts = global.fetch.mock.calls[0][1];
    expect(opts.headers['X-CSRF-Token']).toBeUndefined();
  });

  it('throws ApiError with the server detail on non-2xx', async () => {
    mockFetch(async () => ({ ok: false, status: 403, json: async () => ({ detail: 'אין הרשאה' }) }));
    await expect(api.roles.list()).rejects.toMatchObject({ status: 403, detail: 'אין הרשאה' });
    await expect(api.roles.list()).rejects.toBeInstanceOf(ApiError);
  });

  it('returns null for 204 No Content', async () => {
    mockFetch(async () => ({ ok: true, status: 204, json: async () => { throw new Error('no body'); } }));
    expect(await api.organizations.remove(1)).toBeNull();
  });
});
