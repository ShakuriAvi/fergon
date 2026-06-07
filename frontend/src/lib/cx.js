/* className joiner — shared across components (drops falsy values) */
export const cx = (...c) => c.filter(Boolean).join(' ');
