'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, MONTHS } from '@/lib/utils';

export default function IncomeClient({ properties, income: initialIncome }: { properties: any[], income: any[] }) {
  const [income, setIncome] = useState(initialIncome);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ property_id: '', amount: '', income_date: '', comment: '' });
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { property_id: form.property_id, amount: Number(form.amount), income_date: form.income_date, comment: form.comment };
    if (editing) {
      const { data } = await supabase.from('income').update(payload).eq('id', editing.id).select('*, properties(name, buildings(name))').single();
      setIncome(income.map(i => i.id === editing.id ? data : i));
    } else {
      const { data } = await supabase.from('income').insert(payload).select('*, properties(name, buildings(name))').single();
      setIncome([data, ...income]);
    }
    setShowForm(false); setEditing(null);
    setForm({ property_id: '', amount: '', income_date: '', comment: '' });
    setLoading(false);
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setForm({ property_id: item.property_id, amount: String(item.amount), income_date: item.income_date, comment: item.comment || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить запись?')) return;
    await supabase.from('income').update({ is_deleted: true }).eq('id', id);
    setIncome(income.filter(i => i.id !== id));
  };

  const total = income.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Доходы</h1>
          <p className="text-slate-500 text-sm">Итого: <span className="font-semibold text-green-600">{formatCurrency(total)}</span></p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditing(null); setForm({ property_id: '', amount: '', income_date: '', comment: '' }); }}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Добавить доход</span>
          <span className="sm:hidden">Добавить</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md">
            <h2 className="text-lg font-bold text-slate-800 mb-4">{editing ? 'Редактировать доход' : 'Новый доход'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Объект</label>
                <select className="input" value={form.property_id} onChange={e => setForm({...form, property_id: e.target.value})} required>
                  <option value="">Выберите объект</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.buildings?.name} — {p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Сумма</label>
                <input className="input" type="number" placeholder="0" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
              </div>
              <div>
                <label className="label">Дата</label>
                <input className="input" type="date" value={form.income_date} onChange={e => setForm({...form, income_date: e.target.value})} required />
              </div>
              <div>
                <label className="label">Комментарий</label>
                <input className="input" value={form.comment} onChange={e => setForm({...form, comment: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowForm(false)}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {income.length === 0 && <p className="text-center text-slate-400 py-8">Нет записей</p>}
        {income.map(item => (
          <div key={item.id} className="card flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.properties?.buildings?.name} — {item.properties?.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{formatDate(item.income_date)}</p>
              {item.comment && <p className="text-xs text-slate-400">{item.comment}</p>}
            </div>
            <div className="flex items-center gap-3 ml-4">
              <span className="text-sm font-bold text-green-600 whitespace-nowrap">{formatCurrency(item.amount)}</span>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(item)} className="p-1.5 hover:text-blue-600 rounded"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">Дата</th>
            <th className="table-header">Объект</th>
            <th className="table-header">Сумма</th>
            <th className="table-header">Комментарий</th>
            <th className="table-header"></th>
          </tr></thead>
          <tbody>
            {income.map(item => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="table-cell">{formatDate(item.income_date)}</td>
                <td className="table-cell">{item.properties?.buildings?.name} — {item.properties?.name}</td>
                <td className="table-cell font-semibold text-green-600">{formatCurrency(item.amount)}</td>
                <td className="table-cell text-slate-400">{item.comment || '—'}</td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(item)} className="p-1 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {income.length === 0 && <tr><td colSpan={5} className="table-cell text-center text-slate-400 py-8">Нет записей</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
