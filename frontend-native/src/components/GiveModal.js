/* Give Recognition modal (#44, RN) — recipient + values from the backend;
   submits a real recognition via POST /posts. */
import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, Icon } from './ui';
import { api, ApiError } from '../lib/api';
import { colors, radius, fontFamily } from '../theme';

const MAX_MSG = 400;

export default function GiveModal({ open, onClose, onSent, allowanceLeft = 40 }) {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [values, setValues] = useState([]);
  const [peer, setPeer] = useState(null);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const [value, setValue] = useState(null);
  const [pts, setPts] = useState(5);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setPeer(null); setQ(''); setMsg(''); setValue(null); setPts(5); setSent(false); setBusy(false); setError(null);
    Promise.all([api.orgMembers(), api.orgValueOptions()])
      .then(([m, v]) => { setMembers(m || []); setValues(v || []); })
      .catch(() => {});
  }, [open]);

  if (!open) return null;
  const valid = peer && msg.trim().length > 0 && value && pts <= allowanceLeft;
  const results = members.filter((m) => q === '' || m.full_name.includes(q)).slice(0, 6);

  const submit = () => {
    setBusy(true);
    setError(null);
    api
      .givePost({ to_user_id: peer.id, points: pts, message: msg, recognition_value_ids: value ? [value.id] : [] })
      .then(() => { setSent(true); setTimeout(() => onSent && onSent(), 1200); })
      .catch((err) => { setError(err instanceof ApiError ? err.detail || err.message : String(err)); setBusy(false); });
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{ maxHeight: '92%', backgroundColor: colors.paper, borderTopLeftRadius: radius.r4, borderTopRightRadius: radius.r4 }}>
          {sent ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 44 }}>{value ? value.emoji : '🎉'}</Text>
              <Text style={{ fontFamily, fontSize: 26, fontWeight: '800', color: colors.ink, marginTop: 14 }}>{t('success.title')}</Text>
              <Text style={{ fontFamily, fontSize: 16, color: colors.ink2, marginTop: 8, textAlign: 'center' }}>{t('success.body', { name: peer?.full_name, points: pts })}</Text>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: colors.rule, paddingHorizontal: 22, paddingVertical: 16 }}>
                <Text style={{ fontFamily, fontSize: 23, fontWeight: '800', color: colors.ink }}>{t('give.title')}</Text>
                <Pressable onPress={onClose} accessibilityLabel={t('give.close')}><Icon name="x" size={18} color={colors.ink2} /></Pressable>
              </View>

              <ScrollView contentContainerStyle={{ padding: 22, gap: 20 }}>
                {error ? <Text style={{ fontFamily, fontSize: 13, color: colors.accent700 }}>{error}</Text> : null}

                <Text style={{ fontFamily, fontSize: 15.5, fontWeight: '700', color: colors.ink }}>{t('give.field1')}</Text>
                {peer ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.r2, borderWidth: 1, borderColor: colors.primary100, backgroundColor: colors.primary50, padding: 12 }}>
                    <Avatar name={peer.full_name} size={40} />
                    <Text style={{ flex: 1, fontFamily, fontSize: 15.5, fontWeight: '700', color: colors.ink }}>{peer.full_name}</Text>
                    <Pressable onPress={() => setPeer(null)} accessibilityLabel={t('give.replace')}><Icon name="x" size={18} color={colors.ink3} /></Pressable>
                  </View>
                ) : (
                  <View>
                    <TextInput value={q} onChangeText={setQ} placeholder={t('give.searchPlaceholder')} placeholderTextColor={colors.ink3}
                      style={{ fontFamily, borderRadius: radius.r2, borderWidth: 1, borderColor: colors.ruleStrong, backgroundColor: colors.cardCream, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.ink, textAlign: 'right' }} />
                    {results.map((m) => (
                      <Pressable key={m.id} onPress={() => setPeer(m)} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10 }}>
                        <Avatar name={m.full_name} size={36} />
                        <Text style={{ fontFamily, fontSize: 14.5, fontWeight: '600', color: colors.ink }}>{m.full_name}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                <Text style={{ fontFamily, fontSize: 15.5, fontWeight: '700', color: colors.ink }}>{t('give.field2')}</Text>
                <TextInput value={msg} onChangeText={(v) => setMsg(v.slice(0, MAX_MSG))} multiline numberOfLines={4} placeholder={t('give.msgPlaceholder')} placeholderTextColor={colors.ink3}
                  style={{ fontFamily, minHeight: 90, borderRadius: radius.r2, borderWidth: 1, borderColor: colors.ruleStrong, backgroundColor: colors.cardCream, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: colors.ink, textAlign: 'right' }} />

                <Text style={{ fontFamily, fontSize: 15.5, fontWeight: '700', color: colors.ink }}>{t('give.field3')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
                  {values.map((v) => {
                    const on = value?.id === v.id;
                    return (
                      <Pressable key={v.id} onPress={() => setValue(v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: radius.pill, borderWidth: 1.5, borderColor: on ? colors.primary : colors.rule, backgroundColor: on ? colors.primary50 : colors.cardCream, paddingHorizontal: 14, paddingVertical: 9 }}>
                        <Text style={{ fontSize: 16 }}>{v.emoji}</Text>
                        <Text style={{ fontFamily, fontSize: 14, fontWeight: '600', color: on ? colors.primary : colors.ink2 }}>{v.key}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={{ fontFamily, fontSize: 15.5, fontWeight: '700', color: colors.ink }}>{t('give.field4')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {[1, 3, 5, 8, 10].map((n) => (
                    <Pressable key={n} onPress={() => setPts(n)} style={{ borderRadius: radius.pill, borderWidth: 1, borderColor: pts === n ? colors.primary : colors.rule, paddingHorizontal: 14, paddingVertical: 8 }}>
                      <Text style={{ fontFamily, fontSize: 15, fontWeight: '700', color: pts === n ? colors.primary : colors.ink2 }}>★ {n}</Text>
                    </Pressable>
                  ))}
                </View>
                {pts > allowanceLeft ? (
                  <Text style={{ fontFamily, fontSize: 13, color: colors.accent700 }}>{t('give.overQuota', { count: allowanceLeft })}</Text>
                ) : null}
              </ScrollView>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderColor: colors.rule, paddingHorizontal: 22, paddingVertical: 14 }}>
                <Button variant="ghost" onPress={onClose}>{t('give.cancel')}</Button>
                <View style={{ flex: 1 }} />
                <Button variant="primary" iconAfter="sparkles" onPress={valid && !busy ? submit : undefined} disabled={!valid || busy}>{t('give.send')}</Button>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
