/* Profile / wallet view — RN port of frontend/src/components/ProfileView.jsx. */
import { useState } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Avatar, Icon, Button, Progress, SegTabs, AnimatedNumber } from './ui';
import RecognitionCard from './RecognitionCard';
import { useViewport } from '../hooks/useViewport';
import { getUser, ME, recognitions, schoolById } from '../data/mock';
import { colors, radius, fontFamily } from '../theme';

export default function ProfileView({ onGive, points, allowanceLeft }) {
  const { t } = useTranslation();
  const { isMobile } = useViewport();
  const me = getUser(ME);
  const [tab, setTab] = useState('received');
  const received = recognitions.filter((r) => r.to === ME).sort((a, b) => a.mins - b.mins);
  const given = recognitions.filter((r) => r.from === ME).sort((a, b) => a.mins - b.mins);
  const list = tab === 'received' ? received : given;
  const remaining = allowanceLeft;

  return (
    <View style={{ width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: isMobile ? 16 : 28, paddingVertical: isMobile ? 20 : 32 }}>
      {/* identity */}
      <Card style={{ padding: isMobile ? 20 : 26 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 18 }}>
          <Avatar name={me.name} size={isMobile ? 64 : 76} ring={colors.gold} />
          <View style={{ flex: 1, minWidth: 180 }}>
            <Text style={{ fontFamily, fontWeight: '800', fontSize: isMobile ? 26 : 32, color: colors.ink }}>{me.name}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Text style={{ fontFamily, fontSize: 14.5, color: colors.ink2 }}>{me.role}</Text>
              <Text style={{ color: colors.ink4 }}>·</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Icon name="map-pin" size={14} color={colors.ink3} />
                <Text style={{ fontFamily, fontSize: 14.5, color: colors.ink2 }}>{schoolById(me.school).name}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* balance + allowance */}
        <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 16, marginTop: 22 }}>
          <View style={{ flex: 1, borderRadius: radius.r3, borderWidth: 1, borderColor: colors.gold100, backgroundColor: colors.gold50, padding: 18 }}>
            <Text style={{ fontFamily, fontSize: 13, fontWeight: '700', color: colors.goldDeep }}>{t('profile.pointsEarned')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 6 }}>
              <Text style={{ fontSize: 28, color: colors.gold }}>★</Text>
              <AnimatedNumber value={points} style={{ fontFamily, fontWeight: '800', fontSize: 48, color: colors.ink }} />
            </View>
            <Text style={{ fontFamily, marginTop: 6, fontSize: 12.5, color: colors.goldDeep }}>{t('profile.redeemable')}</Text>
          </View>
          <View style={{ flex: 1, borderRadius: radius.r3, borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.cardCream, padding: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily, fontSize: 13, fontWeight: '700', color: colors.ink2 }}>{t('profile.quotaTitle')}</Text>
              <Text style={{ fontFamily, fontSize: 13, color: colors.ink3 }}>{remaining}/{me.allowance}</Text>
            </View>
            <Text style={{ fontFamily, marginVertical: 8, marginBottom: 12, fontSize: 36, fontWeight: '800', color: colors.ink }}>
              {remaining}
              <Text style={{ fontSize: 16, color: colors.ink3 }}> {t('profile.remainingSuffix')}</Text>
            </Text>
            <Progress value={remaining} max={me.allowance} tone="green" />
          </View>
        </View>

        <View style={{ marginTop: 16, flexDirection: 'row' }}>
          <Button variant="primary" icon="sparkles" onPress={onGive} style={isMobile ? { flex: 1 } : null}>
            {t('common.give')}
          </Button>
        </View>
      </Card>

      {/* tabs */}
      <View style={{ marginTop: 28, alignItems: 'center' }}>
        <SegTabs
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'received', label: t('profile.tabReceived'), count: received.length },
            { id: 'given', label: t('profile.tabGiven'), count: given.length },
          ]}
        />
      </View>

      <View style={{ marginTop: 20, gap: 16 }}>
        {list.map((r) => (
          <Card key={r.id} padded={false} style={{ paddingHorizontal: 16 }}>
            <RecognitionCard r={r} first />
          </Card>
        ))}
        {list.length === 0 ? (
          <Card style={{ padding: 48, alignItems: 'center' }}>
            <Text style={{ fontSize: 40 }}>{tab === 'received' ? '🌱' : '💌'}</Text>
            <Text style={{ fontFamily, marginTop: 12, fontSize: 18, fontWeight: '700', color: colors.ink }}>
              {tab === 'received' ? t('profile.emptyReceivedTitle') : t('profile.emptyGivenTitle')}
            </Text>
            <Text style={{ fontFamily, marginTop: 6, fontSize: 14, color: colors.ink3, textAlign: 'center' }}>
              {tab === 'received' ? t('profile.emptyReceivedSub') : t('profile.emptyGivenSub')}
            </Text>
            {tab === 'given' ? (
              <View style={{ marginTop: 16 }}>
                <Button variant="primary" icon="sparkles" onPress={onGive}>
                  {t('profile.giveFirst')}
                </Button>
              </View>
            ) : null}
          </Card>
        ) : null}
      </View>
    </View>
  );
}
