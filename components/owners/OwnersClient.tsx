'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, UserPlus } from 'lucide-react';

export default function OwnersClient({ owners: initialOwners, properties, shares: initialShares }: any) {
  const [owners, setOwners] = useState(initialOwners);
  const [shares, setShares] = useState(initialShares);
  const [showShareForm, setShowShareForm] = useState(false);
  const [showOwnerForm, setShowOwnerForm] = useState(false);
  const [sForm, setSForm] = useState({ owner_id: '', property_id: '', share_percent: '', valid_from: new Date().toISOString().split('T')[0] });
  const [oForm, setOForm] = useState({ full_name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [oError, setOError] = useState('');
  const supabase = createClient();

  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setOError('');
    const { data, error } = await supabase.auth.signUp({
      email: oForm.email,
      password: oForm.password,
      options: { data: { full_name: oForm.full_name, role: 'owner' } }
    });
    if (error) { setOError(error.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, full_name: oForm.full_name, phone: oForm.phone, role: 'owner' });
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      if (profile) setOwners([...owners, profile]);
    }
    setShowOwnerForm(false);
    setOForm({ full_name: '', email: '', password: '', phone: '' });
    setLoading(false);
  };

  const handleAddShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.from('property_shares')
      .insert({ owner_id: sForm.owner_id, property_id: sForm.property_id, share_percent: Number(sForm.share_percent), valid_from: sForm.valid_from })
      .select('*, profiles(full_name), properties(name, buildings(name))').single();
    if (error) { alert(error.message); setLoading(false); return; }
    setShares([...shares, data]);
    setShowShareForm(false);
    setSForm({ owner_id: '', property_id: '', share_percent: '', valid_from: new Date().toISOString().split('T')[0] });
    setLoading(false);
  };

  const closeShare = async (id: string) => {
    await supabase.from('property_shares').update({ valid_to: new Date().toISOString().split('T')[0] }).eq('id', id);
    setShares(shares.filter((s: any) => s.id !== id));
  };

  const ownerShares = owners.map((o: any) => ({ ...o, shares: shares.filter((s: any) => s.owner_id === o.id) }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Владельцы и доли</h1>
        <div className="flex gap-3">
          <button className="btn-secondary" onClick={() => setShowOwnerForm(true)}><UserPlus className="w-4 h-4" /> Добавить владельца</button>
          <button className="btn-primary" onClick={() => setShowShareForm(true)}><Plus className="w-4 h-4" /> Добавить долю</button>
        </div>
      </div>

      {showOwnerForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Новый владелец</h2>
            <form onSubmit={handleAddOwner} className="space-y-4">
              <div><label className="label">Полное имя</label><input className="input" value={oForm.full_name} onChange={e => setOForm({...oForm, full_name: e.target.value})} required /></div>
              <div><label className="label">Email</label><input className="input" type="email" value={oForm.email} onChange={e => setOForm({...oForm, email: e.target.value})} required /></div>
              <div><label className="label">Пароль</label><input className="input" type="password" value={oForm.password} onChange={e => setOForm({...oForm, password: e.target.value})} required minLength={6} /></div>
              <div><label className="label">Телефон</label><input className="input" value={oForm.phone} onChange={e => setOForm({...oForm, phone: e.target.value})} /></div>
              {oError && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{oError}</p>}
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>{loading ? '...' : 'Создать'}</button>
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowOwnerForm(false)}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showShareForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Назначить долю</h2>
            <form onSubmit={handleAddShare} className="space-y-4">
              <div><label className="label">Владелец</label>
                <select className="input" value={sForm.owner_id} onChange={e => setSForm({...sForm, owner_id: e.target.value})} required>
                  <option value="">Выберите владельца</option>
                  {owners.map((o: any) => <option key={o.id} value={o.id}>{o.full_name}</option>)}
                </select>
              </div>
              <div><label className="label">Объект</label>
                <select className="input" value={sForm.property_id} onChange={e => setSForm({...sForm, property_id: e.target.value})} required>
                  <option value="">Выберите объект</option>
                  {properties.map((p: any) => <option key={p.id} value={p.id}>{p.buildings?.name} — {p.name}</option>)}
                </select>
              </div>
              <div><label className="label">Доля (%)</label><input className="input" type="number" min="1" max="100" value={sForm.share_percent} onChange={e => setSForm({...sForm, share_percent: e.target.value})} required /></div>
              <div><label className="label">Действует с</label><input className="input" type="date" value={sForm.valid_from} onChange={e => setSForm({...sForm, valid_from: e.target.value})} required /></div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>{loading ? '...' : 'Сохранить'}</button>
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowShareForm(false)}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {ownerShares.length === 0 && <p className="text-slate-400 text-center py-12">Добавьте первого владельца</p>}
        {ownerShares.map((o: any) => (
          <div key={o.id} className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                {o.full_name?.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-800">{o.full_name}</p>
                <p className="text-sm text-slate-400">{o.role === 'admin' ? 'Администратор' : 'Владелец'}</p>
              </div>
            </div>
            {o.shares.length > 0 ? (
              <div className="space-y-2">
                {o.shares.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between bg-slate-50 px-4 py-2 rounded-lg">
                    <span className="text-sm text-slate-700">{s.properties?.buildings?.name} — {s.properties?.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="badge-success">{s.share_percent}%</span>
                      <button onClick={() => closeShare(s.id)} className="text-xs text-red-400 hover:text-red-600">Закрыть</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400">Нет долей</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
