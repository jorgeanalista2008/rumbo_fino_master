'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit3, Shield, User, Phone, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

interface EditDriverModalProps {
  driver: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditDriverModal({ driver, onClose, onSuccess }: EditDriverModalProps) {
  const [firstName, setFirstName] = useState(driver?.user?.firstName || '');
  const [lastName, setLastName] = useState(driver?.user?.lastName || '');
  const [email, setEmail] = useState(driver?.user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(driver?.user?.phoneNumber || '+51 987 654 321');
  const [licenseNumber, setLicenseNumber] = useState(driver?.licenseNumber || '');
  const [licenseCategory, setLicenseCategory] = useState(driver?.licenseCategory || 'A-IIIc Executive');
  const [licenseExpiration, setLicenseExpiration] = useState(
    driver?.licenseExpiration ? new Date(driver.licenseExpiration).toISOString().split('T')[0] : '2028-12-31'
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (driver) {
      setFirstName(driver.user?.firstName || '');
      setLastName(driver.user?.lastName || '');
      setEmail(driver.user?.email || '');
      setPhoneNumber(driver.user?.phoneNumber || '+51 987 654 321');
      setLicenseNumber(driver.licenseNumber || '');
      setLicenseCategory(driver.licenseCategory || 'A-IIIc Executive');
      if (driver.licenseExpiration) {
        try {
          setLicenseExpiration(new Date(driver.licenseExpiration).toISOString().split('T')[0]);
        } catch (_) {}
      }
    }
  }, [driver]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driver?.id) return;
    setSubmitting(true);

    try {
      await api.patch(`/drivers/${driver.id}`, {
        firstName,
        lastName,
        email,
        phoneNumber,
        licenseNumber,
        licenseCategory,
        licenseExpiration,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.warn('Error actualizando chofer en API:', err);
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!driver) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-executive-card border border-executive-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-executive-border bg-executive-dark/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-luxury-gold/10 text-luxury-gold rounded-xl border border-luxury-gold/30">
              <Edit3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Editar Perfil de Chofer Ejecutivo</h2>
              <p className="text-xs text-gray-400">Actualizar datos personales o información de la licencia profesional</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-executive-dark hover:bg-executive-border text-gray-400 hover:text-white rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs">
          {/* Section 1: User Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-luxury-gold uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" />
              1. Datos Personales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-gray-300 font-bold block mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-executive-dark border border-executive-border rounded-xl p-3 text-white focus:outline-none focus:border-luxury-gold"
                />
              </div>
              <div>
                <label className="text-gray-300 font-bold block mb-1">Apellido</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-executive-dark border border-executive-border rounded-xl p-3 text-white focus:outline-none focus:border-luxury-gold"
                />
              </div>
              <div>
                <label className="text-gray-300 font-bold block mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-gray-400" /> Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-executive-dark border border-executive-border rounded-xl p-3 text-white focus:outline-none focus:border-luxury-gold"
                />
              </div>
              <div>
                <label className="text-gray-300 font-bold block mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> Teléfono Móvil
                </label>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-executive-dark border border-executive-border rounded-xl p-3 text-white focus:outline-none focus:border-luxury-gold"
                />
              </div>
            </div>
          </div>

          <hr className="border-executive-border/60" />

          {/* Section 2: Professional License Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-luxury-gold uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4" />
              2. Ficha de Licencia de Conducir
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-gray-300 font-bold block mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-gray-400" /> Nº de Licencia
                </label>
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full bg-executive-dark border border-executive-border rounded-xl p-3 text-white font-mono focus:outline-none focus:border-luxury-gold"
                />
              </div>
              <div>
                <label className="text-gray-300 font-bold block mb-1">Categoría</label>
                <select
                  value={licenseCategory}
                  onChange={(e) => setLicenseCategory(e.target.value)}
                  className="w-full bg-executive-dark border border-executive-border rounded-xl p-3 text-white focus:outline-none focus:border-luxury-gold"
                >
                  <option value="A-IIIc Executive">A-IIIc Executive (Prémium)</option>
                  <option value="A-IIIa Professional">A-IIIa Profesional</option>
                  <option value="A-IIb Standard">A-IIb Estándar</option>
                </select>
              </div>
              <div>
                <label className="text-gray-300 font-bold block mb-1">Vencimiento Licencia</label>
                <input
                  type="date"
                  required
                  value={licenseExpiration}
                  onChange={(e) => setLicenseExpiration(e.target.value)}
                  className="w-full bg-executive-dark border border-executive-border rounded-xl p-3 text-white focus:outline-none focus:border-luxury-gold"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-executive-border flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-executive-dark hover:bg-executive-border border border-executive-border text-gray-300 font-bold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-bold rounded-xl shadow-lg shadow-luxury-gold/20 flex items-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
