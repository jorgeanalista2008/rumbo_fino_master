'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@rumbofino.com');
  const [password, setPassword] = useState('Admin123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken } = response.data.data;

      localStorage.setItem('rumbo_fino_token', accessToken);
      localStorage.setItem('rumbo_fino_user', JSON.stringify(user));

      router.push('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Error al iniciar sesión. Verifique sus credenciales.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-executive-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-luxury-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-executive-card border border-executive-border rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-luxury-gold mx-auto flex items-center justify-center text-black font-extrabold text-2xl mb-4 shadow-lg shadow-luxury-gold/20">
            RF
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">RUMBO FINO</h1>
          <p className="text-xs text-luxury-gold font-semibold uppercase tracking-widest mt-1">
            Backoffice Operativo & Flota Ejecutiva
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rumbofino.com"
                className="w-full bg-executive-dark border border-executive-border rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-luxury-gold transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-executive-dark border border-executive-border rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-luxury-gold transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-luxury-gold hover:bg-luxury-gold-hover text-black font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-luxury-gold/20 disabled:opacity-50"
          >
            {loading ? (
              <span>Autenticando...</span>
            ) : (
              <>
                <span>INGRESAR A CONSOLA</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Quick Fill for all 5 Roles */}
        <div className="mt-6 pt-5 border-t border-executive-border/60 space-y-2.5">
          <p className="text-xs font-bold text-gray-400 text-center uppercase tracking-wider">
            Acceso Rápido por Perfil (5 Roles):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Super Admin */}
            <button
              type="button"
              onClick={() => {
                setEmail('admin@rumbofino.com');
                setPassword('Admin2026*');
              }}
              className="px-3 py-2 bg-executive-dark/80 hover:bg-executive-border border border-purple-500/40 rounded-xl text-left text-xs transition-colors"
            >
              <div className="font-black text-purple-400 flex items-center justify-between">
                <span>👑 Super Admin</span>
              </div>
              <div className="text-[10px] text-gray-400 truncate">admin@rumbofino.com</div>
            </button>

            {/* Fleet Admin */}
            <button
              type="button"
              onClick={() => {
                setEmail('flota@rumbofino.com');
                setPassword('AdminFlota2026*');
              }}
              className="px-3 py-2 bg-executive-dark/80 hover:bg-executive-border border border-luxury-gold/40 rounded-xl text-left text-xs transition-colors"
            >
              <div className="font-black text-luxury-gold flex items-center justify-between">
                <span>🏢 Admin Flota</span>
              </div>
              <div className="text-[10px] text-gray-400 truncate">flota@rumbofino.com</div>
            </button>

            {/* Dispatcher */}
            <button
              type="button"
              onClick={() => {
                setEmail('despacho@rumbofino.com');
                setPassword('Despacho2026*');
              }}
              className="px-3 py-2 bg-executive-dark/80 hover:bg-executive-border border border-sky-500/40 rounded-xl text-left text-xs transition-colors"
            >
              <div className="font-black text-sky-400 flex items-center justify-between">
                <span>🎧 Despachador</span>
              </div>
              <div className="text-[10px] text-gray-400 truncate">despacho@rumbofino.com</div>
            </button>

            {/* Driver */}
            <button
              type="button"
              onClick={() => {
                setEmail('chofer1@rumbofino.com');
                setPassword('Chofer2026*');
              }}
              className="px-3 py-2 bg-executive-dark/80 hover:bg-executive-border border border-emerald-500/40 rounded-xl text-left text-xs transition-colors"
            >
              <div className="font-black text-emerald-400 flex items-center justify-between">
                <span>🚗 Chofer VIP</span>
              </div>
              <div className="text-[10px] text-gray-400 truncate">chofer1@rumbofino.com</div>
            </button>

            {/* Passenger */}
            <button
              type="button"
              onClick={() => {
                setEmail('pasajero1@rumbofino.com');
                setPassword('Pasajero2026*');
              }}
              className="px-3 py-2 bg-executive-dark/80 hover:bg-executive-border border border-slate-500/40 rounded-xl text-left text-xs transition-colors sm:col-span-2"
            >
              <div className="font-black text-slate-300 flex items-center justify-between">
                <span>👤 Cliente / Pasajero VIP</span>
              </div>
              <div className="text-[10px] text-gray-400 truncate">pasajero1@rumbofino.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
