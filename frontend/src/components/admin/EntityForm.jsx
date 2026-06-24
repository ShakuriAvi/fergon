/* Generic create/edit modal form for an admin entity (#35).
   Field config drives the inputs; select options can be static or async. */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { I18N } from '../constants.js';
import { Button, Icon } from '../primitives.jsx';
import { ApiError } from '../../lib/api.js';

function initialValues(fields, item) {
  const v = {};
  for (const f of fields) {
    const cur = item?.[f.name];
    v[f.name] = cur ?? (f.type === 'checkbox' ? false : '');
  }
  return v;
}

export default function EntityForm({ title, fields, item, onSubmit, onClose }) {
  const { t } = useTranslation();
  const [values, setValues] = useState(() => initialValues(fields, item));
  const [options, setOptions] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const editing = Boolean(item);
  const activeFields = useMemo(
    () => fields.filter((f) => !(editing && f.createOnly)),
    [fields, editing],
  );

  useEffect(() => {
    let cancelled = false;
    for (const f of activeFields) {
      if (typeof f.loadOptions === 'function') {
        f.loadOptions().then((opts) => {
          if (!cancelled) setOptions((o) => ({ ...o, [f.name]: opts }));
        });
      }
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (name, value) => setValues((v) => ({ ...v, [name]: value }));

  const submit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload = {};
    for (const f of activeFields) {
      let val = values[f.name];
      if (f.type === 'number') val = val === '' ? null : Number(val);
      if ((f.type === 'select' || f.optional) && val === '') val = null;
      payload[f.name] = val;
    }
    Promise.resolve(onSubmit(payload))
      .then(() => onClose())
      .catch((err) => {
        setError(err instanceof ApiError ? err.detail || err.message : String(err));
        setSubmitting(false);
      });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[16px]"
      onClick={onClose}
      role="presentation"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-[440px] overflow-auto rounded-3 bg-paper p-[22px] shadow-pop"
        aria-label={title}
      >
        <div className="mb-[16px] flex items-center justify-between">
          <h2 className="font-display text-[20px] font-extrabold text-ink">{title}</h2>
          <button type="button" aria-label={t('common.close')} onClick={onClose} className="text-ink-3">
            <Icon name="x" size={18} />
          </button>
        </div>

        {error ? (
          <div className="mb-[12px] rounded-2 bg-accent-50 px-[12px] py-[8px] text-[13px] text-accent-700">{error}</div>
        ) : null}

        <div className="flex flex-col gap-[12px]">
          {activeFields.map((f) => {
            const id = `f_${f.name}`;
            const label = t(f.labelKey);
            if (f.type === 'checkbox') {
              return (
                <label key={f.name} htmlFor={id} className="flex items-center gap-[8px] text-[14px] text-ink">
                  <input
                    id={id}
                    type="checkbox"
                    checked={Boolean(values[f.name])}
                    onChange={(e) => setField(f.name, e.target.checked)}
                  />
                  {label}
                </label>
              );
            }
            if (f.type === 'select') {
              const opts = f.options || options[f.name] || [];
              return (
                <div key={f.name} className="flex flex-col gap-[4px]">
                  <label htmlFor={id} className="text-[12.5px] font-semibold text-ink-3">{label}</label>
                  <select
                    id={id}
                    value={values[f.name] ?? ''}
                    required={f.required}
                    onChange={(e) => setField(f.name, e.target.value)}
                    className="rounded-2 border border-rule bg-card-cream px-[12px] py-[9px] text-[14px] text-ink"
                  >
                    <option value="">—</option>
                    {opts.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              );
            }
            return (
              <div key={f.name} className="flex flex-col gap-[4px]">
                <label htmlFor={id} className="text-[12.5px] font-semibold text-ink-3">{label}</label>
                <input
                  id={id}
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={values[f.name] ?? ''}
                  required={f.required}
                  min={f.type === 'number' ? 0 : undefined}
                  onChange={(e) => setField(f.name, e.target.value)}
                  className="rounded-2 border border-rule bg-card-cream px-[12px] py-[9px] text-[14px] text-ink"
                />
              </div>
            );
          })}
        </div>

        <div className="mt-[20px] flex justify-end gap-[10px]">
          <Button variant="ghost" size="md" type="button" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" size="md" type="submit" disabled={submitting}>
            {submitting ? t('common.saving') : t(I18N.COMMON_SAVE)}
          </Button>
        </div>
      </form>
    </div>
  );
}
