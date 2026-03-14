import { createClient } from '@/lib/supabase/server';
import ReportsClient from '@/components/reports/ReportsClient';

export default async function ReportsPage() {
  const supabase = createClient();
  const { data: properties } = await supabase.from('properties').select('*, buildings(name)').order('name');
  const { data: income } = await supabase.from('income').select('*').eq('is_deleted', false);
  const { data: expenses } = await supabase.from('expenses').select('*').eq('is_deleted', false);
  return <ReportsClient properties={properties || []} income={income || []} expenses={expenses || []} />;
}
