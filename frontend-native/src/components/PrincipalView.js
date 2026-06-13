/* Principal dashboard — RN port of frontend/src/components/PrincipalView.jsx. */
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Avatar, Icon, Eyebrow } from './ui';
import { useViewport } from '../hooks/useViewport';
import { getUser, schoolById, recognitions, USERS, VALUES, WEEKLY, valueById } from '../data/mock';
import { colors, radius, fontFamily } from '../theme';

function BarChart({ data, isMobile }) {
  const { t } = useTranslation();
  const max = Math.max(...data);
  const labels = ['8', '7', '6', '5', '4', '3', '2', t('principal.weekLabel')];
  return (
    <View style={{ height: 200, flexDirection: 'row', alignItems: 'flex-end', paddingTop: 12, gap: isMobile ? 8 : 16 }}>
      {data.map((v, i) => {
        const last = i === data.length - 1;
        return (
          <View key={i} style={{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <Text style={{ fontFamily, fontSize: 12.5, fontWeight: '700', color: last ? colors.primary : colors.ink3 }}>{v}</Text>
            <View style={{ width: '100%', maxWidth: 46, height: `${(v / max) * 100}%`, borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: last ? colors.primary : colors.primary200 }} />
            <Text style={{ fontFamily, fontSize: 11, color: colors.ink3 }}>{labels[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}

const STAT_COLORS = { gold: colors.goldDeep, green: colors.primary, terra: colors.accent700, info: colors.info };
const STAT_BG = { gold: colors.gold50, green: colors.primary50, terra: colors.accent50, info: colors.info50 };

function StatCard({ label, value, suffix, sub, icon, tone = 'green' }) {
  return (
    <Card style={{ padding: 18, flex: 1, minWidth: 150 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <View style={{ width: 32, height: 32, borderRadius: radius.r2, alignItems: 'center', justifyContent: 'center', backgroundColor: STAT_BG[tone] }}>
          <Icon name={icon} size={18} color={STAT_COLORS[tone]} />
        </View>
        <Text style={{ fontFamily, fontSize: 13, fontWeight: '600', color: colors.ink2 }}>{label}</Text>
      </View>
      <Text style={{ fontFamily, marginTop: 14, fontSize: 38, fontWeight: '800', color: colors.ink }}>
        {value}
        {suffix ? <Text style={{ fontSize: 19, color: colors.ink3 }}>{suffix}</Text> : null}
      </Text>
      {sub ? <Text style={{ fontFamily, marginTop: 6, fontSize: 12.5, color: colors.ink3 }}>{sub}</Text> : null}
    </Card>
  );
}

export default function PrincipalView() {
  const { t } = useTranslation();
  const { isMobile } = useViewport();
  const school = 'herzl';
  const sObj = schoolById(school);
  const inSchool = recognitions.filter((r) => getUser(r.to).school === school);
  const totalThisMonth = inSchool.length;
  const pointsDistributed = inSchool.reduce((a, r) => a + r.points, 0);

  const valCount = {};
  inSchool.forEach((r) => {
    valCount[r.value] = (valCount[r.value] || 0) + 1;
  });
  const topVal = Object.entries(valCount).sort((a, b) => b[1] - a[1])[0];
  const topValObj = topVal ? valueById(topVal[0]) : VALUES[1];

  const schoolTeachers = USERS.filter((u) => u.school === school);
  const recognizedIds = new Set(inSchool.map((r) => r.to));
  const notRecognized = schoolTeachers.filter((u) => !recognizedIds.has(u.id));

  const totals = {};
  inSchool.forEach((r) => {
    totals[r.to] = (totals[r.to] || 0) + r.points;
  });
  const topRecognized = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const medal = [colors.gold, '#B7BCC4', '#CD8C5A'];

  return (
    <View style={{ width: '100%', maxWidth: 1180, alignSelf: 'center', paddingHorizontal: isMobile ? 16 : 28, paddingVertical: isMobile ? 20 : 32 }}>
      <Eyebrow>{t('principal.eyebrow')}</Eyebrow>
      <Text style={{ fontFamily, marginTop: 6, fontWeight: '800', fontSize: isMobile ? 28 : 34, color: colors.ink }}>{sObj.name}</Text>
      <Text style={{ fontFamily, marginTop: 4, fontSize: 15, color: colors.ink2 }}>{t('principal.subtitle')}</Text>

      {/* stats */}
      <View style={{ marginTop: 22, flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        <StatCard label={t('principal.statRecognitions')} value={totalThisMonth} sub={t('principal.statRecognitionsSub')} icon="heart-handshake" tone="green" />
        <StatCard
          label={t('principal.statActive')}
          value={Math.round(sObj.active * 100)}
          suffix="%"
          sub={t('principal.statActiveSub', { n: Math.round(sObj.teachers * sObj.active), total: sObj.teachers })}
          icon="users"
          tone="info"
        />
        <StatCard label={t('principal.statTopValue')} value={topValObj.emoji} sub={t(`values.${topValObj.id}`)} icon="sparkles" tone="gold" />
        <StatCard label={t('principal.statPoints')} value={pointsDistributed} sub={t('principal.statPointsSub')} icon="star" tone="terra" />
      </View>

      {/* chart */}
      <Card style={{ marginTop: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily, fontSize: 17, fontWeight: '700', color: colors.ink }}>{t('principal.chartTitle')}</Text>
          <Text style={{ fontFamily, fontSize: 12.5, color: colors.ink3 }}>{t('principal.chartSub')}</Text>
        </View>
        <BarChart data={WEEKLY} isMobile={isMobile} />
      </Card>

      {/* two lists */}
      <View style={{ marginTop: 16, flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
        {/* not recognized */}
        <Card style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Icon name="alert-circle" size={18} color={colors.accent} />
            <Text style={{ fontFamily, fontSize: 16, fontWeight: '700', color: colors.ink }}>{t('principal.notRecognizedTitle')}</Text>
          </View>
          <Text style={{ fontFamily, marginBottom: 12, fontSize: 13, color: colors.ink3 }}>{t('principal.notRecognizedSub')}</Text>
          {notRecognized.length === 0 ? (
            <Text style={{ fontFamily, paddingVertical: 20, textAlign: 'center', fontSize: 14, color: colors.ink3 }}>{t('principal.allRecognized')}</Text>
          ) : (
            notRecognized.map((u) => (
              <View key={u.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, borderTopWidth: 1, borderColor: colors.rule, paddingVertical: 9 }}>
                <Avatar name={u.name} size={36} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily, fontSize: 14, fontWeight: '600', color: colors.ink }}>{u.name}</Text>
                  <Text style={{ fontFamily, fontSize: 12, color: colors.ink3 }}>{u.role}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent }} />
                  <Text style={{ fontFamily, fontSize: 12.5, fontWeight: '600', color: colors.accent700 }}>0</Text>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* top recognized */}
        <Card style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Icon name="trophy" size={18} color={colors.goldDeep} />
            <Text style={{ fontFamily, fontSize: 16, fontWeight: '700', color: colors.ink }}>{t('principal.topTitle')}</Text>
          </View>
          <Text style={{ fontFamily, marginBottom: 12, fontSize: 13, color: colors.ink3 }}>{t('principal.topSub')}</Text>
          {topRecognized.map(([uid, pts], i) => {
            const usr = getUser(uid);
            return (
              <View key={uid} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, borderTopWidth: 1, borderColor: colors.rule, paddingVertical: 9 }}>
                <Text style={{ fontFamily, width: 20, textAlign: 'center', fontSize: 14, fontWeight: '800', color: i < 3 ? medal[i] : colors.ink4 }}>{i + 1}</Text>
                <Avatar name={usr.name} size={36} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily, fontSize: 14, fontWeight: '600', color: colors.ink }}>{usr.name}</Text>
                  <Text style={{ fontFamily, fontSize: 12, color: colors.ink3 }}>{usr.role}</Text>
                </View>
                <Text style={{ fontFamily, fontSize: 14, fontWeight: '800', color: colors.goldDeep }}>★ {pts}</Text>
              </View>
            );
          })}
        </Card>
      </View>
    </View>
  );
}
