'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.replace('/login'); return; }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!data) { window.location.replace('/login'); return; }
      setProfile(data);
      setLoading(false);
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop sidebar — скрыт на мобильных */}
      <div className="hidden md:flex">
        <Sidebar profile={profile} />
      </div>
      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
      {/* Mobile bottom nav */}
      <MobileNav profile={profile} />
    </div>
  );
}
