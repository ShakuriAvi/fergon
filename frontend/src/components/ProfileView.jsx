/* Profile / wallet view (#43) — backend wallet + received/given recognitions. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { I18N } from './constants.js';
import { Card, Avatar, Button, Progress, SegTabs, AnimatedNumber } from './primitives.jsx';
import RecognitionCard from './RecognitionCard.jsx';
import { useViewport } from '../hooks/useViewport.js';
import { useMe } from '../context/CurrentUser.jsx';
import { api } from '../lib/api.js';
import { cx } from '../lib/cx.js';

export default function ProfileView({ onGive, points, allowanceLeft, refreshKey }) {
  const { t } = useTranslation();
  const { isMobile } = useViewport();
  const { user } = useMe();
  const [tab, setTab] = useState('received');
  const [items, setItems] = useState([]);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.feed({ limit: 100 }), api.wallet()])
      .then(([feed, w]) => {
        if (cancelled) return;
        setItems(feed.items || []);
        setWallet(w);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [refreshKey, user?.id]);

  const received = items.filter((r) => r.to_user_id === user?.id);
  const given = items.filter((r) => r.from_user_id === user?.id);
  const list = tab === 'received' ? received : given;
  const total = wallet?.allowance_total ?? 0;
  const remaining = wallet?.allowance_remaining ?? allowanceLeft;
  const balance = wallet?.points_balance ?? points;

  return (
    <div className={cx('mx-auto max-w-[760px]', isMobile ? 'px-[16px] py-[20px]' : 'px-[28px] py-[32px]')}>
      <Card className={isMobile ? 'p-[20px]' : 'p-[26px]'}>
        <div className="flex flex-wrap items-center gap-[18px]">
          <Avatar name={user?.full_name || ''} size={isMobile ? 64 : 76} ring="var(--gold)" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display font-extrabold tracking-[-0.02em] text-ink" style={{ fontSize: isMobile ? 26 : 32 }}>
              {user?.full_name}
            </h1>
            <div className="mt-[4px] flex flex-wrap items-center gap-[8px] text-[14.5px] text-ink-2">
              <span>{user?.role}</span>
            </div>
          </div>
        </div>

        <div className={cx('mt-[22px] grid gap-[16px]', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
          <div className="rounded-3 border border-gold-100 bg-gold-50 p-[18px]">
            <div className="text-[13px] font-bold text-gold-deep">{t('profile.pointsEarned')}</div>
            <div className="mt-[6px] flex items-baseline gap-[8px]">
              <span className="text-[28px] text-gold">★</span>
              <AnimatedNumber value={balance} className="font-display font-extrabold leading-none text-ink" style={{ fontSize: 48 }} />
            </div>
            <div className="mt-[6px] text-[12.5px] text-gold-deep">{t('profile.redeemable')}</div>
          </div>
          <div className="rounded-3 border border-rule bg-card-cream p-[18px]">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-bold text-ink-2">{t('profile.quotaTitle')}</div>
              <span className="tnum text-[13px] text-ink-3">{remaining}/{total}</span>
            </div>
            <div className="tnum my-[8px] mb-[12px] font-display text-[36px] font-extrabold text-ink">
              {remaining}
              <span className="text-[16px] text-ink-3"> {t('profile.remainingSuffix')}</span>
            </div>
            <Progress value={remaining} max={total || 1} tone="green" />
          </div>
        </div>

        <div className="mt-[16px]">
          <Button variant="primary" icon="sparkles" onClick={onGive} className={isMobile ? 'w-full' : 'w-auto'}>
            {t(I18N.COMMON_GIVE)}
          </Button>
        </div>
      </Card>

      <div className="mt-[28px] flex justify-center">
        <SegTabs
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'received', label: t('profile.tabReceived'), count: received.length },
            { id: 'given', label: t('profile.tabGiven'), count: given.length },
          ]}
        />
      </div>

      <div className="mt-[20px] flex flex-col gap-[16px]">
        {list.map((item, i) => (
          <div key={item.id} className="rise" style={{ animationDelay: i * 40 + 'ms' }}>
            <RecognitionCard item={item} first />
          </div>
        ))}
        {list.length === 0 ? (
          <Card className="p-[48px] text-center">
            <div className="text-[40px]">{tab === 'received' ? '🌱' : '💌'}</div>
            <h3 className="mt-[12px] text-[18px] font-bold text-ink">
              {tab === 'received' ? t('profile.emptyReceivedTitle') : t('profile.emptyGivenTitle')}
            </h3>
            <p className="mt-[6px] text-[14px] text-ink-3">
              {tab === 'received' ? t('profile.emptyReceivedSub') : t('profile.emptyGivenSub')}
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
