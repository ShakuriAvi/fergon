/* Give Recognition modal (#43) — recipient + values from the backend; submits a
   real recognition via POST /posts. */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, Avatar, Button, Sparkles } from './primitives.jsx';
import { api, ApiError } from '../lib/api.js';
import { cx } from '../lib/cx.js';

const MAX_MSG = 400;

function PeerPicker({ members, selected, onSelect }) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo(
    () => members.filter((m) => q === '' || m.full_name.includes(q)).slice(0, 6),
    [q, members],
  );

  if (selected) {
    return (
      <div className="flex items-center gap-[12px] rounded-2 border border-primary-100 bg-primary-50 p-[12px]">
        <Avatar name={selected.full_name} size={44} />
        <div className="flex-1">
          <div className="text-[15.5px] font-bold text-ink">{selected.full_name}</div>
        </div>
        <button type="button" onClick={() => { onSelect(null); setQ(''); }} aria-label={t('give.replace')} className="cursor-pointer border-none bg-transparent p-[6px] text-ink-3">
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
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={t('give.searchPlaceholder')}
          className="w-full rounded-2 border border-rule-strong bg-card-cream py-[12px] pl-[14px] pr-[42px] text-[15px] text-ink outline-none"
        />
      </div>
      {open && results.length > 0 ? (
        <div className="mt-2 overflow-hidden rounded-2 border border-rule bg-card-cream shadow-pop">
          {results.map((m) => (
            <div key={m.id} onClick={() => { onSelect(m); setOpen(false); }} className="flex cursor-pointer items-center gap-[11px] px-[12px] py-[10px] transition-colors duration-1 ease-sy hover:bg-paper-sink">
              <Avatar name={m.full_name} size={36} />
              <div className="flex-1 text-[14.5px] font-semibold text-ink">{m.full_name}</div>
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
        <span className="tnum inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-paper-sink text-[12px] font-bold text-ink-3">{n}</span>
        <span className="text-[15.5px] font-bold text-ink">{label}</span>
      </div>
      {children}
    </div>
  );
}

function SuccessState({ peer, pts, value }) {
  const { t } = useTranslation();
  return (
    <div className="relative px-[32px] pb-[44px] pt-[52px] text-center">
      <div className="relative mb-[8px] inline-flex">
        <Sparkles run count={22} />
        <div className="pop inline-flex h-[88px] w-[88px] items-center justify-center rounded-full border-2 border-primary-100 bg-primary-50 text-[44px]">
          {value ? value.emoji : '🎉'}
        </div>
      </div>
      <h2 className="mt-[14px] font-display text-[28px] font-extrabold tracking-[-0.02em] text-ink">{t('success.title')}</h2>
      <p className="mt-[8px] text-[16px] leading-[1.6] text-ink-2">{t('success.body', { name: peer?.full_name, points: pts })}</p>
    </div>
  );
}

export default function GiveModal({ open, onClose, onSent, allowanceLeft = 40 }) {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [values, setValues] = useState([]);
  const [peer, setPeer] = useState(null);
  const [msg, setMsg] = useState('');
  const [value, setValue] = useState(null);
  const [pts, setPts] = useState(5);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setPeer(null); setMsg(''); setValue(null); setPts(5); setSent(false); setBusy(false); setError(null);
    Promise.all([api.orgMembers(), api.orgValues()])
      .then(([m, v]) => { setMembers(m || []); setValues(v || []); })
      .catch(() => {});
  }, [open]);

  if (!open) return null;
  const valid = peer && msg.trim().length > 0 && value && pts <= allowanceLeft;

  const submit = () => {
    setBusy(true);
    setError(null);
    api
      .givePost({ to_user_id: peer.id, points: pts, message: msg, recognition_value_ids: value ? [value.id] : [] })
      .then(() => {
        setSent(true);
        setTimeout(() => onSent && onSent(), 1400);
      })
      .catch((err) => { setError(err instanceof ApiError ? err.detail || err.message : String(err)); setBusy(false); });
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal-card max-h-[92vh] w-full max-w-[540px] overflow-auto rounded-4 bg-paper shadow-modal" onClick={(e) => e.stopPropagation()}>
        {sent ? (
          <SuccessState peer={peer} pts={pts} value={value} />
        ) : (
          <>
            <div className="sticky top-0 z-[2] flex items-center justify-between border-b border-rule bg-paper px-[22px] pb-[14px] pt-[20px]">
              <div>
                <h2 className="font-display text-[23px] font-extrabold tracking-[-0.02em] text-ink">{t('give.title')}</h2>
                <p className="mt-[2px] text-[13.5px] text-ink-3">{t('give.allowanceLeft', { count: allowanceLeft })}</p>
              </div>
              <button type="button" onClick={onClose} aria-label={t('give.close')} className="inline-flex h-[36px] w-[36px] cursor-pointer items-center justify-center rounded-full border-none bg-paper-sink text-ink-2">
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-[22px] p-[22px]">
              {error ? (
                <div className="rounded-2 bg-accent-50 px-[12px] py-[8px] text-[13px] text-accent-700">{error}</div>
              ) : null}

              <Field n="1" label={t('give.field1')}>
                <PeerPicker members={members} selected={peer} onSelect={setPeer} />
              </Field>

              <Field n="2" label={t('give.field2')}>
                <textarea
                  value={msg}
                  onChange={(e) => setMsg(e.target.value.slice(0, MAX_MSG))}
                  rows={4}
                  placeholder={t('give.msgPlaceholder')}
                  className="w-full resize-y rounded-2 border border-rule-strong bg-card-cream px-[14px] py-[13px] font-body text-[15px] leading-[1.6] text-ink outline-none"
                />
                <div className="tnum mt-[6px] text-left text-[12px] text-ink-4">{msg.length}/{MAX_MSG}</div>
              </Field>

              <Field n="3" label={t('give.field3')}>
                <div className="flex flex-wrap gap-[9px]">
                  {values.map((v) => {
                    const on = value?.id === v.id;
                    return (
                      <button
                        type="button"
                        key={v.id}
                        onClick={() => setValue(v)}
                        className={cx(
                          'inline-flex cursor-pointer items-center gap-[7px] rounded-pill border-[1.5px] px-[14px] py-[9px] font-body text-[14px] font-semibold transition-all duration-1 ease-sy',
                          on ? 'border-primary bg-primary-50 text-primary' : 'border-rule bg-card-cream text-ink-2'
                        )}
                      >
                        <span className="text-[16px]">{v.emoji}</span>
                        {v.key}
                      </button>
                    );
                  })}
                </div>
              </Field>

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

            <div className="sticky bottom-0 flex items-center gap-[12px] border-t border-rule bg-paper px-[22px] py-[14px]">
              <Button variant="ghost" onClick={onClose} className="border border-rule">{t('give.cancel')}</Button>
              <Button variant="primary" size="md" onClick={submit} disabled={!valid || busy} className="ms-auto" iconAfter="sparkles">
                {t('give.send')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
