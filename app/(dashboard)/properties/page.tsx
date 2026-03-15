import PropertiesClient from '@/components/properties/PropertiesClient';
import { createClient } from '@/lib/supabase/server';

export default async function PropertiesPage() {
  const supabase = createClient();
  const { data: buildings } = await supabase.from('buildings').select('*, properties(*)').order('name');
  const { data: properties } = await supabase.from('properties').select('*, buildings(name)').order('name');
  return <PropertiesClient buildings={buildings || []} properties={properties || []} />;
}
