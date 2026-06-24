/* Guards the per-folder constants convention (#magic-strings) for native.

   Lives under src/lib so the jest config (which only matches src/lib tests)
   runs it. It (1) checks the constant modules export stable values and (2) is a
   regression guard: the centralized i18n keys / HTTP verbs must not reappear as
   raw literals in src/. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { VIEW, GIVE_TAB } from '../constants';
import { I18N } from '../components/constants';
import { HTTP, HEADER, STORAGE_KEY, API_PREFIX } from './constants';

const SRC = join(__dirname, '..'); // frontend-native/src

function srcFiles(dir = SRC) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...srcFiles(full));
    } else if (/\.js$/.test(entry) && !/\.test\.js$/.test(entry) && entry !== 'constants.js') {
      out.push(full);
    }
  }
  return out;
}

describe('native constants modules', () => {
  it('expose the expected view ids', () => {
    expect(VIEW).toMatchObject({ FEED: 'feed', PROFILE: 'profile', REWARDS: 'rewards', PRINCIPAL: 'principal', ADMIN: 'admin' });
    expect(GIVE_TAB).toBe('__give');
  });

  it('expose lib magic-strings', () => {
    expect(HTTP).toMatchObject({ GET: 'GET', POST: 'POST', PUT: 'PUT', PATCH: 'PATCH', DELETE: 'DELETE' });
    expect(HEADER.AUTHORIZATION).toBe('Authorization');
    expect(STORAGE_KEY.SESSION).toBe('fergon_session');
    expect(API_PREFIX.ADMIN).toBe('/admin');
  });
});

describe('native: no centralized literal reappears raw in source', () => {
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
