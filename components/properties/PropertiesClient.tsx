'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Pencil, Archive, Building2, Trash2, ArchiveRestore } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const COL = {
  building: { width: '25%', textAlign: 'left'   as const },
  office:   { width: '25%', textAlign: 'left'   as const },
  plan:     { width: '20%', textAlign: 'right'  as const },
  status:   { width: '15%', textAlign: 'center' as const },
  actions:  { width: '15%', textAlign: 'right'  as const },
};

export default function PropertiesClient({ buildings: initialBuildings, properties: initialProperties }: any) {
  const [buildings, setBuildings] = useState(initialBuildings);
  const [properties, setProperties] = useState(initialProperties);
  const [showBuildingForm, setShowBuildingForm] = useState(false);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<any>(null);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [bForm, setBForm] = useState({ name: '' });
  const [pForm, setPForm] = useState({ building_id: '', name: '', planned_income: '' });
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSaveBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (editingBuilding) {
      const { data } = await supabase.from('buildings').update({ name: bForm.name }).eq('id', editingBuilding.id).select().single();
      setBuildings(buildings.map((b: any) => b.id === editingBuilding.id ? { ...b, ...data } : b));
    } else {
      const { data } = await supabase.from('buildings').insert({ name: bForm.name }).select().single();
      setBuildings([...buildings, { ...data, properties: [] }]);
    }
    setShowBuildingForm(false);
    setEditingBuilding(null);
    setBForm({ name: '' });
    setLoading(false);
  };

  const handleDeleteBuilding = async (id: string) => {
    if (!confirm('Удалить здание? Все офисы также будут удалены.')) return;
    const { error } = await supabase.from('buildings').delete().eq('id', id);
    if (error) { alert('Нельзя удалить: ' + error.message); return; }
    setBuildings(buildings.filter((b: any) => b.id !== id));
    setProperties(properties.filter((p: any) => p.building_id !== id));
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
    if (!confirm('Архивировать офис?')) return;
    await supabase.from('properties').update({ status: 'archived' }).eq('id', id);
    setProperties(properties.map((p: any) => p.id === id ? { ...p, status: 'archived' } : p));
  };

  const handleUnarchive = async (id: string) => {
    await supabase.from('properties').update({ status: 'active' }).eq('id', id);
    setProperties(properties.map((p: any) => p.id === id ? { ...p, status: 'active' } : p));
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Объекты</h1>
        <div className="flex gap-3">
          <button className="btn-secondary" onClick={() => { setShowBuildingForm(true); setEditingBuilding(null); setBForm({ name: '' }); }}>
            <Building2 className="w-4 h-4" /> Добавить здание
          </button>
          <button className="btn-primary" onClick={() => { setShowPropertyForm(true); setEditingProperty(null); setPForm({ building_id: '', name: '', planned_income: '' }); }}>
            <Plus className="w-4 h-4" /> Добавить офис
          </button>
        </div>
      </div>

      {/* Здания */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Здания</h2>
        {buildings.length === 0 && <p className="text-slate-400 text-sm">Нет зданий</p>}
        <div className="space-y-2">
          {buildings.map((b: any) => (
            <div key={b.id} className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-lg">
              <span className="font-medium text-slate-700">{b.name}</span>
              <div className="flex gap-2">
                <button onClick={() => { setEditingBuilding(b); setBForm({ name: b.name }); setShowBuildingForm(true); }} className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteBuilding(b.id)} className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Форма здания */}
      {showBuildingForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">{editingBuilding ? 'Редактировать здание' : 'Новое здание'}</h2>
            <form onSubmit={handleSaveBuilding} className="space-y-4">
              <div><label className="label">Название</label><input className="input" value={bForm.name} onChange={e => setBForm({ name: e.target.value })} required /></div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>Сохранить</button>
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowBuildingForm(false)}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Форма офиса */}
      {showPropertyForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{editingProperty ? 'Редактировать офис' : 'Новый офис'}</h2>
            <form onSubmit={handleSaveProperty} className="space-y-4">
              <div>
                <label className="label">Здание</label>
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

      {/* Таблица офисов */}
      <div className="card p-0 overflow-hidden">
        <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
          <thead>
            <tr className="bg-slate-50">
              <th className="table-header" style={COL.building}>Здание</th>
              <th className="table-header" style={COL.office}>Офис</th>
              <th className="table-header" style={COL.plan}>План дохода</th>
              <th className="table-header" style={COL.status}>Статус</th>
              <th className="table-header" style={COL.actions}></th>
            </tr>
          </thead>
          <tbody>
            {properties.length === 0 && (
              <tr><td colSpan={5} className="table-cell text-center text-slate-400 py-8">Нет офисов</td></tr>
            )}
            {properties.map((p: any) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="table-cell" style={COL.building}>{p.buildings?.name}</td>
                <td className="table-cell font-medium" style={COL.office}>{p.name}</td>
                <td className="table-cell" style={COL.plan}>{formatCurrency(p.planned_income)}</td>
                <td className="table-cell" style={COL.status}>
                  {p.status === 'active'
                    ? <span className="badge-success">Активен</span>
                    : <span className="badge-warning">Архив</span>}
                </td>
                <td className="table-cell" style={COL.actions}>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => { setEditingProperty(p); setPForm({ building_id: p.building_id, name: p.name, planned_income: String(p.planned_income) }); setShowPropertyForm(true); }}
                      className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {p.status === 'active'
                      ? <button onClick={() => handleArchive(p.id)} className="p-1.5 hover:text-orange-600 hover:bg-orange-50 rounded" title="Архивировать">
                          <Archive className="w-4 h-4" />
                        </button>
                      : <button onClick={() => handleUnarchive(p.id)} className="p-1.5 hover:text-green-600 hover:bg-green-50 rounded" title="Активировать">
                          <ArchiveRestore className="w-4 h-4" />
                        </button>
                    }
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
