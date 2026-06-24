/* Brand mark + wordmark — ported from the inline SVGs in
   fergon.html / Shell.jsx, rebuilt with react-native-svg. */
import { View, Text } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { I18N } from './constants';
import { colors, fontFamily } from '../theme';

const STAR = 'M20 9.5l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L20 24.8l-6.1 3.1 1.4-6.8-5.1-4.7 6.9-.8L20 9.5z';

export function LogoMark({ size = 34 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Rect x={1.5} y={1.5} width={37} height={37} rx={11} fill={colors.primary} />
      <Path d={STAR} fill={colors.gold} />
    </Svg>
  );
}

export function Logo({ size = 34, showWord = true, light = false }) {
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <LogoMark size={size} />
      {showWord ? (
        <Text style={{ fontFamily, fontWeight: '800', fontSize: size * 0.62, color: light ? colors.white : colors.ink }}>
          {t(I18N.APP_BRAND)}
        </Text>
      ) : null}
    </View>
  );
}
