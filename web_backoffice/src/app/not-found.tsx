import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-executive-dark flex items-center justify-center p-4">
      <div className="bg-executive-card border border-executive-border rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Página no encontrada (404)</h2>
        <p className="text-xs text-gray-400">
          La ruta especificada no existe en la consola administrativa de Rumbo Fino.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-luxury-gold text-black font-bold text-xs rounded-xl shadow-lg shadow-luxury-gold/20 hover:bg-luxury-gold-hover transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> VOLVER AL DASHBOARD
        </Link>
      </div>
    </div>
  );
}
