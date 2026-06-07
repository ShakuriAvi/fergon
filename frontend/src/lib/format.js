/* relative time, ported from fergon.html — text resolved via i18n (t) */
export function timeAgo(mins, t) {
  if (mins < 60) return t('time.min', { n: mins });
  const h = Math.floor(mins / 60);
  if (h < 24) return t('time.hour', { n: h });
  const d = Math.floor(h / 24);
  if (d < 7) return d === 1 ? t('time.yesterday') : t('time.days', { n: d });
  const w = Math.floor(d / 7);
  return w === 1 ? t('time.week') : t('time.weeks', { n: w });
}
