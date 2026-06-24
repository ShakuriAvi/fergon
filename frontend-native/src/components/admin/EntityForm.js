/* Generic create/edit modal form for an admin entity (#37, RN port). */
import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, Switch, Text, TextInput, View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { I18N } from '../constants';
import { Button, Icon } from '../ui';
import { colors, radius, fontFamily } from '../../theme';
import { ApiError } from '../../lib/api';

function initialValues(fields, item) {
  const v = {};
  for (const f of fields) {
    const cur = item?.[f.name];
    v[f.name] = cur ?? (f.type === 'checkbox' ? false : '');
  }
  return v;
}

function Chip({ label, on, onPress }) {
  return (
    <Pressable onPress={onPress} style={{ borderRadius: radius.pill, borderWidth: 1, borderColor: on ? colors.primary : colors.rule, backgroundColor: on ? colors.primary50 : colors.cardCream, paddingHorizontal: 12, paddingVertical: 6 }}>
      <Text style={{ fontFamily, fontSize: 13, color: on ? colors.primary : colors.ink2 }}>{label}</Text>
    </Pressable>
  );
}

export default function EntityForm({ title, fields, item, onSubmit, onClose }) {
  const { t } = useTranslation();
  const [values, setValues] = useState(() => initialValues(fields, item));
  const [options, setOptions] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const editing = Boolean(item);
  const activeFields = useMemo(() => fields.filter((f) => !(editing && f.createOnly)), [fields, editing]);

  useEffect(() => {
    let cancelled = false;
    for (const f of activeFields) {
      if (typeof f.loadOptions === 'function') {
        f.loadOptions().then((opts) => { if (!cancelled) setOptions((o) => ({ ...o, [f.name]: opts })); });
      }
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (name, value) => setValues((v) => ({ ...v, [name]: value }));

  const submit = () => {
    setSubmitting(true);
    setError(null);
    const payload = {};
    for (const f of activeFields) {
      let val = values[f.name];
      if (f.type === 'number') val = val === '' ? null : Number(val);
      if ((f.type === 'select' || f.optional) && val === '') val = null;
      payload[f.name] = val;
    }
    Promise.resolve(onSubmit(payload))
      .then(() => onClose())
      .catch((err) => {
        setError(err instanceof ApiError ? err.detail || err.message : String(err));
        setSubmitting(false);
      });
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <View style={{ width: '100%', maxWidth: 440, maxHeight: '90%', backgroundColor: colors.paper, borderRadius: radius.r3, padding: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontFamily, fontSize: 20, fontWeight: '800', color: colors.ink }}>{title}</Text>
            <Pressable onPress={onClose} accessibilityLabel={t('common.close')}><Icon name="x" size={18} color={colors.ink3} /></Pressable>
          </View>

          {error ? (
            <View style={{ marginBottom: 12, borderRadius: radius.r2, backgroundColor: colors.accent50, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ fontFamily, fontSize: 13, color: colors.accent700 }}>{error}</Text>
            </View>
          ) : null}

          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 12 }}>
            {activeFields.map((f) => {
              const label = t(f.labelKey);
              if (f.type === 'checkbox') {
                return (
                  <View key={f.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Switch value={Boolean(values[f.name])} onValueChange={(v) => setField(f.name, v)} accessibilityLabel={label} />
                    <Text style={{ fontFamily, fontSize: 14, color: colors.ink }}>{label}</Text>
                  </View>
                );
              }
              if (f.type === 'select') {
                const opts = f.options || options[f.name] || [];
                return (
                  <View key={f.name} style={{ gap: 4 }}>
                    <Text style={{ fontFamily, fontSize: 12.5, fontWeight: '600', color: colors.ink3 }}>{label}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {opts.map((o) => (
                        <Chip key={String(o.value)} label={o.label} on={String(values[f.name]) === String(o.value)} onPress={() => setField(f.name, o.value)} />
                      ))}
                    </View>
                  </View>
                );
              }
              return (
                <View key={f.name} style={{ gap: 4 }}>
                  <Text style={{ fontFamily, fontSize: 12.5, fontWeight: '600', color: colors.ink3 }}>{label}</Text>
                  <TextInput
                    value={values[f.name] === null || values[f.name] === undefined ? '' : String(values[f.name])}
                    onChangeText={(v) => setField(f.name, v)}
                    keyboardType={f.type === 'number' ? 'numeric' : 'default'}
                    accessibilityLabel={label}
                    style={{ fontFamily, borderRadius: radius.r2, borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.cardCream, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: colors.ink, textAlign: 'right' }}
                  />
                </View>
              );
            })}
          </ScrollView>

          <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="ghost" onPress={onClose}>{t('common.cancel')}</Button>
            <Button variant="primary" onPress={submitting ? undefined : submit} disabled={submitting}>
              {submitting ? t('common.saving') : t(I18N.COMMON_SAVE)}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
