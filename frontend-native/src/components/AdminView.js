/* Admin panel (#37). Entity tabs are wired to the live admin API via
   EntityPanel; Analytics stays on mock data for now (mirrors web #35). The
   Organizations tab drills into OrgDetail for per-org recognition values and
   role allowances (#36). */
import { useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Icon, Eyebrow, SegTabs } from './ui';
import { useViewport } from '../hooks/useViewport';
import { SCHOOLS } from '../data/mock';
import { colors, radius, fontFamily } from '../theme';
import { api } from '../lib/api';
import EntityPanel from './admin/EntityPanel';
import OrgDetail from './admin/OrgDetail';

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

function useConfigs(setOrg) {
  const { t } = useTranslation();
  return useMemo(() => {
    const roleOptions = () => api.roles.list({ limit: 200 }).then((r) => (r.items || []).map((x) => ({ value: x.id, label: x.name_he })));
    const orgOptions = () => api.organizations.list({ limit: 200 }).then((r) => (r.items || []).map((x) => ({ value: x.id, label: x.name })));
    const accessOptions = ['admin', 'manager', 'member'].map((v) => ({ value: v, label: t(`admin.access.${v}`) }));
    const categoryOptions = ['books', 'food', 'shop', 'fun'].map((v) => ({ value: v, label: t(`rewardCats.${v}`) }));

    return {
      organizations: {
        resource: api.organizations,
        searchKey: 'admin.searchSchools', addKey: 'admin.addSchool', editTitleKey: 'admin.editSchool',
        onManage: (item) => setOrg(item),
        columns: [
          { key: 'name', labelKey: 'admin.colSchool' },
          { key: 'city', labelKey: 'admin.colCity' },
          { key: 'org_type', labelKey: 'admin.colType' },
          { key: '__status', labelKey: 'admin.colStatus' },
        ],
        fields: [
          { name: 'name', labelKey: 'admin.colSchool', type: 'text', required: true },
          { name: 'short_name', labelKey: 'admin.colShortName', type: 'text', optional: true },
          { name: 'city', labelKey: 'admin.colCity', type: 'text', optional: true },
          { name: 'org_type', labelKey: 'admin.colType', type: 'text', optional: true },
        ],
      },
      users: {
        resource: api.users,
        searchKey: 'admin.searchUsers', addKey: 'admin.addUser', editTitleKey: 'admin.editUser',
        columns: [
          { key: 'full_name', labelKey: 'admin.colName' },
          { key: 'role', labelKey: 'admin.colRole' },
          { key: '__status', labelKey: 'admin.colStatus' },
        ],
        fields: [
          { name: 'email', labelKey: 'admin.colEmail', type: 'text', required: true, createOnly: true },
          { name: 'full_name', labelKey: 'admin.colName', type: 'text', required: true },
          { name: 'role_id', labelKey: 'admin.colRole', type: 'select', loadOptions: roleOptions },
          { name: 'organization_id', labelKey: 'admin.colSchool', type: 'select', loadOptions: orgOptions },
          { name: 'phone', labelKey: 'admin.colPhone', type: 'text', optional: true },
        ],
      },
      roles: {
        resource: api.roles,
        searchKey: 'admin.searchRoles', addKey: 'admin.addRole', editTitleKey: 'admin.editRole',
        columns: [
          { key: 'name', labelKey: 'admin.colRoleName' },
          { key: 'name_he', labelKey: 'admin.colRoleNameHe' },
          { key: 'access_level', labelKey: 'admin.colAccess', render: (i) => t(`admin.access.${i.access_level}`) },
          { key: '__status', labelKey: 'admin.colStatus' },
        ],
        fields: [
          { name: 'name', labelKey: 'admin.colRoleName', type: 'text', required: true },
          { name: 'name_he', labelKey: 'admin.colRoleNameHe', type: 'text', required: true },
          { name: 'access_level', labelKey: 'admin.colAccess', type: 'select', options: accessOptions },
          { name: 'is_manager', labelKey: 'admin.colIsManager', type: 'checkbox' },
          { name: 'rolls_up', labelKey: 'admin.colRollsUp', type: 'checkbox' },
        ],
      },
      values: {
        resource: api.recognitionValues,
        searchKey: 'admin.searchValues', addKey: 'admin.addValue', editTitleKey: 'admin.editValue',
        columns: [
          { key: 'key', labelKey: 'admin.colValue' },
          { key: 'emoji', labelKey: 'admin.colEmoji' },
          { key: 'tone', labelKey: 'admin.colTone' },
          { key: '__status', labelKey: 'admin.colStatus' },
        ],
        fields: [
          { name: 'key', labelKey: 'admin.colValue', type: 'text', required: true },
          { name: 'emoji', labelKey: 'admin.colEmoji', type: 'text', optional: true },
          { name: 'tone', labelKey: 'admin.colTone', type: 'text', optional: true },
        ],
      },
      rewards: {
        resource: api.rewards,
        searchKey: 'admin.searchRewards', addKey: 'admin.addReward', editTitleKey: 'admin.editReward',
        columns: [
          { key: 'title', labelKey: 'admin.colReward' },
          { key: 'provider', labelKey: 'admin.colProvider' },
          { key: 'category', labelKey: 'admin.colCategory', render: (i) => t(`rewardCats.${i.category}`) },
          { key: 'cost', labelKey: 'admin.colCost' },
          { key: '__status', labelKey: 'admin.colStatus' },
        ],
        fields: [
          { name: 'provider', labelKey: 'admin.colProvider', type: 'text', required: true },
          { name: 'title', labelKey: 'admin.colReward', type: 'text', required: true },
          { name: 'category', labelKey: 'admin.colCategory', type: 'select', options: categoryOptions },
          { name: 'cost', labelKey: 'admin.colCost', type: 'number', required: true },
          { name: 'emoji', labelKey: 'admin.colEmoji', type: 'text', optional: true },
          { name: 'color', labelKey: 'admin.colColor', type: 'text', optional: true },
          { name: 'blurb', labelKey: 'admin.colBlurb', type: 'text', optional: true },
          { name: 'in_stock', labelKey: 'admin.colInStock', type: 'checkbox' },
        ],
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);
}

export default function AdminView() {
  const { t } = useTranslation();
  const { isMobile } = useViewport();
  const [tab, setTab] = useState('analytics');
  const [org, setOrg] = useState(null);
  const configs = useConfigs(setOrg);

  const tabs = [
    { id: 'analytics', label: t('admin.tabAnalytics') },
    { id: 'organizations', label: t('admin.tabSchools') },
    { id: 'users', label: t('admin.tabUsers') },
    { id: 'roles', label: t('admin.tabRoles') },
    { id: 'values', label: t('admin.tabValues') },
    { id: 'rewards', label: t('admin.tabRewards') },
  ];

  return (
    <View style={{ maxWidth: 1180, width: '100%', alignSelf: 'center', paddingHorizontal: isMobile ? 16 : 28, paddingVertical: isMobile ? 20 : 32 }}>
      <Eyebrow>{t('admin.eyebrow')}</Eyebrow>
      <Text style={{ fontFamily, marginTop: 6, fontSize: isMobile ? 28 : 34, fontWeight: '800', color: colors.ink }}>{t('admin.title')}</Text>
      <Text style={{ fontFamily, marginTop: 4, fontSize: 15, color: colors.ink2 }}>{t('admin.subtitle')}</Text>

      {org ? (
        <View style={{ marginTop: 22 }}>
          <OrgDetail org={org} onBack={() => setOrg(null)} />
        </View>
      ) : (
        <>
          <View style={{ marginTop: 22, marginBottom: 22 }}>
            <SegTabs active={tab} onChange={setTab} tabs={tabs} />
          </View>
          {tab === 'analytics' ? <Analytics isMobile={isMobile} /> : <EntityPanel config={configs[tab]} />}
        </>
      )}
    </View>
  );
}
