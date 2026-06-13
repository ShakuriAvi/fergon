/* Feed view — RN port of frontend/src/components/FeedView.jsx. */
import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Eyebrow, Avatar, Button, Icon, FEED_AVATAR_TONE as AV } from './ui';
import RecognitionCard from './RecognitionCard';
import { useViewport } from '../hooks/useViewport';
import { getUser, ME, recognitions, VALUES, SCHOOLS } from '../data/mock';
import { colors, radius, fontFamily, shadowPop } from '../theme';

function GreetingStrip({ onGive, isMobile, points, remaining }) {
  const { t } = useTranslation();
  const me = getUser(ME);
  const hour = new Date().getHours();
  const greet = hour < 12 ? t('feed.greetMorning') : hour < 18 ? t('feed.greetNoon') : t('feed.greetEvening');
  return (
    <View
      style={{
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: 16,
        borderBottomWidth: 1,
        borderColor: colors.rule,
        paddingBottom: 22,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily, fontWeight: '800', fontSize: isMobile ? 28 : 32, color: colors.ink }}>
          {t('feed.greeting', { greet, name: me.name.split(' ')[0] })}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={{ fontSize: 15, color: colors.gold }}>★</Text>
            <Text style={{ fontFamily, fontWeight: '800', color: colors.ink, fontSize: 14 }}>{points}</Text>
            <Text style={{ fontFamily, fontSize: 14, color: colors.ink2 }}>{t('common.points')}</Text>
          </View>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.ruleStrong }} />
          <Text style={{ fontFamily, fontSize: 14, color: colors.ink2 }}>
            {t('feed.remainingPre')} <Text style={{ fontWeight: '700', color: colors.ink }}>{remaining}</Text> {t('feed.remainingPost')}
          </Text>
        </View>
      </View>
      <Button variant="primary" icon="sparkles" onPress={onGive} style={isMobile ? { alignSelf: 'stretch' } : null}>
        {t('common.give')}
      </Button>
    </View>
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
    <View style={{ borderBottomWidth: 1, borderColor: colors.rule, paddingVertical: 20 }}>
      <Eyebrow style={{ marginBottom: 14 }}>{t('feed.spotlight')}</Eyebrow>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 22 }}>
        {top.map(([uid, pts], i) => {
          const usr = getUser(uid);
          return (
            <View key={uid} style={{ minWidth: 64, alignItems: 'center', gap: 8 }}>
              <View>
                <Avatar name={usr.name} size={56} tone={AV} ring={i === 0 ? colors.gold : undefined} />
                {i === 0 ? (
                  <View style={{ position: 'absolute', bottom: -2, alignSelf: 'center', borderRadius: radius.pill, borderWidth: 2, borderColor: colors.paper, backgroundColor: colors.gold, paddingHorizontal: 7, paddingVertical: 1 }}>
                    <Text style={{ fontFamily, fontSize: 10, fontWeight: '800', color: colors.ink }}>#1</Text>
                  </View>
                ) : null}
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontFamily, fontSize: 12.5, fontWeight: '600', color: colors.ink }}>{usr.name.split(' ')[0]}</Text>
                <Text style={{ fontFamily, fontSize: 11.5, fontWeight: '700', color: colors.goldDeep }}>★ {pts}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function SchoolSelect({ school, setSchool }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = school === 'all' ? t('feed.schoolAll') : SCHOOLS.find((s) => s.id === school).short;
  const options = [{ id: 'all', label: t('feed.schoolAll') }, ...SCHOOLS.map((s) => ({ id: s.id, label: s.short }))];
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.rule, paddingHorizontal: 12, paddingVertical: 7 }}
      >
        <Icon name="school" size={15} color={colors.ink3} />
        <Text style={{ fontFamily, fontSize: 13.5, fontWeight: '600', color: colors.ink2 }}>{current}</Text>
        <Icon name="chevron-down" size={14} color={colors.ink3} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(31,26,20,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 }} onPress={() => setOpen(false)}>
          <View style={[{ backgroundColor: colors.cardCream, borderRadius: radius.r3, padding: 8, width: 240 }, shadowPop]}>
            {options.map((o) => (
              <Pressable
                key={o.id}
                onPress={() => {
                  setSchool(o.id);
                  setOpen(false);
                }}
                style={{ paddingHorizontal: 14, paddingVertical: 12, borderRadius: radius.r2, backgroundColor: o.id === school ? colors.primary50 : 'transparent' }}
              >
                <Text style={{ fontFamily, fontSize: 14.5, fontWeight: o.id === school ? '700' : '500', color: o.id === school ? colors.primary : colors.ink }}>{o.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function FilterBar({ value, setValue, school, setSchool, isMobile }) {
  const { t } = useTranslation();
  const pills = [{ id: 'all', label: t('feed.filterAll'), emoji: null }, ...VALUES.map((v) => ({ id: v.id, label: t(`values.${v.id}`), emoji: v.emoji }))];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 18, paddingBottom: 6 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 7 }}>
        {pills.map((p) => {
          const on = p.id === value;
          return (
            <Pressable
              key={p.id}
              onPress={() => setValue(p.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: on ? colors.ink : colors.rule,
                backgroundColor: on ? colors.ink : 'transparent',
                paddingHorizontal: 13,
                paddingVertical: 6,
              }}
            >
              {p.emoji ? <Text style={{ fontSize: 14 }}>{p.emoji}</Text> : null}
              <Text style={{ fontFamily, fontSize: 13.5, fontWeight: '600', color: on ? colors.paper : colors.ink2 }}>{p.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {!isMobile ? <SchoolSelect school={school} setSchool={setSchool} /> : null}
    </View>
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
    <View style={{ width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: isMobile ? 16 : 28, paddingTop: isMobile ? 20 : 36, paddingBottom: isMobile ? 28 : 48 }}>
      <GreetingStrip onGive={onGive} isMobile={isMobile} points={points} remaining={allowanceLeft} />
      <Spotlight />
      <FilterBar value={value} setValue={setValue} school={school} setSchool={setSchool} isMobile={isMobile} />
      <View>
        {list.map((r, i) => (
          <RecognitionCard key={r.id} r={r} first={i === 0} />
        ))}
        {list.length === 0 ? (
          <View style={{ paddingHorizontal: 20, paddingVertical: 56, alignItems: 'center' }}>
            <Text style={{ fontFamily, fontSize: 15, fontWeight: '600', color: colors.ink2 }}>{t('feed.emptyTitle')}</Text>
            <Text style={{ fontFamily, marginTop: 6, fontSize: 13.5, color: colors.ink3 }}>{t('feed.emptySub')}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
