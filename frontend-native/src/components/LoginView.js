/* Login screen — RN port of frontend/src/components/LoginView.jsx. */
import { View, Text, Pressable, ScrollView } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { I18N } from './constants';
import { Icon, Txt } from './ui';
import { useViewport } from '../hooks/useViewport';
import { colors, radius, fontFamily } from '../theme';

const STAR = 'M20 9.5l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L20 24.8l-6.1 3.1 1.4-6.8-5.1-4.7 6.9-.8L20 9.5z';

function GoogleMark() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <Path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5c-2 1.5-4.7 2.5-7.6 2.5-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <Path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.5l6.5 5.5C39.9 36.7 44 31 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </Svg>
  );
}

export default function LoginView({ onLogin }) {
  const { t } = useTranslation();
  const { isMobile } = useViewport();
  const brand = t(I18N.APP_BRAND);

  return (
    <ScrollView
      style={{ backgroundColor: colors.paper }}
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: isMobile ? 22 : 48,
        paddingVertical: isMobile ? 32 : 48,
      }}
    >
      <View style={{ width: '100%', maxWidth: 400, alignItems: 'center' }}>
        {/* mark */}
        <View style={{ marginBottom: 22 }}>
          <Svg width={52} height={52} viewBox="0 0 40 40">
            <Rect x={1.5} y={1.5} width={37} height={37} rx={11} fill={colors.primary} />
            <Path d={STAR} fill={colors.gold} />
          </Svg>
        </View>

        {/* wordmark */}
        <Text style={{ fontFamily, fontWeight: '900', fontSize: isMobile ? 60 : 76, color: colors.ink, letterSpacing: -1 }}>
          {brand}
        </Text>

        {/* hand-drawn underline */}
        <Svg width={isMobile ? 170 : 210} height={16} viewBox="0 0 210 16" style={{ marginTop: 6 }}>
          <Path d="M5 9 C 45 3, 80 12, 120 7 S 185 4, 205 10" stroke={colors.gold} strokeWidth={4.5} strokeLinecap="round" fill="none" />
        </Svg>

        <Txt style={{ marginTop: 16, fontSize: 14.5, fontWeight: '500', color: colors.ink3, textAlign: 'center' }}>
          {t('login.tagline')}
        </Txt>

        <View style={{ height: 1, backgroundColor: colors.rule, alignSelf: 'stretch', marginVertical: 30 }} />

        {/* Google SSO */}
        <Pressable
          onPress={() => onLogin('admin')}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            alignSelf: 'stretch',
            borderRadius: radius.r2,
            borderWidth: 1,
            borderColor: colors.ruleStrong,
            backgroundColor: pressed ? colors.paperSink : colors.cardCream,
            paddingHorizontal: 18,
            paddingVertical: 14,
          })}
        >
          <GoogleMark />
          <Text style={{ fontFamily, fontSize: 15.5, fontWeight: '600', color: colors.ink }}>{t('login.google')}</Text>
        </Pressable>

        <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Icon name="lock" size={13} color={colors.ink3} />
          <Txt style={{ fontSize: 12.5, color: colors.ink3 }}>{t('login.secured')}</Txt>
        </View>

        <Pressable onPress={() => onLogin('member')} style={{ marginTop: 16 }}>
          <Text style={{ fontFamily, fontSize: 14, fontWeight: '600', color: colors.ink2, textDecorationLine: 'underline' }}>
            {t('login.guest')}
          </Text>
        </Pressable>

        <Txt style={{ marginTop: 30, fontSize: 12, lineHeight: 19, color: colors.ink4, textAlign: 'center' }}>
          {t('login.terms')}
        </Txt>
      </View>
    </ScrollView>
  );
}
