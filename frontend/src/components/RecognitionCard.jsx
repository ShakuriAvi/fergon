/* Recognition feed item (#43). Renders an enriched backend feed item:
   { id, from_name, to_name, points, message, values: [{key,emoji,tone}], created_at }. */
import { useTranslation } from 'react-i18next';
import { Avatar, FEED_AVATAR_TONE as AV } from './primitives.jsx';
import { timeAgo } from '../lib/format.js';

export default function RecognitionCard({ item, first }) {
  const { t } = useTranslation();
  const val = item.values && item.values[0];

  const mins = item.created_at
    ? Math.max(0, Math.floor((Date.now() - Date.parse(item.created_at)) / 60000))
    : 0;

  return (
    <article className={first ? 'px-[4px] py-[24px]' : 'border-t border-rule px-[4px] py-[24px]'}>
      <header className="mb-[14px] flex items-center gap-[12px]">
        <Avatar name={item.from_name} size={44} tone={AV} />
        <div className="min-w-0 flex-1 leading-[1.35]">
          <div className="text-[15.5px] text-ink">
            <span className="font-bold">{item.from_name}</span>
            <span className="mx-[5px] text-ink-3">{t('feed.recognized')}</span>
            <span className="font-bold">{item.to_name}</span>
          </div>
          <div className="mt-[2px] text-[12.5px] text-ink-3">{timeAgo(mins, t)}</div>
        </div>
        <span className="tnum inline-flex shrink-0 items-center gap-[5px] text-[16px] font-extrabold text-gold-deep">
          <span className="text-[16px] text-gold">★</span>+{item.points}
        </span>
      </header>

      {item.message ? (
        <p className="m-0 ps-[56px] text-[16.5px] leading-[1.66] text-ink [text-wrap:pretty]">{item.message}</p>
      ) : null}

      {val ? (
        <div className="mt-[16px] flex items-center gap-[14px] ps-[56px]">
          <span className="inline-flex items-center gap-[6px] whitespace-nowrap text-[13px] font-semibold text-ink-2">
            <span className="text-[15px]">{val.emoji}</span>
            {val.key}
          </span>
        </div>
      ) : null}
    </article>
  );
}
