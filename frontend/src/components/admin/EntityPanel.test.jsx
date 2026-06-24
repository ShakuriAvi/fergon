import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EntityPanel from './EntityPanel.jsx';
import he from '../../locales/he.json';

function resourceWith(items) {
  return {
    list: vi.fn().mockResolvedValue({ items, total: items.length }),
    create: vi.fn().mockResolvedValue({ id: 99 }),
    update: vi.fn().mockResolvedValue({}),
    remove: vi.fn().mockResolvedValue({ id: 1, is_active: false }),
    reactivate: vi.fn().mockResolvedValue({}),
  };
}

const orgConfig = (resource) => ({
  resource,
  searchKey: 'admin.searchSchools',
  addKey: 'admin.addSchool',
  editTitleKey: 'admin.editSchool',
  columns: [
    { key: 'name', labelKey: 'admin.colSchool' },
    { key: '__status', labelKey: 'admin.colStatus' },
  ],
  fields: [{ name: 'name', labelKey: 'admin.colSchool', type: 'text', required: true }],
});

describe('EntityPanel', () => {
  it('renders live rows and creates a new record', async () => {
    const resource = resourceWith([{ id: 1, name: 'הרצל', is_active: true }]);
    render(<EntityPanel config={orgConfig(resource)} />);

    await screen.findByText('הרצל');
    expect(resource.list).toHaveBeenCalled();

    // open the create form
    fireEvent.click(screen.getByText(he.admin.addSchool));
    const input = screen.getByLabelText(he.admin.colSchool);
    fireEvent.change(input, { target: { value: 'בית ספר חדש' } });
    fireEvent.click(screen.getByText(he.common.save));

    await waitFor(() =>
      expect(resource.create).toHaveBeenCalledWith({ name: 'בית ספר חדש' }),
    );
  });

  it('soft-deletes an active row via the delete action', async () => {
    const resource = resourceWith([{ id: 7, name: 'רבין', is_active: true }]);
    render(<EntityPanel config={orgConfig(resource)} />);
    await screen.findByText('רבין');

    fireEvent.click(screen.getByLabelText(he.admin.deleteAria));
    await waitFor(() => expect(resource.remove).toHaveBeenCalledWith(7));
  });

  it('coerces number and checkbox fields in the submitted payload', async () => {
    const resource = resourceWith([]);
    const config = {
      resource,
      searchKey: 'admin.searchRewards',
      addKey: 'admin.addReward',
      editTitleKey: 'admin.editReward',
      columns: [{ key: 'title', labelKey: 'admin.colReward' }],
      fields: [
        { name: 'title', labelKey: 'admin.colReward', type: 'text', required: true },
        { name: 'cost', labelKey: 'admin.colCost', type: 'number', required: true },
        { name: 'in_stock', labelKey: 'admin.colInStock', type: 'checkbox' },
      ],
    };
    render(<EntityPanel config={config} />);
    await screen.findByText(he.admin.empty);

    fireEvent.click(screen.getByText(he.admin.addReward));
    fireEvent.change(screen.getByLabelText(he.admin.colReward), { target: { value: 'שובר' } });
    fireEvent.change(screen.getByLabelText(he.admin.colCost), { target: { value: '120' } });
    fireEvent.click(screen.getByLabelText(he.admin.colInStock));
    fireEvent.click(screen.getByText(he.common.save));

    await waitFor(() =>
      expect(resource.create).toHaveBeenCalledWith({ title: 'שובר', cost: 120, in_stock: true }),
    );
  });

  it('refetches and re-renders when the config resource changes (tab switch)', async () => {
    // Regression: switching admin tabs reuses the same EntityPanel instance, so
    // the list must refetch for the new resource instead of leaving the previous
    // tab's rows (whose fields don't match the new columns) rendered as '—'.
    const schoolsRes = resourceWith([{ id: 1, name: 'הרצל', is_active: true }]);
    const usersRes = resourceWith([{ id: 2, full_name: 'יעל כהן', is_active: true }]);
    const usersConfig = {
      resource: usersRes,
      searchKey: 'admin.searchUsers',
      addKey: 'admin.addUser',
      editTitleKey: 'admin.editUser',
      columns: [
        { key: 'full_name', labelKey: 'admin.colName' },
        { key: '__status', labelKey: 'admin.colStatus' },
      ],
      fields: [{ name: 'full_name', labelKey: 'admin.colName', type: 'text', required: true }],
    };

    const { rerender } = render(<EntityPanel config={orgConfig(schoolsRes)} />);
    await screen.findByText('הרצל');

    rerender(<EntityPanel config={usersConfig} />);

    await screen.findByText('יעל כהן');
    expect(usersRes.list).toHaveBeenCalled();
    expect(screen.queryByText('הרצל')).toBeNull();
  });
});
