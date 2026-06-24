/* Organization detail (#37, RN port of #36): manage the org's recognition
   values and per-role monthly allowances. */
import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { I18N } from '../constants';
import { Button, Card, Icon } from '../ui';
import { colors, radius, fontFamily } from '../../theme';
import { api } from '../../lib/api';

function Section({ title, children }) {
  return (
    <Card style={{ marginBottom: 18 }}>
      <Text style={{ fontFamily, fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 12 }}>{title}</Text>
      {children}
    </Card>
  );
}

function RecognitionValues({ orgId }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [available, setAvailable] = useState([]);
  const [state, setState] = useState({ loading: true, error: null });

  const reload = useCallback(() => {
    setState({ loading: true, error: null });
    return Promise.all([api.orgValues.list(orgId), api.orgValues.available(orgId)])
      .then(([list, avail]) => { setRows(list || []); setAvailable(avail || []); })
      .catch((e) => setState((s) => ({ ...s, error: e })))
      .finally(() => setState((s) => ({ ...s, loading: false })));
  }, [orgId]);

  useEffect(() => { reload(); }, [reload]);

  const add = (valueId) => api.orgValues.add(orgId, valueId).then(reload);
  const remove = (valueId) => api.orgValues.remove(orgId, valueId).then(reload);

  return (
    <Section title={t('admin.orgValuesTitle')}>
      {state.loading ? (
        <Text style={{ fontFamily, fontSize: 14, color: colors.ink3 }}>{t(I18N.COMMON_LOADING)}</Text>
      ) : state.error ? (
        <Text style={{ fontFamily, fontSize: 14, color: colors.accent700 }}>{t(I18N.COMMON_ERROR)}</Text>
      ) : (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {rows.length === 0 ? (
              <Text style={{ fontFamily, fontSize: 14, color: colors.ink3 }}>{t('admin.orgValuesEmpty')}</Text>
            ) : rows.map((r) => (
              <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.cardCream, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ fontFamily, fontSize: 14, color: colors.ink }}>{(r.emoji || '') + ' ' + r.key}</Text>
                <Pressable onPress={() => remove(r.recognition_value_id)} accessibilityLabel={t('admin.orgValuesRemove')}>
                  <Icon name="x" size={14} color={colors.accent700} />
                </Pressable>
              </View>
            ))}
          </View>
          {available.length ? (
            <>
              <Text style={{ fontFamily, fontSize: 12.5, fontWeight: '600', color: colors.ink3, marginBottom: 6 }}>{t('admin.orgValuesPick')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {available.map((v) => (
                  <Pressable key={v.id} onPress={() => add(v.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6 }}>
                    <Icon name="plus" size={13} color={colors.primary} />
                    <Text style={{ fontFamily, fontSize: 14, color: colors.primary }}>{(v.emoji || '') + ' ' + v.key}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
        </>
      )}
    </Section>
  );
}

function RoleAllowances({ orgId }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [state, setState] = useState({ loading: true, error: null });

  const reload = useCallback(() => {
    setState({ loading: true, error: null });
    return api.orgAllowances.list(orgId)
      .then((list) => {
        setRows(list || []);
        const d = {};
        for (const r of list || []) d[r.role_id] = r.monthly_points == null ? '' : String(r.monthly_points);
        setDrafts(d);
      })
      .catch((e) => setState((s) => ({ ...s, error: e })))
      .finally(() => setState((s) => ({ ...s, loading: false })));
  }, [orgId]);

  useEffect(() => { reload(); }, [reload]);

  const save = (roleId) => {
    const raw = drafts[roleId];
    if (raw === '' || raw == null) return;
    api.orgAllowances.set(orgId, roleId, Number(raw)).then(reload);
  };
  const clear = (roleId) => api.orgAllowances.remove(orgId, roleId).then(reload);

  return (
    <Section title={t('admin.orgAllowancesTitle')}>
      {state.loading ? (
        <Text style={{ fontFamily, fontSize: 14, color: colors.ink3 }}>{t(I18N.COMMON_LOADING)}</Text>
      ) : state.error ? (
        <Text style={{ fontFamily, fontSize: 14, color: colors.accent700 }}>{t(I18N.COMMON_ERROR)}</Text>
      ) : (
        rows.map((r) => (
          <View key={r.role_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderColor: colors.rule, paddingVertical: 10 }}>
            <Text style={{ flex: 1, fontFamily, fontSize: 14, color: colors.ink, textAlign: 'right' }}>{r.name_he}</Text>
            <TextInput value={drafts[r.role_id] ?? ''} onChangeText={(v) => setDrafts((d) => ({ ...d, [r.role_id]: v }))}
              keyboardType="numeric" accessibilityLabel={r.name_he}
              style={{ width: 90, fontFamily, borderRadius: radius.r2, borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.cardCream, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, color: colors.ink, textAlign: 'right' }} />
            <Button variant="primary" size="sm" onPress={() => save(r.role_id)}>{t(I18N.COMMON_SAVE)}</Button>
            {r.monthly_points != null ? (
              <Button variant="ghost" size="sm" onPress={() => clear(r.role_id)}>{t('admin.clear')}</Button>
            ) : null}
          </View>
        ))
      )}
    </Section>
  );
}

export default function OrgDetail({ org, onBack }) {
  const { t } = useTranslation();
  return (
    <View>
      <Pressable onPress={onBack} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <Icon name="chevron-right" size={16} color={colors.ink2} />
        <Text style={{ fontFamily, fontSize: 14, fontWeight: '600', color: colors.ink2 }}>{t('admin.backToList')}</Text>
      </Pressable>
      <Text style={{ fontFamily, fontSize: 26, fontWeight: '800', color: colors.ink, marginBottom: 16 }}>{org.name}</Text>
      <RecognitionValues orgId={org.id} />
      <RoleAllowances orgId={org.id} />
    </View>
  );
}
