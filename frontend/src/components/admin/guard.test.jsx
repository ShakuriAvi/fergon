import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import he from '../../locales/he.json';

vi.mock('../../lib/api.js', () => {
  class ApiError extends Error {}
  return {
    ApiError,
    api: {
      me: vi.fn().mockResolvedValue({ id: 2, full_name: 'מורה', role: 'teacher', access_level: 'member', organization_id: 1 }),
      logout: vi.fn().mockResolvedValue(null),
    },
  };
});

import { isAdmin, setSession, clearSession } from '../../lib/auth.js';
import { CurrentUserProvider } from '../../context/CurrentUser.jsx';
import Shell from '../Shell.jsx';
import AdminApp from '../AdminApp.jsx';

describe('admin guard (#42)', () => {
  beforeEach(() => {
    clearSession();
    window.history.pushState({}, '', '/admin');
  });

  it('isAdmin is true only for the admin access level', () => {
    expect(isAdmin({ access_level: 'admin' })).toBe(true);
    expect(isAdmin({ access_level: 'member' })).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });

  it('the consumer Shell has no admin nav entry', () => {
    render(
      <CurrentUserProvider onLogout={() => {}}>
        <Shell active="feed" onNavigate={() => {}} onGive={() => {}} points={0}>x</Shell>
      </CurrentUserProvider>,
    );
    expect(screen.queryByText(he.nav.admin)).toBeNull();
    expect(screen.getByText(he.nav.feed)).toBeInTheDocument();
  });

  it('AdminApp denies a non-admin user', async () => {
    setSession({ access_level: 'member' });
    render(<AdminApp />);
    await waitFor(() => expect(screen.getByText(he.admin.accessDeniedTitle)).toBeInTheDocument());
  });
});
