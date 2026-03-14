'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, MONTHS } from '@/lib/utils';
import { Calculator, CheckCircle, Download } from 'lucide-react';

export default function DividendsClient({ profile, properties, owners, shares, dividends: initialDividends, income, expenses }: any) {
  const [dividends, setDividends] = useState(initialDividends);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const isAdmin = profile?.role === 'admin';

  const calculate = async () => {
    setLoading(true);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const monthIncome = income.filter((i: any) => i.income_date >= startDate && i.income_date <= endDate);
    const monthExpenses = expenses.filter((e: any) => e.expense_date >= startDate && e.expense_date <= endDate);
    const currentShares = shares.filter((s: any) => s.valid_from <= endDate);

    const toInsert: any[] = [];
    for (const property of properties) {
      const propIncome = monthIncome.filter((i: any) => i.property_id === property.id).reduce((s: number, i: any) => s + Number(i.amount), 0);
      const propExpenses = monthExpenses.filter((e: any) => e.property_id === property.id).reduce((s: number, e: any) => s + Number(e.amount), 0);
      const netProfit = propIncome - propExpenses;
      const propShares = currentShares.filter((s: any) => s.property_id === property.id);
      for (const share of propShares) {
        toInsert.push({
          period_year: year, period_month: month,
          property_id: property.id, owner_id: share.owner_id,
          net_profit: netProfit, share_percent: share.share_percent,
          dividend_amount: (netProfit * share.share_percent) / 100,
          calculated_by: profile.id,
        });
      }
    }

    await supabase.from('dividend_calculations').delete()
      .eq('period_year', year).eq('period_month', month);
    const { data } = await supabase.from('dividend_calculations')
      .insert(toInsert)
      .select('*, properties(name, buildings(name)), profiles(full_name)');
    setDividends([...(data || []), ...dividends.filter((d: any) => !(d.period_year === year && d.period_month === month))]);
    setLoading(false);
  };

  const markPaid = async (id: string) => {
    await supabase.from('dividend_calculations').update({ is_paid: true, paid_at: new Date().toISOString() }).eq('id', id);
    setDividends(dividends.map((d: any) => d.id === id ? { ...d, is_paid: true } : d));
  };

  const filtered = isAdmin
    ? dividends.filter((d: any) => d.period_year === year && d.period_month === month)
    : dividends.filter((d: any) => d.owner_id === profile.id);

  const totalDividends = filtered.reduce((s: number, d: any) => s + Number(d.dividend_amount), 0);

  const exportExcel = async () => {
    const XLSX = (await import('xlsx')).default;
    const wsData = [
      ['Владелец', 'Объект', 'Чистая прибыль', 'Доля %', 'Дивиденд', 'Статус'],
      ...filtered.map((d: any) => [d.profiles?.full_name, d.properties?.name, d.net_profit, `${d.share_percent}%`, d.dividend_amount, d.is_paid ? 'Выплачено' : 'Ожидает']),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Дивиденды');
    XLSX.writeFile(wb, `Dividends_${year}_${month}.xlsx`);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Дивиденды</h1>
          <p className="text-slate-500">Сумма: <span className="font-bold text-blue-600">{formatCurrency(totalDividends)}</span></p>
        </div>
        {isAdmin && (
          <div className="flex gap-3">
            <select className="input w-auto" value={month} onChange={e => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select className="input w-auto" value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="btn-primary" onClick={calculate} disabled={loading}>
              <Calculator className="w-4 h-4" />{loading ? 'Расчёт...' : 'Рассчитать дивиденды'}
            </button>
            <button className="btn-secondary" onClick={exportExcel}><Download className="w-4 h-4" /> Excel</button>
          </div>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            {isAdmin && <th className="table-header">Владелец</th>}
            <th className="table-header">Период</th>
            <th className="table-header">Объект</th>
            <th className="table-header text-right">Чистая прибыль</th>
            <th className="table-header text-center">Доля</th>
            <th className="table-header text-right">Дивиденд</th>
            <th className="table-header text-center">Статус</th>
            {isAdmin && <th className="table-header"></th>}
          </tr></thead>
          <tbody>
            {filtered.map((d: any) => (
              <tr key={d.id} className="hover:bg-slate-50">
                {isAdmin && <td className="table-cell font-medium">{d.profiles?.full_name}</td>}
                <td className="table-cell">{MONTHS[d.period_month-1]} {d.period_year}</td>
                <td className="table-cell">{d.properties?.buildings?.name} — {d.properties?.name}</td>
                <td className="table-cell text-right">{formatCurrency(d.net_profit)}</td>
                <td className="table-cell text-center">{d.share_percent}%</td>
                <td className="table-cell text-right font-bold text-blue-600">{formatCurrency(d.dividend_amount)}</td>
                <td className="table-cell text-center">
                  {d.is_paid
                    ? <span className="badge-success">Выплачено</span>
                    : <span className="badge-warning">Ожидает</span>}
                </td>
                {isAdmin && (
                  <td className="table-cell">
                    {!d.is_paid && (
                      <button onClick={() => markPaid(d.id)} className="btn-secondary py-1 px-2 text-xs">
                        <CheckCircle className="w-3 h-3" /> Выплатить
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="table-cell text-center text-slate-400 py-8">Нет данных. Нажмите "Рассчитать дивиденды"</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
