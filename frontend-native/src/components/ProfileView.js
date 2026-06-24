/* Profile / wallet view (#44, RN) — backend wallet + received/given. */
import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { I18N } from './constants';
import { Card, Avatar, Button, Progress, SegTabs } from './ui';
import RecognitionCard from './RecognitionCard';
import { useViewport } from '../hooks/useViewport';
import { useMe } from '../context/CurrentUser';
import { api } from '../lib/api';
import { colors, radius, fontFamily } from '../theme';

export default function ProfileView({ onGive, points, allowanceLeft, refreshKey }) {
  const { t } = useTranslation();
  const { isMobile } = useViewport();
  const { user } = useMe();
  const [tab, setTab] = useState('received');
  const [items, setItems] = useState([]);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.feed({ limit: 100 }), api.wallet()])
      .then(([feed, w]) => { if (!cancelled) { setItems(feed.items || []); setWallet(w); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [refreshKey, user?.id]);

  const received = items.filter((r) => r.to_user_id === user?.id);
  const given = items.filter((r) => r.from_user_id === user?.id);
  const list = tab === 'received' ? received : given;
  const total = wallet?.allowance_total ?? 0;
  const remaining = wallet?.allowance_remaining ?? allowanceLeft;
  const balance = wallet?.points_balance ?? points;

  return (
    <ScrollView contentContainerStyle={{ maxWidth: 760, width: '100%', alignSelf: 'center', paddingHorizontal: isMobile ? 16 : 28, paddingVertical: isMobile ? 20 : 32 }}>
      <Card style={{ padding: isMobile ? 20 : 26 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <Avatar name={user?.full_name || ''} size={isMobile ? 64 : 76} ring={colors.gold} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontFamily, fontSize: isMobile ? 26 : 32, fontWeight: '800', color: colors.ink }}>{user?.full_name}</Text>
            <Text style={{ fontFamily, fontSize: 14.5, color: colors.ink2, marginTop: 4 }}>{user?.role}</Text>
          </View>
        </View>

        <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 16, marginTop: 22 }}>
          <View style={{ flex: 1, borderRadius: radius.r3, borderWidth: 1, borderColor: colors.gold100, backgroundColor: colors.gold50, padding: 18 }}>
            <Text style={{ fontFamily, fontSize: 13, fontWeight: '700', color: colors.goldDeep }}>{t('profile.pointsEarned')}</Text>
            <Text style={{ fontFamily, fontSize: 44, fontWeight: '800', color: colors.ink, marginTop: 6 }}>★ {balance}</Text>
            <Text style={{ fontFamily, fontSize: 12.5, color: colors.goldDeep, marginTop: 6 }}>{t('profile.redeemable')}</Text>
          </View>
          <View style={{ flex: 1, borderRadius: radius.r3, borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.cardCream, padding: 18 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily, fontSize: 13, fontWeight: '700', color: colors.ink2 }}>{t('profile.quotaTitle')}</Text>
              <Text style={{ fontFamily, fontSize: 13, color: colors.ink3 }}>{remaining}/{total}</Text>
            </View>
            <Text style={{ fontFamily, fontSize: 36, fontWeight: '800', color: colors.ink, marginVertical: 8 }}>{remaining}</Text>
            <Progress value={remaining} max={total || 1} tone="green" />
          </View>
        </View>

        <Button variant="primary" icon="sparkles" onPress={onGive} style={{ marginTop: 16 }}>{t(I18N.COMMON_GIVE)}</Button>
      </Card>

      <View style={{ marginTop: 28, alignItems: 'center' }}>
        <SegTabs
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'received', label: t('profile.tabReceived') },
            { id: 'given', label: t('profile.tabGiven') },
          ]}
        />
      </View>

      <View style={{ marginTop: 20, gap: 16 }}>
        {list.length === 0 ? (
          <Card style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 40 }}>{tab === 'received' ? '🌱' : '💌'}</Text>
            <Text style={{ fontFamily, fontSize: 18, fontWeight: '700', color: colors.ink, marginTop: 12 }}>
              {tab === 'received' ? t('profile.emptyReceivedTitle') : t('profile.emptyGivenTitle')}
            </Text>
          </Card>
        ) : (
          list.map((item) => <RecognitionCard key={item.id} item={item} first />)
        )}
      </View>
    </ScrollView>
  );
}
