import { createClient } from '@/lib/supabase/server';
import DividendsClient from '@/components/dividends/DividendsClient';

export default async function DividendsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
  const { data: properties } = await supabase.from('properties').select('*, buildings(name)').eq('status', 'active');
  const { data: owners } = await supabase.from('profiles').select('*').eq('role', 'owner');
  const { data: shares } = await supabase.from('property_shares').select('*, profiles(full_name), properties(name)').is('valid_to', null);
  const { data: dividends } = await supabase.from('dividend_calculations').select('*, properties(name, buildings(name)), profiles(full_name)').order('period_year', { ascending: false }).order('period_month', { ascending: false });
  const { data: income } = await supabase.from('income').select('*').eq('is_deleted', false);
  const { data: expenses } = await supabase.from('expenses').select('*').eq('is_deleted', false);
  return <DividendsClient profile={profile} properties={properties || []} owners={owners || []} shares={shares || []} dividends={dividends || []} income={income || []} expenses={expenses || []} />;
}
