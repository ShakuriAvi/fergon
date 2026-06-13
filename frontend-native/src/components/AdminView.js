/* Admin panel — RN port of frontend/src/components/AdminView.jsx.
   HTML tables are rebuilt as flex rows inside a horizontal scroll. */
import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Avatar, Icon, Button, Eyebrow, SegTabs, ValueTag, Progress } from './ui';
import { useViewport } from '../hooks/useViewport';
import { SCHOOLS, USERS, VALUES, REWARDS, VALUE_USAGE, schoolById } from '../data/mock';
import { colors, radius, fontFamily } from '../theme';

function Th({ children, flex = 1, width }) {
  return (
    <View style={{ flex: width ? undefined : flex, width, borderBottomWidth: 1, borderColor: colors.rule, paddingHorizontal: 14, paddingVertical: 11 }}>
      <Text style={{ fontFamily, fontSize: 12, fontWeight: '700', letterSpacing: 0.3, color: colors.ink3, textAlign: 'right' }}>{children}</Text>
    </View>
  );
}

function Td({ children, flex = 1, width, align = 'right' }) {
  return (
    <View style={{ flex: width ? undefined : flex, width, borderBottomWidth: 1, borderColor: colors.rule, paddingHorizontal: 14, paddingVertical: 12, justifyContent: 'center', alignItems: align === 'left' ? 'flex-start' : 'stretch' }}>
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text style={{ fontFamily, fontSize: 14, color: colors.ink, textAlign: 'right' }}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

function StatusPill({ on, labels }) {
  return (
    <View style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 6, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: on ? colors.successBg : colors.neutralBg }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: on ? colors.primary : colors.ink4 }} />
      <Text style={{ fontFamily, fontSize: 12, fontWeight: '600', color: on ? colors.success : colors.ink3 }}>{on ? labels[0] : labels[1]}</Text>
    </View>
  );
}

function RowActions() {
  const { t } = useTranslation();
  const btn = { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: radius.r1, borderWidth: 1, borderColor: colors.rule };
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      <Pressable style={btn} accessibilityLabel={t('admin.editAria')}>
        <Icon name="pencil" size={15} color={colors.ink3} />
      </Pressable>
      <Pressable style={btn} accessibilityLabel={t('admin.moreAria')}>
        <Icon name="more-horizontal" size={15} color={colors.ink3} />
      </Pressable>
    </View>
  );
}

function TableShell({ minWidth = 620, children }) {
  return (
    <Card padded={false} style={{ overflow: 'hidden' }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth }}>{children}</View>
      </ScrollView>
    </Card>
  );
}

function Toolbar({ placeholder, action }) {
  return (
    <View style={{ marginBottom: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      <View style={{ flex: 1, minWidth: 200, justifyContent: 'center' }}>
        <Icon name="search" size={15} color={colors.ink3} style={{ position: 'absolute', insetInlineEnd: 12, zIndex: 1 }} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.ink3}
          style={{ fontFamily, borderRadius: radius.r2, borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.cardCream, paddingVertical: 9, paddingStart: 14, paddingEnd: 36, fontSize: 14, color: colors.ink, textAlign: 'right' }}
        />
      </View>
      <Button variant="primary" icon="plus">{action}</Button>
    </View>
  );
}

const Row = ({ children }) => <View style={{ flexDirection: 'row' }}>{children}</View>;

function SchoolsTable() {
  const { t } = useTranslation();
  const labels = [t('admin.statusActive'), t('admin.statusPaused')];
  return (
    <>
      <Toolbar placeholder={t('admin.searchSchools')} action={t('admin.addSchool')} />
      <TableShell>
        <Row>
          <Th flex={2}>{t('admin.colSchool')}</Th>
          <Th>{t('admin.colCity')}</Th>
          <Th width={80}>{t('admin.colTeachers')}</Th>
          <Th flex={1.4}>{t('admin.colActivity')}</Th>
          <Th>{t('admin.colStatus')}</Th>
          <Th width={80}>{' '}</Th>
        </Row>
        {SCHOOLS.map((s) => (
          <Row key={s.id}>
            <Td flex={2}><Text style={{ fontFamily, fontSize: 14, fontWeight: '600', color: colors.ink, textAlign: 'right' }}>{s.name}</Text></Td>
            <Td><Text style={{ fontFamily, fontSize: 14, color: colors.ink2, textAlign: 'right' }}>{s.city}</Text></Td>
            <Td width={80}>{s.teachers}</Td>
            <Td flex={1.4}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1 }}><Progress value={s.active * 100} max={100} tone="green" height={6} /></View>
                <Text style={{ fontFamily, width: 34, fontSize: 12.5, color: colors.ink3 }}>{Math.round(s.active * 100)}%</Text>
              </View>
            </Td>
            <Td><StatusPill on labels={labels} /></Td>
            <Td width={80}><RowActions /></Td>
          </Row>
        ))}
      </TableShell>
    </>
  );
}

function UsersTable() {
  const { t } = useTranslation();
  const labels = [t('admin.statusActive'), t('admin.statusPaused')];
  return (
    <>
      <Toolbar placeholder={t('admin.searchUsers')} action={t('admin.addUser')} />
      <TableShell minWidth={680}>
        <Row>
          <Th flex={2}>{t('admin.colName')}</Th>
          <Th flex={1.4}>{t('admin.colRole')}</Th>
          <Th>{t('admin.colSchool')}</Th>
          <Th>{t('admin.colQuota')}</Th>
          <Th>{t('admin.colStatus')}</Th>
          <Th width={80}>{' '}</Th>
        </Row>
        {USERS.map((u) => (
          <Row key={u.id}>
            <Td flex={2}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Avatar name={u.name} size={32} />
                <Text style={{ fontFamily, fontSize: 14, fontWeight: '600', color: colors.ink }}>{u.name}</Text>
                {u.principal ? (
                  <View style={{ borderRadius: radius.pill, backgroundColor: colors.info50, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontFamily, fontSize: 11, fontWeight: '700', color: colors.info }}>{t('admin.principalBadge')}</Text>
                  </View>
                ) : null}
              </View>
            </Td>
            <Td flex={1.4}><Text style={{ fontFamily, fontSize: 14, color: colors.ink2, textAlign: 'right' }}>{u.role}</Text></Td>
            <Td><Text style={{ fontFamily, fontSize: 14, color: colors.ink2, textAlign: 'right' }}>{schoolById(u.school).short}</Text></Td>
            <Td>{t('admin.quotaPerMonth', { n: u.allowance })}</Td>
            <Td><StatusPill on labels={labels} /></Td>
            <Td width={80}><RowActions /></Td>
          </Row>
        ))}
      </TableShell>
    </>
  );
}

function ValuesTable() {
  const { t } = useTranslation();
  const labels = [t('admin.statusOn'), t('admin.statusOff')];
  return (
    <>
      <Toolbar placeholder={t('admin.searchValues')} action={t('admin.addValue')} />
      <TableShell minWidth={560}>
        <Row>
          <Th flex={1.6}>{t('admin.colValue')}</Th>
          <Th width={90}>{t('admin.colEmoji')}</Th>
          <Th>{t('admin.colUsage')}</Th>
          <Th>{t('admin.colStatus')}</Th>
          <Th width={80}>{' '}</Th>
        </Row>
        {VALUES.map((v, i) => (
          <Row key={v.id}>
            <Td flex={1.6}><View style={{ alignItems: 'flex-start' }}><ValueTag value={v} label={t(`values.${v.id}`)} /></View></Td>
            <Td width={90}><Text style={{ fontSize: 20, textAlign: 'right' }}>{v.emoji}</Text></Td>
            <Td><Text style={{ fontFamily, fontSize: 14, color: colors.ink2, textAlign: 'right' }}>{t('admin.usageCount', { n: VALUE_USAGE[i] })}</Text></Td>
            <Td><StatusPill on labels={labels} /></Td>
            <Td width={80}><RowActions /></Td>
          </Row>
        ))}
      </TableShell>
    </>
  );
}

function RewardsTable() {
  const { t } = useTranslation();
  const labels = [t('admin.statusInStock'), t('admin.statusOut')];
  return (
    <>
      <Toolbar placeholder={t('admin.searchRewards')} action={t('admin.addReward')} />
      <TableShell minWidth={680}>
        <Row>
          <Th flex={2}>{t('admin.colReward')}</Th>
          <Th>{t('admin.colProvider')}</Th>
          <Th>{t('admin.colCategory')}</Th>
          <Th width={90}>{t('admin.colCost')}</Th>
          <Th>{t('admin.colStatus')}</Th>
          <Th width={80}>{' '}</Th>
        </Row>
        {REWARDS.map((r) => (
          <Row key={r.id}>
            <Td flex={2}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 30, height: 30, borderRadius: radius.r1, alignItems: 'center', justifyContent: 'center', backgroundColor: r.color }}>
                  <Text style={{ fontSize: 16 }}>{r.emoji}</Text>
                </View>
                <Text style={{ fontFamily, fontSize: 14, fontWeight: '600', color: colors.ink }}>{r.title}</Text>
              </View>
            </Td>
            <Td><Text style={{ fontFamily, fontSize: 14, color: colors.ink2, textAlign: 'right' }}>{r.provider}</Text></Td>
            <Td><Text style={{ fontFamily, fontSize: 14, color: colors.ink2, textAlign: 'right' }}>{t(`rewardCats.${r.cat}`)}</Text></Td>
            <Td width={90}><Text style={{ fontFamily, fontSize: 14, fontWeight: '700', color: colors.goldDeep, textAlign: 'right' }}>★ {r.cost}</Text></Td>
            <Td><StatusPill on labels={labels} /></Td>
            <Td width={80}><RowActions /></Td>
          </Row>
        ))}
      </TableShell>
    </>
  );
}

const A_COLORS = { gold: colors.goldDeep, green: colors.primary, terra: colors.accent700, info: colors.info };
const A_BG = { gold: colors.gold50, green: colors.primary50, terra: colors.accent50, info: colors.info50 };

function Analytics({ isMobile }) {
  const { t } = useTranslation();
  const cards = [
    { labelKey: 'cardRecognitions', value: '1,284', icon: 'heart-handshake', tone: 'green' },
    { labelKey: 'cardActiveUsers', value: '196', icon: 'users', tone: 'info' },
    { labelKey: 'cardSchools', value: String(SCHOOLS.length), icon: 'school', tone: 'gold' },
    { labelKey: 'cardPointsCirculating', value: '24.6k', icon: 'star', tone: 'terra' },
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      {cards.map((c) => (
        <Card key={c.labelKey} style={{ padding: 18, flex: 1, minWidth: isMobile ? 150 : 180 }}>
          <View style={{ width: 34, height: 34, borderRadius: radius.r2, alignItems: 'center', justifyContent: 'center', backgroundColor: A_BG[c.tone] }}>
            <Icon name={c.icon} size={19} color={A_COLORS[c.tone]} />
          </View>
          <Text style={{ fontFamily, marginTop: 12, fontSize: 36, fontWeight: '800', color: colors.ink }}>{c.value}</Text>
          <Text style={{ fontFamily, marginTop: 6, fontSize: 13, color: colors.ink3 }}>{t(`admin.${c.labelKey}`)}</Text>
        </Card>
      ))}
    </View>
  );
}

export default function AdminView() {
  const { t } = useTranslation();
  const { isMobile } = useViewport();
  const [tab, setTab] = useState('analytics');
  const tabs = [
    { id: 'analytics', label: t('admin.tabAnalytics') },
    { id: 'schools', label: t('admin.tabSchools') },
    { id: 'users', label: t('admin.tabUsers') },
    { id: 'values', label: t('admin.tabValues') },
    { id: 'rewards', label: t('admin.tabRewards') },
  ];
  return (
    <View style={{ width: '100%', maxWidth: 1180, alignSelf: 'center', paddingHorizontal: isMobile ? 16 : 28, paddingVertical: isMobile ? 20 : 32 }}>
      <Eyebrow>{t('admin.eyebrow')}</Eyebrow>
      <Text style={{ fontFamily, marginTop: 6, fontWeight: '800', fontSize: isMobile ? 28 : 34, color: colors.ink }}>{t('admin.title')}</Text>
      <Text style={{ fontFamily, marginTop: 4, fontSize: 15, color: colors.ink2 }}>{t('admin.subtitle')}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 22 }}>
        <SegTabs active={tab} onChange={setTab} tabs={tabs} />
      </ScrollView>

      {tab === 'analytics' ? <Analytics isMobile={isMobile} /> : null}
      {tab === 'schools' ? <SchoolsTable /> : null}
      {tab === 'users' ? <UsersTable /> : null}
      {tab === 'values' ? <ValuesTable /> : null}
      {tab === 'rewards' ? <RewardsTable /> : null}
    </View>
  );
}
