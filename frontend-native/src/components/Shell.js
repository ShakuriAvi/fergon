/* App shell — RN port of frontend/src/components/Shell.jsx.
   Desktop: sidebar + topbar. Mobile: topbar + bottom tabs with center FAB. */
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon, Avatar, Button } from './ui';
import { Logo } from './Logo';
import { useViewport } from '../hooks/useViewport';
import { getUser, ME, schoolById } from '../data/mock';
import { colors, radius, fontFamily, shadowPop } from '../theme';

const NAV = [
  { id: 'feed', icon: 'layout-list' },
  { id: 'profile', icon: 'wallet' },
  { id: 'rewards', icon: 'gift' },
  { id: 'principal', icon: 'bar-chart-3' },
  { id: 'admin', icon: 'shield-check' },
];

function NavItem({ it, active, onPress }) {
  const { t } = useTranslation();
  const on = it.id === active;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        borderRadius: radius.r2,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: on ? colors.primary50 : 'transparent',
      }}
    >
      <Icon name={it.icon} size={19} color={on ? colors.primary : colors.ink2} />
      <Text style={{ flex: 1, fontFamily, fontSize: 14.5, fontWeight: on ? '700' : '500', color: on ? colors.primary : colors.ink2 }}>
        {t(`nav.${it.id}`)}
      </Text>
      {on ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} /> : null}
    </Pressable>
  );
}

function Sidebar({ active, onNavigate, onGive }) {
  const { t } = useTranslation();
  const me = getUser(ME);
  return (
    <View style={{ width: 248, borderLeftWidth: 1, borderColor: colors.rule, backgroundColor: colors.cardCream, padding: 18 }}>
      <View style={{ paddingHorizontal: 8, paddingTop: 6, paddingBottom: 16 }}>
        <Logo size={34} />
      </View>

      <Button variant="primary" icon="sparkles" onPress={onGive} style={{ marginBottom: 10 }}>
        {t('common.give')}
      </Button>

      <Text style={{ fontFamily, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: colors.ink3 }}>
        {t('nav.section')}
      </Text>
      {NAV.map((it) => (
        <NavItem key={it.id} it={it} active={active} onPress={() => onNavigate(it.id)} />
      ))}

      <Pressable
        onPress={() => onNavigate('profile')}
        style={{ marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderColor: colors.rule, paddingTop: 12 }}
      >
        <Avatar name={me.name} size={36} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontFamily, fontSize: 13.5, fontWeight: '700', color: colors.ink }}>{me.name}</Text>
          <Text style={{ fontFamily, fontSize: 11.5, color: colors.ink3 }}>{schoolById(me.school).short}</Text>
        </View>
        <Icon name="chevron-left" size={15} color={colors.ink3} />
      </Pressable>
    </View>
  );
}

function Topbar({ isMobile, onNavigate, points }) {
  const { t } = useTranslation();
  const me = getUser(ME);
  return (
    <View
      style={{
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        borderBottomWidth: 1,
        borderColor: colors.rule,
        backgroundColor: colors.paper,
        paddingHorizontal: isMobile ? 16 : 28,
      }}
    >
      {isMobile ? (
        <Logo size={30} />
      ) : (
        <View style={{ flexBasis: 380, flexShrink: 1, maxWidth: 380, justifyContent: 'center' }}>
          <Icon name="search" size={16} color={colors.ink3} style={{ position: 'absolute', insetInlineEnd: 13, zIndex: 1 }} />
          <TextInput
            placeholder={t('topbar.searchPlaceholder')}
            placeholderTextColor={colors.ink3}
            style={{
              fontFamily,
              borderRadius: radius.r2,
              borderWidth: 1,
              borderColor: colors.rule,
              backgroundColor: colors.cardCream,
              paddingVertical: 9,
              paddingStart: 14,
              paddingEnd: 40,
              fontSize: 14,
              color: colors.ink,
              textAlign: 'right',
            }}
          />
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: isMobile ? 10 : 16 }}>
        <Pressable
          onPress={() => onNavigate('profile')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.gold100, backgroundColor: colors.gold50, paddingHorizontal: 12, paddingVertical: 6 }}
        >
          <Text style={{ fontSize: 15, color: colors.gold }}>★</Text>
          <Text style={{ fontFamily, fontSize: 14.5, fontWeight: '800', color: colors.goldDeep }}>{points}</Text>
          {!isMobile ? <Text style={{ fontFamily, fontSize: 12.5, fontWeight: '600', color: colors.goldDeep }}>{t('common.points')}</Text> : null}
        </Pressable>
        {isMobile ? null : <Icon name="bell" size={20} color={colors.ink2} />}
        {isMobile ? null : <Avatar name={me.name} size={36} />}
      </View>
    </View>
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
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        height: 66,
        borderTopWidth: 1,
        borderColor: colors.rule,
        backgroundColor: colors.cardCream,
      }}
    >
      {items.map((it) => {
        if (it.id === '__give') {
          return (
            <Pressable
              key="give"
              onPress={onGive}
              style={[
                {
                  marginTop: -24,
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  borderWidth: 4,
                  borderColor: colors.paper,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                shadowPop,
              ]}
            >
              <Icon name="sparkles" size={24} stroke={2} color={colors.white} />
            </Pressable>
          );
        }
        const on = it.id === active;
        return (
          <Pressable key={it.id} onPress={() => onNavigate(it.id)} style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 6 }}>
            <Icon name={it.icon} size={22} stroke={on ? 2 : 1.75} color={on ? colors.primary : colors.ink3} />
            <Text style={{ fontFamily, fontSize: 11, fontWeight: on ? '700' : '500', color: on ? colors.primary : colors.ink3 }}>
              {t(`tabs.${it.id}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function Shell({ active, onNavigate, onGive, points, children }) {
  const { isMobile } = useViewport();
  if (isMobile) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper }}>
        <Topbar isMobile onNavigate={onNavigate} points={points} />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 12 }}>
          {children}
        </ScrollView>
        <BottomTabs active={active} onNavigate={onNavigate} onGive={onGive} />
      </View>
    );
  }
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.paper }}>
      <Sidebar active={active} onNavigate={onNavigate} onGive={onGive} />
      <View style={{ flex: 1 }}>
        <Topbar isMobile={false} onNavigate={onNavigate} points={points} />
        <ScrollView style={{ flex: 1 }}>{children}</ScrollView>
      </View>
    </View>
  );
}
