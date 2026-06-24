import { api, ApiError } from './api';
import { setSession, clearSession } from './auth';

function mockFetch(impl) {
  global.fetch = jest.fn().mockImplementation(impl);
}

describe('native api client', () => {
  beforeEach(() => {
    clearSession();
    jest.restoreAllMocks();
  });

  it('builds the URL with query params and returns JSON', async () => {
    mockFetch(async () => ({ ok: true, status: 200, json: async () => ({ items: [], total: 0 }) }));
    const res = await api.organizations.list({ q: 'herzl', limit: 20 });
    expect(res).toEqual({ items: [], total: 0 });
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('/admin/organizations');
    expect(url).toContain('q=herzl');
  });

  it('attaches the Bearer token from the session', async () => {
    setSession({ token: 'tok123', access_level: 'admin' });
    mockFetch(async () => ({ ok: true, status: 200, json: async () => ({}) }));
    await api.me();
    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer tok123');
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

  it('dev-login posts the email to /auth/dev-login (#44)', async () => {
    mockFetch(async () => ({ ok: true, status: 200, json: async () => ({ access_token: 't', user: {} }) }));
    await api.devLogin('teacher@fergon.dev');
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain('/auth/dev-login');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ email: 'teacher@fergon.dev' });
  });

  it('exposes the consumer read + action endpoints (#44)', async () => {
    mockFetch(async () => ({ ok: true, status: 200, json: async () => ({}) }));
    await api.feed({ limit: 20 });
    expect(global.fetch.mock.calls[0][0]).toContain('/feed');
    await api.givePost({ to_user_id: 2, points: 5 });
    expect(global.fetch.mock.calls[1][0]).toContain('/posts');
    expect(global.fetch.mock.calls[1][1].method).toBe('POST');
  });
});
