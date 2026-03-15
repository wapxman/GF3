import OwnersClient from '@/components/owners/OwnersClient';
import { createClient } from '@/lib/supabase/server';

export default async function OwnersPage() {
  const supabase = createClient();
  const { data: owners } = await supabase.from('profiles').select('*').order('full_name');
  const { data: properties } = await supabase.from('properties').select('*, buildings(name)').eq('status', 'active');
  const { data: shares } = await supabase.from('property_shares').select('*, profiles(full_name), properties(name, buildings(name))').is('valid_to', null);
  return <OwnersClient owners={owners || []} properties={properties || []} shares={shares || []} />;
}
