'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('rumbo_fino_token');
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-executive-dark flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-luxury-gold mx-auto animate-pulse flex items-center justify-center text-black font-black text-xl">
          RF
        </div>
        <p className="text-gray-400 text-sm">Cargando consola Rumbo Fino...</p>
      </div>
    </div>
  );
}
