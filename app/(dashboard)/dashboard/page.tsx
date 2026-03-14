import { createClient } from '@/lib/supabase/server';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
  const { data: buildings } = await supabase.from('buildings').select('*, properties(*)').order('name');
  const { data: properties } = await supabase.from('properties').select('*, buildings(name)').eq('status', 'active').order('name');

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

  const { data: income } = await supabase.from('income')
    .select('*, properties(name, planned_income)')
    .eq('is_deleted', false)
    .gte('income_date', startDate)
    .lte('income_date', endDate);

  const { data: expenses } = await supabase.from('expenses')
    .select('*, expense_categories(name)')
    .eq('is_deleted', false)
    .gte('expense_date', startDate)
    .lte('expense_date', endDate);

  return <DashboardClient profile={profile} buildings={buildings || []} properties={properties || []} income={income || []} expenses={expenses || []} year={year} month={month} />;
}
