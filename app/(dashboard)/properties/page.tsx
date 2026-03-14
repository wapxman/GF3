import { createClient } from '@/lib/supabase/server';
import PropertiesClient from '@/components/properties/PropertiesClient';

export default async function PropertiesPage() {
  const supabase = createClient();
  const { data: buildings } = await supabase.from('buildings').select('*, properties(*)').order('name');
  const { data: properties } = await supabase.from('properties').select('*, buildings(name)').order('name');
  return <PropertiesClient buildings={buildings || []} properties={properties || []} />;
}
