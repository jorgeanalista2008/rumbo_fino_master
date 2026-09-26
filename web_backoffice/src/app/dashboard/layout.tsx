'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { PermissionsProvider } from '@/lib/PermissionsContext';
import PermissionGuard from '@/components/PermissionGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('rumbo_fino_token');
    if (!token) {
      router.push('/login');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-executive-dark flex items-center justify-center">
        <p className="text-gray-400 text-sm">Verificando sesión...</p>
      </div>
    );
  }

  return (
    <PermissionsProvider>
      <div className="flex min-h-screen bg-executive-dark">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 p-6 overflow-y-auto">
            <PermissionGuard>{children}</PermissionGuard>
          </main>
        </div>
      </div>
    </PermissionsProvider>
  );
}
