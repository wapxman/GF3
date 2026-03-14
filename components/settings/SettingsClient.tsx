'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2 } from 'lucide-react';

export default function SettingsClient({ profile, categories: initialCategories, auditLog }: any) {
  const [categories, setCategories] = useState(initialCategories);
  const [newCategory, setNewCategory] = useState('');
  const supabase = createClient();

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    const { data } = await supabase.from('expense_categories').insert({ name: newCategory }).select().single();
    setCategories([...categories, data]);
    setNewCategory('');
  };

  const deleteCategory = async (id: string) => {
    await supabase.from('expense_categories').delete().eq('id', id);
    setCategories(categories.filter((c: any) => c.id !== id));
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">Настройки</h1>

      <div className="card">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Категории расходов</h2>
        <div className="flex gap-3 mb-4">
          <input className="input" placeholder="Новая категория" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
          <button className="btn-primary" onClick={addCategory}><Plus className="w-4 h-4" /> Добавить</button>
        </div>
        <div className="space-y-2">
          {categories.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between bg-slate-50 px-4 py-2 rounded-lg">
              <span className="text-sm text-slate-700">{c.name}</span>
              <button onClick={() => deleteCategory(c.id)} className="p-1 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Журнал действий</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {auditLog.map((log: any) => (
            <div key={log.id} className="flex items-center gap-4 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded">
              <span className="font-mono">{new Date(log.changed_at).toLocaleString('ru-RU')}</span>
              <span className={`font-semibold ${log.action === 'INSERT' ? 'text-green-600' : log.action === 'DELETE' ? 'text-red-600' : 'text-blue-600'}`}>{log.action}</span>
              <span>{log.table_name}</span>
            </div>
          ))}
          {auditLog.length === 0 && <p className="text-slate-400 text-sm">Журнал пуст</p>}
        </div>
      </div>
    </div>
  );
}
