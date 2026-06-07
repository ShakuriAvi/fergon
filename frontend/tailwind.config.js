/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        'paper-sink': 'var(--paper-sink)',
        'card-cream': 'var(--card-cream)',
        rule: 'var(--rule)',
        'rule-strong': 'var(--rule-strong)',
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
          4: 'var(--ink-4)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          700: 'var(--primary-700)',
          200: 'var(--primary-200)',
          100: 'var(--primary-100)',
          50: 'var(--primary-50)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          700: 'var(--accent-700)',
          100: 'var(--accent-100)',
          50: 'var(--accent-50)',
        },
        info: {
          DEFAULT: 'var(--info)',
          100: 'var(--info-100)',
          50: 'var(--info-50)',
        },
        gold: {
          DEFAULT: 'var(--gold)',
          deep: 'var(--gold-deep)',
          100: 'var(--gold-100)',
          50: 'var(--gold-50)',
        },
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
      },
      borderRadius: {
        1: 'var(--r-1)',
        2: 'var(--r-2)',
        3: 'var(--r-3)',
        4: 'var(--r-4)',
        pill: 'var(--r-pill)',
      },
      boxShadow: {
        pop: 'var(--shadow-pop)',
        modal: 'var(--shadow-modal)',
      },
      transitionTimingFunction: {
        sy: 'var(--ease)',
      },
      transitionDuration: {
        1: '160ms',
        2: '240ms',
        3: '400ms',
      },
    },
  },
  plugins: [],
};
