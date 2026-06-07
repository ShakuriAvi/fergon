import '@testing-library/jest-dom/vitest';
import '../i18n.js';

/* jsdom doesn't implement scrollTo — stub it so navigation in App is quiet */
window.scrollTo = () => {};
