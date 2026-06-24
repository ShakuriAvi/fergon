/* Admin panel (#35, #36). Entity tabs are wired to the live admin API via
   EntityPanel; Analytics stays on mock data for now (see issue #35). The
   Organizations tab drills into OrgDetail to manage per-org recognition values
   and role allowances. */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Icon, Eyebrow, SegTabs } from './primitives.jsx';
import { useViewport } from '../hooks/useViewport.js';
import { cx } from '../lib/cx.js';
import { api } from '../lib/api.js';
import { SCHOOLS } from '../data/mock.js';
import EntityPanel from './admin/EntityPanel.jsx';
import OrgDetail from './admin/OrgDetail.jsx';

const A_COLORS = { gold: 'var(--gold-deep)', green: 'var(--primary)', terra: 'var(--accent-700)', info: 'var(--info)' };
const A_BG = { gold: 'var(--gold-50)', green: 'var(--primary-50)', terra: 'var(--accent-50)', info: 'var(--info-50)' };

/* Analytics summary cards — mock data placeholder for now (#35). */
function Analytics() {
  const { t } = useTranslation();
  const cards = [
    { labelKey: 'cardRecognitions', value: '1,284', icon: 'heart-handshake', tone: 'green' },
    { labelKey: 'cardActiveUsers', value: '196', icon: 'users', tone: 'info' },
    { labelKey: 'cardSchools', value: SCHOOLS.length, icon: 'school', tone: 'gold' },
    { labelKey: 'cardPointsCirculating', value: '24.6k', icon: 'star', tone: 'terra' },
  ];
  return (
    <div className="grid gap-[16px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
      {cards.map((c) => (
        <Card key={c.labelKey} className="p-[18px]">
          <span className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-2" style={{ background: A_BG[c.tone], color: A_COLORS[c.tone] }}>
            <Icon name={c.icon} size={19} />
          </span>
          <div className="tnum mt-[12px] font-display text-[36px] font-extrabold leading-none text-ink">{c.value}</div>
          <div className="mt-[6px] text-[13px] text-ink-3">{t(`admin.${c.labelKey}`)}</div>
        </Card>
      ))}
    </div>
  );
}

function useConfigs(setOrg) {
  const { t } = useTranslation();
  return useMemo(() => {
    const roleOptions = () =>
      api.roles.list({ limit: 200 }).then((r) => (r.items || []).map((x) => ({ value: x.id, label: x.name_he })));
    const orgOptions = () =>
      api.organizations.list({ limit: 200 }).then((r) => (r.items || []).map((x) => ({ value: x.id, label: x.name })));
    const accessOptions = ['admin', 'manager', 'member'].map((v) => ({ value: v, label: t(`admin.access.${v}`) }));
    const categoryOptions = ['books', 'food', 'shop', 'fun'].map((v) => ({ value: v, label: t(`rewardCats.${v}`) }));

    return {
      organizations: {
        resource: api.organizations,
        searchKey: 'admin.searchSchools',
        addKey: 'admin.addSchool',
        editTitleKey: 'admin.editSchool',
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
        searchKey: 'admin.searchUsers',
        addKey: 'admin.addUser',
        editTitleKey: 'admin.editUser',
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
        searchKey: 'admin.searchRoles',
        addKey: 'admin.addRole',
        editTitleKey: 'admin.editRole',
        columns: [
          { key: 'name', labelKey: 'admin.colRoleName' },
          { key: 'name_he', labelKey: 'admin.colRoleNameHe' },
          { key: 'access_level', labelKey: 'admin.colAccess', render: (i) => t(`admin.access.${i.access_level}`) },
          { key: '__status', labelKey: 'admin.colStatus' },
        ],
        fields: [
          { name: 'name', labelKey: 'admin.colRoleName', type: 'text', required: true },
          { name: 'name_he', labelKey: 'admin.colRoleNameHe', type: 'text', required: true },
          { name: 'access_level', labelKey: 'admin.colAccess', type: 'select', options: accessOptions, required: true },
          { name: 'is_manager', labelKey: 'admin.colIsManager', type: 'checkbox' },
          { name: 'rolls_up', labelKey: 'admin.colRollsUp', type: 'checkbox' },
        ],
      },
      values: {
        resource: api.recognitionValues,
        searchKey: 'admin.searchValues',
        addKey: 'admin.addValue',
        editTitleKey: 'admin.editValue',
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
        searchKey: 'admin.searchRewards',
        addKey: 'admin.addReward',
        editTitleKey: 'admin.editReward',
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
          { name: 'category', labelKey: 'admin.colCategory', type: 'select', options: categoryOptions, required: true },
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
  const [tab, setTab] = useState('analytics');
  const [org, setOrg] = useState(null);
  const { isMobile } = useViewport();
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
    <div className={cx('mx-auto max-w-[1180px]', isMobile ? 'px-[16px] py-[20px]' : 'px-[28px] py-[32px]')}>
      <Eyebrow>{t('admin.eyebrow')}</Eyebrow>
      <h1 className="mt-[6px] font-display font-extrabold tracking-[-0.02em] text-ink" style={{ fontSize: isMobile ? 28 : 34 }}>
        {t('admin.title')}
      </h1>
      <p className="mt-[4px] text-[15px] text-ink-2">{t('admin.subtitle')}</p>

      {org ? (
        <div className="mt-[22px]">
          <OrgDetail org={org} onBack={() => setOrg(null)} />
        </div>
      ) : (
        <>
          <div className="no-sb mb-[22px] mt-[22px] overflow-x-auto">
            <SegTabs active={tab} onChange={setTab} tabs={tabs} />
          </div>
          {tab === 'analytics' ? <Analytics /> : <EntityPanel config={configs[tab]} />}
        </>
      )}
    </div>
  );
}
