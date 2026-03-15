'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, MONTHS } from '@/lib/utils';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';

const COL = {
  obj:    { width: '30%', textAlign: 'left'   as const },
  plan:   { width: '14%', textAlign: 'right'  as const },
  fact:   { width: '14%', textAlign: 'right'  as const },
  exp:    { width: '14%', textAlign: 'right'  as const },
  profit: { width: '18%', textAlign: 'right'  as const },
  pct:    { width: '10%', textAlign: 'center' as const },
};

export default function ReportsClient() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [properties, setProperties] = useState<any[]>([]);
  const [income, setIncome] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const [{ data: p }, { data: i }, { data: e }] = await Promise.all([
        supabase.from('properties').select('*, buildings(name)').order('name'),
        supabase.from('income').select('*').eq('is_deleted', false).gte('income_date', startDate).lte('income_date', endDate),
        supabase.from('expenses').select('*').eq('is_deleted', false).gte('expense_date', startDate).lte('expense_date', endDate),
      ]);
      setProperties(p || []);
      setIncome(i || []);
      setExpenses(e || []);
      setLoading(false);
    };
    load();
  }, [year, month]);

  const rows = properties.map((p: any) => {
    const propIncome   = income.filter((i: any) => i.property_id === p.id).reduce((s: number, i: any) => s + Number(i.amount), 0);
    const propExpenses = expenses.filter((e: any) => e.property_id === p.id).reduce((s: number, e: any) => s + Number(e.amount), 0);
    const netProfit    = propIncome - propExpenses;
    const planPercent  = p.planned_income > 0 ? Math.round((propIncome / p.planned_income) * 100) : null;
    return { ...p, propIncome, propExpenses, netProfit, planPercent };
  });

  const totalPlan     = rows.reduce((s: number, r: any) => s + Number(r.planned_income || 0), 0);
  const totalIncome   = rows.reduce((s: number, r: any) => s + r.propIncome, 0);
  const totalExpenses = rows.reduce((s: number, r: any) => s + r.propExpenses, 0);
  const totalProfit   = totalIncome - totalExpenses;
  const totalPlanPct  = totalPlan > 0 ? Math.round((totalIncome / totalPlan) * 100) : null;

  const prev = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const exportExcel = async () => {
    const XLSX = (await import('xlsx')).default;
    const wsData = [
      ['Объект', 'План', 'Факт дохода', 'Расходы', 'Чистая прибыль', '% плана'],
      ...rows.map((r: any) => [`${r.buildings?.name} — ${r.name}`, r.planned_income, r.propIncome, r.propExpenses, r.netProfit, r.planPercent != null ? `${r.planPercent}%` : '—']),
      ['ИТОГО', totalPlan, totalIncome, totalExpenses, totalProfit, totalPlanPct != null ? `${totalPlanPct}%` : '—'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'P&L');
    XLSX.writeFile(wb, `PL_${year}_${month}.xlsx`);
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">P&amp;L Отчёт</h1>
          <p className="text-slate-400 text-xs mt-0.5">{MONTHS[month - 1]} {year}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period switcher */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl px-1 py-1">
            <button onClick={prev} className="p-1.5 hover:bg-white rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <span className="text-sm font-medium text-slate-700 px-1 hidden sm:inline">
              {MONTHS[month - 1]} {year}
            </span>
            <button onClick={next} className="p-1.5 hover:bg-white rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <button className="btn-secondary" onClick={exportExcel}>
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="card">
          <p className="text-xs text-slate-400 mb-1">План</p>
          <p className="text-sm font-bold text-slate-700 truncate">{formatCurrency(totalPlan)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-400 mb-1">Факт</p>
          <p className="text-sm font-bold text-green-600 truncate">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-400 mb-1">Расходы</p>
          <p className="text-sm font-bold text-red-500 truncate">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-400 mb-1">Прибыль</p>
          <p className={`text-sm font-bold truncate ${totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(totalProfit)}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-12">Загрузка...</div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="md:hidden space-y-2">
            {rows.length === 0 && <p className="text-center text-slate-400 py-8">Нет данных</p>}
            {rows.map((r: any) => (
              <div key={r.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-800 flex-1 mr-3">{r.buildings?.name} — {r.name}</p>
                  {r.planPercent != null && (
                    <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                      r.planPercent >= 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>{r.planPercent}%</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-slate-400">План</p>
                    <p className="font-medium text-slate-600 truncate">{formatCurrency(r.planned_income)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Доход</p>
                    <p className="font-semibold text-green-600 truncate">{formatCurrency(r.propIncome)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Прибыль</p>
                    <p className={`font-bold truncate ${r.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(r.netProfit)}</p>
                  </div>
                </div>
                {r.planPercent != null && (
                  <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${r.planPercent >= 100 ? 'bg-green-500' : 'bg-blue-400'}`}
                      style={{ width: `${Math.min(r.planPercent, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block card p-0 overflow-hidden">
            <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
              <thead>
                <tr className="bg-slate-50">
                  <th className="table-header" style={COL.obj}>Объект</th>
                  <th className="table-header" style={COL.plan}>План</th>
                  <th className="table-header" style={COL.fact}>Факт дохода</th>
                  <th className="table-header" style={COL.exp}>Расходы</th>
                  <th className="table-header" style={COL.profit}>Чистая прибыль</th>
                  <th className="table-header" style={COL.pct}>% плана</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={6} className="table-cell text-center text-slate-400 py-8">Нет данных за выбранный период</td></tr>
                )}
                {rows.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50 border-b border-slate-50">
                    <td className="table-cell font-medium" style={COL.obj}>{r.buildings?.name} — {r.name}</td>
                    <td className="table-cell text-slate-500" style={COL.plan}>{formatCurrency(r.planned_income)}</td>
                    <td className="table-cell font-semibold text-green-600" style={COL.fact}>{formatCurrency(r.propIncome)}</td>
                    <td className="table-cell text-red-500" style={COL.exp}>{formatCurrency(r.propExpenses)}</td>
                    <td className={`table-cell font-bold ${r.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`} style={COL.profit}>{formatCurrency(r.netProfit)}</td>
                    <td className="table-cell" style={COL.pct}>
                      {r.planPercent != null && (
                        <span className={r.planPercent >= 100 ? 'badge-success' : 'badge-danger'}>{r.planPercent}%</span>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length > 0 && (
                  <tr className="bg-slate-100 font-bold">
                    <td className="table-cell" style={COL.obj}>ИТОГО</td>
                    <td className="table-cell text-slate-600" style={COL.plan}>{formatCurrency(totalPlan)}</td>
                    <td className="table-cell text-green-600" style={COL.fact}>{formatCurrency(totalIncome)}</td>
                    <td className="table-cell text-red-500" style={COL.exp}>{formatCurrency(totalExpenses)}</td>
                    <td className={`table-cell ${totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`} style={COL.profit}>{formatCurrency(totalProfit)}</td>
                    <td className="table-cell" style={COL.pct}>
                      {totalPlanPct != null && (
                        <span className={totalPlanPct >= 100 ? 'badge-success' : 'badge-danger'}>{totalPlanPct}%</span>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
