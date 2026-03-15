'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, MONTHS } from '@/lib/utils';
import { Download } from 'lucide-react';

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

  const exportExcel = async () => {
    const XLSX = (await import('xlsx')).default;
    const wsData = [
      ['Объект', 'План', 'Факт дохода', 'Расходы', 'Чистая прибыль', '% плана'],
      ...rows.map((r: any) => [
        `${r.buildings?.name} — ${r.name}`,
        r.planned_income, r.propIncome, r.propExpenses, r.netProfit,
        r.planPercent != null ? `${r.planPercent}%` : '—',
      ]),
      ['ИТОГО', totalPlan, totalIncome, totalExpenses, totalProfit, totalPlanPct != null ? `${totalPlanPct}%` : '—'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'P&L');
    XLSX.writeFile(wb, `PL_${year}_${month}.xlsx`);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">P&amp;L Отчёт</h1>
          <p className="text-slate-500">{MONTHS[month - 1]} {year}</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input w-auto" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="input w-auto" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn-secondary" onClick={exportExcel}>
            <Download className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-12">Загрузка...</div>
      ) : (
        <div className="card p-0 overflow-hidden">
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
                <tr>
                  <td colSpan={6} className="table-cell text-center text-slate-400 py-8">
                    Нет данных за выбранный период
                  </td>
                </tr>
              )}
              {rows.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50 border-b border-slate-50">
                  <td className="table-cell font-medium" style={COL.obj}>
                    {r.buildings?.name} — {r.name}
                  </td>
                  <td className="table-cell text-slate-500" style={COL.plan}>
                    {formatCurrency(r.planned_income)}
                  </td>
                  <td className="table-cell font-semibold text-green-600" style={COL.fact}>
                    {formatCurrency(r.propIncome)}
                  </td>
                  <td className="table-cell text-red-500" style={COL.exp}>
                    {formatCurrency(r.propExpenses)}
                  </td>
                  <td className={`table-cell font-bold ${r.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`} style={COL.profit}>
                    {formatCurrency(r.netProfit)}
                  </td>
                  <td className="table-cell" style={COL.pct}>
                    {r.planPercent != null && (
                      <span className={r.planPercent >= 100 ? 'badge-success' : 'badge-danger'}>
                        {r.planPercent}%
                      </span>
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
                      <span className={totalPlanPct >= 100 ? 'badge-success' : 'badge-danger'}>
                        {totalPlanPct}%
                      </span>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
