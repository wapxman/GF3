'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, TrendingDown, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency, MONTHS } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // filter state
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterProperty, setFilterProperty] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [owners, setOwners] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const [
        { data: buildings },
        { data: properties },
        { data: income },
        { data: expenses },
        { data: ownersData },
        { data: sharesData },
      ] = await Promise.all([
        supabase.from('buildings').select('*').order('name'),
        supabase.from('properties').select('*, buildings(name)').eq('status', 'active').order('name'),
        supabase.from('income').select('*').eq('is_deleted', false).gte('income_date', startDate).lte('income_date', endDate),
        supabase.from('expenses').select('*').eq('is_deleted', false).gte('expense_date', startDate).lte('expense_date', endDate),
        supabase.from('profiles').select('id, full_name').eq('role', 'owner'),
        supabase.from('property_shares').select('*').is('valid_to', null),
      ]);
      setData({ buildings: buildings || [], properties: properties || [], income: income || [], expenses: expenses || [] });
      setOwners(ownersData || []);
      setShares(sharesData || []);
      setLoading(false);
    };
    load();
  }, [year, month]);

  const prev = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  if (!data) return <div className="page-content text-slate-400">Загрузка...</div>;

  const { buildings, income, expenses } = data;

  // Filter properties by building
  let properties = data.properties;
  if (filterBuilding) properties = properties.filter((p: any) => p.building_id === filterBuilding);
  if (filterOwner) {
    const ownerPropIds = shares.filter((s: any) => s.owner_id === filterOwner).map((s: any) => s.property_id);
    properties = properties.filter((p: any) => ownerPropIds.includes(p.id));
  }
  if (filterProperty) properties = properties.filter((p: any) => p.id === filterProperty);

  // Filter income/expenses to matching properties
  const propIds = properties.map((p: any) => p.id);
  const filteredIncome = income.filter((i: any) => propIds.includes(i.property_id));
  const filteredExpenses = expenses.filter((e: any) => propIds.includes(e.property_id));

  const totalIncome   = filteredIncome.reduce((s: number, i: any) => s + Number(i.amount), 0);
  const totalExpenses = filteredExpenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const netProfit     = totalIncome - totalExpenses;
  const totalPlan     = properties.reduce((s: number, p: any) => s + Number(p.planned_income), 0);
  const planPercent   = totalPlan > 0 ? Math.round((totalIncome / totalPlan) * 100) : 0;

  const propertyStats = properties.map((p: any) => ({
    name: p.name,
    income:   filteredIncome.filter((i: any) => i.property_id === p.id).reduce((s: number, i: any) => s + Number(i.amount), 0),
    expenses: filteredExpenses.filter((e: any) => e.property_id === p.id).reduce((s: number, e: any) => s + Number(e.amount), 0),
    plan: Number(p.planned_income),
  })).map((p: any) => ({ ...p, profit: p.income - p.expenses }));

  // Properties filtered by selected building (for property dropdown)
  const propsForDropdown = filterBuilding
    ? data.properties.filter((p: any) => p.building_id === filterBuilding)
    : data.properties;

  return (
    <div className="page-content">

      {/* === HEADER === */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Дашборд</h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
            <Building2 className="w-3 h-3" />
            <span>{buildings.length} зд. · {data.properties.length} объ.</span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl px-1 py-1">
          <button onClick={prev} className="p-1.5 hover:bg-white rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <span className="text-sm font-medium text-slate-700 px-2 min-w-[90px] text-center">
            {MONTHS[month - 1]} {year}
          </span>
          <button onClick={next} className="p-1.5 hover:bg-white rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* === FILTERS === */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <select className="input text-sm" value={filterBuilding} onChange={e => { setFilterBuilding(e.target.value); setFilterProperty(''); }}>
          <option value="">Все здания</option>
          {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="input text-sm" value={filterProperty} onChange={e => setFilterProperty(e.target.value)}>
          <option value="">Все объекты</option>
          {propsForDropdown.map((p: any) => <option key={p.id} value={p.id}>{p.buildings?.name} — {p.name}</option>)}
        </select>
        <select className="input text-sm" value={filterOwner} onChange={e => { setFilterOwner(e.target.value); setFilterProperty(''); }}>
          <option value="">Все владельцы</option>
          {owners.map((o: any) => <option key={o.id} value={o.id}>{o.full_name}</option>)}
        </select>
      </div>

      {/* === HERO === */}
      <div className="card mb-3">
        <p className="text-xs text-slate-400 mb-1">Чистая прибыль</p>
        <p className={`text-2xl md:text-3xl font-bold tracking-tight ${
          netProfit >= 0 ? 'text-slate-800' : 'text-red-600'
        }`}>
          {formatCurrency(netProfit)}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                planPercent >= 100 ? 'bg-green-500' : planPercent >= 50 ? 'bg-blue-500' : 'bg-orange-400'
              }`}
              style={{ width: `${Math.min(planPercent, 100)}%` }}
            />
          </div>
          <span className={`text-xs font-semibold ${
            planPercent >= 100 ? 'text-green-600' : 'text-orange-600'
          }`}>{planPercent}%</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Выполнение плана</p>
      </div>

      {/* === 2 карточки === */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="card">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-5 h-5 bg-green-50 rounded flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-green-600" />
            </div>
            <span className="text-xs text-slate-400">Доходы</span>
          </div>
          <p className="text-sm md:text-base font-bold text-green-600 leading-tight">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-5 h-5 bg-red-50 rounded flex items-center justify-center">
              <TrendingDown className="w-3 h-3 text-red-600" />
            </div>
            <span className="text-xs text-slate-400">Расходы</span>
          </div>
          <p className="text-sm md:text-base font-bold text-red-600 leading-tight">{formatCurrency(totalExpenses)}</p>
        </div>
      </div>

      {/* === Список объектов === */}
      {propertyStats.length > 0 && (
        <div className="card mb-3">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Объекты</h2>
          <div className="space-y-3">
            {propertyStats.map((p: any) => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-600 truncate mr-4" style={{ maxWidth: '60%' }}>{p.name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {p.plan > 0 && (
                      <span className="text-xs text-slate-400">{Math.round((p.income / p.plan) * 100)}%</span>
                    )}
                    <span className={`text-xs font-bold ${
                      p.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>{formatCurrency(p.profit)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      p.plan > 0 && p.income >= p.plan ? 'bg-green-500' : 'bg-blue-400'
                    }`}
                    style={{ width: `${p.plan > 0 ? Math.min((p.income / p.plan) * 100, 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === График — только desktop === */}
      {!loading && propertyStats.length > 0 && (
        <div className="hidden md:block card">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Доходы и расходы по объектам</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={propertyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" name="Доход" fill="#22c55e" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" name="Расход" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}
