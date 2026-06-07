/* Principal dashboard — ported from fergon.html. */
import { useTranslation } from 'react-i18next';
import { Card, Avatar, Icon, Eyebrow } from './primitives.jsx';
import { useViewport } from '../hooks/useViewport.js';
import { getUser, schoolById, recognitions, USERS, VALUES, WEEKLY, valueById } from '../data/mock.js';
import { cx } from '../lib/cx.js';

function BarChart({ data, isMobile }) {
  const { t } = useTranslation();
  const max = Math.max(...data);
  const labels = ['8', '7', '6', '5', '4', '3', '2', t('principal.weekLabel')];
  return (
    <div className="flex h-[200px] items-end pt-[12px]" style={{ gap: isMobile ? 8 : 16 }}>
      {data.map((v, i) => {
        const last = i === data.length - 1;
        return (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-[8px]">
            <span className={cx('tnum text-[12.5px] font-bold', last ? 'text-primary' : 'text-ink-3')}>{v}</span>
            <div
              className="w-full max-w-[46px] rounded-t-[6px] transition-[height] duration-3 ease-sy"
              style={{ height: `${(v / max) * 100}%`, background: last ? 'var(--primary)' : 'var(--primary-200)' }}
            />
            <span className="whitespace-nowrap text-[11px] text-ink-3">{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

const STAT_COLORS = { gold: 'var(--gold-deep)', green: 'var(--primary)', terra: 'var(--accent-700)', info: 'var(--info)' };
const STAT_BG = { gold: 'var(--gold-50)', green: 'var(--primary-50)', terra: 'var(--accent-50)', info: 'var(--info-50)' };

function StatCard({ label, value, suffix, sub, icon, tone = 'green' }) {
  return (
    <Card className="p-[18px]">
      <div className="flex items-center gap-[9px]">
        <span
          className="inline-flex h-[32px] w-[32px] items-center justify-center rounded-2"
          style={{ background: STAT_BG[tone], color: STAT_COLORS[tone] }}
        >
          <Icon name={icon} size={18} />
        </span>
        <span className="text-[13px] font-semibold text-ink-2">{label}</span>
      </div>
      <div className="tnum mt-[14px] font-display text-[38px] font-extrabold leading-none text-ink">
        {value}
        {suffix ? <span className="text-[19px] text-ink-3">{suffix}</span> : null}
      </div>
      {sub ? <div className="mt-[6px] text-[12.5px] text-ink-3">{sub}</div> : null}
    </Card>
  );
}

export default function PrincipalView() {
  const { t } = useTranslation();
  const { isMobile } = useViewport();
  const school = 'herzl';
  const sObj = schoolById(school);
  const inSchool = recognitions.filter((r) => getUser(r.to).school === school);
  const totalThisMonth = inSchool.length;
  const pointsDistributed = inSchool.reduce((a, r) => a + r.points, 0);

  const valCount = {};
  inSchool.forEach((r) => {
    valCount[r.value] = (valCount[r.value] || 0) + 1;
  });
  const topVal = Object.entries(valCount).sort((a, b) => b[1] - a[1])[0];
  const topValObj = topVal ? valueById(topVal[0]) : VALUES[1];

  const schoolTeachers = USERS.filter((u) => u.school === school);
  const recognizedIds = new Set(inSchool.map((r) => r.to));
  const notRecognized = schoolTeachers.filter((u) => !recognizedIds.has(u.id));

  const totals = {};
  inSchool.forEach((r) => {
    totals[r.to] = (totals[r.to] || 0) + r.points;
  });
  const topRecognized = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const medal = ['var(--gold)', '#B7BCC4', '#CD8C5A'];

  return (
    <div className={cx('mx-auto max-w-[1180px]', isMobile ? 'px-[16px] py-[20px]' : 'px-[28px] py-[32px]')}>
      <Eyebrow>{t('principal.eyebrow')}</Eyebrow>
      <h1 className="mt-[6px] font-display font-extrabold tracking-[-0.02em] text-ink" style={{ fontSize: isMobile ? 28 : 34 }}>
        {sObj.name}
      </h1>
      <p className="mt-[4px] text-[15px] text-ink-2">{t('principal.subtitle')}</p>

      {/* stats */}
      <div className={cx('mt-[22px] grid gap-[16px]', isMobile ? 'grid-cols-2' : 'grid-cols-4')}>
        <StatCard label={t('principal.statRecognitions')} value={totalThisMonth} sub={t('principal.statRecognitionsSub')} icon="heart-handshake" tone="green" />
        <StatCard
          label={t('principal.statActive')}
          value={Math.round(sObj.active * 100)}
          suffix="%"
          sub={t('principal.statActiveSub', { n: Math.round(sObj.teachers * sObj.active), total: sObj.teachers })}
          icon="users"
          tone="info"
        />
        <StatCard label={t('principal.statTopValue')} value={topValObj.emoji} sub={t(`values.${topValObj.id}`)} icon="sparkles" tone="gold" />
        <StatCard label={t('principal.statPoints')} value={pointsDistributed} sub={t('principal.statPointsSub')} icon="star" tone="terra" />
      </div>

      {/* chart */}
      <Card className="mt-[24px]">
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-bold text-ink">{t('principal.chartTitle')}</h3>
          <span className="text-[12.5px] text-ink-3">{t('principal.chartSub')}</span>
        </div>
        <BarChart data={WEEKLY} isMobile={isMobile} />
      </Card>

      {/* two lists */}
      <div className={cx('mt-[16px] grid gap-[16px]', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
        {/* not recognized */}
        <Card>
          <div className="mb-[4px] flex items-center gap-[8px]">
            <Icon name="alert-circle" size={18} className="text-accent" />
            <h3 className="text-[16px] font-bold text-ink">{t('principal.notRecognizedTitle')}</h3>
          </div>
          <p className="mb-[12px] text-[13px] text-ink-3">{t('principal.notRecognizedSub')}</p>
          {notRecognized.length === 0 ? (
            <div className="py-[20px] text-center text-[14px] text-ink-3">{t('principal.allRecognized')}</div>
          ) : (
            notRecognized.map((u) => (
              <div key={u.id} className="flex items-center gap-[11px] border-t border-rule py-[9px]">
                <Avatar name={u.name} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-ink">{u.name}</div>
                  <div className="text-[12px] text-ink-3">{u.role}</div>
                </div>
                <span className="inline-flex items-center gap-[4px] text-[12.5px] font-semibold text-accent-700">
                  <span className="h-[6px] w-[6px] rounded-full bg-accent" />0
                </span>
              </div>
            ))
          )}
        </Card>

        {/* top recognized */}
        <Card>
          <div className="mb-[4px] flex items-center gap-[8px]">
            <Icon name="trophy" size={18} className="text-gold-deep" />
            <h3 className="text-[16px] font-bold text-ink">{t('principal.topTitle')}</h3>
          </div>
          <p className="mb-[12px] text-[13px] text-ink-3">{t('principal.topSub')}</p>
          {topRecognized.map(([uid, pts], i) => {
            const usr = getUser(uid);
            return (
              <div key={uid} className="flex items-center gap-[11px] border-t border-rule py-[9px]">
                <span className="tnum w-[20px] text-center text-[14px] font-extrabold" style={{ color: i < 3 ? medal[i] : 'var(--ink-4)' }}>
                  {i + 1}
                </span>
                <Avatar name={usr.name} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-ink">{usr.name}</div>
                  <div className="text-[12px] text-ink-3">{usr.role}</div>
                </div>
                <span className="tnum text-[14px] font-extrabold text-gold-deep">★ {pts}</span>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
