/* App shell — ported from fergon.html. Desktop sidebar + topbar,
   mobile topbar + bottom tabs with center "give" FAB. */
import { useTranslation } from 'react-i18next';
import { Icon, Avatar, Button } from './primitives.jsx';
import { useViewport } from '../hooks/useViewport.js';
import { getUser, ME, schoolById } from '../data/mock.js';
import { cx } from '../lib/cx.js';

export function Logo({ size = 34, showWord = true, light = false }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-[10px]">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className="shrink-0">
        <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill="var(--primary)" />
        <path d="M20 9.5l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L20 24.8l-6.1 3.1 1.4-6.8-5.1-4.7 6.9-.8L20 9.5z" fill="var(--gold)" />
      </svg>
      {showWord ? (
        <div className="leading-none">
          <div
            className={cx('font-display font-extrabold tracking-[-0.02em]', light ? 'text-white' : 'text-ink')}
            style={{ fontSize: size * 0.62 }}
          >
            {t('app.brand')}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const NAV = [
  { id: 'feed', icon: 'layout-list' },
  { id: 'profile', icon: 'wallet' },
  { id: 'rewards', icon: 'gift' },
  { id: 'principal', icon: 'bar-chart-3' },
  { id: 'admin', icon: 'shield-check' },
];

function NavItem({ it, active, onClick }) {
  const { t } = useTranslation();
  const on = it.id === active;
  return (
    <div
      onClick={onClick}
      className={cx(
        'flex cursor-pointer items-center gap-[11px] rounded-2 px-[12px] py-[10px] text-[14.5px] transition-colors duration-1 ease-sy',
        on ? 'bg-primary-50 font-bold text-primary' : 'bg-transparent font-medium text-ink-2 hover:bg-paper-sink'
      )}
    >
      <Icon name={it.icon} size={19} />
      <span className="flex-1">{t(`nav.${it.id}`)}</span>
      {on ? <span className="h-[6px] w-[6px] rounded-full bg-primary" /> : null}
    </div>
  );
}

function Sidebar({ active, onNavigate, onGive }) {
  const { t } = useTranslation();
  const me = getUser(ME);
  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col gap-1 border-l border-rule bg-card-cream p-[18px]">
      <div className="px-[8px] pb-[16px] pt-[6px]">
        <Logo size={34} />
      </div>

      <Button variant="primary" size="md" icon="sparkles" onClick={onGive} className="mb-[10px] w-full text-[15px]">
        {t('common.give')}
      </Button>

      <div className="px-[12px] pb-[6px] pt-[10px] text-[11px] font-bold tracking-[0.08em] text-ink-3">{t('nav.section')}</div>
      {NAV.map((it) => (
        <NavItem key={it.id} it={it} active={active} onClick={() => onNavigate(it.id)} />
      ))}

      <div
        className="mt-auto flex cursor-pointer items-center gap-[10px] border-t border-rule pt-[12px]"
        onClick={() => onNavigate('profile')}
      >
        <Avatar name={me.name} size={36} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-bold text-ink">{me.name}</div>
          <div className="text-[11.5px] text-ink-3">{schoolById(me.school).short}</div>
        </div>
        <Icon name="chevron-left" size={15} className="text-ink-3" />
      </div>
    </aside>
  );
}

function Topbar({ isMobile, onNavigate, points }) {
  const { t } = useTranslation();
  const me = getUser(ME);
  return (
    <header className={cx('flex h-[60px] shrink-0 items-center gap-[14px] border-b border-rule bg-paper', isMobile ? 'px-[16px]' : 'px-[28px]')}>
      {isMobile ? (
        <Logo size={30} showWord />
      ) : (
        <div className="relative max-w-[380px] flex-1">
          <Icon name="search" size={16} className="absolute right-[13px] top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            placeholder={t('topbar.searchPlaceholder')}
            className="w-full rounded-2 border border-rule bg-card-cream py-[9px] pl-[14px] pr-[40px] text-[14px] text-ink outline-none"
          />
        </div>
      )}
      <div className={cx('mr-auto flex items-center', isMobile ? 'gap-[10px]' : 'gap-[16px]')}>
        <div
          onClick={() => onNavigate('profile')}
          className="flex cursor-pointer items-center gap-[7px] rounded-pill border border-gold-100 bg-gold-50 px-[12px] py-[6px]"
        >
          <span className="text-[15px] text-gold">★</span>
          <span className="tnum text-[14.5px] font-extrabold text-gold-deep">{points}</span>
          {!isMobile ? <span className="text-[12.5px] font-semibold text-gold-deep">{t('common.points')}</span> : null}
        </div>
        {isMobile ? null : <Icon name="bell" size={20} className="cursor-pointer text-ink-2" />}
        {isMobile ? null : <Avatar name={me.name} size={36} />}
      </div>
    </header>
  );
}

function BottomTabs({ active, onNavigate, onGive }) {
  const { t } = useTranslation();
  const items = [
    { id: 'feed', icon: 'layout-list' },
    { id: 'rewards', icon: 'gift' },
    { id: '__give', icon: 'sparkles' },
    { id: 'profile', icon: 'wallet' },
    { id: 'principal', icon: 'bar-chart-3' },
  ];
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex h-[66px] items-center justify-around border-t border-rule bg-card-cream"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map((it) => {
        if (it.id === '__give') {
          return (
            <button
              key="give"
              type="button"
              onClick={onGive}
              aria-label={t('common.give')}
              className="-mt-[24px] flex h-[56px] w-[56px] shrink-0 cursor-pointer items-center justify-center rounded-full border-4 border-paper bg-primary text-white shadow-pop"
            >
              <Icon name="sparkles" size={24} stroke={2} />
            </button>
          );
        }
        const on = it.id === active;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onNavigate(it.id)}
            className={cx(
              'flex flex-1 cursor-pointer flex-col items-center gap-[3px] border-none bg-transparent px-[8px] py-[6px] font-body',
              on ? 'font-bold text-primary' : 'font-medium text-ink-3'
            )}
          >
            <Icon name={it.icon} size={22} stroke={on ? 2 : 1.75} />
            <span className="text-[11px]">{t(`tabs.${it.id}`)}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default function Shell({ active, onNavigate, onGive, points, children }) {
  const { isMobile } = useViewport();
  if (isMobile) {
    return (
      <div className="flex h-screen flex-col bg-paper">
        <Topbar isMobile onNavigate={onNavigate} points={points} />
        <div className="flex-1 overflow-auto pb-[78px]">{children}</div>
        <BottomTabs active={active} onNavigate={onNavigate} onGive={onGive} />
      </div>
    );
  }
  return (
    <div className="flex h-screen flex-row overflow-hidden bg-paper">
      <Sidebar active={active} onNavigate={onNavigate} onGive={onGive} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar isMobile={false} onNavigate={onNavigate} points={points} />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
