import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import he from '../locales/he.json';

vi.mock('../lib/api.js', () => {
  class ApiError extends Error {
    constructor(status, detail) { super(detail); this.status = status; this.detail = detail; }
  }
  return {
    ApiError,
    api: {
      devLogin: vi.fn().mockResolvedValue({
        access_token: 'tok-123',
        user: { email: 'teacher@fergoni.dev', access_level: 'member' },
      }),
    },
  };
});

import { api } from '../lib/api.js';
import { getSession, clearSession } from '../lib/auth.js';
import DevLoginView from './DevLoginView.jsx';

describe('DevLoginView (#43)', () => {
  beforeEach(() => clearSession());

  it('logs in with an email and stores the UI marker (token stays in the cookie)', async () => {
    const onSuccess = vi.fn();
    render(<DevLoginView onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText(he.devLogin.placeholder), {
      target: { value: 'teacher@fergoni.dev' },
    });
    fireEvent.click(screen.getByText(he.devLogin.signIn));

    await waitFor(() => expect(api.devLogin).toHaveBeenCalledWith('teacher@fergoni.dev'));
    // The token is never persisted client-side; only the non-sensitive marker is.
    await waitFor(() => expect(getSession()?.access_level).toBe('member'));
    expect(getSession()?.token).toBeUndefined();
    expect(onSuccess).toHaveBeenCalled();
  });
});
