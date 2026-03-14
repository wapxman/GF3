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
    { label: 'Доходы', value: formatCurrency(totalIncome), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Расходы', value: formatCurrency(totalExpenses), icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Чистая прибыль', value: formatCurrency(netProfit), icon: DollarSign, color: netProfit >= 0 ? 'text-blue-600' : 'text-red-600', bg: netProfit >= 0 ? 'bg-blue-50' : 'bg-red-50' },
    { label: 'Выполнение плана', value: `${planPercent}%`, icon: Target, color: planPercent >= 100 ? 'text-green-600' : 'text-orange-600', bg: planPercent >= 100 ? 'bg-green-50' : 'bg-orange-50' },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Дашборд</h1>
          <p className="text-slate-500">{MONTHS[month - 1]} {year}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Building2 className="w-4 h-4" />
          {buildings.length} зданий · {properties.length} объектов
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">{label}</span>
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Доходы и расходы по объектам</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={propertyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="income" name="Доход" fill="#22c55e" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" name="Расход" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Статус объектов</h2>
          <div className="space-y-3">
            {propertyStats.map((p) => (
              <div key={p.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">{p.name}</span>
                <div className="text-right">
                  <p className={`text-sm font-bold ${p.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(p.profit)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {p.plan > 0 ? `${Math.round((p.income / p.plan) * 100)}% от плана` : ''}
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
