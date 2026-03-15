'use client';
import { useState } from 'react';
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

export default function DashboardClient({ profile, buildings, properties, income, expenses, year, month }: Props) {
  const totalIncome = income.reduce((s: number, i: any) => s + Number(i.amount), 0);
  const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const netProfit = totalIncome - totalExpenses;
  const totalPlan = properties.reduce((s: number, p: any) => s + Number(p.planned_income), 0);
  const planPercent = totalPlan > 0 ? Math.round((totalIncome / totalPlan) * 100) : 0;

  const propertyStats = properties.map((p: any) => {
    const propIncome = income.filter((i: any) => i.property_id === p.id).reduce((s: number, i: any) => s + Number(i.amount), 0);
    const propExpenses = expenses.filter((e: any) => e.property_id === p.id).reduce((s: number, e: any) => s + Number(e.amount), 0);
    return {
      name: p.name,
      income: propIncome,
      expenses: propExpenses,
      profit: propIncome - propExpenses,
      plan: Number(p.planned_income),
    };
  });

  const stats = [
    { label: 'Доходы',           value: formatCurrency(totalIncome),   icon: TrendingUp,   color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'Расходы',          value: formatCurrency(totalExpenses), icon: TrendingDown, color: 'text-red-600',    bg: 'bg-red-50' },
    { label: 'Чистая прибыль', value: formatCurrency(netProfit),     icon: DollarSign,   color: netProfit >= 0 ? 'text-blue-600' : 'text-red-600', bg: netProfit >= 0 ? 'bg-blue-50' : 'bg-red-50' },
    { label: 'Выполнение плана', value: `${planPercent}%`, icon: Target, color: planPercent >= 100 ? 'text-green-600' : 'text-orange-600', bg: planPercent >= 100 ? 'bg-green-50' : 'bg-orange-50' },
  ];

  return (
    <div className="page-content">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Дашборд</h1>
          <p className="text-slate-500 text-sm">{MONTHS[month - 1]} {year}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Building2 className="w-4 h-4" />
          <span className="hidden sm:inline">{buildings.length} зданий · </span>
          {properties.length} объектов
        </div>
      </div>

      {/* Stats grid — 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">{label}</span>
              <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
            </div>
            <p className={`text-base md:text-xl font-bold ${color} truncate`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Charts — stacked on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Доходы и расходы по объектам</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={propertyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="income" name="Доход" fill="#22c55e" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" name="Расход" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Статус объектов</h2>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {propertyStats.map((p) => (
              <div key={p.name} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-xs font-medium text-slate-700 truncate mr-2">{p.name}</span>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-bold ${p.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(p.profit)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {p.plan > 0 ? `${Math.round((p.income / p.plan) * 100)}%` : ''}
                  </p>
                </div>
              </div>
            ))}
            {propertyStats.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-8">Нет данных</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
