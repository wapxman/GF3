'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, MONTHS } from '@/lib/utils';
import { Calculator, CheckCircle, Download } from 'lucide-react';

export default function DividendsClient() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [profile, setProfile] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);
  const [dividends, setDividends] = useState<any[]>([]);
  const [income, setIncome] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState('');

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: p }, { data: props }, { data: sh }, { data: div }, { data: inc }, { data: exp }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('properties').select('*, buildings(name)').eq('status', 'active'),
        supabase.from('property_shares').select('*, profiles(full_name), properties(name)').is('valid_to', null),
        supabase.from('dividend_calculations').select('*, properties(name, buildings(name)), profiles(full_name)').order('period_year', { ascending: false }).order('period_month', { ascending: false }),
        supabase.from('income').select('*').eq('is_deleted', false),
        supabase.from('expenses').select('*').eq('is_deleted', false),
      ]);
      setProfile(p);
      setProperties(props || []);
      setShares(sh || []);
      setDividends(div || []);
      setIncome(inc || []);
      setExpenses(exp || []);
      setLoading(false);
    };
    load();
  }, []);

  const calculate = async () => {
    setCalculating(true);
    setCalcError('');
    try {
      const supabase = createClient();
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

      // Берём свежие данные напрямую из БД
      const [{ data: freshIncome }, { data: freshExpenses }, { data: freshShares }, { data: freshProps }] = await Promise.all([
        supabase.from('income').select('*').eq('is_deleted', false).gte('income_date', startDate).lte('income_date', endDate),
        supabase.from('expenses').select('*').eq('is_deleted', false).gte('expense_date', startDate).lte('expense_date', endDate),
        supabase.from('property_shares').select('*').is('valid_to', null),
        supabase.from('properties').select('*').eq('status', 'active'),
      ]);

      const toInsert: any[] = [];
      for (const property of (freshProps || [])) {
        const propIncome = (freshIncome || []).filter((i: any) => i.property_id === property.id).reduce((s: number, i: any) => s + Number(i.amount), 0);
        const propExpenses = (freshExpenses || []).filter((e: any) => e.property_id === property.id).reduce((s: number, e: any) => s + Number(e.amount), 0);
        const netProfit = propIncome - propExpenses;
        const propShares = (freshShares || []).filter((s: any) => s.property_id === property.id);
        for (const share of propShares) {
          toInsert.push({
            period_year: year,
            period_month: month,
            property_id: property.id,
            owner_id: share.owner_id,
            net_profit: netProfit,
            share_percent: share.share_percent,
            dividend_amount: (netProfit * Number(share.share_percent)) / 100,
            calculated_by: profile?.id,
          });
        }
      }

      if (toInsert.length === 0) {
        setCalcError('Нет данных для расчёта. Проверьте: есть ли активные объекты с долями владельцев?');
        setCalculating(false);
        return;
      }

      // Удаляем старые расчёты за этот период
      await supabase.from('dividend_calculations').delete()
        .eq('period_year', year).eq('period_month', month);

      // Вставляем новые
      const { data, error } = await supabase.from('dividend_calculations')
        .insert(toInsert)
        .select('*, properties(name, buildings(name)), profiles(full_name)');

      if (error) {
        setCalcError('Ошибка: ' + error.message);
      } else {
        setDividends([
          ...(data || []),
          ...dividends.filter((d: any) => !(d.period_year === year && d.period_month === month))
        ]);
      }
    } catch (err: any) {
      setCalcError('Ошибка: ' + err.message);
    }
    setCalculating(false);
  };

  const markPaid = async (id: string) => {
    const supabase = createClient();
    await supabase.from('dividend_calculations').update({ is_paid: true, paid_at: new Date().toISOString() }).eq('id', id);
    setDividends(dividends.map((d: any) => d.id === id ? { ...d, is_paid: true } : d));
  };

  const exportExcel = async () => {
    const XLSX = (await import('xlsx')).default;
    const wsData = [
      ['Владелец', 'Период', 'Объект', 'Чистая прибыль', 'Доля %', 'Дивиденд', 'Статус'],
      ...filtered.map((d: any) => [
        d.profiles?.full_name,
        `${MONTHS[d.period_month - 1]} ${d.period_year}`,
        d.properties?.name,
        d.net_profit, `${d.share_percent}%`,
        d.dividend_amount,
        d.is_paid ? 'Выплачено' : 'Ожидает'
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Дивиденды');
    XLSX.writeFile(wb, `Dividends_${year}_${month}.xlsx`);
  };

  const isAdmin = profile?.role === 'admin';
  const filtered = isAdmin
    ? dividends.filter((d: any) => d.period_year === year && d.period_month === month)
    : dividends.filter((d: any) => d.owner_id === profile?.id);
  const totalDividends = filtered.reduce((s: number, d: any) => s + Number(d.dividend_amount), 0);

  if (loading) return <div className="p-8 text-slate-400">Загрузка...</div>;

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
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select className="input w-auto" value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="btn-primary" onClick={calculate} disabled={calculating}>
              <Calculator className="w-4 h-4" />{calculating ? 'Расчёт...' : 'Рассчитать дивиденды'}
            </button>
            <button className="btn-secondary" onClick={exportExcel}><Download className="w-4 h-4" /> Excel</button>
          </div>
        )}
      </div>

      {calcError && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">{calcError}</div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              {isAdmin && <th className="table-header">Владелец</th>}
              <th className="table-header">Период</th>
              <th className="table-header">Объект</th>
              <th className="table-header text-right">Чистая прибыль</th>
              <th className="table-header text-center">Доля</th>
              <th className="table-header text-right">Дивиденд</th>
              <th className="table-header text-center">Статус</th>
              {isAdmin && <th className="table-header"></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={isAdmin ? 8 : 6} className="table-cell text-center text-slate-400 py-8">
                {isAdmin ? 'Нажмите "Рассчитать дивиденды" для выбранного периода' : 'Нет данных'}
              </td></tr>
            )}
            {filtered.map((d: any) => (
              <tr key={d.id} className="hover:bg-slate-50 border-b border-slate-50">
                {isAdmin && <td className="table-cell font-medium">{d.profiles?.full_name}</td>}
                <td className="table-cell">{MONTHS[d.period_month - 1]} {d.period_year}</td>
                <td className="table-cell">{d.properties?.buildings?.name} — {d.properties?.name}</td>
                <td className="table-cell text-right">{formatCurrency(d.net_profit)}</td>
                <td className="table-cell text-center font-medium">{d.share_percent}%</td>
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
