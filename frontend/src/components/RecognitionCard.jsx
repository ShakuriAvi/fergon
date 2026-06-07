/* Recognition feed item — ported from fergon.html. Used in Feed + Profile. */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, Avatar, Sparkles, FEED_AVATAR_TONE as AV } from './primitives.jsx';
import { getUser, valueById, schoolById } from '../data/mock.js';
import { timeAgo } from '../lib/format.js';

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
    <article className={first ? 'px-[4px] py-[24px]' : 'border-t border-rule px-[4px] py-[24px]'}>
      {/* who → whom */}
      <header className="mb-[14px] flex items-center gap-[12px]">
        <Avatar name={from.name} size={44} tone={AV} />
        <div className="min-w-0 flex-1 leading-[1.35]">
          <div className="text-[15.5px] text-ink">
            <span className="font-bold">{from.name}</span>
            <span className="mx-[5px] text-ink-3">{t('feed.recognized')}</span>
            <span className="font-bold">{to.name}</span>
          </div>
          <div className="mt-[2px] text-[12.5px] text-ink-3">
            {timeAgo(r.mins, t)} · {schoolById(to.school).short}
          </div>
        </div>
        <span className="tnum inline-flex shrink-0 items-center gap-[5px] text-[16px] font-extrabold text-gold-deep">
          <span className="text-[16px] text-gold">★</span>+{r.points}
        </span>
      </header>

      {/* message */}
      <p className="m-0 ps-[56px] text-[16.5px] leading-[1.66] text-ink [text-wrap:pretty]">{r.msg}</p>

      {/* footer */}
      <div className="mt-[16px] flex items-center gap-[14px] ps-[56px]">
        <span className="inline-flex items-center gap-[6px] whitespace-nowrap text-[13px] font-semibold text-ink-2">
          <span className="text-[15px]">{val.emoji}</span>
          {t(`values.${val.id}`)}
        </span>
        <button
          type="button"
          onClick={clap}
          className={[
            'relative ms-auto inline-flex cursor-pointer items-center gap-[6px] border-none bg-transparent px-[4px] py-[5px] font-body text-[13.5px] font-semibold transition-colors duration-1 ease-sy',
            clapped ? 'text-gold-deep' : 'text-ink-3',
          ].join(' ')}
        >
          <Sparkles run={burst} count={12} />
          <span className="text-[15px]">👏</span>
          <span className="tnum">{claps}</span>
        </button>
        <button type="button" aria-label={t('feed.commentAria')} className="inline-flex items-center border-none bg-transparent p-[4px] text-ink-3">
          <Icon name="message-circle" size={16} />
        </button>
        <button type="button" aria-label={t('feed.shareAria')} className="inline-flex items-center border-none bg-transparent p-[4px] text-ink-3">
          <Icon name="share-2" size={15} />
        </button>
      </div>
    </article>
  );
}
