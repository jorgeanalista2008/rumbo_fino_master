'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  Users,
  MapPin,
  DollarSign,
  ShieldCheck,
  Award,
  TrendingUp,
  Coins,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard Global', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Expedientes Vehículos', href: '/dashboard/vehicles', icon: Car },
  { name: 'Choferes y Turnos', href: '/dashboard/drivers', icon: Users },
  { name: 'Monitoreo / Despacho', href: '/dashboard/dispatch', icon: MapPin },
  { name: 'Finanzas y Recaudación', href: '/dashboard/financials', icon: DollarSign },
  { name: 'Tasas Oficiales BCV', href: '/dashboard/exchange-rates', icon: TrendingUp },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-executive-card border-r border-executive-border min-h-screen flex flex-col justify-between p-4">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-4 border-b border-executive-border mb-6">
          <div className="w-10 h-10 rounded-xl bg-luxury-gold flex items-center justify-center text-black font-extrabold text-xl shadow-lg shadow-luxury-gold/20">
            RF
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white tracking-wide">RUMBO FINO</h1>
            <p className="text-xs text-luxury-gold font-semibold uppercase tracking-widest">Executive Fleet</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-luxury-gold text-black font-bold shadow-md shadow-luxury-gold/20'
                    : 'text-gray-400 hover:text-white hover:bg-executive-border/50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-black' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Branding */}
      <div className="p-3 bg-executive-dark/50 rounded-xl border border-executive-border/50 text-center">
        <div className="flex items-center justify-center gap-2 text-luxury-gold mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Sistema Seguro</span>
        </div>
        <p className="text-[10px] text-gray-500">v1.0.0 Backoffice Operativo</p>
      </div>
    </aside>
  );
}
