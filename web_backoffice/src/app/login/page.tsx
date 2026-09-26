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

        {/* Demo Credentials Quick Fill */}
        <div className="mt-8 pt-6 border-t border-executive-border/60">
          <p className="text-xs font-semibold text-gray-400 mb-3 text-center">Acceso Rápido de Prueba:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@rumbofino.com');
                setPassword('Admin123!');
              }}
              className="px-3 py-2 bg-executive-dark/70 hover:bg-executive-border border border-executive-border rounded-lg text-left text-xs transition-colors"
            >
              <div className="font-bold text-luxury-gold">Super Admin</div>
              <div className="text-[10px] text-gray-400">admin@rumbofino.com</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail('despacho@rumbofino.com');
                setPassword('Despacho123!');
              }}
              className="px-3 py-2 bg-executive-dark/70 hover:bg-executive-border border border-executive-border rounded-lg text-left text-xs transition-colors"
            >
              <div className="font-bold text-white">Despachador</div>
              <div className="text-[10px] text-gray-400">despacho@rumbofino.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
