'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Pencil, Archive, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function PropertiesClient({ buildings: initialBuildings, properties: initialProperties }: any) {
  const [buildings, setBuildings] = useState(initialBuildings);
  const [properties, setProperties] = useState(initialProperties);
  const [showBuildingForm, setShowBuildingForm] = useState(false);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [bForm, setBForm] = useState({ name: '' });
  const [pForm, setPForm] = useState({ building_id: '', name: '', planned_income: '' });
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleAddBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data } = await supabase.from('buildings').insert({ name: bForm.name }).select().single();
    setBuildings([...buildings, { ...data, properties: [] }]);
    setShowBuildingForm(false);
    setBForm({ name: '' });
    setLoading(false);
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { building_id: pForm.building_id, name: pForm.name, planned_income: Number(pForm.planned_income) };
    if (editingProperty) {
      const { data } = await supabase.from('properties').update(payload).eq('id', editingProperty.id).select('*, buildings(name)').single();
      setProperties(properties.map((p: any) => p.id === editingProperty.id ? data : p));
    } else {
      const { data } = await supabase.from('properties').insert(payload).select('*, buildings(name)').single();
      setProperties([...properties, data]);
    }
    setShowPropertyForm(false);
    setEditingProperty(null);
    setPForm({ building_id: '', name: '', planned_income: '' });
    setLoading(false);
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Архивировать объект?')) return;
    await supabase.from('properties').update({ status: 'archived' }).eq('id', id);
    setProperties(properties.map((p: any) => p.id === id ? { ...p, status: 'archived' } : p));
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Объекты</h1>
        <div className="flex gap-3">
          <button className="btn-secondary" onClick={() => setShowBuildingForm(true)}><Building2 className="w-4 h-4" /> Добавить здание</button>
          <button className="btn-primary" onClick={() => { setShowPropertyForm(true); setEditingProperty(null); setPForm({ building_id: '', name: '', planned_income: '' }); }}><Plus className="w-4 h-4" /> Добавить офис</button>
        </div>
      </div>

      {showBuildingForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Новое здание</h2>
            <form onSubmit={handleAddBuilding} className="space-y-4">
              <div><label className="label">Название</label><input className="input" value={bForm.name} onChange={e => setBForm({name: e.target.value})} required /></div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>Сохранить</button>
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowBuildingForm(false)}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPropertyForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{editingProperty ? 'Редактировать офис' : 'Новый офис'}</h2>
            <form onSubmit={handleSaveProperty} className="space-y-4">
              <div><label className="label">Здание</label>
                <select className="input" value={pForm.building_id} onChange={e => setPForm({...pForm, building_id: e.target.value})} required>
                  <option value="">Выберите здание</option>
                  {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div><label className="label">Название офиса</label><input className="input" value={pForm.name} onChange={e => setPForm({...pForm, name: e.target.value})} required /></div>
              <div><label className="label">Плановый доход</label><input className="input" type="number" value={pForm.planned_income} onChange={e => setPForm({...pForm, planned_income: e.target.value})} /></div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>Сохранить</button>
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowPropertyForm(false)}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">Здание</th>
            <th className="table-header">Офис</th>
            <th className="table-header text-right">План дохода</th>
            <th className="table-header text-center">Статус</th>
            <th className="table-header"></th>
          </tr></thead>
          <tbody>
            {properties.map((p: any) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="table-cell">{p.buildings?.name}</td>
                <td className="table-cell font-medium">{p.name}</td>
                <td className="table-cell text-right">{formatCurrency(p.planned_income)}</td>
                <td className="table-cell text-center">
                  {p.status === 'active' ? <span className="badge-success">Активен</span> : <span className="badge-warning">Архив</span>}
                </td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingProperty(p); setPForm({ building_id: p.building_id, name: p.name, planned_income: String(p.planned_income) }); setShowPropertyForm(true); }} className="p-1 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                    {p.status === 'active' && <button onClick={() => handleArchive(p.id)} className="p-1 hover:text-orange-600"><Archive className="w-4 h-4" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
