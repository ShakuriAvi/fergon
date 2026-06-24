import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import he from '../locales/he.json';

vi.mock('../lib/api.js', () => {
  class ApiError extends Error {}
  return {
    ApiError,
    api: {
      orgMembers: vi.fn().mockResolvedValue([{ id: 2, full_name: 'דוד לוי' }]),
      orgValues: vi.fn().mockResolvedValue([
        { id: 5, key: 'שיתוף פעולה', emoji: '🤝' },
        { id: 6, key: 'מנהיגות', emoji: '🏆' },
      ]),
      givePost: vi.fn().mockResolvedValue({ id: 1 }),
    },
  };
});

import { api } from '../lib/api.js';
import GiveModal from './GiveModal.jsx';

const noop = () => {};

describe('GiveModal (#43)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders nothing when closed', () => {
    const { container } = render(<GiveModal open={false} onClose={noop} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the steps and loads members + values', async () => {
    render(<GiveModal open onClose={noop} allowanceLeft={40} />);
    expect(screen.getByRole('heading', { name: he.give.title })).toBeInTheDocument();
    await waitFor(() => expect(api.orgMembers).toHaveBeenCalled());
    expect(api.orgValues).toHaveBeenCalled();
  });

  it('submits a recognition via the backend and fires onSent', async () => {
    vi.useFakeTimers();
    const onSent = vi.fn();
    render(<GiveModal open onClose={noop} onSent={onSent} allowanceLeft={40} />);

    // members/values load (flush mocked promises)
    await vi.runAllTimersAsync();

    fireEvent.change(screen.getByPlaceholderText(he.give.searchPlaceholder), { target: { value: 'דוד' } });
    fireEvent.click(screen.getByText('דוד לוי'));
    fireEvent.change(screen.getByPlaceholderText(he.give.msgPlaceholder), { target: { value: 'כל הכבוד' } });
    fireEvent.click(screen.getByRole('button', { name: /שיתוף פעולה/ }));
    fireEvent.click(screen.getByRole('button', { name: he.give.send }));

    await vi.runAllTimersAsync();
    expect(api.givePost).toHaveBeenCalledWith({
      to_user_id: 2,
      points: 5,
      message: 'כל הכבוד',
      recognition_value_ids: [5],
    });
    expect(onSent).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('warns when points exceed the allowance', async () => {
    render(<GiveModal open onClose={noop} allowanceLeft={3} />);
    await waitFor(() => expect(api.orgValues).toHaveBeenCalled());
    fireEvent.change(screen.getByRole('slider'), { target: { value: '8' } });
    expect(screen.getByText(new RegExp(he.give.overQuota.split('{{')[0].trim()))).toBeInTheDocument();
  });
});
