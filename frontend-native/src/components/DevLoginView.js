/* TEMPORARY email-only login (#39/#44).

   !!! TEMPORARY — REMOVE AT THE GOOGLE OAUTH CUTOVER !!!
   Mirrors the web DevLoginView. Type a seeded email → POST /auth/dev-login →
   store token. Replace with the Google OAuth flow later; the api/auth plumbing
   stays unchanged. */
import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { I18N } from './constants';
import { Button } from './ui';
import { colors, radius, fontFamily } from '../theme';
import { api, ApiError } from '../lib/api';
import { setSession } from '../lib/auth';

const SAMPLES = ['admin@fergon.dev', 'principal@fergon.dev', 'teacher@fergon.dev'];

export default function DevLoginView({ heading, onSuccess }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = () => {
    setBusy(true);
    setError(null);
    api
      .devLogin(email.trim())
      .then((res) => {
        setSession({ token: res.access_token, access_level: res.user?.access_level, email: res.user?.email });
        if (onSuccess) onSuccess();
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.detail || err.message : String(err));
        setBusy(false);
      });
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, padding: 24 }}>
      <View style={{ width: '100%', maxWidth: 400, borderRadius: radius.r3, borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.cardCream, padding: 26 }}>
        <Text style={{ fontFamily, fontSize: 28, fontWeight: '800', color: colors.ink, textAlign: 'center' }}>
          {heading || t('devLogin.heading')}
        </Text>
        <Text style={{ fontFamily, fontSize: 14, color: colors.ink3, textAlign: 'center', marginTop: 6 }}>
          {t('devLogin.subtitle')}
        </Text>

        {error ? (
          <View style={{ marginTop: 14, borderRadius: radius.r2, backgroundColor: colors.accent50, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ fontFamily, fontSize: 13, color: colors.accent700 }}>{error}</Text>
          </View>
        ) : null}

        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder={t(I18N.DEVLOGIN_PLACEHOLDER)}
          placeholderTextColor={colors.ink3}
          accessibilityLabel={t(I18N.DEVLOGIN_PLACEHOLDER)}
          style={{ fontFamily, marginTop: 18, borderRadius: radius.r2, borderWidth: 1, borderColor: colors.ruleStrong, backgroundColor: colors.paper, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.ink, textAlign: 'right' }}
        />
        <Button variant="primary" onPress={busy ? undefined : submit} disabled={busy} style={{ marginTop: 14 }}>
          {busy ? t('devLogin.signingIn') : t('devLogin.signIn')}
        </Button>

        <Text style={{ fontFamily, fontSize: 12, color: colors.ink3, textAlign: 'center', marginTop: 18 }}>{t('devLogin.tryHint')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 6 }}>
          {SAMPLES.map((s) => (
            <Pressable key={s} onPress={() => setEmail(s)} style={{ borderRadius: radius.pill, borderWidth: 1, borderColor: colors.rule, paddingHorizontal: 10, paddingVertical: 3 }}>
              <Text style={{ fontFamily, fontSize: 12, color: colors.ink2 }}>{s}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
