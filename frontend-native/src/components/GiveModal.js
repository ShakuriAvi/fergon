/* Give Recognition modal — RN port of frontend/src/components/GiveModal.jsx.
   The web range slider (1–10) becomes a +/- stepper since RN has no native
   range input; everything else mirrors the original four-step flow. */
import { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon, Avatar, Button, Sparkles } from './ui';
import { USERS, VALUES, STICKERS, ME, getUser, schoolById } from '../data/mock';
import { colors, radius, fontFamily, shadowPop, shadowModal } from '../theme';

const MAX_MSG = 400;

function usePeerMeta() {
  const { t } = useTranslation();
  return (user) => t('give.peerMeta', { role: user.role, school: schoolById(user.school).short });
}

function PeerPicker({ selected, onSelect }) {
  const { t } = useTranslation();
  const peerMeta = usePeerMeta();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo(
    () => USERS.filter((user) => user.id !== ME && (q === '' || user.name.includes(q) || user.role.includes(q))).slice(0, 6),
    [q]
  );

  if (selected) {
    const usr = getUser(selected);
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.r2, borderWidth: 1, borderColor: colors.primary100, backgroundColor: colors.primary50, padding: 12 }}>
        <Avatar name={usr.name} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily, fontSize: 15.5, fontWeight: '700', color: colors.ink }}>{usr.name}</Text>
          <Text style={{ fontFamily, fontSize: 13, color: colors.ink3 }}>{peerMeta(usr)}</Text>
        </View>
        <Pressable onPress={() => { onSelect(null); setQ(''); }} accessibilityLabel={t('give.replace')} style={{ padding: 6 }}>
          <Icon name="x" size={18} color={colors.ink3} />
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <View style={{ justifyContent: 'center' }}>
        <Icon name="search" size={16} color={colors.ink3} style={{ position: 'absolute', insetInlineEnd: 13, zIndex: 1 }} />
        <TextInput
          value={q}
          onChangeText={(v) => { setQ(v); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={t('give.searchPlaceholder')}
          placeholderTextColor={colors.ink3}
          style={{ fontFamily, borderRadius: radius.r2, borderWidth: 1, borderColor: colors.ruleStrong, backgroundColor: colors.cardCream, paddingVertical: 12, paddingStart: 14, paddingEnd: 42, fontSize: 15, color: colors.ink, textAlign: 'right' }}
        />
      </View>
      {open && results.length > 0 ? (
        <View style={[{ marginTop: 8, borderRadius: radius.r2, borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.cardCream, overflow: 'hidden' }, shadowPop]}>
          {results.map((user) => (
            <Pressable
              key={user.id}
              onPress={() => { onSelect(user.id); setOpen(false); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 12, paddingVertical: 10 }}
            >
              <Avatar name={user.name} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily, fontSize: 14.5, fontWeight: '600', color: colors.ink }}>{user.name}</Text>
                <Text style={{ fontFamily, fontSize: 12.5, color: colors.ink3 }}>{peerMeta(user)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Field({ n, label, children }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paperSink }}>
          <Text style={{ fontFamily, fontSize: 12, fontWeight: '700', color: colors.ink3 }}>{n}</Text>
        </View>
        <Text style={{ fontFamily, fontSize: 15.5, fontWeight: '700', color: colors.ink }}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

function Stepper({ value, setValue }) {
  const btn = (label, fn, disabled) => (
    <Pressable
      onPress={disabled ? undefined : fn}
      style={{ width: 38, height: 38, borderRadius: radius.r2, borderWidth: 1, borderColor: colors.ruleStrong, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardCream, opacity: disabled ? 0.4 : 1 }}
    >
      <Text style={{ fontFamily, fontSize: 22, fontWeight: '700', color: colors.ink }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {btn('−', () => setValue(Math.max(1, value - 1)), value <= 1)}
        {/* visual track */}
        <View style={{ flexDirection: 'row', gap: 3 }}>
          {Array.from({ length: 10 }, (_, i) => (
            <Pressable key={i} onPress={() => setValue(i + 1)} style={{ width: 10, height: 22, borderRadius: 3, backgroundColor: i < value ? colors.gold : colors.rule }} />
          ))}
        </View>
        {btn('+', () => setValue(Math.min(10, value + 1)), value >= 10)}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, minWidth: 70, justifyContent: 'flex-end' }}>
        <Text style={{ fontSize: 20, color: colors.gold }}>★</Text>
        <Text style={{ fontFamily, fontSize: 30, fontWeight: '800', color: colors.ink }}>{value}</Text>
      </View>
    </View>
  );
}

function SuccessState({ peer, pts, value }) {
  const { t } = useTranslation();
  const usr = getUser(peer);
  const val = VALUES.find((v) => v.id === value);
  return (
    <View style={{ paddingHorizontal: 32, paddingTop: 52, paddingBottom: 44, alignItems: 'center' }}>
      <View style={{ marginBottom: 8 }}>
        <Sparkles run count={22} />
        <View style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: colors.primary100, backgroundColor: colors.primary50, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 44 }}>{val ? val.emoji : '🎉'}</Text>
        </View>
      </View>
      <Text style={{ fontFamily, marginTop: 14, fontSize: 28, fontWeight: '800', color: colors.ink }}>{t('success.title')}</Text>
      <Text style={{ fontFamily, marginTop: 8, fontSize: 16, lineHeight: 26, color: colors.ink2, textAlign: 'center' }}>{t('success.body', { name: usr.name, points: pts })}</Text>
    </View>
  );
}

export default function GiveModal({ open, onClose, onSent, allowanceLeft = 40 }) {
  const { t } = useTranslation();
  const [peer, setPeer] = useState(null);
  const [msg, setMsg] = useState('');
  const [value, setValue] = useState(null);
  const [pts, setPts] = useState(5);
  const [sticker, setSticker] = useState(null);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open) {
      setPeer(null); setMsg(''); setValue(null); setPts(5); setSticker(null); setStickerOpen(false); setSent(false);
    }
  }, [open]);

  if (!open) return null;
  const valid = peer && msg.trim().length > 0 && value && pts <= allowanceLeft;

  const submit = () => {
    setSent(true);
    setTimeout(() => onSent && onSent({ to: peer, msg, value, points: pts, sticker }), 1500);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(31,26,20,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 }} onPress={onClose}>
        <Pressable style={[{ width: '100%', maxWidth: 540, maxHeight: '92%', borderRadius: radius.r4, backgroundColor: colors.paper, overflow: 'hidden' }, shadowModal]} onPress={() => {}}>
          {sent ? (
            <SuccessState peer={peer} pts={pts} value={value} />
          ) : (
            <>
              {/* header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: colors.rule, backgroundColor: colors.paper, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily, fontSize: 23, fontWeight: '800', color: colors.ink }}>{t('give.title')}</Text>
                  <Text style={{ fontFamily, marginTop: 2, fontSize: 13.5, color: colors.ink3 }}>{t('give.allowanceLeft', { count: allowanceLeft })}</Text>
                </View>
                <Pressable onPress={onClose} accessibilityLabel={t('give.close')} style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paperSink }}>
                  <Icon name="x" size={18} color={colors.ink2} />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={{ gap: 22, padding: 22 }}>
                {/* 1. peer */}
                <Field n="1" label={t('give.field1')}>
                  <PeerPicker selected={peer} onSelect={setPeer} />
                </Field>

                {/* 2. message */}
                <Field n="2" label={t('give.field2')}>
                  <View>
                    <TextInput
                      value={msg}
                      onChangeText={(v) => setMsg(v.slice(0, MAX_MSG))}
                      multiline
                      numberOfLines={4}
                      placeholder={t('give.msgPlaceholder')}
                      placeholderTextColor={colors.ink3}
                      style={{ fontFamily, minHeight: 96, borderRadius: radius.r2, borderWidth: 1, borderColor: colors.ruleStrong, backgroundColor: colors.cardCream, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, lineHeight: 24, color: colors.ink, textAlign: 'right', textAlignVertical: 'top' }}
                    />
                    <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Pressable
                        onPress={() => setStickerOpen((s) => !s)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.rule, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: sticker ? colors.gold50 : colors.cardCream }}
                      >
                        {sticker ? <Text style={{ fontSize: 16 }}>{sticker}</Text> : <Icon name="sticker" size={15} color={colors.ink2} />}
                        <Text style={{ fontFamily, fontSize: 13, fontWeight: '600', color: colors.ink2 }}>{sticker ? t('give.stickerChosen') : t('give.addSticker')}</Text>
                      </Pressable>
                      <View style={{ flex: 1 }} />
                      <Text style={{ fontFamily, fontSize: 12, color: colors.ink4 }}>{msg.length}/{MAX_MSG}</Text>
                    </View>
                    {stickerOpen ? (
                      <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8, borderRadius: radius.r2, borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.cardCream, padding: 12 }}>
                        {STICKERS.map((s) => (
                          <Pressable
                            key={s}
                            onPress={() => setSticker(s === sticker ? null : s)}
                            style={{ width: 46, height: 46, borderRadius: radius.r2, borderWidth: 1, alignItems: 'center', justifyContent: 'center', borderColor: s === sticker ? colors.gold : colors.rule, backgroundColor: s === sticker ? colors.gold50 : colors.paper }}
                          >
                            <Text style={{ fontSize: 24 }}>{s}</Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
                  </View>
                </Field>

                {/* 3. value */}
                <Field n="3" label={t('give.field3')}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
                    {VALUES.map((v) => {
                      const on = value === v.id;
                      return (
                        <Pressable
                          key={v.id}
                          onPress={() => setValue(v.id)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: radius.pill, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 9, borderColor: on ? colors.primary : colors.rule, backgroundColor: on ? colors.primary50 : colors.cardCream }}
                        >
                          <Text style={{ fontSize: 16 }}>{v.emoji}</Text>
                          <Text style={{ fontFamily, fontSize: 14, fontWeight: '600', color: on ? colors.primary : colors.ink2 }}>{t(`values.${v.id}`)}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Field>

                {/* 4. points */}
                <Field n="4" label={t('give.field4')}>
                  <Stepper value={pts} setValue={setPts} />
                  {pts > allowanceLeft ? (
                    <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Icon name="alert-circle" size={14} color={colors.accent700} />
                      <Text style={{ fontFamily, fontSize: 13, color: colors.accent700 }}>{t('give.overQuota', { count: allowanceLeft })}</Text>
                    </View>
                  ) : null}
                </Field>
              </ScrollView>

              {/* footer */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderColor: colors.rule, backgroundColor: colors.paper, paddingHorizontal: 22, paddingVertical: 14 }}>
                <Button variant="ghost" onPress={onClose} style={{ borderColor: colors.rule }}>{t('give.cancel')}</Button>
                <View style={{ flex: 1 }} />
                <Button variant="primary" onPress={submit} disabled={!valid} iconAfter="sparkles">{t('give.send')}</Button>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
