/* Profile / wallet view — ported from fergon.html. */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Avatar, Icon, Button, Progress, SegTabs, AnimatedNumber } from './primitives.jsx';
import RecognitionCard from './RecognitionCard.jsx';
import { useViewport } from '../hooks/useViewport.js';
import { getUser, ME, recognitions, schoolById } from '../data/mock.js';
import { cx } from '../lib/cx.js';

export default function ProfileView({ onGive, points, allowanceLeft }) {
  const { t } = useTranslation();
  const { isMobile } = useViewport();
  const me = getUser(ME);
  const [tab, setTab] = useState('received');
  const received = recognitions.filter((r) => r.to === ME).sort((a, b) => a.mins - b.mins);
  const given = recognitions.filter((r) => r.from === ME).sort((a, b) => a.mins - b.mins);
  const list = tab === 'received' ? received : given;
  const remaining = allowanceLeft;

  return (
    <div className={cx('mx-auto max-w-[760px]', isMobile ? 'px-[16px] py-[20px]' : 'px-[28px] py-[32px]')}>
      {/* identity */}
      <Card className={isMobile ? 'p-[20px]' : 'p-[26px]'}>
        <div className="flex flex-wrap items-center gap-[18px]">
          <Avatar name={me.name} size={isMobile ? 64 : 76} ring="var(--gold)" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display font-extrabold tracking-[-0.02em] text-ink" style={{ fontSize: isMobile ? 26 : 32 }}>
              {me.name}
            </h1>
            <div className="mt-[4px] flex flex-wrap items-center gap-[8px] text-[14.5px] text-ink-2">
              <span>{me.role}</span>
              <span className="text-ink-4">·</span>
              <span className="inline-flex items-center gap-[5px]">
                <Icon name="map-pin" size={14} className="text-ink-3" /> {schoolById(me.school).name}
              </span>
            </div>
          </div>
        </div>

        {/* balance + allowance */}
        <div className={cx('mt-[22px] grid gap-[16px]', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
          <div className="rounded-3 border border-gold-100 bg-gold-50 p-[18px]">
            <div className="text-[13px] font-bold text-gold-deep">{t('profile.pointsEarned')}</div>
            <div className="mt-[6px] flex items-baseline gap-[8px]">
              <span className="text-[28px] text-gold">★</span>
              <AnimatedNumber value={points} className="font-display font-extrabold leading-none text-ink" style={{ fontSize: 48 }} />
            </div>
            <div className="mt-[6px] text-[12.5px] text-gold-deep">{t('profile.redeemable')}</div>
          </div>
          <div className="rounded-3 border border-rule bg-card-cream p-[18px]">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-bold text-ink-2">{t('profile.quotaTitle')}</div>
              <span className="tnum text-[13px] text-ink-3">
                {remaining}/{me.allowance}
              </span>
            </div>
            <div className="tnum my-[8px] mb-[12px] font-display text-[36px] font-extrabold text-ink">
              {remaining}
              <span className="text-[16px] text-ink-3"> {t('profile.remainingSuffix')}</span>
            </div>
            <Progress value={remaining} max={me.allowance} tone="green" />
          </div>
        </div>

        <div className="mt-[16px]">
          <Button variant="primary" icon="sparkles" onClick={onGive} className={isMobile ? 'w-full' : 'w-auto'}>
            {t('common.give')}
          </Button>
        </div>
      </Card>

      {/* tabs */}
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
        {list.map((r, i) => (
          <div key={r.id} className="rise" style={{ animationDelay: i * 40 + 'ms' }}>
            <RecognitionCard r={r} first />
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
            {tab === 'given' ? (
              <div className="mt-[16px]">
                <Button variant="primary" icon="sparkles" onClick={onGive}>
                  {t('profile.giveFirst')}
                </Button>
              </div>
            ) : null}
          </Card>
        ) : null}
      </div>
    </div>
  );
}
