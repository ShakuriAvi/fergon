import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import he from '../../locales/he.json';

vi.mock('../../lib/api.js', () => {
  const api = {
    orgValues: {
      list: vi.fn().mockResolvedValue([
        { id: 10, recognition_value_id: 5, key: 'הקשבה', emoji: '👂', is_active: true },
      ]),
      available: vi.fn().mockResolvedValue([{ id: 6, key: 'יצירתיות', emoji: '🎨' }]),
      add: vi.fn().mockResolvedValue({}),
      remove: vi.fn().mockResolvedValue({}),
    },
    orgAllowances: {
      list: vi.fn().mockResolvedValue([
        { role_id: 1, name_he: 'מורה', monthly_points: null },
      ]),
      set: vi.fn().mockResolvedValue({}),
      remove: vi.fn().mockResolvedValue({}),
    },
  };
  return { api, ApiError: class ApiError extends Error {} };
});

import { api } from '../../lib/api.js';
import OrgDetail from './OrgDetail.jsx';

describe('OrgDetail (#36)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists the org values and allowances', async () => {
    render(<OrgDetail org={{ id: 1, name: 'בית ספר הרצל' }} onBack={() => {}} />);
    await screen.findByText(/הקשבה/);
    expect(screen.getByText('מורה')).toBeInTheDocument();
    expect(api.orgValues.list).toHaveBeenCalledWith(1);
    expect(api.orgAllowances.list).toHaveBeenCalledWith(1);
  });

  it('adds a recognition value from the available list', async () => {
    render(<OrgDetail org={{ id: 1, name: 'בית ספר' }} onBack={() => {}} />);
    await screen.findByText(/הקשבה/);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '6' } });
    fireEvent.click(screen.getByText(he.admin.orgValuesAdd));
    await waitFor(() => expect(api.orgValues.add).toHaveBeenCalledWith(1, 6));
  });

  it('sets a role allowance', async () => {
    render(<OrgDetail org={{ id: 1, name: 'בית ספר' }} onBack={() => {}} />);
    await screen.findByText('מורה');
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '40' } });
    fireEvent.click(screen.getByText(he.common.save));
    await waitFor(() => expect(api.orgAllowances.set).toHaveBeenCalledWith(1, 1, 40));
  });
});
