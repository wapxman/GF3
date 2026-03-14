import { createClient } from '@/lib/supabase/server';
import ExpensesClient from '@/components/expenses/ExpensesClient';

export default async function ExpensesPage() {
  const supabase = createClient();
  const { data: properties } = await supabase.from('properties').select('*, buildings(name)').eq('status', 'active').order('name');
  const { data: buildings } = await supabase.from('buildings').select('*').order('name');
  const { data: categories } = await supabase.from('expense_categories').select('*').order('name');
  const { data: expenses } = await supabase.from('expenses').select('*, expense_categories(name), properties(name, buildings(name)), buildings(name)').eq('is_deleted', false).order('expense_date', { ascending: false });
  return <ExpensesClient properties={properties || []} buildings={buildings || []} categories={categories || []} expenses={expenses || []} />;
}
