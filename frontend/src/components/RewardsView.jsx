/* Rewards store (#43) — backend rewards catalog + real redemption. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { I18N } from './constants.js';
import { Card, Icon, Button, Sparkles } from './primitives.jsx';
import { useViewport } from '../hooks/useViewport.js';
import { api, ApiError } from '../lib/api.js';
import { cx } from '../lib/cx.js';

const CATS = ['all', 'books', 'food', 'shop', 'fun'];

function RewardCard({ r, balance, onRedeem }) {
  const { t } = useTranslation();
  const afford = balance >= r.cost;
  return (
    <Card padded={false} hover className="flex h-full flex-col overflow-hidden">
      <div className="relative flex h-[92px] items-center justify-center" style={{ background: r.color || 'var(--primary)' }}>
        <span className="text-[40px]">{r.emoji}</span>
        <span className="absolute bottom-[10px] right-[14px] text-[15px] font-bold tracking-[-0.01em] text-white/95">{r.provider}</span>
      </div>
      <div className="flex flex-1 flex-col p-[16px]">
        <div className="text-[16px] font-bold text-ink">{r.title}</div>
        <div className="mt-[4px] flex-1 text-[13px] leading-[1.5] text-ink-3">{r.blurb}</div>
        <div className="mt-[16px] flex items-center justify-between">
          <span className="tnum inline-flex items-center gap-[5px] text-[17px] font-extrabold text-gold-deep">
            <span className="text-[17px] text-gold">★</span>
            {r.cost}
          </span>
          <Button variant={afford ? 'primary' : 'secondary'} size="sm" disabled={!afford} onClick={() => onRedeem(r)}>
            {afford ? t('rewards.redeemNow') : t('rewards.insufficient')}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className={cx('flex justify-between border-b border-rule px-[14px] py-[11px]', strong ? 'bg-gold-50' : 'bg-transparent')}>
      <span className={cx('text-[14px]', strong ? 'font-bold text-gold-deep' : 'font-medium text-ink-2')}>{label}</span>
      <span className={cx('tnum text-[14.5px] font-bold', strong ? 'text-gold-deep' : 'text-ink')}>{value}</span>
    </div>
  );
}

function RedeemModal({ reward, balance, onClose, onConfirm }) {
  const { t } = useTranslation();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  if (!reward) return null;
  const after = balance - reward.cost;

  const confirm = () => {
    setBusy(true);
    setError(null);
    Promise.resolve(onConfirm(reward))
      .then(() => setDone(true))
      .catch((err) => setError(err instanceof ApiError ? err.detail || err.message : String(err)))
      .finally(() => setBusy(false));
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal-card relative w-full max-w-[420px] overflow-hidden rounded-4 bg-paper shadow-modal" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="relative px-[32px] py-[48px] text-center">
            <div className="relative inline-flex">
              <Sparkles run count={20} />
              <div className="pop inline-flex h-[80px] w-[80px] items-center justify-center rounded-full border-2 border-primary-100 bg-primary-50">
                <Icon name="check" size={38} stroke={2.5} className="text-primary" />
              </div>
            </div>
            <h2 className="mt-[16px] font-display text-[25px] font-extrabold text-ink">{t('rewards.doneTitle')}</h2>
            <p className="mt-[8px] text-[15px] leading-[1.6] text-ink-2">{t('rewards.doneBody', { provider: reward.provider })}</p>
            <div className="mt-[22px]">
              <Button variant="primary" onClick={onClose} className="w-full">{t('rewards.backToStore')}</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex h-[80px] items-center justify-center text-[36px]" style={{ background: reward.color || 'var(--primary)' }}>
              {reward.emoji}
            </div>
            <div className="p-[24px]">
              <h2 className="font-display text-[23px] font-extrabold text-ink">{t('rewards.confirmTitle')}</h2>
              <p className="mt-[6px] text-[14.5px] text-ink-2">{reward.provider} · {reward.title}</p>

              {error ? (
                <div className="mt-[12px] rounded-2 bg-accent-50 px-[12px] py-[8px] text-[13px] text-accent-700">{error}</div>
              ) : null}

              <div className="mt-[18px] overflow-hidden rounded-2 border border-rule">
                <Row label={t('rewards.costLabel')} value={`★ ${reward.cost}`} />
                <Row label={t('rewards.balanceNow')} value={`★ ${balance}`} />
                <Row label={t('rewards.balanceAfter')} value={`★ ${after}`} strong />
              </div>

              <div className="mt-[22px] flex gap-[12px]">
                <Button variant="ghost" onClick={onClose} className="flex-1 border border-rule">{t('rewards.cancel')}</Button>
                <Button variant="primary" onClick={confirm} disabled={busy} className="flex-1">{t('rewards.confirm')}</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function RewardsView({ points, onRedeemed, refreshKey }) {
  const { t } = useTranslation();
  const { isMobile } = useViewport();
  const [cat, setCat] = useState('all');
  const [redeeming, setRedeeming] = useState(null);
  const [state, setState] = useState({ rewards: [], loading: true, error: null });
  const balance = points;

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .consumerRewards()
      .then((rewards) => { if (!cancelled) setState({ rewards: rewards || [], loading: false, error: null }); })
      .catch((error) => { if (!cancelled) setState((s) => ({ ...s, loading: false, error })); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const list = state.rewards.filter((r) => cat === 'all' || r.category === cat);

  const confirmRedeem = (reward) => api.redeem(reward.id).then((res) => { if (onRedeemed) onRedeemed(); return res; });

  return (
    <div className={cx('mx-auto max-w-[1180px]', isMobile ? 'px-[16px] py-[20px]' : 'px-[28px] py-[32px]')}>
      <div className="flex flex-wrap items-end justify-between gap-[16px]">
        <div>
          <h1 className="font-display font-extrabold tracking-[-0.02em] text-ink" style={{ fontSize: isMobile ? 28 : 34 }}>{t('rewards.title')}</h1>
          <p className="mt-[4px] text-[15px] text-ink-2">{t('rewards.subtitle')}</p>
        </div>
        <div className="inline-flex items-center gap-[8px] rounded-pill border border-gold-100 bg-gold-50 px-[16px] py-[9px]">
          <span className="text-[18px] text-gold">★</span>
          <span className="tnum text-[18px] font-extrabold text-gold-deep">{balance}</span>
          <span className="text-[13.5px] font-semibold text-gold-deep">{t('rewards.available')}</span>
        </div>
      </div>

      <div className="no-sb mt-[18px] flex gap-[8px] overflow-x-auto">
        {CATS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={cx(
              'whitespace-nowrap rounded-pill border px-[14px] py-[7px] font-body text-[13.5px] font-semibold',
              c === cat ? 'border-ink bg-ink text-paper' : 'border-rule bg-transparent text-ink-2'
            )}
          >
            {c === 'all' ? t('feed.filterAll') : t(`rewardCats.${c}`)}
          </button>
        ))}
      </div>

      {state.loading ? (
        <div className="py-[56px] text-center text-ink-3">{t(I18N.COMMON_LOADING)}</div>
      ) : state.error ? (
        <div className="py-[56px] text-center text-accent-700">{t(I18N.COMMON_ERROR)}</div>
      ) : (
        <div className="mt-[22px] grid gap-[16px]" style={{ gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {list.map((r, i) => (
            <div key={r.id} className="rise" style={{ animationDelay: i * 40 + 'ms' }}>
              <RewardCard r={r} balance={balance} onRedeem={setRedeeming} />
            </div>
          ))}
        </div>
      )}

      <RedeemModal reward={redeeming} balance={balance} onClose={() => setRedeeming(null)} onConfirm={confirmRedeem} />
    </div>
  );
}
