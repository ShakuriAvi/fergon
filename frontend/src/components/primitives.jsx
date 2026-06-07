/* ============================================================
   Schoolyard primitives — ported from fergon.html.
   Styled with Tailwind utilities (design tokens mapped in
   tailwind.config.js). Prop-driven / computed values that cannot
   be static classes stay inline.
   ============================================================ */
import { useState, useEffect, useRef } from 'react';
import {
  X, Search, Sticker, Sparkles as SparklesIcon, AlertCircle, LayoutList, Wallet, Gift,
  BarChart3, ShieldCheck, ChevronLeft, ChevronDown, Bell, Lock, MessageCircle, Share2,
  School, MapPin, HeartHandshake, Users, Star, Trophy, Check, Plus, Pencil, MoreHorizontal,
} from 'lucide-react';
import { cx } from '../lib/cx.js';

/* one calm avatar tone for the whole feed (Feed + Profile cards) */
export const FEED_AVATAR_TONE = { bg: 'var(--primary-50)', fg: 'var(--primary)' };

const ICONS = {
  x: X,
  search: Search,
  sticker: Sticker,
  sparkles: SparklesIcon,
  'alert-circle': AlertCircle,
  'layout-list': LayoutList,
  wallet: Wallet,
  gift: Gift,
  'bar-chart-3': BarChart3,
  'shield-check': ShieldCheck,
  'chevron-left': ChevronLeft,
  'chevron-down': ChevronDown,
  bell: Bell,
  lock: Lock,
  'message-circle': MessageCircle,
  'share-2': Share2,
  school: School,
  'map-pin': MapPin,
  'heart-handshake': HeartHandshake,
  users: Users,
  star: Star,
  trophy: Trophy,
  check: Check,
  plus: Plus,
  pencil: Pencil,
  'more-horizontal': MoreHorizontal,
};

export function Icon({ name, size = 18, stroke = 1.75, className, style, ...rest }) {
  const Cmp = ICONS[name] || X;
  return (
    <span className={cx('inline-flex', className)} style={{ width: size, height: size, ...style }} {...rest}>
      <Cmp size={size} strokeWidth={stroke} />
    </span>
  );
}

export function Eyebrow({ children, className }) {
  return (
    <div className={cx('text-[11px] font-bold tracking-[0.08em] text-ink-3', className)}>{children}</div>
  );
}

export function HRule({ className }) {
  return <div className={cx('h-px bg-rule', className)} />;
}

const AVATAR_TONES = [
  { bg: 'var(--primary-100)', fg: 'var(--primary)' },
  { bg: 'var(--accent-100)', fg: 'var(--accent-700)' },
  { bg: 'var(--gold-100)', fg: 'var(--gold-deep)' },
  { bg: 'var(--info-100)', fg: 'var(--info)' },
];

export function Avatar({ name, size = 40, ring, tone }) {
  const initials = (name || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('');
  const hash = [...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0);
  const t = tone || AVATAR_TONES[hash % AVATAR_TONES.length];
  return (
    <div
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold tracking-[-0.02em]"
      style={{
        width: size,
        height: size,
        background: t.bg,
        color: t.fg,
        fontSize: size * 0.38,
        boxShadow: ring ? `0 0 0 3px var(--paper), 0 0 0 4px ${ring}` : undefined,
      }}
    >
      {initials}
    </div>
  );
}

const BTN_SIZES = {
  sm: 'px-[13px] py-[7px] text-[13.5px]',
  md: 'px-[18px] py-[10px] text-[15px]',
  lg: 'px-[24px] py-[13px] text-[16px]',
};

const BTN_VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-700',
  gold: 'bg-gold text-ink hover:bg-[#d9a52f]',
  secondary: 'bg-card-cream text-ink border-rule-strong hover:bg-paper-sink',
  ghost: 'bg-transparent text-ink-2 hover:bg-paper-sink',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconAfter,
  children,
  onClick,
  className,
  type,
  disabled,
  ...rest
}) {
  return (
    <button
      type={type || 'button'}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cx(
        'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap',
        'rounded-2 border border-transparent font-body font-semibold leading-none tracking-[-0.01em]',
        'transition-all duration-1 ease-sy',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none',
        BTN_SIZES[size],
        BTN_VARIANTS[variant],
        className
      )}
      {...rest}
    >
      {icon ? <Icon name={icon} size={size === 'lg' ? 19 : 16} /> : null}
      {children}
      {iconAfter ? <Icon name={iconAfter} size={size === 'lg' ? 19 : 16} /> : null}
    </button>
  );
}

export function Card({ children, className, padded = true, hover = false, onClick, ...rest }) {
  return (
    <div
      onClick={onClick}
      className={cx(
        'rounded-3 border border-rule bg-card-cream transition-[border-color,transform] duration-1 ease-sy',
        padded ? 'p-[20px]' : 'p-0',
        hover ? 'hover:border-rule-strong' : '',
        onClick ? 'cursor-pointer' : '',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

const VALUE_TONES = {
  gold: 'bg-gold-50 text-gold-deep',
  green: 'bg-primary-50 text-primary',
  terra: 'bg-accent-50 text-accent-700',
};

export function ValueTag({ value, label, size = 'md', className }) {
  const fs = size === 'sm' ? 12 : 13.5;
  return (
    <span
      className={cx(
        'inline-flex items-center gap-[6px] whitespace-nowrap rounded-pill font-semibold leading-[1.3]',
        size === 'sm' ? 'px-[9px] py-[3px]' : 'px-[12px] py-[5px]',
        VALUE_TONES[value.tone] || VALUE_TONES.green,
        className
      )}
      style={{ fontSize: fs }}
    >
      <span style={{ fontSize: fs + 2 }}>{value.emoji}</span>
      {label}
    </span>
  );
}

export function PointsPill({ points, size = 'md', plus = true, className }) {
  const fs = size === 'sm' ? 12.5 : size === 'lg' ? 17 : 14;
  return (
    <span
      className={cx(
        'tnum inline-flex items-center gap-[5px] rounded-pill border border-gold-100 bg-gold-50 font-extrabold leading-none text-gold-deep',
        size === 'lg' ? 'px-[14px] py-[7px]' : 'px-[11px] py-[4px]',
        className
      )}
      style={{ fontSize: fs }}
    >
      <span style={{ fontSize: fs + 1 }}>★</span>
      {plus ? '+' : ''}
      {points}
    </span>
  );
}

const PROGRESS_COLORS = { gold: 'var(--gold)', green: 'var(--primary)', terra: 'var(--accent)' };

export function Progress({ value, max, tone = 'gold', height = 10 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="w-full overflow-hidden rounded-full bg-paper-sink" style={{ height }}>
      <div
        className="h-full rounded-full transition-[width] duration-3 ease-sy"
        style={{ width: pct + '%', background: PROGRESS_COLORS[tone] }}
      />
    </div>
  );
}

export function AnimatedNumber({ value, duration = 700, style, className }) {
  const [n, setN] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    const to = value;
    const start = performance.now();
    if (from === to) return undefined;
    let raf;
    const tick = (ts) => {
      const p = Math.min(1, (ts - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setN(Math.round(from + (to - from) * e));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={cx('tnum', className)} style={style}>{n.toLocaleString('he-IL')}</span>;
}

export function SegTabs({ tabs, active, onChange, className }) {
  return (
    <div className={cx('inline-flex gap-[2px] rounded-2 bg-paper-sink p-1', className)}>
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cx(
              'inline-flex cursor-pointer items-center gap-[7px] rounded-1 px-[16px] py-[8px] font-body text-[14px] font-semibold transition-all duration-1 ease-sy',
              on ? 'bg-card-cream text-ink shadow-pop' : 'bg-transparent text-ink-3'
            )}
          >
            {t.count != null ? (
              <span className={cx('tnum text-[12px]', on ? 'text-primary' : 'text-ink-4')}>{t.count}</span>
            ) : null}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

const SPARK_COLORS = ['var(--gold)', 'var(--primary)', 'var(--accent)', 'var(--gold-deep)'];

export function Sparkles({ run, count = 16 }) {
  if (!run) return null;
  const parts = Array.from({ length: count }, (_, i) => {
    const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const dist = 60 + Math.random() * 70;
    return {
      dx: Math.cos(ang) * dist + 'px',
      dy: Math.sin(ang) * dist + 'px',
      c: SPARK_COLORS[i % SPARK_COLORS.length],
      s: 5 + Math.random() * 5,
      d: Math.random() * 80,
      star: i % 3 === 0,
    };
  });
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-visible">
      {parts.map((p, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2"
          style={{
            width: p.s,
            height: p.s,
            borderRadius: p.star ? 0 : '50%',
            background: p.c,
            '--dx': p.dx,
            '--dy': p.dy,
            clipPath: p.star
              ? 'polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)'
              : 'none',
            animation: `sy-spark ${700 + p.d * 4}ms var(--ease) ${p.d}ms both`,
          }}
        />
      ))}
    </div>
  );
}
