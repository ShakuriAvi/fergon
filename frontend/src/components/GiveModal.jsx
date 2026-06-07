/* Give Recognition modal. Ported from the GiveModal in
   fergon.html. Triggered from the shell nav / FAB. Tailwind + i18n. */
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, Avatar, Button, Sparkles } from './primitives.jsx';
import { USERS, VALUES, STICKERS, ME, getUser, schoolById } from '../data/mock.js';
import { cx } from '../lib/cx.js';

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
      <div className="flex items-center gap-[12px] rounded-2 border border-primary-100 bg-primary-50 p-[12px]">
        <Avatar name={usr.name} size={44} />
        <div className="flex-1">
          <div className="text-[15.5px] font-bold text-ink">{usr.name}</div>
          <div className="text-[13px] text-ink-3">{peerMeta(usr)}</div>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelect(null);
            setQ('');
          }}
          aria-label={t('give.replace')}
          className="cursor-pointer border-none bg-transparent p-[6px] text-ink-3"
        >
          <Icon name="x" size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Icon name="search" size={16} className="absolute right-[13px] top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t('give.searchPlaceholder')}
          className="w-full rounded-2 border border-rule-strong bg-card-cream py-[12px] pl-[14px] pr-[42px] text-[15px] text-ink outline-none"
        />
      </div>
      {open && results.length > 0 ? (
        <div className="mt-2 overflow-hidden rounded-2 border border-rule bg-card-cream shadow-pop">
          {results.map((user) => (
            <div
              key={user.id}
              onClick={() => {
                onSelect(user.id);
                setOpen(false);
              }}
              className="flex cursor-pointer items-center gap-[11px] px-[12px] py-[10px] transition-colors duration-1 ease-sy hover:bg-paper-sink"
            >
              <Avatar name={user.name} size={36} />
              <div className="flex-1">
                <div className="text-[14.5px] font-semibold text-ink">{user.name}</div>
                <div className="text-[12.5px] text-ink-3">{peerMeta(user)}</div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Field({ n, label, children }) {
  return (
    <div>
      <div className="mb-[10px] flex items-center gap-[9px]">
        <span className="tnum inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-paper-sink text-[12px] font-bold text-ink-3">
          {n}
        </span>
        <span className="text-[15.5px] font-bold text-ink">{label}</span>
      </div>
      {children}
    </div>
  );
}

function SuccessState({ peer, pts, value }) {
  const { t } = useTranslation();
  const usr = getUser(peer);
  const val = VALUES.find((v) => v.id === value);
  return (
    <div className="relative px-[32px] pb-[44px] pt-[52px] text-center">
      <div className="relative mb-[8px] inline-flex">
        <Sparkles run count={22} />
        <div className="pop inline-flex h-[88px] w-[88px] items-center justify-center rounded-full border-2 border-primary-100 bg-primary-50 text-[44px]">
          {val ? val.emoji : '🎉'}
        </div>
      </div>
      <h2 className="mt-[14px] font-display text-[28px] font-extrabold tracking-[-0.02em] text-ink">{t('success.title')}</h2>
      <p className="mt-[8px] text-[16px] leading-[1.6] text-ink-2">{t('success.body', { name: usr.name, points: pts })}</p>
    </div>
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
      setPeer(null);
      setMsg('');
      setValue(null);
      setPts(5);
      setSticker(null);
      setStickerOpen(false);
      setSent(false);
    }
  }, [open]);

  if (!open) return null;
  const valid = peer && msg.trim().length > 0 && value && pts <= allowanceLeft;

  const submit = () => {
    setSent(true);
    setTimeout(() => onSent && onSent({ to: peer, msg, value, points: pts, sticker }), 1500);
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div
        className="modal-card max-h-[92vh] w-full max-w-[540px] overflow-auto rounded-4 bg-paper shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <SuccessState peer={peer} pts={pts} value={value} />
        ) : (
          <>
            {/* header */}
            <div className="sticky top-0 z-[2] flex items-center justify-between border-b border-rule bg-paper px-[22px] pb-[14px] pt-[20px]">
              <div>
                <h2 className="font-display text-[23px] font-extrabold tracking-[-0.02em] text-ink">{t('give.title')}</h2>
                <p className="mt-[2px] text-[13.5px] text-ink-3">{t('give.allowanceLeft', { count: allowanceLeft })}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('give.close')}
                className="inline-flex h-[36px] w-[36px] cursor-pointer items-center justify-center rounded-full border-none bg-paper-sink text-ink-2"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-[22px] p-[22px]">
              {/* 1. peer */}
              <Field n="1" label={t('give.field1')}>
                <PeerPicker selected={peer} onSelect={setPeer} />
              </Field>

              {/* 2. message */}
              <Field n="2" label={t('give.field2')}>
                <div className="relative">
                  <textarea
                    value={msg}
                    onChange={(e) => setMsg(e.target.value.slice(0, MAX_MSG))}
                    rows={4}
                    placeholder={t('give.msgPlaceholder')}
                    className="w-full resize-y rounded-2 border border-rule-strong bg-card-cream px-[14px] py-[13px] font-body text-[15px] leading-[1.6] text-ink outline-none"
                  />
                  <div className="mt-[8px] flex items-center gap-[8px]">
                    <button
                      type="button"
                      onClick={() => setStickerOpen((s) => !s)}
                      className={cx(
                        'inline-flex cursor-pointer items-center gap-[6px] rounded-pill border border-rule px-[11px] py-[6px] font-body text-[13px] font-semibold text-ink-2',
                        sticker ? 'bg-gold-50' : 'bg-card-cream'
                      )}
                    >
                      {sticker ? <span className="text-[16px]">{sticker}</span> : <Icon name="sticker" size={15} />}
                      {sticker ? t('give.stickerChosen') : t('give.addSticker')}
                    </button>
                    <span className="tnum ms-auto text-[12px] text-ink-4">
                      {msg.length}/{MAX_MSG}
                    </span>
                  </div>
                  {stickerOpen ? (
                    <div className="mt-[10px] flex flex-wrap gap-[8px] rounded-2 border border-rule bg-card-cream p-[12px]">
                      {STICKERS.map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setSticker(s === sticker ? null : s)}
                          className={cx(
                            'h-[46px] w-[46px] cursor-pointer rounded-2 border text-[24px]',
                            s === sticker ? 'border-gold bg-gold-50' : 'border-rule bg-paper'
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Field>

              {/* 3. value */}
              <Field n="3" label={t('give.field3')}>
                <div className="flex flex-wrap gap-[9px]">
                  {VALUES.map((v) => {
                    const on = value === v.id;
                    return (
                      <button
                        type="button"
                        key={v.id}
                        onClick={() => setValue(v.id)}
                        className={cx(
                          'inline-flex cursor-pointer items-center gap-[7px] rounded-pill border-[1.5px] px-[14px] py-[9px] font-body text-[14px] font-semibold transition-all duration-1 ease-sy',
                          on ? 'border-primary bg-primary-50 text-primary' : 'border-rule bg-card-cream text-ink-2'
                        )}
                      >
                        <span className="text-[16px]">{v.emoji}</span>
                        {t(`values.${v.id}`)}
                      </button>
                    );
                  })}
                </div>
              </Field>

              {/* 4. points */}
              <Field n="4" label={t('give.field4')}>
                <div className="flex items-center gap-[16px]">
                  <input type="range" className="pts flex-1" min="1" max="10" value={pts} onChange={(e) => setPts(Number(e.target.value))} />
                  <div className="tnum flex min-w-[70px] items-baseline justify-end gap-[4px]">
                    <span className="text-[20px] text-gold">★</span>
                    <span className="font-display text-[30px] font-extrabold text-ink">{pts}</span>
                  </div>
                </div>
                {pts > allowanceLeft ? (
                  <div className="mt-[8px] flex items-center gap-[6px] text-[13px] text-accent-700">
                    <Icon name="alert-circle" size={14} /> {t('give.overQuota', { count: allowanceLeft })}
                  </div>
                ) : null}
              </Field>
            </div>

            {/* footer */}
            <div className="sticky bottom-0 flex items-center gap-[12px] border-t border-rule bg-paper px-[22px] py-[14px]">
              <Button variant="ghost" onClick={onClose} className="border border-rule">
                {t('give.cancel')}
              </Button>
              <Button variant="primary" size="md" onClick={submit} disabled={!valid} className="ms-auto" iconAfter="sparkles">
                {t('give.send')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
