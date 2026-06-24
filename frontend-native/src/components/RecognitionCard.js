/* Recognition feed item (#44, RN) — renders an enriched backend feed item. */
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Avatar, FEED_AVATAR_TONE as AV } from './ui';
import { colors, fontFamily } from '../theme';
import { timeAgo } from '../lib/format';

export default function RecognitionCard({ item, first }) {
  const { t } = useTranslation();
  const val = item.values && item.values[0];
  const mins = item.created_at
    ? Math.max(0, Math.floor((Date.now() - Date.parse(item.created_at)) / 60000))
    : 0;

  return (
    <View style={{ paddingHorizontal: 4, paddingVertical: 24, borderTopWidth: first ? 0 : 1, borderColor: colors.rule }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <Avatar name={item.from_name} size={44} tone={AV} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily, fontSize: 15.5, color: colors.ink }}>
            <Text style={{ fontWeight: '700' }}>{item.from_name}</Text>
            <Text style={{ color: colors.ink3 }}>{' ' + t('feed.recognized') + ' '}</Text>
            <Text style={{ fontWeight: '700' }}>{item.to_name}</Text>
          </Text>
          <Text style={{ fontFamily, fontSize: 12.5, color: colors.ink3, marginTop: 2 }}>{timeAgo(mins, t)}</Text>
        </View>
        <Text style={{ fontFamily, fontSize: 16, fontWeight: '800', color: colors.goldDeep }}>★ +{item.points}</Text>
      </View>

      {item.message ? (
        <Text style={{ fontFamily, fontSize: 16.5, lineHeight: 27, color: colors.ink, paddingStart: 56 }}>{item.message}</Text>
      ) : null}

      {val ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, paddingStart: 56 }}>
          <Text style={{ fontSize: 15 }}>{val.emoji}</Text>
          <Text style={{ fontFamily, fontSize: 13, fontWeight: '600', color: colors.ink2 }}>{val.key}</Text>
        </View>
      ) : null}
    </View>
  );
}
