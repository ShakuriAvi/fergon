/* Feed view (#44, RN) — live recognition feed + spotlight from the backend. */
import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { I18N } from './constants';
import { Eyebrow, Avatar, Button, FEED_AVATAR_TONE as AV } from './ui';
import RecognitionCard from './RecognitionCard';
import { useViewport } from '../hooks/useViewport';
import { useMe } from '../context/CurrentUser';
import { api } from '../lib/api';
import { colors, fontFamily } from '../theme';

function GreetingStrip({ onGive, points, remaining, name }) {
  const { t } = useTranslation();
  const hour = new Date().getHours();
  const greet = hour < 12 ? t('feed.greetMorning') : hour < 18 ? t('feed.greetNoon') : t('feed.greetEvening');
  return (
    <View style={{ borderBottomWidth: 1, borderColor: colors.rule, paddingBottom: 22, gap: 12 }}>
      <Text style={{ fontFamily, fontSize: 28, fontWeight: '800', color: colors.ink }}>
        {t('feed.greeting', { greet, name: (name || '').split(' ')[0] })}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
        <Text style={{ fontFamily, fontSize: 14, color: colors.ink2 }}>★ <Text style={{ fontWeight: '800', color: colors.ink }}>{points}</Text> {t(I18N.COMMON_POINTS)}</Text>
        <Text style={{ fontFamily, fontSize: 14, color: colors.ink2 }}>
          {t('feed.remainingPre')} <Text style={{ fontWeight: '700', color: colors.ink }}>{remaining}</Text> {t('feed.remainingPost')}
        </Text>
      </View>
      <Button variant="primary" icon="sparkles" onPress={onGive}>{t(I18N.COMMON_GIVE)}</Button>
    </View>
  );
}

function Spotlight({ entries }) {
  const { t } = useTranslation();
  if (!entries.length) return null;
  return (
    <View style={{ borderBottomWidth: 1, borderColor: colors.rule, paddingVertical: 20 }}>
      <Eyebrow style={{ marginBottom: 14 }}>{t('feed.spotlight')}</Eyebrow>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 22 }}>
        {entries.map((e, i) => (
          <View key={e.user_id} style={{ alignItems: 'center', gap: 8, minWidth: 64 }}>
            <Avatar name={e.name} size={56} tone={AV} ring={i === 0 ? colors.gold : undefined} />
            <Text style={{ fontFamily, fontSize: 12.5, fontWeight: '600', color: colors.ink }}>{(e.name || '').split(' ')[0]}</Text>
            <Text style={{ fontFamily, fontSize: 11.5, fontWeight: '700', color: colors.goldDeep }}>★ {e.points}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export default function FeedView({ onGive, points, allowanceLeft, refreshKey }) {
  const { t } = useTranslation();
  const { isMobile } = useViewport();
  const { user } = useMe();
  const [state, setState] = useState({ items: [], spotlight: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.all([api.feed({ limit: 50 }), api.leaderboard()])
      .then(([feed, board]) => { if (!cancelled) setState({ items: feed.items || [], spotlight: board || [], loading: false, error: null }); })
      .catch((error) => { if (!cancelled) setState((s) => ({ ...s, loading: false, error })); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  return (
    <ScrollView contentContainerStyle={{ maxWidth: 760, width: '100%', alignSelf: 'center', paddingHorizontal: isMobile ? 16 : 28, paddingVertical: isMobile ? 20 : 36 }}>
      <GreetingStrip onGive={onGive} points={points} remaining={allowanceLeft} name={user?.full_name} />
      <Spotlight entries={state.spotlight} />
      {state.loading ? (
        <Text style={{ fontFamily, textAlign: 'center', color: colors.ink3, paddingVertical: 56 }}>{t(I18N.COMMON_LOADING)}</Text>
      ) : state.error ? (
        <Text style={{ fontFamily, textAlign: 'center', color: colors.accent700, paddingVertical: 56 }}>{t(I18N.COMMON_ERROR)}</Text>
      ) : state.items.length === 0 ? (
        <View style={{ paddingVertical: 56, alignItems: 'center' }}>
          <Text style={{ fontFamily, fontSize: 15, fontWeight: '600', color: colors.ink2 }}>{t('feed.emptyTitle')}</Text>
          <Text style={{ fontFamily, fontSize: 13.5, color: colors.ink3, marginTop: 6 }}>{t('feed.emptySub')}</Text>
        </View>
      ) : (
        state.items.map((item, i) => <RecognitionCard key={item.id} item={item} first={i === 0} />)
      )}
    </ScrollView>
  );
}
