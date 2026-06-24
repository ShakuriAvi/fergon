/* Feed view (#43) — live recognition feed + spotlight from the backend. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { I18N } from './constants.js';
import { Eyebrow, Avatar, Button, FEED_AVATAR_TONE as AV } from './primitives.jsx';
import RecognitionCard from './RecognitionCard.jsx';
import { useViewport } from '../hooks/useViewport.js';
import { useMe } from '../context/CurrentUser.jsx';
import { api } from '../lib/api.js';
import { cx } from '../lib/cx.js';

function GreetingStrip({ onGive, isMobile, points, remaining, name }) {
  const { t } = useTranslation();
  const hour = new Date().getHours();
  const greet = hour < 12 ? t('feed.greetMorning') : hour < 18 ? t('feed.greetNoon') : t('feed.greetEvening');
  return (
    <div className={cx('flex gap-[16px] border-b border-rule pb-[22px]', isMobile ? 'flex-col items-start' : 'flex-row items-center')}>
      <div className="flex-1">
        <h1 className="font-display font-extrabold tracking-[-0.02em] text-ink" style={{ fontSize: isMobile ? 28 : 32 }}>
          {t('feed.greeting', { greet, name: (name || '').split(' ')[0] })}
        </h1>
        <div className="mt-[8px] flex flex-wrap items-center gap-[14px] text-[14px] text-ink-2">
          <span className="tnum inline-flex items-center gap-[5px]">
            <span className="text-[15px] text-gold">★</span>
            <strong className="font-extrabold text-ink">{points}</strong> {t(I18N.COMMON_POINTS)}
          </span>
          <span className="h-[4px] w-[4px] rounded-full bg-rule-strong" />
          <span className="tnum">
            {t('feed.remainingPre')} <strong className="font-bold text-ink">{remaining}</strong> {t('feed.remainingPost')}
          </span>
        </div>
      </div>
      <Button variant="primary" size="md" icon="sparkles" onClick={onGive} className={cx('shrink-0', isMobile ? 'w-full' : 'w-auto')}>
        {t(I18N.COMMON_GIVE)}
      </Button>
    </div>
  );
}

function Spotlight({ entries }) {
  const { t } = useTranslation();
  if (!entries.length) return null;
  return (
    <div className="border-b border-rule py-[20px]">
      <Eyebrow className="mb-[14px]">{t('feed.spotlight')}</Eyebrow>
      <div className="no-sb flex gap-[22px] overflow-x-auto pb-[2px]">
        {entries.map((e, i) => (
          <div key={e.user_id} className="flex min-w-[64px] shrink-0 flex-col items-center gap-[8px]">
            <div className="relative">
              <Avatar name={e.name} size={56} tone={AV} ring={i === 0 ? 'var(--gold)' : undefined} />
              {i === 0 ? (
                <span className="absolute bottom-[-2px] start-1/2 -translate-x-1/2 rounded-pill border-2 border-paper bg-gold px-[7px] py-[1px] text-[10px] font-extrabold text-ink">#1</span>
              ) : null}
            </div>
            <div className="text-center">
              <div className="whitespace-nowrap text-[12.5px] font-semibold text-ink">{(e.name || '').split(' ')[0]}</div>
              <div className="tnum text-[11.5px] font-bold text-gold-deep">★ {e.points}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FeedView({ onGive, points, allowanceLeft, refreshKey }) {
  const { t } = useTranslation();
  const { isMobile } = useViewport();
  const { user } = useMe();
  const [state, setState] = useState({ items: [], spotlight: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.all([api.feed({ limit: 50 }), api.leaderboard()])
      .then(([feed, board]) => {
        if (!cancelled) setState({ items: feed.items || [], spotlight: board || [], loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error }));
      });
    return () => { cancelled = true; };
  }, [refreshKey]);

  return (
    <div className={cx('mx-auto max-w-[760px]', isMobile ? 'px-[16px] pb-[28px] pt-[20px]' : 'px-[28px] pb-[48px] pt-[36px]')}>
      <GreetingStrip onGive={onGive} isMobile={isMobile} points={points} remaining={allowanceLeft} name={user?.full_name} />
      <Spotlight entries={state.spotlight} />

      <div className="pt-[10px]">
        {state.loading ? (
          <div className="px-[20px] py-[56px] text-center text-ink-3">{t(I18N.COMMON_LOADING)}</div>
        ) : state.error ? (
          <div className="px-[20px] py-[56px] text-center text-accent-700">{t(I18N.COMMON_ERROR)}</div>
        ) : state.items.length === 0 ? (
          <div className="px-[20px] py-[56px] text-center text-ink-3">
            <div className="text-[15px] font-semibold text-ink-2">{t('feed.emptyTitle')}</div>
            <div className="mt-[6px] text-[13.5px]">{t('feed.emptySub')}</div>
          </div>
        ) : (
          state.items.map((item, i) => (
            <div key={item.id} className="rise" style={{ animationDelay: i * 35 + 'ms' }}>
              <RecognitionCard item={item} first={i === 0} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
