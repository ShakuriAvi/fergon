/* Rewards store (#44, RN) — backend rewards catalog + real redemption. */
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { I18N } from './constants';
import { Card, Button, Icon } from './ui';
import { useViewport } from '../hooks/useViewport';
import { api, ApiError } from '../lib/api';
import { colors, radius, fontFamily } from '../theme';

const CATS = ['all', 'books', 'food', 'shop', 'fun'];

function RewardCard({ r, balance, onRedeem }) {
  const { t } = useTranslation();
  const afford = balance >= r.cost;
  return (
    <Card padded={false} style={{ flex: 1, minWidth: 220, overflow: 'hidden' }}>
      <View style={{ height: 92, alignItems: 'center', justifyContent: 'center', backgroundColor: r.color || colors.primary }}>
        <Text style={{ fontSize: 40 }}>{r.emoji}</Text>
      </View>
      <View style={{ padding: 16, gap: 8 }}>
        <Text style={{ fontFamily, fontSize: 16, fontWeight: '700', color: colors.ink }}>{r.title}</Text>
        <Text style={{ fontFamily, fontSize: 13, color: colors.ink3 }}>{r.provider} · {r.blurb}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={{ fontFamily, fontSize: 17, fontWeight: '800', color: colors.goldDeep }}>★ {r.cost}</Text>
          <Button variant={afford ? 'primary' : 'secondary'} size="sm" disabled={!afford} onPress={() => onRedeem(r)}>
            {afford ? t('rewards.redeemNow') : t('rewards.insufficient')}
          </Button>
        </View>
      </View>
    </Card>
  );
}

function RedeemModal({ reward, balance, onClose, onConfirm }) {
  const { t } = useTranslation();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  if (!reward) return null;

  const confirm = () => {
    setBusy(true);
    setError(null);
    Promise.resolve(onConfirm(reward))
      .then(() => setDone(true))
      .catch((err) => setError(err instanceof ApiError ? err.detail || err.message : String(err)))
      .finally(() => setBusy(false));
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <View style={{ width: '100%', maxWidth: 420, borderRadius: radius.r4, backgroundColor: colors.paper, overflow: 'hidden' }}>
          {done ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Icon name="check" size={38} color={colors.primary} />
              <Text style={{ fontFamily, fontSize: 25, fontWeight: '800', color: colors.ink, marginTop: 16 }}>{t('rewards.doneTitle')}</Text>
              <Text style={{ fontFamily, fontSize: 15, color: colors.ink2, marginTop: 8, textAlign: 'center' }}>{t('rewards.doneBody', { provider: reward.provider })}</Text>
              <Button variant="primary" onPress={onClose} style={{ marginTop: 22, alignSelf: 'stretch' }}>{t('rewards.backToStore')}</Button>
            </View>
          ) : (
            <View style={{ padding: 24 }}>
              <Text style={{ fontFamily, fontSize: 23, fontWeight: '800', color: colors.ink }}>{t('rewards.confirmTitle')}</Text>
              <Text style={{ fontFamily, fontSize: 14.5, color: colors.ink2, marginTop: 6 }}>{reward.provider} · {reward.title}</Text>
              {error ? <Text style={{ fontFamily, fontSize: 13, color: colors.accent700, marginTop: 12 }}>{error}</Text> : null}
              <Text style={{ fontFamily, fontSize: 14, color: colors.ink2, marginTop: 16 }}>{t('rewards.costLabel')}: ★ {reward.cost}</Text>
              <Text style={{ fontFamily, fontSize: 14, color: colors.ink2 }}>{t('rewards.balanceAfter')}: ★ {balance - reward.cost}</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 22 }}>
                <Button variant="ghost" onPress={onClose} style={{ flex: 1 }}>{t('rewards.cancel')}</Button>
                <Button variant="primary" onPress={busy ? undefined : confirm} disabled={busy} style={{ flex: 1 }}>{t('rewards.confirm')}</Button>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function RewardsView({ points, onRedeemed, refreshKey }) {
  const { t } = useTranslation();
  const { isMobile } = useViewport();
  const [cat, setCat] = useState('all');
  const [redeeming, setRedeeming] = useState(null);
  const [state, setState] = useState({ rewards: [], loading: true, error: null });
  const balance = points;

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .consumerRewards()
      .then((rewards) => { if (!cancelled) setState({ rewards: rewards || [], loading: false, error: null }); })
      .catch((error) => { if (!cancelled) setState((s) => ({ ...s, loading: false, error })); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const list = state.rewards.filter((r) => cat === 'all' || r.category === cat);
  const confirmRedeem = (reward) => api.redeem(reward.id).then((res) => { if (onRedeemed) onRedeemed(); return res; });

  return (
    <ScrollView contentContainerStyle={{ maxWidth: 1180, width: '100%', alignSelf: 'center', paddingHorizontal: isMobile ? 16 : 28, paddingVertical: isMobile ? 20 : 32 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <View>
          <Text style={{ fontFamily, fontSize: isMobile ? 28 : 34, fontWeight: '800', color: colors.ink }}>{t('rewards.title')}</Text>
          <Text style={{ fontFamily, fontSize: 15, color: colors.ink2, marginTop: 4 }}>{t('rewards.subtitle')}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.gold100, backgroundColor: colors.gold50, paddingHorizontal: 16, paddingVertical: 9 }}>
          <Text style={{ fontFamily, fontSize: 18, fontWeight: '800', color: colors.goldDeep }}>★ {balance}</Text>
          <Text style={{ fontFamily, fontSize: 13.5, fontWeight: '600', color: colors.goldDeep }}>{t('rewards.available')}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 18 }}>
        {CATS.map((c) => (
          <Pressable key={c} onPress={() => setCat(c)} style={{ borderRadius: radius.pill, borderWidth: 1, borderColor: c === cat ? colors.ink : colors.rule, backgroundColor: c === cat ? colors.ink : 'transparent', paddingHorizontal: 14, paddingVertical: 7 }}>
            <Text style={{ fontFamily, fontSize: 13.5, fontWeight: '600', color: c === cat ? colors.paper : colors.ink2 }}>{c === 'all' ? t('feed.filterAll') : t(`rewardCats.${c}`)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {state.loading ? (
        <Text style={{ fontFamily, textAlign: 'center', color: colors.ink3, paddingVertical: 56 }}>{t(I18N.COMMON_LOADING)}</Text>
      ) : state.error ? (
        <Text style={{ fontFamily, textAlign: 'center', color: colors.accent700, paddingVertical: 56 }}>{t(I18N.COMMON_ERROR)}</Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 22 }}>
          {list.map((r) => <RewardCard key={r.id} r={r} balance={balance} onRedeem={setRedeeming} />)}
        </View>
      )}

      <RedeemModal reward={redeeming} balance={balance} onClose={() => setRedeeming(null)} onConfirm={confirmRedeem} />
    </ScrollView>
  );
}
