'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2 } from 'lucide-react';

export default function SettingsClient() {
  const [categories, setCategories] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [{ data: cats }, { data: logs }] = await Promise.all([
        supabase.from('expense_categories').select('*').order('name'),
        supabase.from('audit_log').select('*').order('changed_at', { ascending: false }).limit(50),
      ]);
      setCategories(cats || []);
      setAuditLog(logs || []);
      setLoading(false);
    };
    load();
  }, []);

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    const supabase = createClient();
    const { data } = await supabase.from('expense_categories').insert({ name: newCategory }).select().single();
    if (data) setCategories([...categories, data]);
    setNewCategory('');
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Удалить категорию?')) return;
    const supabase = createClient();
    await supabase.from('expense_categories').delete().eq('id', id);
    setCategories(categories.filter((c: any) => c.id !== id));
  };

  if (loading) return <div className="p-8 text-slate-400">Загрузка...</div>;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">Настройки</h1>

      <div className="card">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Категории расходов</h2>
        <div className="flex gap-3 mb-4">
          <input className="input" placeholder="Новая категория" value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCategory()} />
          <button className="btn-primary" onClick={addCategory}><Plus className="w-4 h-4" /> Добавить</button>
        </div>
        <div className="space-y-2">
          {categories.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between bg-slate-50 px-4 py-2 rounded-lg">
              <span className="text-sm text-slate-700">{c.name}</span>
              <button onClick={() => deleteCategory(c.id)} className="p-1 hover:text-red-600 text-slate-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Журнал действий</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {auditLog.length === 0 && <p className="text-slate-400 text-sm">Журнал пуст</p>}
          {auditLog.map((log: any) => (
            <div key={log.id} className="flex items-center gap-4 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded">
              <span className="font-mono">{new Date(log.changed_at).toLocaleString('ru-RU')}</span>
              <span className={`font-semibold ${
                log.action === 'INSERT' ? 'text-green-600' :
                log.action === 'DELETE' ? 'text-red-600' : 'text-blue-600'
              }`}>{log.action}</span>
              <span>{log.table_name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
