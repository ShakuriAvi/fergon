/* Principal dashboard (#44, RN) — backend leaderboard + derived stats. */
import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { I18N } from './constants';
import { Card, Avatar, Icon, Eyebrow } from './ui';
import { useViewport } from '../hooks/useViewport';
import { api } from '../lib/api';
import { colors, radius, fontFamily } from '../theme';

const STAT_COLORS = { gold: colors.goldDeep, green: colors.primary, info: colors.info };
const STAT_BG = { gold: colors.gold50, green: colors.primary50, info: colors.info50 };

function StatCard({ label, value, icon, tone = 'green' }) {
  return (
    <Card style={{ flex: 1, minWidth: 160, padding: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: radius.r2, backgroundColor: STAT_BG[tone] }}>
          <Icon name={icon} size={18} color={STAT_COLORS[tone]} />
        </View>
        <Text style={{ fontFamily, fontSize: 13, fontWeight: '600', color: colors.ink2 }}>{label}</Text>
      </View>
      <Text style={{ fontFamily, fontSize: 38, fontWeight: '800', color: colors.ink, marginTop: 14 }}>{value}</Text>
    </Card>
  );
}

export default function PrincipalView({ refreshKey }) {
  const { t } = useTranslation();
  const { isMobile } = useViewport();
  const [state, setState] = useState({ feed: { items: [], total: 0 }, board: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.all([api.feed({ limit: 100 }), api.leaderboard()])
      .then(([feed, board]) => { if (!cancelled) setState({ feed, board: board || [], loading: false, error: null }); })
      .catch((error) => { if (!cancelled) setState((s) => ({ ...s, loading: false, error })); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const pointsDistributed = state.feed.items.reduce((a, r) => a + (r.points || 0), 0);

  return (
    <ScrollView contentContainerStyle={{ maxWidth: 1180, width: '100%', alignSelf: 'center', paddingHorizontal: isMobile ? 16 : 28, paddingVertical: isMobile ? 20 : 32 }}>
      <Eyebrow>{t('principal.eyebrow')}</Eyebrow>
      <Text style={{ fontFamily, fontSize: isMobile ? 28 : 34, fontWeight: '800', color: colors.ink, marginTop: 6 }}>{t('principal.title')}</Text>

      {state.loading ? (
        <Text style={{ fontFamily, textAlign: 'center', color: colors.ink3, paddingVertical: 56 }}>{t(I18N.COMMON_LOADING)}</Text>
      ) : state.error ? (
        <Text style={{ fontFamily, textAlign: 'center', color: colors.accent700, paddingVertical: 56 }}>{t(I18N.COMMON_ERROR)}</Text>
      ) : (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 22 }}>
            <StatCard label={t('principal.cardRecognitions')} value={state.feed.total} icon="heart-handshake" tone="green" />
            <StatCard label={t('principal.cardPoints')} value={pointsDistributed} icon="star" tone="gold" />
            <StatCard label={t('principal.cardPeople')} value={state.board.length} icon="users" tone="info" />
          </View>

          <Card style={{ marginTop: 18, padding: 18 }}>
            <Eyebrow style={{ marginBottom: 14 }}>{t('principal.topRecipients')}</Eyebrow>
            {state.board.map((e, i) => (
              <View key={e.user_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}>
                <Text style={{ fontFamily, width: 20, fontSize: 13, fontWeight: '700', color: colors.ink3 }}>{i + 1}</Text>
                <Avatar name={e.name} size={36} />
                <Text style={{ flex: 1, fontFamily, fontSize: 14.5, fontWeight: '600', color: colors.ink }}>{e.name}</Text>
                <Text style={{ fontFamily, fontSize: 14, fontWeight: '700', color: colors.goldDeep }}>★ {e.points}</Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </ScrollView>
  );
}
