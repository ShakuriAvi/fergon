/* Recognition feed item — RN port of frontend/src/components/RecognitionCard.jsx. */
import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon, Avatar, Sparkles, FEED_AVATAR_TONE as AV } from './ui';
import { getUser, valueById, schoolById } from '../data/mock';
import { timeAgo } from '../lib/format';
import { colors, fontFamily } from '../theme';

export default function RecognitionCard({ r, first }) {
  const { t } = useTranslation();
  const from = getUser(r.from);
  const to = getUser(r.to);
  const val = valueById(r.value);
  const [claps, setClaps] = useState(r.claps);
  const [clapped, setClapped] = useState(false);
  const [burst, setBurst] = useState(false);

  const clap = () => {
    const next = !clapped;
    setClapped(next);
    setClaps((v) => v + (next ? 1 : -1));
    if (next) {
      setBurst(true);
      setTimeout(() => setBurst(false), 900);
    }
  };

  return (
    <View style={{ paddingHorizontal: 4, paddingVertical: 24, borderTopWidth: first ? 0 : 1, borderColor: colors.rule }}>
      {/* who → whom */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <Avatar name={from.name} size={44} tone={AV} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily, fontSize: 15.5, color: colors.ink, lineHeight: 21 }}>
            <Text style={{ fontWeight: '700' }}>{from.name}</Text>
            <Text style={{ color: colors.ink3 }}>{` ${t('feed.recognized')} `}</Text>
            <Text style={{ fontWeight: '700' }}>{to.name}</Text>
          </Text>
          <Text style={{ fontFamily, marginTop: 2, fontSize: 12.5, color: colors.ink3 }}>
            {timeAgo(r.mins, t)} · {schoolById(to.school).short}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Text style={{ fontSize: 16, color: colors.gold }}>★</Text>
          <Text style={{ fontFamily, fontSize: 16, fontWeight: '800', color: colors.goldDeep }}>+{r.points}</Text>
        </View>
      </View>

      {/* message */}
      <Text style={{ fontFamily, paddingStart: 56, fontSize: 16.5, lineHeight: 27, color: colors.ink }}>{r.msg}</Text>

      {/* footer */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16, paddingStart: 56 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 15 }}>{val.emoji}</Text>
          <Text style={{ fontFamily, fontSize: 13, fontWeight: '600', color: colors.ink2 }}>{t(`values.${val.id}`)}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Pressable onPress={clap} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4, paddingVertical: 5 }}>
          <Sparkles run={burst} count={12} />
          <Text style={{ fontSize: 15 }}>👏</Text>
          <Text style={{ fontFamily, fontWeight: '600', fontSize: 13.5, color: clapped ? colors.goldDeep : colors.ink3 }}>{claps}</Text>
        </Pressable>
        <Pressable style={{ padding: 4 }} accessibilityLabel={t('feed.commentAria')}>
          <Icon name="message-circle" size={16} color={colors.ink3} />
        </Pressable>
        <Pressable style={{ padding: 4 }} accessibilityLabel={t('feed.shareAria')}>
          <Icon name="share-2" size={15} color={colors.ink3} />
        </Pressable>
      </View>
    </View>
  );
}
