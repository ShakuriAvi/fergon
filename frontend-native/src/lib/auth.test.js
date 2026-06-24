import { getSession, setSession, clearSession, getToken, isAdmin } from './auth';

describe('native auth/session', () => {
  beforeEach(() => clearSession());

  it('isAdmin is true only for the admin access level', () => {
    expect(isAdmin({ access_level: 'admin' })).toBe(true);
    expect(isAdmin({ access_level: 'member' })).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });

  it('round-trips the session and token via the in-memory fallback', () => {
    expect(getSession()).toBeNull();
    setSession({ access_level: 'admin', token: 'abc' });
    expect(getSession()).toEqual({ access_level: 'admin', token: 'abc' });
    expect(getToken()).toBe('abc');
    clearSession();
    expect(getSession()).toBeNull();
    expect(getToken()).toBe('');
  });
});
