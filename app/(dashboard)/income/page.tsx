import { createClient } from '@/lib/supabase/server';
import IncomeClient from '@/components/income/IncomeClient';

export default async function IncomePage() {
  const supabase = createClient();
  const { data: properties } = await supabase.from('properties').select('*, buildings(name)').eq('status', 'active').order('name');
  const { data: income } = await supabase.from('income').select('*, properties(name, buildings(name))').eq('is_deleted', false).order('income_date', { ascending: false });
  return <IncomeClient properties={properties || []} income={income || []} />;
}
