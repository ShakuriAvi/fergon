import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App.jsx';
import he from './locales/he.json';

describe('App routing', () => {
  it('shows the login page first, then the feed after login', () => {
    render(<App />);
    // login screen
    expect(screen.getByText(he.login.google)).toBeInTheDocument();
    expect(screen.getByText(he.login.tagline)).toBeInTheDocument();

    // log in via Google SSO
    fireEvent.click(screen.getByText(he.login.google));

    // feed view is now shown (nav + greeting present)
    expect(screen.getByText(he.nav.feed)).toBeInTheDocument();
    expect(screen.getByText(he.feed.spotlight)).toBeInTheDocument();
  });

  it('navigates to the rewards store via the sidebar', () => {
    render(<App />);
    fireEvent.click(screen.getByText(he.login.guest));
    fireEvent.click(screen.getByText(he.nav.rewards));
    expect(screen.getByRole('heading', { name: he.rewards.title })).toBeInTheDocument();
  });

  it('opens the give modal from the sidebar button', () => {
    render(<App />);
    fireEvent.click(screen.getByText(he.login.google));
    // sidebar "give" button + modal heading both read תן הכרה; open the modal
    fireEvent.click(screen.getAllByText(he.give.title)[0]);
    expect(screen.getByText(he.give.field1)).toBeInTheDocument();
  });
});
