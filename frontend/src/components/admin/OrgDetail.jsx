/* Organization detail (#36): manage the org's recognition values and the
   per-role monthly allowances. Reached from the Organizations tab. */
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { I18N } from '../constants.js';
import { Button, Card, Icon } from '../primitives.jsx';
import { api } from '../../lib/api.js';

function Section({ title, children }) {
  return (
    <Card className="mb-[18px] p-[18px]">
      <h2 className="mb-[12px] font-display text-[18px] font-extrabold text-ink">{title}</h2>
      {children}
    </Card>
  );
}

function RecognitionValues({ orgId }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [available, setAvailable] = useState([]);
  const [selected, setSelected] = useState('');
  const [state, setState] = useState({ loading: true, error: null });

  const reload = useCallback(() => {
    setState({ loading: true, error: null });
    return Promise.all([api.orgValues.list(orgId), api.orgValues.available(orgId)])
      .then(([list, avail]) => {
        setRows(list || []);
        setAvailable(avail || []);
        setSelected('');
      })
      .catch((e) => setState((s) => ({ ...s, error: e })))
      .finally(() => setState((s) => ({ ...s, loading: false })));
  }, [orgId]);

  useEffect(() => { reload(); }, [reload]);

  const add = () => {
    if (!selected) return;
    api.orgValues.add(orgId, Number(selected)).then(reload);
  };
  const remove = (valueId) => api.orgValues.remove(orgId, valueId).then(reload);

  return (
    <Section title={t('admin.orgValuesTitle')}>
      <div className="mb-[12px] flex flex-wrap items-center gap-[8px]">
        <select value={selected} onChange={(e) => setSelected(e.target.value)}
          className="rounded-2 border border-rule bg-card-cream px-[12px] py-[8px] text-[14px] text-ink">
          <option value="">{t('admin.orgValuesPick')}</option>
          {available.map((v) => (
            <option key={v.id} value={v.id}>{(v.emoji || '') + ' ' + v.key}</option>
          ))}
        </select>
        <Button variant="primary" size="sm" icon="plus" disabled={!selected} onClick={add}>{t('admin.orgValuesAdd')}</Button>
      </div>
      {state.loading ? (
        <p className="text-[14px] text-ink-3">{t(I18N.COMMON_LOADING)}</p>
      ) : state.error ? (
        <p className="text-[14px] text-accent-700">{t(I18N.COMMON_ERROR)}</p>
      ) : rows.length === 0 ? (
        <p className="text-[14px] text-ink-3">{t('admin.orgValuesEmpty')}</p>
      ) : (
        <div className="flex flex-wrap gap-[8px]">
          {rows.map((r) => (
            <span key={r.id} className="inline-flex items-center gap-[8px] rounded-pill border border-rule bg-card-cream px-[12px] py-[6px] text-[14px] text-ink">
              <span>{(r.emoji || '') + ' ' + r.key}</span>
              <button type="button" aria-label={t('admin.orgValuesRemove')} onClick={() => remove(r.recognition_value_id)} className="text-accent-700">
                <Icon name="x" size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
    </Section>
  );
}

function RoleAllowances({ orgId }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [state, setState] = useState({ loading: true, error: null });

  const reload = useCallback(() => {
    setState({ loading: true, error: null });
    return api.orgAllowances.list(orgId)
      .then((list) => {
        setRows(list || []);
        const d = {};
        for (const r of list || []) d[r.role_id] = r.monthly_points ?? '';
        setDrafts(d);
      })
      .catch((e) => setState((s) => ({ ...s, error: e })))
      .finally(() => setState((s) => ({ ...s, loading: false })));
  }, [orgId]);

  useEffect(() => { reload(); }, [reload]);

  const save = (roleId) => {
    const raw = drafts[roleId];
    if (raw === '' || raw === null || raw === undefined) return;
    api.orgAllowances.set(orgId, roleId, Number(raw)).then(reload);
  };
  const clear = (roleId) => api.orgAllowances.remove(orgId, roleId).then(reload);

  return (
    <Section title={t('admin.orgAllowancesTitle')}>
      {state.loading ? (
        <p className="text-[14px] text-ink-3">{t(I18N.COMMON_LOADING)}</p>
      ) : state.error ? (
        <p className="text-[14px] text-accent-700">{t(I18N.COMMON_ERROR)}</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border-b border-rule px-[10px] py-[8px] text-right text-[12px] font-bold text-ink-3">{t('admin.colRole')}</th>
              <th className="border-b border-rule px-[10px] py-[8px] text-right text-[12px] font-bold text-ink-3">{t('admin.colMonthlyPoints')}</th>
              <th className="border-b border-rule px-[10px] py-[8px]" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.role_id}>
                <td className="border-b border-rule px-[10px] py-[8px] text-[14px] text-ink">{r.name_he}</td>
                <td className="border-b border-rule px-[10px] py-[8px]">
                  <input type="number" min={0} value={drafts[r.role_id] ?? ''}
                    onChange={(e) => setDrafts((d) => ({ ...d, [r.role_id]: e.target.value }))}
                    className="w-[110px] rounded-2 border border-rule bg-card-cream px-[10px] py-[6px] text-[14px] text-ink" />
                </td>
                <td className="border-b border-rule px-[10px] py-[8px] text-left">
                  <div className="inline-flex gap-[6px]">
                    <Button variant="primary" size="sm" onClick={() => save(r.role_id)}>{t(I18N.COMMON_SAVE)}</Button>
                    {r.monthly_points !== null && r.monthly_points !== undefined ? (
                      <Button variant="ghost" size="sm" onClick={() => clear(r.role_id)}>{t('admin.clear')}</Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}

export default function OrgDetail({ org, onBack }) {
  const { t } = useTranslation();
  return (
    <div>
      <button type="button" onClick={onBack} className="mb-[14px] inline-flex items-center gap-[6px] text-[14px] font-semibold text-ink-2">
        <Icon name="chevron-right" size={16} />{t('admin.backToList')}
      </button>
      <h1 className="mb-[16px] font-display text-[26px] font-extrabold text-ink">{org.name}</h1>
      <RecognitionValues orgId={org.id} />
      <RoleAllowances orgId={org.id} />
    </div>
  );
}
