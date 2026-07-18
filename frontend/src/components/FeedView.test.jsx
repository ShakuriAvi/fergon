import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import he from '../locales/he.json';

vi.mock('../lib/api.js', () => {
  class ApiError extends Error {}
  return {
    ApiError,
    api: {
      me: vi.fn().mockResolvedValue({ id: 1, full_name: 'יעל כהן', role: 'teacher', access_level: 'member', organization_id: 1 }),
      orgValueOptions: vi.fn().mockResolvedValue([
        { id: 5, key: 'שיתוף פעולה', emoji: '🤝' },
        { id: 6, key: 'חדשנות', emoji: '💡' },
      ]),
      feed: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      leaderboard: vi.fn().mockResolvedValue([]),
    },
  };
});

import { api } from '../lib/api.js';
import { setSession } from '../lib/auth.js';
import { CurrentUserProvider } from '../context/CurrentUser.jsx';
import FeedView from './FeedView.jsx';

const noop = () => {};

function renderFeed() {
  return render(
    <CurrentUserProvider onLogout={noop}>
      <FeedView onGive={noop} points={340} allowanceLeft={40} refreshKey={0} />
    </CurrentUserProvider>,
  );
}

describe('FeedView filter chips (#46)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setSession({ access_level: 'member' });
  });

  it('loads without a value filter and renders a chip per org value', async () => {
    renderFeed();
    await waitFor(() => expect(api.feed).toHaveBeenCalled());
    expect(api.feed).toHaveBeenCalledWith({ limit: 50, recognition_value_id: undefined });
    expect(await screen.findByText(he.feed.filterAll)).toBeInTheDocument();
    expect(screen.getByText('שיתוף פעולה')).toBeInTheDocument();
    expect(screen.getByText('חדשנות')).toBeInTheDocument();
  });

  it('re-fetches the feed scoped to the selected value, and clears on "All"', async () => {
    renderFeed();
    await waitFor(() => expect(api.feed).toHaveBeenCalled());

    fireEvent.click(screen.getByText('שיתוף פעולה'));
    await waitFor(() =>
      expect(api.feed).toHaveBeenCalledWith({ limit: 50, recognition_value_id: 5 }),
    );

    fireEvent.click(screen.getByText(he.feed.filterAll));
    await waitFor(() =>
      expect(api.feed).toHaveBeenLastCalledWith({ limit: 50, recognition_value_id: undefined }),
    );
  });
});
