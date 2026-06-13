/* Rewards store — RN port of frontend/src/components/RewardsView.jsx. */
import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Icon, Button, Sparkles } from './ui';
import { useViewport } from '../hooks/useViewport';
import { REWARDS, REWARD_CATS } from '../data/mock';
import { colors, radius, fontFamily, shadowModal } from '../theme';

function RewardCard({ r, balance, onRedeem }) {
  const { t } = useTranslation();
  const afford = balance >= r.cost;
  return (
    <Card padded={false} style={{ flex: 1, overflow: 'hidden' }}>
      <View style={{ height: 92, alignItems: 'center', justifyContent: 'center', backgroundColor: r.color }}>
        <Text style={{ fontSize: 40 }}>{r.emoji}</Text>
        <Text style={{ position: 'absolute', bottom: 10, insetInlineEnd: 14, fontFamily, fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.95)' }}>{r.provider}</Text>
      </View>
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontFamily, fontSize: 16, fontWeight: '700', color: colors.ink }}>{r.title}</Text>
        <Text style={{ fontFamily, marginTop: 4, flex: 1, fontSize: 13, lineHeight: 19, color: colors.ink3 }}>{r.blurb}</Text>
        <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={{ fontSize: 17, color: colors.gold }}>★</Text>
            <Text style={{ fontFamily, fontSize: 17, fontWeight: '800', color: colors.goldDeep }}>{r.cost}</Text>
          </View>
          <Button variant={afford ? 'primary' : 'secondary'} size="sm" disabled={!afford} onPress={() => onRedeem(r)}>
            {afford ? t('rewards.redeemNow') : t('rewards.insufficient')}
          </Button>
        </View>
      </View>
    </Card>
  );
}

function Row({ label, value, strong }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: colors.rule, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: strong ? colors.gold50 : 'transparent' }}>
      <Text style={{ fontFamily, fontSize: 14, fontWeight: strong ? '700' : '500', color: strong ? colors.goldDeep : colors.ink2 }}>{label}</Text>
      <Text style={{ fontFamily, fontSize: 14.5, fontWeight: '700', color: strong ? colors.goldDeep : colors.ink }}>{value}</Text>
    </View>
  );
}

function RedeemModal({ reward, balance, onClose, onConfirm }) {
  const { t } = useTranslation();
  const [done, setDone] = useState(false);
  if (!reward) return null;
  const after = balance - reward.cost;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles_scrim} onPress={onClose}>
        <Pressable style={[{ width: '100%', maxWidth: 420, borderRadius: radius.r4, backgroundColor: colors.paper, overflow: 'hidden' }, shadowModal]} onPress={() => {}}>
          {done ? (
            <View style={{ paddingHorizontal: 32, paddingVertical: 48, alignItems: 'center' }}>
              <View style={{ position: 'relative' }}>
                <Sparkles run count={20} />
                <View style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: colors.primary100, backgroundColor: colors.primary50, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={38} stroke={2.5} color={colors.primary} />
                </View>
              </View>
              <Text style={{ fontFamily, marginTop: 16, fontSize: 25, fontWeight: '800', color: colors.ink }}>{t('rewards.doneTitle')}</Text>
              <Text style={{ fontFamily, marginTop: 8, fontSize: 15, lineHeight: 24, color: colors.ink2, textAlign: 'center' }}>{t('rewards.doneBody', { provider: reward.provider })}</Text>
              <View style={{ marginTop: 22, alignSelf: 'stretch' }}>
                <Button variant="primary" onPress={onClose}>{t('rewards.backToStore')}</Button>
              </View>
            </View>
          ) : (
            <>
              <View style={{ height: 80, alignItems: 'center', justifyContent: 'center', backgroundColor: reward.color }}>
                <Text style={{ fontSize: 36 }}>{reward.emoji}</Text>
              </View>
              <View style={{ padding: 24 }}>
                <Text style={{ fontFamily, fontSize: 23, fontWeight: '800', color: colors.ink }}>{t('rewards.confirmTitle')}</Text>
                <Text style={{ fontFamily, marginTop: 6, fontSize: 14.5, color: colors.ink2 }}>{reward.provider} · {reward.title}</Text>
                <View style={{ marginTop: 18, borderRadius: radius.r2, borderWidth: 1, borderColor: colors.rule, overflow: 'hidden' }}>
                  <Row label={t('rewards.costLabel')} value={`★ ${reward.cost}`} />
                  <Row label={t('rewards.balanceNow')} value={`★ ${balance}`} />
                  <Row label={t('rewards.balanceAfter')} value={`★ ${after}`} strong />
                </View>
                <View style={{ marginTop: 22, flexDirection: 'row', gap: 12 }}>
                  <Button variant="ghost" onPress={onClose} style={{ flex: 1, borderColor: colors.rule }}>{t('rewards.cancel')}</Button>
                  <Button variant="primary" onPress={() => { setDone(true); onConfirm(reward); }} style={{ flex: 1 }}>{t('rewards.confirm')}</Button>
                </View>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles_scrim = { flex: 1, backgroundColor: 'rgba(31,26,20,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 };

export default function RewardsView({ points, onRedeem }) {
  const { t } = useTranslation();
  const { isMobile } = useViewport();
  const { width } = useWindowDimensions();
  const [cat, setCat] = useState('all');
  const [redeeming, setRedeeming] = useState(null);
  const balance = points;
  const list = REWARDS.filter((r) => cat === 'all' || r.cat === cat);

  /* responsive grid: 2-up on mobile, ~240px cards on desktop */
  const contentW = Math.min(width, 1180) - (isMobile ? 32 : 56);
  const cols = isMobile ? 2 : Math.max(2, Math.floor(contentW / 256));
  const gap = 16;
  const cardW = (contentW - gap * (cols - 1)) / cols;

  return (
    <View style={{ width: '100%', maxWidth: 1180, alignSelf: 'center', paddingHorizontal: isMobile ? 16 : 28, paddingVertical: isMobile ? 20 : 32 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <View>
          <Text style={{ fontFamily, fontWeight: '800', fontSize: isMobile ? 28 : 34, color: colors.ink }}>{t('rewards.title')}</Text>
          <Text style={{ fontFamily, marginTop: 4, fontSize: 15, color: colors.ink2 }}>{t('rewards.subtitle')}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.gold100, backgroundColor: colors.gold50, paddingHorizontal: 16, paddingVertical: 9 }}>
          <Text style={{ fontSize: 18, color: colors.gold }}>★</Text>
          <Text style={{ fontFamily, fontSize: 18, fontWeight: '800', color: colors.goldDeep }}>{balance}</Text>
          <Text style={{ fontFamily, fontSize: 13.5, fontWeight: '600', color: colors.goldDeep }}>{t('rewards.available')}</Text>
        </View>
      </View>

      {/* category filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 22 }} contentContainerStyle={{ gap: 8 }}>
        {REWARD_CATS.map((c) => {
          const on = c === cat;
          return (
            <Pressable
              key={c}
              onPress={() => setCat(c)}
              style={{ borderRadius: radius.pill, borderWidth: 1, borderColor: on ? colors.primary : colors.rule, backgroundColor: on ? colors.primary : colors.cardCream, paddingHorizontal: 16, paddingVertical: 8 }}
            >
              <Text style={{ fontFamily, fontSize: 14, fontWeight: '600', color: on ? colors.white : colors.ink2 }}>{t(`rewardCats.${c}`)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ marginTop: 22, flexDirection: 'row', flexWrap: 'wrap', gap }}>
        {list.map((r) => (
          <View key={r.id} style={{ width: cardW }}>
            <RewardCard r={r} balance={balance} onRedeem={setRedeeming} />
          </View>
        ))}
      </View>

      <RedeemModal reward={redeeming} balance={balance} onClose={() => setRedeeming(null)} onConfirm={onRedeem} />
    </View>
  );
}
