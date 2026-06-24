/* Guards the per-folder constants convention (#magic-strings).

   1. The constant modules export the expected, stable values.
   2. Regression guard: the centralized "magic strings" (repeated i18n keys and
      HTTP verbs) must NOT reappear as raw literals anywhere in src/ — they have
      to be imported from the folder's constants.js. This keeps "all repeating
      strings live in const files" true over time, not just today. */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { VIEW, GIVE_TAB, ROUTE } from './constants.js';
import { I18N } from './components/constants.js';
import { HTTP, HEADER, STORAGE_KEY, COOKIE, API_PREFIX } from './lib/constants.js';
import { MOBILE_BREAKPOINT_PX } from './hooks/constants.js';

const SRC = dirname(fileURLToPath(import.meta.url));

function srcFiles(dir = SRC) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...srcFiles(full));
    } else if (/\.(js|jsx)$/.test(entry) && !/\.test\.(js|jsx)$/.test(entry) && entry !== 'constants.js') {
      out.push(full);
    }
  }
  return out;
}

describe('constants modules', () => {
  it('expose the expected view ids and route prefix', () => {
    expect(VIEW).toMatchObject({ FEED: 'feed', PROFILE: 'profile', REWARDS: 'rewards', PRINCIPAL: 'principal', ADMIN: 'admin' });
    expect(GIVE_TAB).toBe('__give');
    expect(ROUTE.ADMIN_PREFIX).toBe('/admin');
  });

  it('expose lib magic-strings', () => {
    expect(HTTP).toMatchObject({ GET: 'GET', POST: 'POST', PUT: 'PUT', PATCH: 'PATCH', DELETE: 'DELETE' });
    expect(HEADER.CSRF).toBe('X-CSRF-Token');
    expect(STORAGE_KEY.SESSION).toBe('fergon_session');
    expect(COOKIE.CSRF).toBe('csrf_token');
    expect(API_PREFIX.ADMIN).toBe('/admin');
  });

  it('expose the mobile breakpoint', () => {
    expect(MOBILE_BREAKPOINT_PX).toBe(880);
  });
});

describe('no centralized literal reappears raw in source', () => {
  const files = srcFiles();

  it('repeated i18n keys are always referenced via I18N.*', () => {
    const offenders = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const key of Object.values(I18N)) {
        if (text.includes(`t('${key}')`) || text.includes(`t("${key}")`)) {
          offenders.push(`${file}: t('${key}')`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('HTTP verbs in fetch options are referenced via HTTP.*', () => {
    const offenders = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const verb of Object.values(HTTP)) {
        if (new RegExp(`method:\\s*['"]${verb}['"]`).test(text)) {
          offenders.push(`${file}: method: '${verb}'`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
