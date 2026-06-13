/* ============================================================
   Schoolyard primitives — React Native port of frontend/src/components/primitives.jsx.
   Rebuilt with View / Text / Pressable + lucide-react-native (the icons
   are RN-native components; the web build used lucide-react).
   ============================================================ */
import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import {
  X, Search, Sticker, Sparkles as SparklesIcon, AlertCircle, LayoutList, Wallet, Gift,
  BarChart3, ShieldCheck, ChevronLeft, ChevronDown, Bell, Lock, MessageCircle, Share2,
  School, MapPin, HeartHandshake, Users, Star, Trophy, Check, Plus, Pencil, MoreHorizontal,
} from 'lucide-react-native';
import { colors, radius, fontFamily, shadowPop } from '../theme';

export const FEED_AVATAR_TONE = { bg: colors.primary50, fg: colors.primary };

const ICONS = {
  x: X, search: Search, sticker: Sticker, sparkles: SparklesIcon, 'alert-circle': AlertCircle,
  'layout-list': LayoutList, wallet: Wallet, gift: Gift, 'bar-chart-3': BarChart3,
  'shield-check': ShieldCheck, 'chevron-left': ChevronLeft, 'chevron-down': ChevronDown,
  bell: Bell, lock: Lock, 'message-circle': MessageCircle, 'share-2': Share2, school: School,
  'map-pin': MapPin, 'heart-handshake': HeartHandshake, users: Users, star: Star, trophy: Trophy,
  check: Check, plus: Plus, pencil: Pencil, 'more-horizontal': MoreHorizontal,
};

export function Icon({ name, size = 18, stroke = 1.75, color = colors.ink2, style }) {
  const Cmp = ICONS[name] || X;
  return <Cmp size={size} strokeWidth={stroke} color={color} style={style} />;
}

/* base text — bakes the brand font + RTL-aware default alignment */
export function Txt({ style, children, ...rest }) {
  return (
    <Text style={[styles.txt, style]} {...rest}>
      {children}
    </Text>
  );
}

export function Eyebrow({ children, style }) {
  return <Txt style={[styles.eyebrow, style]}>{children}</Txt>;
}

export function HRule({ style }) {
  return <View style={[styles.hrule, style]} />;
}

const AVATAR_TONES = [
  { bg: colors.primary100, fg: colors.primary },
  { bg: colors.accent100, fg: colors.accent700 },
  { bg: colors.gold100, fg: colors.goldDeep },
  { bg: colors.info100, fg: colors.info },
];

export function Avatar({ name, size = 40, ring, tone }) {
  const initials = (name || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('');
  const hash = [...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0);
  const t = tone || AVATAR_TONES[hash % AVATAR_TONES.length];
  const inner = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: t.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: t.fg, fontFamily, fontWeight: '700', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
  if (!ring) return inner;
  return (
    <View
      style={{
        padding: 3,
        borderRadius: (size + 8) / 2,
        backgroundColor: colors.paper,
        borderWidth: 1,
        borderColor: ring,
      }}
    >
      {inner}
    </View>
  );
}

const BTN_SIZES = {
  sm: { paddingHorizontal: 13, paddingVertical: 7, fontSize: 13.5, icon: 16 },
  md: { paddingHorizontal: 18, paddingVertical: 10, fontSize: 15, icon: 16 },
  lg: { paddingHorizontal: 24, paddingVertical: 13, fontSize: 16, icon: 19 },
};

const BTN_VARIANTS = {
  primary: { bg: colors.primary, fg: colors.white, border: 'transparent' },
  gold: { bg: colors.gold, fg: colors.ink, border: 'transparent' },
  secondary: { bg: colors.cardCream, fg: colors.ink, border: colors.ruleStrong },
  ghost: { bg: 'transparent', fg: colors.ink2, border: 'transparent' },
};

export function Button({ variant = 'primary', size = 'md', icon, iconAfter, children, onPress, style, disabled }) {
  const s = BTN_SIZES[size];
  const v = BTN_VARIANTS[variant];
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        {
          paddingHorizontal: s.paddingHorizontal,
          paddingVertical: s.paddingVertical,
          backgroundColor: v.bg,
          borderColor: v.border,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={s.icon} color={v.fg} /> : null}
      <Text style={{ color: v.fg, fontFamily, fontWeight: '600', fontSize: s.fontSize }}>{children}</Text>
      {iconAfter ? <Icon name={iconAfter} size={s.icon} color={v.fg} /> : null}
    </Pressable>
  );
}

export function Card({ children, style, padded = true, onPress }) {
  const content = [styles.card, padded ? { padding: 20 } : { padding: 0 }, style];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [...content, pressed && { borderColor: colors.ruleStrong }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={content}>{children}</View>;
}

const VALUE_TONES = {
  gold: { bg: colors.gold50, fg: colors.goldDeep },
  green: { bg: colors.primary50, fg: colors.primary },
  terra: { bg: colors.accent50, fg: colors.accent700 },
};

export function ValueTag({ value, label, size = 'md', style }) {
  const fs = size === 'sm' ? 12 : 13.5;
  const t = VALUE_TONES[value.tone] || VALUE_TONES.green;
  return (
    <View
      style={[
        styles.pillRow,
        {
          backgroundColor: t.bg,
          paddingHorizontal: size === 'sm' ? 9 : 12,
          paddingVertical: size === 'sm' ? 3 : 5,
          borderRadius: radius.pill,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: fs + 2 }}>{value.emoji}</Text>
      <Text style={{ color: t.fg, fontFamily, fontWeight: '600', fontSize: fs }}>{label}</Text>
    </View>
  );
}

export function PointsPill({ points, size = 'md', plus = true, style }) {
  const fs = size === 'sm' ? 12.5 : size === 'lg' ? 17 : 14;
  return (
    <View
      style={[
        styles.pillRow,
        {
          backgroundColor: colors.gold50,
          borderWidth: 1,
          borderColor: colors.gold100,
          borderRadius: radius.pill,
          paddingHorizontal: size === 'lg' ? 14 : 11,
          paddingVertical: size === 'lg' ? 7 : 4,
        },
        style,
      ]}
    >
      <Text style={{ color: colors.gold, fontSize: fs + 1 }}>★</Text>
      <Text style={{ color: colors.goldDeep, fontFamily, fontWeight: '800', fontSize: fs }}>
        {plus ? '+' : ''}
        {points}
      </Text>
    </View>
  );
}

const PROGRESS_COLORS = { gold: colors.gold, green: colors.primary, terra: colors.accent };

export function Progress({ value, max, tone = 'gold', height = 10 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <View style={{ width: '100%', height, borderRadius: height / 2, backgroundColor: colors.paperSink, overflow: 'hidden' }}>
      <View style={{ height: '100%', width: pct + '%', borderRadius: height / 2, backgroundColor: PROGRESS_COLORS[tone] }} />
    </View>
  );
}

export function AnimatedNumber({ value, duration = 700, style }) {
  const [n, setN] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    const to = value;
    if (from === to) return undefined;
    const start = Date.now();
    let raf;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setN(Math.round(from + (to - from) * e));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <Text style={[styles.txt, style]}>{n.toLocaleString('he-IL')}</Text>;
}

export function SegTabs({ tabs, active, onChange, style }) {
  return (
    <View style={[styles.segWrap, style]}>
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <Pressable
            key={t.id}
            onPress={() => onChange(t.id)}
            style={[styles.segTab, on ? [{ backgroundColor: colors.cardCream }, shadowPop] : null]}
          >
            {t.count != null ? (
              <Text style={{ fontFamily, fontSize: 12, color: on ? colors.primary : colors.ink4 }}>{t.count}</Text>
            ) : null}
            <Text style={{ fontFamily, fontSize: 14, fontWeight: '600', color: on ? colors.ink : colors.ink3 }}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const SPARK_COLORS = [colors.gold, colors.primary, colors.accent, colors.goldDeep];

/* lightweight burst — N particles fly outward from the anchor center */
export function Sparkles({ run, count = 16 }) {
  const anims = useRef(Array.from({ length: count }, () => new Animated.Value(0))).current;
  const parts = useRef(
    Array.from({ length: count }, (_, i) => {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const dist = 50 + Math.random() * 50;
      return {
        dx: Math.cos(ang) * dist,
        dy: Math.sin(ang) * dist,
        c: SPARK_COLORS[i % SPARK_COLORS.length],
        s: 5 + Math.random() * 4,
        delay: Math.random() * 80,
      };
    })
  ).current;

  useEffect(() => {
    if (!run) return undefined;
    const seqs = anims.map((a, i) => {
      a.setValue(0);
      return Animated.timing(a, {
        toValue: 1,
        duration: 700 + parts[i].delay * 4,
        delay: parts[i].delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    });
    Animated.parallel(seqs).start();
    return undefined;
  }, [run]);

  if (!run) return null;
  return (
    <View pointerEvents="none" style={styles.sparkLayer}>
      {parts.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: p.s,
            height: p.s,
            borderRadius: p.s / 2,
            backgroundColor: p.c,
            opacity: anims[i].interpolate({ inputRange: [0, 0.18, 1], outputRange: [0, 1, 0] }),
            transform: [
              { translateX: anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
              { translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, p.dy] }) },
              { scale: anims[i].interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  txt: { fontFamily, color: colors.ink },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: colors.ink3 },
  hrule: { height: 1, backgroundColor: colors.rule },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.r2,
    borderWidth: 1,
  },
  card: { borderRadius: radius.r3, borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.cardCream },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  segWrap: { flexDirection: 'row', gap: 2, borderRadius: radius.r2, backgroundColor: colors.paperSink, padding: 4 },
  segTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: radius.r1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sparkLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
});
