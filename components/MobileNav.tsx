'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard, TrendingUp, TrendingDown,
  BarChart3, PieChart, Users, Building2, Settings, LogOut
} from 'lucide-react';
import type { Profile } from '@/lib/types';

const adminLinks = [
  { href: '/dashboard', label: 'Главная', icon: LayoutDashboard },
  { href: '/income',    label: 'Доходы',  icon: TrendingUp },
  { href: '/expenses',  label: 'Расходы', icon: TrendingDown },
  { href: '/reports',   label: 'Отчёт',   icon: BarChart3 },
  { href: '/dividends', label: 'Дивид.',   icon: PieChart },
];

const ownerLinks = [
  { href: '/dashboard', label: 'Главная',  icon: LayoutDashboard },
  { href: '/dividends', label: 'Дивиденды', icon: PieChart },
];

export default function MobileNav({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const links = profile?.role === 'admin' ? adminLinks : ownerLinks;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <nav className="mobile-nav">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`mobile-nav-item ${pathname === href ? 'active' : ''}`}
        >
          <Icon className="w-5 h-5" />
          <span className="mobile-nav-label">{label}</span>
        </Link>
      ))}
      <button onClick={handleLogout} className="mobile-nav-item text-red-400">
        <LogOut className="w-5 h-5" />
        <span className="mobile-nav-label">Выйти</span>
      </button>
    </nav>
  );
}
