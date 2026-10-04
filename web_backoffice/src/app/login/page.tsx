'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@rumbofino.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken } = response.data.data;

      const role = (user.role || '').toUpperCase();
      if (role === 'PASSENGER' || role === 'DRIVER') {
        setError(
          'Acceso restringido: Esta consola web es exclusiva para personal administrativo (Super Admin, Administrador de Flota, Despacho y Auditoría). Los pasajeros y choferes deben utilizar la aplicación móvil Rumbo Fino.'
        );
        return;
      }

      localStorage.setItem('rumbo_fino_token', accessToken);
      localStorage.setItem('rumbo_fino_user', JSON.stringify(user));

      router.push('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Credenciales inválidas. Por favor verifique su correo y contraseña.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Dynamic Ambient Luxury Glows */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-luxury-gold/15 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navigation Back to Landing */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-executive-card/70 hover:bg-executive-card border border-executive-border text-gray-300 hover:text-white text-xs font-bold backdrop-blur-md transition-all shadow-lg hover:border-luxury-gold/40"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-luxury-gold" />
          <span>Volver al Portal Público</span>
        </Link>
      </div>

      <div className="w-full max-w-[440px] relative z-10 my-auto">
        {/* Main Card with Obsidian Glassmorphism */}
        <div className="bg-[#0B1120]/80 backdrop-blur-2xl border border-luxury-gold/30 rounded-3xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.85)] relative overflow-hidden">
          {/* Subtle Top Metallic Accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-luxury-gold to-transparent" />

          {/* Logo & Executive Branding */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-luxury-gold via-yellow-500 to-luxury-gold-hover mx-auto flex items-center justify-center text-black font-black text-2xl shadow-xl shadow-luxury-gold/25 transform hover:scale-105 transition-transform duration-300">
                RF
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0B1120] rounded-full" />
            </div>

            <h1 className="text-2xl font-black text-white tracking-wider flex items-center justify-center gap-2">
              RUMBO FINO
            </h1>
            <p className="text-[11px] text-luxury-gold font-bold uppercase tracking-[0.25em] mt-1.5 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-luxury-gold" />
              Consola Maestra de Operaciones
            </p>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-400 text-xs leading-relaxed animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <div className="relative group">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-luxury-gold transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@rumbofino.com"
                  className="w-full bg-[#060913] border border-executive-border rounded-xl py-3 pl-11 pr-4 text-white text-xs font-medium focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold transition-all placeholder:text-gray-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                  Contraseña
                </label>
              </div>
              <div className="relative group">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-luxury-gold transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#060913] border border-executive-border rounded-xl py-3 pl-11 pr-11 text-white text-xs font-mono focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold transition-all placeholder:text-gray-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-gray-400 cursor-pointer select-none hover:text-gray-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#060913] border-executive-border text-luxury-gold focus:ring-0 focus:ring-offset-0 cursor-pointer accent-luxury-gold"
                />
                <span className="text-[11px]">Mantener sesión abierta (30 días)</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-luxury-gold to-yellow-500 hover:from-yellow-400 hover:to-luxury-gold text-black font-black py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-xl shadow-luxury-gold/20 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 text-xs tracking-wider uppercase mt-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Validando Credenciales...</span>
                </div>
              ) : (
                <>
                  <span>Ingresar a la Consola</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Badge Footer */}
          <div className="mt-8 pt-5 border-t border-executive-border/60 flex items-center justify-center gap-2 text-[10px] text-gray-500 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Conexión Encriptada SSL 256-Bit • Venezuela</span>
          </div>
        </div>

        {/* Corporate Copyright */}
        <div className="text-center mt-6 text-[11px] text-gray-500">
          © {new Date().getFullYear()} Rumbo Fino VIP. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}
