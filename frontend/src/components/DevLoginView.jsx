/* TEMPORARY email-only login (#39/#43).

   !!! TEMPORARY — REMOVE AT THE GOOGLE OAUTH CUTOVER !!!
   Type a seeded email, click → POST /auth/dev-login. The server sets the
   HttpOnly session cookie; we only persist a non-sensitive UI marker. Replace
   this whole component with the Google OAuth flow later; the api/auth plumbing
   (lib/api.js, lib/auth.js) stays unchanged. */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { I18N } from './constants.js';
import { Button } from './primitives.jsx';
import { api, ApiError } from '../lib/api.js';
import { setSession } from '../lib/auth.js';

const SAMPLE_EMAILS = ['admin@fergoni.dev', 'principal@fergoni.dev', 'teacher@fergoni.dev'];

export default function DevLoginView({ heading, onSuccess }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    api
      .devLogin(email.trim())
      .then((res) => {
        // The token now lives in the HttpOnly cookie the server just set; store
        // only the non-sensitive marker the UI needs to gate views.
        setSession({ access_level: res.user?.access_level, email: res.user?.email });
        if (onSuccess) onSuccess();
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.detail || err.message : String(err));
        setBusy(false);
      });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-[24px]">
      <form onSubmit={submit} className="w-full max-w-[400px] rounded-3 border border-rule bg-card-cream p-[26px] text-center">
        <h1 className="font-display text-[30px] font-extrabold text-ink">{heading || t('devLogin.heading')}</h1>
        <p className="mt-[6px] text-[14px] text-ink-3">{t('devLogin.subtitle')}</p>

        {error ? (
          <div className="mt-[14px] rounded-2 bg-accent-50 px-[12px] py-[8px] text-[13px] text-accent-700">{error}</div>
        ) : null}

        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t(I18N.DEVLOGIN_PLACEHOLDER)}
          aria-label={t(I18N.DEVLOGIN_PLACEHOLDER)}
          className="mt-[18px] w-full rounded-2 border border-rule-strong bg-paper px-[14px] py-[12px] text-[15px] text-ink outline-none"
        />
        <Button variant="primary" size="md" type="submit" disabled={busy} className="mt-[14px] w-full">
          {busy ? t('devLogin.signingIn') : t('devLogin.signIn')}
        </Button>

        <div className="mt-[18px] text-[12px] text-ink-3">
          {t('devLogin.tryHint')}
          <div className="mt-[6px] flex flex-wrap justify-center gap-[6px]">
            {SAMPLE_EMAILS.map((s) => (
              <button key={s} type="button" onClick={() => setEmail(s)} className="rounded-pill border border-rule px-[10px] py-[3px] text-[12px] text-ink-2">
                {s}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
