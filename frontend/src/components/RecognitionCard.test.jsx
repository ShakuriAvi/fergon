import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RecognitionCard from './RecognitionCard.jsx';

const item = {
  id: 1,
  from_name: 'יעל כהן',
  to_name: 'אבי מזרחי',
  points: 5,
  message: 'כל הכבוד',
  values: [{ id: 2, key: 'שיתוף פעולה', emoji: '🤝' }],
  created_at: new Date().toISOString(),
};

describe('RecognitionCard (#47)', () => {
  it('renders the recognition without clap, comment, or share actions', () => {
    render(<RecognitionCard item={item} first />);
    expect(screen.getByText('יעל כהן')).toBeInTheDocument();
    expect(screen.getByText('אבי מזרחי')).toBeInTheDocument();
    expect(screen.getByText('שיתוף פעולה')).toBeInTheDocument();
    expect(screen.queryByText('👏')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
