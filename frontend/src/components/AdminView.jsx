/* Admin panel — ported from fergon.html. */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Avatar, Icon, Button, Eyebrow, SegTabs, ValueTag, Progress } from './primitives.jsx';
import { useViewport } from '../hooks/useViewport.js';
import { SCHOOLS, USERS, VALUES, REWARDS, VALUE_USAGE, schoolById } from '../data/mock.js';
import { cx } from '../lib/cx.js';

function Th({ children, className }) {
  return (
    <th className={cx('whitespace-nowrap border-b border-rule px-[14px] py-[11px] text-right text-[12px] font-bold tracking-[0.03em] text-ink-3', className)}>
      {children}
    </th>
  );
}

function Td({ children, className }) {
  return <td className={cx('border-b border-rule px-[14px] py-[12px] text-[14px] text-ink', className)}>{children}</td>;
}

function StatusPill({ on, labels }) {
  return (
    <span
      className="inline-flex items-center gap-[6px] rounded-pill px-[10px] py-[3px] text-[12px] font-semibold"
      style={{ background: on ? 'var(--success-bg)' : 'var(--neutral-bg)', color: on ? 'var(--success)' : 'var(--ink-3)' }}
    >
      <span className="h-[6px] w-[6px] rounded-full" style={{ background: on ? 'var(--primary)' : 'var(--ink-4)' }} />
      {on ? labels[0] : labels[1]}
    </span>
  );
}

function RowActions() {
  const { t } = useTranslation();
  const btn = 'inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-1 border border-rule bg-transparent text-ink-3';
  return (
    <div className="inline-flex gap-[4px]">
      <button type="button" aria-label={t('admin.editAria')} className={btn}>
        <Icon name="pencil" size={15} />
      </button>
      <button type="button" aria-label={t('admin.moreAria')} className={btn}>
        <Icon name="more-horizontal" size={15} />
      </button>
    </div>
  );
}

function TableShell({ children }) {
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">{children}</table>
      </div>
    </Card>
  );
}

function Toolbar({ placeholder, action }) {
  return (
    <div className="mb-[14px] flex flex-wrap gap-[10px]">
      <div className="relative min-w-[200px] flex-1">
        <Icon name="search" size={15} className="absolute right-[12px] top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          placeholder={placeholder}
          className="w-full rounded-2 border border-rule bg-card-cream py-[9px] pl-[14px] pr-[36px] text-[14px] text-ink outline-none"
        />
      </div>
      <Button variant="primary" size="md" icon="plus">
        {action}
      </Button>
    </div>
  );
}

function SchoolsTable() {
  const { t } = useTranslation();
  const labels = [t('admin.statusActive'), t('admin.statusPaused')];
  return (
    <>
      <Toolbar placeholder={t('admin.searchSchools')} action={t('admin.addSchool')} />
      <TableShell>
        <thead>
          <tr>
            <Th>{t('admin.colSchool')}</Th>
            <Th>{t('admin.colCity')}</Th>
            <Th>{t('admin.colTeachers')}</Th>
            <Th>{t('admin.colActivity')}</Th>
            <Th>{t('admin.colStatus')}</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {SCHOOLS.map((s) => (
            <tr key={s.id}>
              <Td>
                <span className="font-semibold">{s.name}</span>
              </Td>
              <Td className="text-ink-2">{s.city}</Td>
              <Td className="tnum">{s.teachers}</Td>
              <Td>
                <div className="flex min-w-[120px] items-center gap-[8px]">
                  <div className="flex-1">
                    <Progress value={s.active * 100} max={100} tone="green" height={6} />
                  </div>
                  <span className="tnum w-[34px] text-[12.5px] text-ink-3">{Math.round(s.active * 100)}%</span>
                </div>
              </Td>
              <Td>
                <StatusPill on labels={labels} />
              </Td>
              <Td className="text-left">
                <RowActions />
              </Td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </>
  );
}

function UsersTable() {
  const { t } = useTranslation();
  const labels = [t('admin.statusActive'), t('admin.statusPaused')];
  return (
    <>
      <Toolbar placeholder={t('admin.searchUsers')} action={t('admin.addUser')} />
      <TableShell>
        <thead>
          <tr>
            <Th>{t('admin.colName')}</Th>
            <Th>{t('admin.colRole')}</Th>
            <Th>{t('admin.colSchool')}</Th>
            <Th>{t('admin.colQuota')}</Th>
            <Th>{t('admin.colStatus')}</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {USERS.map((u) => (
            <tr key={u.id}>
              <Td>
                <div className="flex items-center gap-[10px]">
                  <Avatar name={u.name} size={32} />
                  <span className="font-semibold">{u.name}</span>
                  {u.principal ? (
                    <span className="rounded-pill bg-info-50 px-[8px] py-[2px] text-[11px] font-bold text-info">{t('admin.principalBadge')}</span>
                  ) : null}
                </div>
              </Td>
              <Td className="text-ink-2">{u.role}</Td>
              <Td className="text-ink-2">{schoolById(u.school).short}</Td>
              <Td className="tnum">{t('admin.quotaPerMonth', { n: u.allowance })}</Td>
              <Td>
                <StatusPill on labels={labels} />
              </Td>
              <Td className="text-left">
                <RowActions />
              </Td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </>
  );
}

function ValuesTable() {
  const { t } = useTranslation();
  const labels = [t('admin.statusOn'), t('admin.statusOff')];
  return (
    <>
      <Toolbar placeholder={t('admin.searchValues')} action={t('admin.addValue')} />
      <TableShell>
        <thead>
          <tr>
            <Th>{t('admin.colValue')}</Th>
            <Th>{t('admin.colEmoji')}</Th>
            <Th>{t('admin.colUsage')}</Th>
            <Th>{t('admin.colStatus')}</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {VALUES.map((v, i) => (
            <tr key={v.id}>
              <Td>
                <ValueTag value={v} label={t(`values.${v.id}`)} />
              </Td>
              <Td className="text-[20px]">{v.emoji}</Td>
              <Td className="tnum text-ink-2">{t('admin.usageCount', { n: VALUE_USAGE[i] })}</Td>
              <Td>
                <StatusPill on labels={labels} />
              </Td>
              <Td className="text-left">
                <RowActions />
              </Td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </>
  );
}

function RewardsTable() {
  const { t } = useTranslation();
  const labels = [t('admin.statusInStock'), t('admin.statusOut')];
  return (
    <>
      <Toolbar placeholder={t('admin.searchRewards')} action={t('admin.addReward')} />
      <TableShell>
        <thead>
          <tr>
            <Th>{t('admin.colReward')}</Th>
            <Th>{t('admin.colProvider')}</Th>
            <Th>{t('admin.colCategory')}</Th>
            <Th>{t('admin.colCost')}</Th>
            <Th>{t('admin.colStatus')}</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {REWARDS.map((r) => (
            <tr key={r.id}>
              <Td>
                <div className="flex items-center gap-[10px]">
                  <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-1 text-[16px]" style={{ background: r.color }}>
                    {r.emoji}
                  </span>
                  <span className="font-semibold">{r.title}</span>
                </div>
              </Td>
              <Td className="text-ink-2">{r.provider}</Td>
              <Td className="text-ink-2">{t(`rewardCats.${r.cat}`)}</Td>
              <Td className="tnum font-bold text-gold-deep">★ {r.cost}</Td>
              <Td>
                <StatusPill on labels={labels} />
              </Td>
              <Td className="text-left">
                <RowActions />
              </Td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </>
  );
}

const A_COLORS = { gold: 'var(--gold-deep)', green: 'var(--primary)', terra: 'var(--accent-700)', info: 'var(--info)' };
const A_BG = { gold: 'var(--gold-50)', green: 'var(--primary-50)', terra: 'var(--accent-50)', info: 'var(--info-50)' };

function Analytics() {
  const { t } = useTranslation();
  const cards = [
    { labelKey: 'cardRecognitions', value: '1,284', icon: 'heart-handshake', tone: 'green' },
    { labelKey: 'cardActiveUsers', value: '196', icon: 'users', tone: 'info' },
    { labelKey: 'cardSchools', value: SCHOOLS.length, icon: 'school', tone: 'gold' },
    { labelKey: 'cardPointsCirculating', value: '24.6k', icon: 'star', tone: 'terra' },
  ];
  return (
    <div className="grid gap-[16px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
      {cards.map((c) => (
        <Card key={c.labelKey} className="p-[18px]">
          <span
            className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-2"
            style={{ background: A_BG[c.tone], color: A_COLORS[c.tone] }}
          >
            <Icon name={c.icon} size={19} />
          </span>
          <div className="tnum mt-[12px] font-display text-[36px] font-extrabold leading-none text-ink">{c.value}</div>
          <div className="mt-[6px] text-[13px] text-ink-3">{t(`admin.${c.labelKey}`)}</div>
        </Card>
      ))}
    </div>
  );
}

export default function AdminView() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('analytics');
  const tabs = [
    { id: 'analytics', label: t('admin.tabAnalytics') },
    { id: 'schools', label: t('admin.tabSchools') },
    { id: 'users', label: t('admin.tabUsers') },
    { id: 'values', label: t('admin.tabValues') },
    { id: 'rewards', label: t('admin.tabRewards') },
  ];
  const { isMobile } = useViewport();
  return (
    <div className={cx('mx-auto max-w-[1180px]', isMobile ? 'px-[16px] py-[20px]' : 'px-[28px] py-[32px]')}>
      <Eyebrow>{t('admin.eyebrow')}</Eyebrow>
      <h1 className="mt-[6px] font-display font-extrabold tracking-[-0.02em] text-ink" style={{ fontSize: isMobile ? 28 : 34 }}>
        {t('admin.title')}
      </h1>
      <p className="mt-[4px] text-[15px] text-ink-2">{t('admin.subtitle')}</p>

      <div className="no-sb mb-[22px] mt-[22px] overflow-x-auto">
        <SegTabs active={tab} onChange={setTab} tabs={tabs} />
      </div>

      {tab === 'analytics' ? <Analytics /> : null}
      {tab === 'schools' ? <SchoolsTable /> : null}
      {tab === 'users' ? <UsersTable /> : null}
      {tab === 'values' ? <ValuesTable /> : null}
      {tab === 'rewards' ? <RewardsTable /> : null}
    </div>
  );
}
