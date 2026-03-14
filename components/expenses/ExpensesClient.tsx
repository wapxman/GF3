'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ExpensesClient({ properties, buildings, categories, expenses: initialExpenses }: any) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ property_id: '', building_id: '', category_id: '', amount: '', expense_date: '', comment: '', type: 'property' });
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload: any = { category_id: form.category_id, amount: Number(form.amount), expense_date: form.expense_date, comment: form.comment };
    if (form.type === 'property') payload.property_id = form.property_id;
    else payload.building_id = form.building_id;
    if (editing) {
      const { data } = await supabase.from('expenses').update(payload).eq('id', editing.id).select('*, expense_categories(name), properties(name, buildings(name)), buildings(name)').single();
      setExpenses(expenses.map((e: any) => e.id === editing.id ? data : e));
    } else {
      const { data } = await supabase.from('expenses').insert(payload).select('*, expense_categories(name), properties(name, buildings(name)), buildings(name)').single();
      setExpenses([data, ...expenses]);
    }
    setShowForm(false); setEditing(null);
    setForm({ property_id: '', building_id: '', category_id: '', amount: '', expense_date: '', comment: '', type: 'property' });
    setLoading(false);
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setForm({ property_id: item.property_id || '', building_id: item.building_id || '', category_id: item.category_id, amount: String(item.amount), expense_date: item.expense_date, comment: item.comment || '', type: item.property_id ? 'property' : 'building' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить?')) return;
    await supabase.from('expenses').update({ is_deleted: true }).eq('id', id);
    setExpenses(expenses.filter((e: any) => e.id !== id));
  };

  const total = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Расходы</h1>
          <p className="text-slate-500">Итого: <span className="font-semibold text-red-600">{formatCurrency(total)}</span></p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditing(null); }}>
          <Plus className="w-4 h-4" /> Добавить расход
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-slate-800 mb-4">{editing ? 'Редактировать' : 'Новый расход'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Привязка</label>
                <div className="flex gap-3 mb-2">
                  <label className="flex items-center gap-2 text-sm"><input type="radio" value="property" checked={form.type === 'property'} onChange={e => setForm({...form, type: e.target.value})} /> Офис</label>
                  <label className="flex items-center gap-2 text-sm"><input type="radio" value="building" checked={form.type === 'building'} onChange={e => setForm({...form, type: e.target.value})} /> Здание (распределить поровну)</label>
                </div>
                {form.type === 'property'
                  ? <select className="input" value={form.property_id} onChange={e => setForm({...form, property_id: e.target.value})} required>
                      <option value="">Выберите офис</option>
                      {properties.map((p: any) => <option key={p.id} value={p.id}>{p.buildings?.name} — {p.name}</option>)}
                    </select>
                  : <select className="input" value={form.building_id} onChange={e => setForm({...form, building_id: e.target.value})} required>
                      <option value="">Выберите здание</option>
                      {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                }
              </div>
              <div>
                <label className="label">Категория</label>
                <select className="input" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} required>
                  <option value="">Выберите категорию</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Сумма</label>
                <input className="input" type="number" placeholder="0" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
              </div>
              <div>
                <label className="label">Дата</label>
                <input className="input" type="date" value={form.expense_date} onChange={e => setForm({...form, expense_date: e.target.value})} required />
              </div>
              <div>
                <label className="label">Комментарий</label>
                <input className="input" value={form.comment} onChange={e => setForm({...form, comment: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>{loading ? '...' : 'Сохранить'}</button>
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowForm(false)}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">Дата</th>
            <th className="table-header">Объект</th>
            <th className="table-header">Категория</th>
            <th className="table-header">Сумма</th>
            <th className="table-header">Комментарий</th>
            <th className="table-header"></th>
          </tr></thead>
          <tbody>
            {expenses.map((item: any) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="table-cell">{formatDate(item.expense_date)}</td>
                <td className="table-cell">{item.property_id ? `${item.properties?.buildings?.name} — ${item.properties?.name}` : `${item.buildings?.name} (здание)`}</td>
                <td className="table-cell"><span className="badge-warning">{item.expense_categories?.name}</span></td>
                <td className="table-cell font-semibold text-red-600">{formatCurrency(item.amount)}</td>
                <td className="table-cell text-slate-400">{item.comment || '—'}</td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(item)} className="p-1 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && <tr><td colSpan={6} className="table-cell text-center text-slate-400 py-8">Нет записей</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
