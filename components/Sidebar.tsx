'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Building2, LayoutDashboard, TrendingUp, TrendingDown, BarChart3, Users, Settings, LogOut, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/lib/types';

const adminLinks = [
  { href: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/income', label: 'Доходы', icon: TrendingUp },
  { href: '/expenses', label: 'Расходы', icon: TrendingDown },
  { href: '/reports', label: 'P&L Отчёт', icon: BarChart3 },
  { href: '/dividends', label: 'Дивиденды', icon: PieChart },
  { href: '/owners', label: 'Владельцы', icon: Users },
  { href: '/properties', label: 'Объекты', icon: Building2 },
  { href: '/settings', label: 'Настройки', icon: Settings },
];

const ownerLinks = [
  { href: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/dividends', label: 'Мои дивиденды', icon: PieChart },
];

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const links = profile?.role === 'admin' ? adminLinks : ownerLinks;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-full">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm">GroundFloor</h1>
            <p className="text-xs text-slate-400">{profile?.role === 'admin' ? 'Администратор' : 'Владелец'}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={cn('sidebar-link', pathname === href && 'active')}>
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
            {profile?.full_name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">{profile?.full_name}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut className="w-4 h-4" />
          Выйти
        </button>
      </div>
    </aside>
  );
}
