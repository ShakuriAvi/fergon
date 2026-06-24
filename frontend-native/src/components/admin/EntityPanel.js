/* Generic admin entity panel (#37, RN port): search + add toolbar, a flex
   "table" with status + edit/delete actions, pagination, and loading / error /
   empty states. */
import { useState } from 'react';
import { View, Text, TextInput, Pressable, Switch, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { I18N } from '../constants';
import { Button, Card, Icon } from '../ui';
import { colors, radius, fontFamily } from '../../theme';
import { useList } from './useList';
import EntityForm from './EntityForm';

function StatusPill({ on, labels }) {
  return (
    <View style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 6, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: on ? colors.successBg : colors.neutralBg }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: on ? colors.primary : colors.ink4 }} />
      <Text style={{ fontFamily, fontSize: 12, fontWeight: '600', color: on ? colors.success : colors.ink3 }}>{on ? labels[0] : labels[1]}</Text>
    </View>
  );
}

function IconBtn({ name, color, onPress, label, disabled }) {
  return (
    <Pressable onPress={disabled ? undefined : onPress} accessibilityLabel={label} accessibilityRole="button"
      style={{ height: 30, width: 30, alignItems: 'center', justifyContent: 'center', borderRadius: radius.r1, borderWidth: 1, borderColor: colors.rule, opacity: disabled ? 0.5 : 1 }}>
      <Icon name={name} size={15} color={color} />
    </Pressable>
  );
}

export default function EntityPanel({ config }) {
  const { t } = useTranslation();
  const list = useList((params) => config.resource.list(params));
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const statusLabels = [t('admin.statusActive'), t('admin.statusInactive')];

  const onSubmit = (payload) =>
    editing && editing.id
      ? config.resource.update(editing.id, payload).then(list.reload)
      : config.resource.create(payload).then(list.reload);

  const toggleActive = (item) => {
    setBusyId(item.id);
    const op = item.is_active ? config.resource.remove(item.id) : config.resource.reactivate(item.id);
    op.then(list.reload).finally(() => setBusyId(null));
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <View style={{ flexGrow: 1, minWidth: 180, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.r2, borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.cardCream, paddingHorizontal: 12 }}>
          <Icon name="search" size={15} color={colors.ink3} />
          <TextInput value={list.q} onChangeText={list.setQ} placeholder={t(config.searchKey)} placeholderTextColor={colors.ink3}
            style={{ flex: 1, fontFamily, fontSize: 14, color: colors.ink, paddingVertical: 9, textAlign: 'right' }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Switch value={list.includeInactive} onValueChange={list.setIncludeInactive} accessibilityLabel={t(I18N.ADMIN_SHOW_INACTIVE)} />
          <Text style={{ fontFamily, fontSize: 13, color: colors.ink2 }}>{t(I18N.ADMIN_SHOW_INACTIVE)}</Text>
        </View>
        <Button variant="primary" icon="plus" onPress={() => setEditing({})}>{t(config.addKey)}</Button>
      </View>

      <Card padded={false}>
        <ScrollView horizontal>
          <View style={{ minWidth: 560 }}>
            <View style={{ flexDirection: 'row' }}>
              {config.columns.map((c) => (
                <View key={c.key} style={{ flex: 1, borderBottomWidth: 1, borderColor: colors.rule, paddingHorizontal: 14, paddingVertical: 11 }}>
                  <Text style={{ fontFamily, fontSize: 12, fontWeight: '700', color: colors.ink3, textAlign: 'right' }}>{t(c.labelKey)}</Text>
                </View>
              ))}
              <View style={{ width: 140, borderBottomWidth: 1, borderColor: colors.rule }} />
            </View>

            {list.loading ? (
              <Text style={{ fontFamily, fontSize: 14, color: colors.ink3, textAlign: 'center', paddingVertical: 20 }}>{t(I18N.COMMON_LOADING)}</Text>
            ) : list.error ? (
              <Text style={{ fontFamily, fontSize: 14, color: colors.accent700, textAlign: 'center', paddingVertical: 20 }}>{t(I18N.COMMON_ERROR)}</Text>
            ) : list.items.length === 0 ? (
              <Text style={{ fontFamily, fontSize: 14, color: colors.ink3, textAlign: 'center', paddingVertical: 20 }}>{t('admin.empty')}</Text>
            ) : (
              list.items.map((item) => (
                <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {config.columns.map((c) => (
                    <View key={c.key} style={{ flex: 1, borderBottomWidth: 1, borderColor: colors.rule, paddingHorizontal: 14, paddingVertical: 12 }}>
                      {c.key === '__status' ? (
                        <StatusPill on={item.is_active} labels={statusLabels} />
                      ) : (
                        <Text style={{ fontFamily, fontSize: 14, color: colors.ink, textAlign: 'right' }}>
                          {c.render ? c.render(item) : (item[c.key] ?? '—')}
                        </Text>
                      )}
                    </View>
                  ))}
                  <View style={{ width: 140, borderBottomWidth: 1, borderColor: colors.rule, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', gap: 4, justifyContent: 'flex-start' }}>
                    {config.onManage ? (
                      <Pressable onPress={() => config.onManage(item)} accessibilityLabel={t(I18N.ADMIN_MANAGE)}
                        style={{ height: 30, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', borderRadius: radius.r1, borderWidth: 1, borderColor: colors.rule, flexDirection: 'row', gap: 5 }}>
                        <Icon name="settings" size={14} color={colors.ink2} />
                        <Text style={{ fontFamily, fontSize: 12.5, color: colors.ink2 }}>{t(I18N.ADMIN_MANAGE)}</Text>
                      </Pressable>
                    ) : null}
                    <IconBtn name="pencil" color={colors.ink3} onPress={() => setEditing(item)} label={t('admin.editAria')} />
                    <IconBtn name={item.is_active ? 'trash-2' : 'rotate-ccw'} color={item.is_active ? colors.accent700 : colors.primary}
                      disabled={busyId === item.id} onPress={() => toggleActive(item)}
                      label={item.is_active ? t('admin.deleteAria') : t('admin.reactivateAria')} />
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </Card>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <Text style={{ fontFamily, fontSize: 13, color: colors.ink3 }}>{t('admin.totalCount', { n: list.total })}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button variant="ghost" size="sm" disabled={list.offset === 0} onPress={() => list.setOffset(Math.max(0, list.offset - list.pageSize))}>{t('admin.prev')}</Button>
          <Button variant="ghost" size="sm" disabled={list.offset + list.pageSize >= list.total} onPress={() => list.setOffset(list.offset + list.pageSize)}>{t('admin.next')}</Button>
        </View>
      </View>

      {editing ? (
        <EntityForm
          title={editing.id ? t(config.editTitleKey) : t(config.addKey)}
          fields={config.fields}
          item={editing.id ? editing : null}
          onSubmit={onSubmit}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </View>
  );
}
