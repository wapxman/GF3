import OwnersClient from '@/components/owners/OwnersClient';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function OwnersPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: owners }, { data: properties }, { data: shares }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('properties').select('*, buildings(name)').eq('status', 'active'),
    supabase.from('property_shares').select('*, profiles(full_name), properties(name, buildings(name))').is('valid_to', null),
  ]);

  return (
    <OwnersClient
      owners={owners || []}
      properties={properties || []}
      shares={shares || []}
      currentUserRole={profile?.role ?? 'owner'}
    />
  );
}
