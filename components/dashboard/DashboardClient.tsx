'use client';
import { TrendingUp, TrendingDown, DollarSign, Target, Building2 } from 'lucide-react';
import { formatCurrency, MONTHS } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  profile: any;
  buildings: any[];
  properties: any[];
  income: any[];
  expenses: any[];
  year: number;
  month: number;
}

export default function DashboardClient({ buildings, properties, income, expenses, year, month }: Props) {
  const totalIncome   = income.reduce((s: number, i: any) => s + Number(i.amount), 0);
  const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const netProfit     = totalIncome - totalExpenses;
  const totalPlan     = properties.reduce((s: number, p: any) => s + Number(p.planned_income), 0);
  const planPercent   = totalPlan > 0 ? Math.round((totalIncome / totalPlan) * 100) : 0;

  const propertyStats = properties.map((p: any) => {
    const propIncome   = income.filter((i: any) => i.property_id === p.id).reduce((s: number, i: any) => s + Number(i.amount), 0);
    const propExpenses = expenses.filter((e: any) => e.property_id === p.id).reduce((s: number, e: any) => s + Number(e.amount), 0);
    return { name: p.name, income: propIncome, expenses: propExpenses, profit: propIncome - propExpenses, plan: Number(p.planned_income) };
  });

  return (
    <div className="page-content">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">Дашборд</h1>
        <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
          <span>{MONTHS[month - 1]} {year}</span>
          <span>·</span>
          <Building2 className="w-3.5 h-3.5" />
          <span>{buildings.length} зд. · {properties.length} об.</span>
        </div>
      </div>

      {/* Главная карточка прибыли */}
      <div className="card mb-4">
        <p className="text-xs text-slate-400 mb-1">Чистая прибыль</p>
        <p className={`text-2xl md:text-3xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
          {formatCurrency(netProfit)}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className={`text-xs font-medium px-2 py-1 rounded-full ${
            planPercent >= 100 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {planPercent}% плана
          </div>
        </div>
      </div>

      {/* 2 карточки */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-green-50 rounded-md flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-green-600" />
            </div>
            <span className="text-xs text-slate-400">Доходы</span>
          </div>
          <p className="text-base font-bold text-green-600 truncate">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-red-50 rounded-md flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-red-600" />
            </div>
            <span className="text-xs text-slate-400">Расходы</span>
          </div>
          <p className="text-base font-bold text-red-600 truncate">{formatCurrency(totalExpenses)}</p>
        </div>
      </div>

      {/* Статус объектов — мобильный список */}
      <div className="card mb-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Статус объектов</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {propertyStats.filter(p => p.income > 0 || p.plan > 0).map((p) => (
            <div key={p.name} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-xs font-medium text-slate-700 truncate">{p.name}</p>
                <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${p.plan > 0 && p.income >= p.plan ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${p.plan > 0 ? Math.min((p.income / p.plan) * 100, 100) : 0}%` }}
                  />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-xs font-bold ${p.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(p.profit)}
                </p>
                {p.plan > 0 && (
                  <p className="text-xs text-slate-400">{Math.round((p.income / p.plan) * 100)}%</p>
                )}
              </div>
            </div>
          ))}
          {propertyStats.filter(p => p.income > 0 || p.plan > 0).length === 0 && (
            <p className="text-slate-400 text-sm text-center py-4">Нет данных</p>
          )}
        </div>
      </div>

      {/* График — только на десктопе */}
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
    </div>
  );
}
