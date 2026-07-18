import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import he from './locales/he.json';

vi.mock('./lib/api.js', () => {
  class ApiError extends Error {}
  return {
    ApiError,
    api: {
      me: vi.fn().mockResolvedValue({ id: 1, full_name: 'יעל כהן', role: 'teacher', access_level: 'member', organization_id: 1 }),
      wallet: vi.fn().mockResolvedValue({ points_balance: 340, allowance_total: 100, allowance_used: 60, allowance_remaining: 40 }),
      feed: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      leaderboard: vi.fn().mockResolvedValue([]),
      orgValueOptions: vi.fn().mockResolvedValue([]),
      devLogin: vi.fn(),
    },
  };
});

import { setSession, clearSession } from './lib/auth.js';
import App from './App.jsx';

describe('App routing (#42/#43)', () => {
  beforeEach(() => {
    clearSession();
    window.history.pushState({}, '', '/');
  });

  it('consumer route shows the email dev-login when logged out', () => {
    render(<App />);
    expect(screen.getAllByText(he.devLogin.signIn).length).toBeGreaterThan(0);
  });

  it('consumer route renders the backend-driven feed when logged in', async () => {
    setSession({ access_level: 'member' });
    render(<App />);
    await waitFor(() => expect(screen.getAllByText(/יעל/).length).toBeGreaterThan(0));
  });

  it('/admin route shows the standalone admin login', () => {
    window.history.pushState({}, '', '/admin');
    render(<App />);
    expect(screen.getByText(he.admin.loginHeading)).toBeInTheDocument();
  });
});
