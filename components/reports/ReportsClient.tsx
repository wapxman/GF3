'use client';
import { useState } from 'react';
import { formatCurrency, MONTHS } from '@/lib/utils';
import { Download } from 'lucide-react';

export default function ReportsClient({ properties, income, expenses }: any) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

  const filteredIncome = income.filter((i: any) => i.income_date >= startDate && i.income_date <= endDate);
  const filteredExpenses = expenses.filter((e: any) => e.expense_date >= startDate && e.expense_date <= endDate);

  const rows = properties.map((p: any) => {
    const propIncome = filteredIncome.filter((i: any) => i.property_id === p.id).reduce((s: number, i: any) => s + Number(i.amount), 0);
    const propExpenses = filteredExpenses.filter((e: any) => e.property_id === p.id).reduce((s: number, e: any) => s + Number(e.amount), 0);
    const netProfit = propIncome - propExpenses;
    const planPercent = p.planned_income > 0 ? Math.round((propIncome / p.planned_income) * 100) : null;
    return { ...p, propIncome, propExpenses, netProfit, planPercent };
  });

  const totalIncome = rows.reduce((s: number, r: any) => s + r.propIncome, 0);
  const totalExpenses = rows.reduce((s: number, r: any) => s + r.propExpenses, 0);
  const totalProfit = totalIncome - totalExpenses;

  const exportExcel = async () => {
    const XLSX = (await import('xlsx')).default;
    const wsData = [
      ['Объект', 'План', 'Факт дохода', 'Расходы', 'Чистая прибыль', '% плана'],
      ...rows.map((r: any) => [r.name, r.planned_income, r.propIncome, r.propExpenses, r.netProfit, r.planPercent ? `${r.planPercent}%` : '—']),
      ['ИТОГО', '', totalIncome, totalExpenses, totalProfit, ''],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'P&L');
    XLSX.writeFile(wb, `PL_${year}_${month}.xlsx`);
  };

  const exportPDF = async () => {
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();
    doc.text(`P&L Отчёт - ${MONTHS[month-1]} ${year}`, 14, 16);
    autoTable(doc, {
      head: [['Объект', 'План', 'Факт', 'Расходы', 'Прибыль']],
      body: rows.map((r: any) => [r.name, r.planned_income, r.propIncome, r.propExpenses, r.netProfit]),
      startY: 20,
    });
    doc.save(`PL_${year}_${month}.pdf`);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">P&L Отчёт</h1>
          <p className="text-slate-500">Отчёт о прибылях и убытках</p>
        </div>
        <div className="flex gap-3">
          <select className="input w-auto" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="input w-auto" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn-secondary" onClick={exportExcel}><Download className="w-4 h-4" /> Excel</button>
          <button className="btn-secondary" onClick={exportPDF}><Download className="w-4 h-4" /> PDF</button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr>
            <th className="table-header">Объект</th>
            <th className="table-header text-right">План</th>
            <th className="table-header text-right">Факт дохода</th>
            <th className="table-header text-right">Расходы</th>
            <th className="table-header text-right">Чистая прибыль</th>
            <th className="table-header text-center">% плана</th>
          </tr></thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="table-cell font-medium">{r.buildings?.name} — {r.name}</td>
                <td className="table-cell text-right text-slate-500">{formatCurrency(r.planned_income)}</td>
                <td className="table-cell text-right text-green-600 font-semibold">{formatCurrency(r.propIncome)}</td>
                <td className="table-cell text-right text-red-500">{formatCurrency(r.propExpenses)}</td>
                <td className={`table-cell text-right font-bold ${r.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(r.netProfit)}</td>
                <td className="table-cell text-center">
                  {r.planPercent !== null && (
                    <span className={r.planPercent >= 100 ? 'badge-success' : 'badge-danger'}>{r.planPercent}%</span>
                  )}
                </td>
              </tr>
            ))}
            <tr className="bg-slate-100 font-bold">
              <td className="table-cell">ИТОГО</td>
              <td className="table-cell text-right">—</td>
              <td className="table-cell text-right text-green-600">{formatCurrency(totalIncome)}</td>
              <td className="table-cell text-right text-red-500">{formatCurrency(totalExpenses)}</td>
              <td className={`table-cell text-right ${totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(totalProfit)}</td>
              <td className="table-cell"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
