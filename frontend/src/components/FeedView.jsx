/* Feed view — ported from fergon.html. */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eyebrow, Avatar, Button, Icon, FEED_AVATAR_TONE as AV } from './primitives.jsx';
import RecognitionCard from './RecognitionCard.jsx';
import { useViewport } from '../hooks/useViewport.js';
import { getUser, ME, recognitions, VALUES, SCHOOLS } from '../data/mock.js';
import { cx } from '../lib/cx.js';

function GreetingStrip({ onGive, isMobile, points, remaining }) {
  const { t } = useTranslation();
  const me = getUser(ME);
  const hour = new Date().getHours();
  const greet = hour < 12 ? t('feed.greetMorning') : hour < 18 ? t('feed.greetNoon') : t('feed.greetEvening');
  return (
    <div className={cx('flex gap-[16px] border-b border-rule pb-[22px]', isMobile ? 'flex-col items-start' : 'flex-row items-center')}>
      <div className="flex-1">
        <h1 className="font-display font-extrabold tracking-[-0.02em] text-ink" style={{ fontSize: isMobile ? 28 : 32 }}>
          {t('feed.greeting', { greet, name: me.name.split(' ')[0] })}
        </h1>
        <div className="mt-[8px] flex flex-wrap items-center gap-[14px] text-[14px] text-ink-2">
          <span className="tnum inline-flex items-center gap-[5px]">
            <span className="text-[15px] text-gold">★</span>
            <strong className="font-extrabold text-ink">{points}</strong> {t('common.points')}
          </span>
          <span className="h-[4px] w-[4px] rounded-full bg-rule-strong" />
          <span className="tnum">
            {t('feed.remainingPre')} <strong className="font-bold text-ink">{remaining}</strong> {t('feed.remainingPost')}
          </span>
        </div>
      </div>
      <Button variant="primary" size="md" icon="sparkles" onClick={onGive} className={cx('shrink-0', isMobile ? 'w-full' : 'w-auto')}>
        {t('common.give')}
      </Button>
    </div>
  );
}

function Spotlight() {
  const { t } = useTranslation();
  const totals = {};
  recognitions.forEach((r) => {
    totals[r.to] = (totals[r.to] || 0) + r.points;
  });
  const top = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  return (
    <div className="border-b border-rule py-[20px]">
      <Eyebrow className="mb-[14px]">{t('feed.spotlight')}</Eyebrow>
      <div className="no-sb flex gap-[22px] overflow-x-auto pb-[2px]">
        {top.map(([uid, pts], i) => {
          const usr = getUser(uid);
          return (
            <div key={uid} className="flex min-w-[64px] shrink-0 flex-col items-center gap-[8px]">
              <div className="relative">
                <Avatar name={usr.name} size={56} tone={AV} ring={i === 0 ? 'var(--gold)' : undefined} />
                {i === 0 ? (
                  <span className="absolute bottom-[-2px] start-1/2 -translate-x-1/2 rounded-pill border-2 border-paper bg-gold px-[7px] py-[1px] text-[10px] font-extrabold text-ink">
                    #1
                  </span>
                ) : null}
              </div>
              <div className="text-center">
                <div className="whitespace-nowrap text-[12.5px] font-semibold text-ink">{usr.name.split(' ')[0]}</div>
                <div className="tnum text-[11.5px] font-bold text-gold-deep">★ {pts}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilterBar({ value, setValue, school, setSchool, isMobile }) {
  const { t } = useTranslation();
  const pills = [{ id: 'all', label: t('feed.filterAll'), emoji: null }, ...VALUES.map((v) => ({ id: v.id, label: t(`values.${v.id}`), emoji: v.emoji }))];
  return (
    <div className="flex flex-wrap items-center gap-[12px] pb-[6px] pt-[18px]">
      <div className="no-sb flex min-w-0 flex-1 gap-[7px] overflow-x-auto">
        {pills.map((p) => {
          const on = p.id === value;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setValue(p.id)}
              className={cx(
                'inline-flex cursor-pointer items-center gap-[5px] whitespace-nowrap rounded-pill border px-[13px] py-[6px] font-body text-[13.5px] font-semibold transition-all duration-1 ease-sy',
                on ? 'border-ink bg-ink text-paper' : 'border-rule bg-transparent text-ink-2'
              )}
            >
              {p.emoji ? <span className="text-[14px]">{p.emoji}</span> : null}
              {p.label}
            </button>
          );
        })}
      </div>
      {!isMobile ? (
        <div className="relative inline-flex shrink-0 items-center">
          <Icon name="school" size={15} className="pointer-events-none absolute right-[11px] text-ink-3" />
          <select
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            className="cursor-pointer appearance-none rounded-pill border border-rule bg-transparent py-[7px] pl-[30px] pr-[32px] font-body text-[13.5px] font-semibold text-ink-2 outline-none"
          >
            <option value="all">{t('feed.schoolAll')}</option>
            {SCHOOLS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.short}
              </option>
            ))}
          </select>
          <Icon name="chevron-down" size={14} className="pointer-events-none absolute left-[9px] text-ink-3" />
        </div>
      ) : null}
    </div>
  );
}

export default function FeedView({ onGive, points, allowanceLeft }) {
  const { t } = useTranslation();
  const { isMobile } = useViewport();
  const [value, setValue] = useState('all');
  const [school, setSchool] = useState('all');
  const list = recognitions
    .filter((r) => school === 'all' || getUser(r.to).school === school || getUser(r.from).school === school)
    .filter((r) => value === 'all' || r.value === value)
    .sort((a, b) => a.mins - b.mins);

  return (
    <div className={cx('mx-auto max-w-[760px]', isMobile ? 'px-[16px] pb-[28px] pt-[20px]' : 'px-[28px] pb-[48px] pt-[36px]')}>
      <GreetingStrip onGive={onGive} isMobile={isMobile} points={points} remaining={allowanceLeft} />
      <Spotlight />
      <FilterBar value={value} setValue={setValue} school={school} setSchool={setSchool} isMobile={isMobile} />

      <div>
        {list.map((r, i) => (
          <div key={r.id} className="rise" style={{ animationDelay: i * 35 + 'ms' }}>
            <RecognitionCard r={r} first={i === 0} />
          </div>
        ))}
        {list.length === 0 ? (
          <div className="px-[20px] py-[56px] text-center text-ink-3">
            <div className="text-[15px] font-semibold text-ink-2">{t('feed.emptyTitle')}</div>
            <div className="mt-[6px] text-[13.5px]">{t('feed.emptySub')}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
