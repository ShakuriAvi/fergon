/* Principal dashboard (#43) — backend leaderboard + derived stats. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { I18N } from './constants.js';
import { Card, Avatar, Icon, Eyebrow } from './primitives.jsx';
import { useViewport } from '../hooks/useViewport.js';
import { api } from '../lib/api.js';
import { cx } from '../lib/cx.js';

const STAT_COLORS = { gold: 'var(--gold-deep)', green: 'var(--primary)', terra: 'var(--accent-700)', info: 'var(--info)' };
const STAT_BG = { gold: 'var(--gold-50)', green: 'var(--primary-50)', terra: 'var(--accent-50)', info: 'var(--info-50)' };

function StatCard({ label, value, icon, tone = 'green' }) {
  return (
    <Card className="p-[18px]">
      <div className="flex items-center gap-[9px]">
        <span className="inline-flex h-[32px] w-[32px] items-center justify-center rounded-2" style={{ background: STAT_BG[tone], color: STAT_COLORS[tone] }}>
          <Icon name={icon} size={18} />
        </span>
        <span className="text-[13px] font-semibold text-ink-2">{label}</span>
      </div>
      <div className="tnum mt-[14px] font-display text-[38px] font-extrabold leading-none text-ink">{value}</div>
    </Card>
  );
}

export default function PrincipalView({ refreshKey }) {
  const { t } = useTranslation();
  const { isMobile } = useViewport();
  const [state, setState] = useState({ feed: { items: [], total: 0 }, board: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.all([api.feed({ limit: 100 }), api.leaderboard()])
      .then(([feed, board]) => { if (!cancelled) setState({ feed, board: board || [], loading: false, error: null }); })
      .catch((error) => { if (!cancelled) setState((s) => ({ ...s, loading: false, error })); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const pointsDistributed = state.feed.items.reduce((a, r) => a + (r.points || 0), 0);

  return (
    <div className={cx('mx-auto max-w-[1180px]', isMobile ? 'px-[16px] py-[20px]' : 'px-[28px] py-[32px]')}>
      <Eyebrow>{t('principal.eyebrow')}</Eyebrow>
      <h1 className="mt-[6px] font-display font-extrabold tracking-[-0.02em] text-ink" style={{ fontSize: isMobile ? 28 : 34 }}>
        {t('principal.title')}
      </h1>

      {state.loading ? (
        <div className="py-[56px] text-center text-ink-3">{t(I18N.COMMON_LOADING)}</div>
      ) : state.error ? (
        <div className="py-[56px] text-center text-accent-700">{t(I18N.COMMON_ERROR)}</div>
      ) : (
        <>
          <div className="mt-[22px] grid gap-[16px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <StatCard label={t('principal.cardRecognitions')} value={state.feed.total} icon="heart-handshake" tone="green" />
            <StatCard label={t('principal.cardPoints')} value={pointsDistributed} icon="star" tone="gold" />
            <StatCard label={t('principal.cardPeople')} value={state.board.length} icon="users" tone="info" />
          </div>

          <Card className="mt-[18px] p-[18px]">
            <Eyebrow className="mb-[14px]">{t('principal.topRecipients')}</Eyebrow>
            <div className="flex flex-col gap-[10px]">
              {state.board.map((e, i) => (
                <div key={e.user_id} className="flex items-center gap-[12px]">
                  <span className="tnum w-[20px] text-[13px] font-bold text-ink-3">{i + 1}</span>
                  <Avatar name={e.name} size={36} />
                  <span className="flex-1 text-[14.5px] font-semibold text-ink">{e.name}</span>
                  <span className="tnum text-[14px] font-bold text-gold-deep">★ {e.points}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
