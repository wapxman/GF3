import { createClient } from '@/lib/supabase/server';
import SettingsClient from '@/components/settings/SettingsClient';

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
  const { data: categories } = await supabase.from('expense_categories').select('*').order('name');
  const { data: auditLog } = await supabase.from('audit_log').select('*').order('changed_at', { ascending: false }).limit(50);
  return <SettingsClient profile={profile} categories={categories || []} auditLog={auditLog || []} />;
}
