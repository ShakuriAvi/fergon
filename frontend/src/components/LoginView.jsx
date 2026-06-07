/* Login page — ported from fergon.html. Google SSO / guest both
   call onLogin (mock auth). Text via i18n; styling via Tailwind. */
import { useTranslation } from 'react-i18next';
import { Icon } from './primitives.jsx';
import { useViewport } from '../hooks/useViewport.js';

export default function LoginView({ onLogin }) {
  const { t } = useTranslation();
  const { isMobile } = useViewport();
  const brand = t('app.brand');

  return (
    <div className={cxBase(isMobile)}>
      {/* faint oversized backdrop glyph — quiet texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute select-none font-display font-black leading-none tracking-[-0.04em] text-primary opacity-[0.04]"
        style={{ insetInlineStart: '-6%', top: isMobile ? '4%' : '-4%', fontSize: isMobile ? 320 : 520, whiteSpace: 'nowrap' }}
      >
        {brand.charAt(0)}
      </div>

      <div className="rise relative w-full max-w-[400px] text-center">
        {/* mark */}
        <div className="mb-[22px] flex justify-center">
          <svg width="52" height="52" viewBox="0 0 40 40" fill="none">
            <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill="var(--primary)" />
            <path d="M20 9.5l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L20 24.8l-6.1 3.1 1.4-6.8-5.1-4.7 6.9-.8L20 9.5z" fill="var(--gold)" />
          </svg>
        </div>

        {/* wordmark */}
        <h1
          className="font-display font-black leading-none tracking-[-0.03em] text-ink"
          style={{ fontSize: isMobile ? 60 : 76 }}
        >
          {brand}
        </h1>

        {/* hand-drawn gold underline */}
        <div className="mt-[6px] flex justify-center">
          <svg width={isMobile ? 170 : 210} height="16" viewBox="0 0 210 16" fill="none">
            <path d="M5 9 C 45 3, 80 12, 120 7 S 185 4, 205 10" stroke="var(--gold)" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        <div className="mt-[16px] text-[14.5px] font-medium tracking-[0.01em] text-ink-3">{t('login.tagline')}</div>

        <div className="my-[30px] h-px bg-rule" />

        {/* Google SSO */}
        <button
          type="button"
          onClick={onLogin}
          className="flex w-full cursor-pointer items-center justify-center gap-[12px] whitespace-nowrap rounded-2 border border-rule-strong bg-card-cream px-[18px] py-[14px] font-body text-[15.5px] font-semibold text-ink transition-all duration-1 ease-sy hover:bg-paper-sink"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5c-2 1.5-4.7 2.5-7.6 2.5-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.5l6.5 5.5C39.9 36.7 44 31 44 24c0-1.3-.1-2.3-.4-3.5z" />
          </svg>
          {t('login.google')}
        </button>

        <div className="mt-[12px] flex items-center justify-center gap-[6px] whitespace-nowrap text-[12.5px] text-ink-3">
          <Icon name="lock" size={13} />
          {t('login.secured')}
        </div>

        <button
          type="button"
          onClick={onLogin}
          className="mt-[16px] cursor-pointer border-none bg-transparent font-body text-[14px] font-semibold text-ink-2 underline decoration-rule-strong underline-offset-[3px]"
        >
          {t('login.guest')}
        </button>

        <p className="mt-[30px] text-[12px] leading-[1.6] text-ink-4">{t('login.terms')}</p>
      </div>
    </div>
  );
}

function cxBase(isMobile) {
  return [
    'relative flex min-h-screen items-center justify-center overflow-hidden bg-paper',
    isMobile ? 'px-[22px] py-[32px]' : 'p-[48px]',
  ].join(' ');
}
