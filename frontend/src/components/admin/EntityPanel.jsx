/* Generic admin entity panel: toolbar (search + add), table with status +
   edit/delete actions, pagination, loading/error/empty states (#35).
   `config` describes the resource, columns and form fields. */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { I18N } from '../constants.js';
import { Button, Card, Icon } from '../primitives.jsx';
import { cx } from '../../lib/cx.js';
import { useList } from './useList.js';
import EntityForm from './EntityForm.jsx';

function StatusPill({ on, labels }) {
  return (
    <span
      className="inline-flex items-center gap-[6px] rounded-pill px-[10px] py-[3px] text-[12px] font-semibold"
      style={{ background: on ? 'var(--success-bg)' : 'var(--neutral-bg)', color: on ? 'var(--success)' : 'var(--ink-3)' }}
    >
      <span className="h-[6px] w-[6px] rounded-full" style={{ background: on ? 'var(--primary)' : 'var(--ink-4)' }} />
      {on ? labels[0] : labels[1]}
    </span>
  );
}

export default function EntityPanel({ config }) {
  const { t } = useTranslation();
  // Pass the resource as a dependency so the list refetches when the active
  // entity (admin tab) changes — otherwise stale rows from the previous tab
  // would render under the new tab's columns (#bug: name/role showed as '—').
  const list = useList((params) => config.resource.list(params), [config.resource]);
  const [editing, setEditing] = useState(null); // item or {} for create
  const [busyId, setBusyId] = useState(null);

  const statusLabels = [t('admin.statusActive'), t('admin.statusInactive')];

  const onSubmit = (payload) => {
    if (editing && editing.id) return config.resource.update(editing.id, payload).then(list.reload);
    return config.resource.create(payload).then(list.reload);
  };

  const toggleActive = (item) => {
    setBusyId(item.id);
    const op = item.is_active ? config.resource.remove(item.id) : config.resource.reactivate(item.id);
    op.then(list.reload).finally(() => setBusyId(null));
  };

  return (
    <>
      <div className="mb-[14px] flex flex-wrap items-center gap-[10px]">
        <div className="relative min-w-[200px] flex-1">
          <Icon name="search" size={15} className="absolute right-[12px] top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            value={list.q}
            onChange={(e) => list.setQ(e.target.value)}
            placeholder={t(config.searchKey)}
            className="w-full rounded-2 border border-rule bg-card-cream py-[9px] pl-[14px] pr-[36px] text-[14px] text-ink outline-none"
          />
        </div>
        <label className="flex items-center gap-[6px] text-[13px] text-ink-2">
          <input type="checkbox" checked={list.includeInactive} onChange={(e) => list.setIncludeInactive(e.target.checked)} />
          {t('admin.showInactive')}
        </label>
        <Button variant="primary" size="md" icon="plus" onClick={() => setEditing({})}>
          {t(config.addKey)}
        </Button>
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr>
                {config.columns.map((c) => (
                  <th key={c.key} className="whitespace-nowrap border-b border-rule px-[14px] py-[11px] text-right text-[12px] font-bold tracking-[0.03em] text-ink-3">
                    {t(c.labelKey)}
                  </th>
                ))}
                <th className="border-b border-rule px-[14px] py-[11px]" />
              </tr>
            </thead>
            <tbody>
              {list.loading ? (
                <tr><td colSpan={config.columns.length + 1} className="px-[14px] py-[20px] text-center text-[14px] text-ink-3">{t(I18N.COMMON_LOADING)}</td></tr>
              ) : list.error ? (
                <tr><td colSpan={config.columns.length + 1} className="px-[14px] py-[20px] text-center text-[14px] text-accent-700">{t(I18N.COMMON_ERROR)}</td></tr>
              ) : list.items.length === 0 ? (
                <tr><td colSpan={config.columns.length + 1} className="px-[14px] py-[20px] text-center text-[14px] text-ink-3">{t('admin.empty')}</td></tr>
              ) : (
                list.items.map((item) => (
                  <tr key={item.id}>
                    {config.columns.map((c) => (
                      <td key={c.key} className="border-b border-rule px-[14px] py-[12px] text-[14px] text-ink">
                        {c.key === '__status'
                          ? <StatusPill on={item.is_active} labels={statusLabels} />
                          : c.render ? c.render(item) : (item[c.key] ?? '—')}
                      </td>
                    ))}
                    <td className="border-b border-rule px-[14px] py-[12px] text-left">
                      <div className="inline-flex gap-[4px]">
                        {config.onManage ? (
                          <button type="button" aria-label={t(I18N.ADMIN_MANAGE)} onClick={() => config.onManage(item)}
                            className="inline-flex h-[30px] items-center gap-[5px] rounded-1 border border-rule bg-transparent px-[8px] text-[12.5px] text-ink-2">
                            <Icon name="settings" size={14} />{t(I18N.ADMIN_MANAGE)}
                          </button>
                        ) : null}
                        <button type="button" aria-label={t('admin.editAria')} onClick={() => setEditing(item)}
                          className="inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-1 border border-rule bg-transparent text-ink-3">
                          <Icon name="pencil" size={15} />
                        </button>
                        <button type="button" aria-label={item.is_active ? t('admin.deleteAria') : t('admin.reactivateAria')}
                          disabled={busyId === item.id} onClick={() => toggleActive(item)}
                          className={cx('inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-1 border border-rule bg-transparent', item.is_active ? 'text-accent-700' : 'text-primary')}>
                          <Icon name={item.is_active ? 'trash-2' : 'rotate-ccw'} size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-[12px] flex items-center justify-between text-[13px] text-ink-3">
        <span>{t('admin.totalCount', { n: list.total })}</span>
        <div className="flex items-center gap-[8px]">
          <Button variant="ghost" size="sm" disabled={list.offset === 0} onClick={() => list.setOffset(Math.max(0, list.offset - list.pageSize))}>
            {t('admin.prev')}
          </Button>
          <Button variant="ghost" size="sm" disabled={list.offset + list.pageSize >= list.total} onClick={() => list.setOffset(list.offset + list.pageSize)}>
            {t('admin.next')}
          </Button>
        </div>
      </div>

      {editing ? (
        <EntityForm
          title={editing.id ? t(config.editTitleKey) : t(config.addKey)}
          fields={config.fields}
          item={editing.id ? editing : null}
          onSubmit={onSubmit}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}
