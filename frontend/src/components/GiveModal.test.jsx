import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GiveModal from './GiveModal.jsx';
import he from '../locales/he.json';
import { getUser } from '../data/mock.js';

const noop = () => {};
const david = getUser('u_david').name; // mock peer used across the flow
const overQuotaPrefix = he.give.overQuota.split('{{')[0].trim();

describe('GiveModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<GiveModal open={false} onClose={noop} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the four steps when open', () => {
    render(<GiveModal open onClose={noop} allowanceLeft={40} />);
    expect(screen.getByRole('heading', { name: he.give.title })).toBeInTheDocument();
    expect(screen.getByText(he.give.field1)).toBeInTheDocument();
    expect(screen.getByText(he.give.field4)).toBeInTheDocument();
  });

  it('enables send only after peer, message and value are set', () => {
    render(<GiveModal open onClose={noop} allowanceLeft={40} />);
    const send = screen.getByRole('button', { name: he.give.send });
    expect(send).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(he.give.searchPlaceholder), { target: { value: david } });
    fireEvent.click(screen.getByText(david));
    fireEvent.change(screen.getByPlaceholderText(he.give.msgPlaceholder), { target: { value: 'test message' } });
    expect(send).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(he.values.collab) }));
    expect(send).toBeEnabled();
  });

  it('warns when points exceed the allowance', () => {
    render(<GiveModal open onClose={noop} allowanceLeft={3} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '8' } });
    expect(screen.getByText(new RegExp(overQuotaPrefix))).toBeInTheDocument();
  });

  it('shows the success state and fires onSent after sending', () => {
    vi.useFakeTimers();
    const onSent = vi.fn();
    render(<GiveModal open onClose={noop} onSent={onSent} allowanceLeft={40} />);
    fireEvent.change(screen.getByPlaceholderText(he.give.searchPlaceholder), { target: { value: david } });
    fireEvent.click(screen.getByText(david));
    fireEvent.change(screen.getByPlaceholderText(he.give.msgPlaceholder), { target: { value: 'great work' } });
    fireEvent.click(screen.getByRole('button', { name: new RegExp(he.values.lead) }));
    fireEvent.click(screen.getByRole('button', { name: he.give.send }));
    expect(screen.getByText(he.success.title)).toBeInTheDocument();
    vi.runAllTimers();
    expect(onSent).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
