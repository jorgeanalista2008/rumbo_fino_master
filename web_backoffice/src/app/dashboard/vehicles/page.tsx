'use client';

import React, { useEffect, useState } from 'react';
import {
  Car,
  FileCheck,
  Plus,
  Check,
  X,
  Eye,
  Calendar,
  Sparkles,
  Luggage,
  Fuel,
  Settings,
  Users,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Wand2,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';

const DEFAULT_VEHICLES = [
  {
    id: 'veh-1',
    make: 'Mercedes-Benz',
    model: 'E-Class 350 AMG Line',
    year: 2024,
    color: 'Negro Obsidian Metalizado',
    licensePlate: 'VIP-777',
    vin: 'WDD2130421A123456',
    seats: 4,
    category: 'EXECUTIVE_SEDAN',
    status: 'IN_SERVICE',
    transmission: 'Automática 9G-Tronic',
    fuelType: 'Gasolina Premium / Mild Hybrid',
    luggageCapacity: '3 Maletas Grandes + 2 de Mano',
    amenities: [
      'Wi-Fi 5G Ilimitado',
      'Asientos de Cuero Nappa Calefaccionados',
      'Climatizador Automático Tri-Zona',
      'Tomas de Corriente 110V / USB-C Rápido',
      'Agua Evian y Snacks VIP',
      'Cristales Tintados de Privacidad',
      'Sistema de Sonido Burmester® 3D',
    ],
    photos: [
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1000&auto=format&fit=crop',
    ],
  },
  {
    id: 'veh-2',
    make: 'Cadillac',
    model: 'Escalade ESV Platinum',
    year: 2025,
    color: 'Azul Midnight Imperial',
    licensePlate: 'LUX-999',
    vin: '1GYS4HKJ8R1987654',
    seats: 7,
    category: 'VIP_SUV',
    status: 'AVAILABLE',
    transmission: 'Automática de 10 Velocidades',
    fuelType: 'V8 6.2L EcoTec3',
    luggageCapacity: '6 Maletas Grandes + 4 de Mano',
    amenities: [
      'Wi-Fi 5G a Bordo',
      'Pantallas OLED Traseras de 12.6"',
      'Asientos Capitán con Masaje',
      'Refrigerador / Enfriador Integrado',
      'Suspensión Neumática MagneRide',
      'Aislamiento Acústico Doble Cristal',
      'Audio AKG Studio Reference 36 Altavoces',
    ],
    photos: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1000&auto=format&fit=crop',
    ],
  },
];

const AVAILABLE_AMENITIES_OPTIONS = [
  'Wi-Fi 5G Ilimitado',
  'Asientos de Cuero Nappa',
  'Climatizador Tri-Zona',
  'Cargadores USB-C / 110V',
  'Agua Evian y Snacks VIP',
  'Cristales Tintados de Privacidad',
  'Sistema de Sonido Premium 3D',
  'Refrigerador a Bordo',
  'Pantallas Entretenimiento Traseras',
];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // New Vehicle Form state
  const [newVehicle, setNewVehicle] = useState({
    make: 'BMW',
    model: '7 Series 740i Executive',
    year: 2025,
    color: 'Negro Zafiro Metalizado',
    licensePlate: '',
    vin: '',
    seats: 4,
    category: 'EXECUTIVE_SEDAN',
    transmission: 'Automática 8G Steptronic',
    fuelType: 'Gasolina Premium / Mild Hybrid',
    luggageCapacity: '3 Maletas Grandes + 2 de Mano',
    amenities: [
      'Wi-Fi 5G Ilimitado',
      'Asientos de Cuero Nappa',
      'Climatizador Tri-Zona',
      'Cargadores USB-C / 110V',
      'Agua Evian y Snacks VIP',
    ],
    photoUrlInput: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1000&auto=format&fit=crop',
  });

  const generateUniquePlateAndVin = () => {
    const randomPlate = `EXC-${Math.floor(100 + Math.random() * 900)}`;
    const randomVin = `WBA71CH${Math.floor(10000000 + Math.random() * 90000000)}`;
    setNewVehicle((prev) => ({
      ...prev,
      licensePlate: randomPlate,
      vin: randomVin,
    }));
  };

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vehicles');
      if (res.data?.data && res.data.data.length > 0) {
        setVehicles(res.data.data);
      } else {
        setVehicles(DEFAULT_VEHICLES);
      }
    } catch (err) {
      console.warn('Backend API offline or empty, loading default executive fleet:', err);
      setVehicles(DEFAULT_VEHICLES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const openAddModal = () => {
    const randomPlate = `EXC-${Math.floor(100 + Math.random() * 900)}`;
    const randomVin = `WBA71CH${Math.floor(10000000 + Math.random() * 90000000)}`;
    setNewVehicle({
      make: 'BMW',
      model: '7 Series 740i Executive',
      year: 2025,
      color: 'Negro Zafiro Metalizado',
      licensePlate: randomPlate,
      vin: randomVin,
      seats: 4,
      category: 'EXECUTIVE_SEDAN',
      transmission: 'Automática 8G Steptronic',
      fuelType: 'Gasolina Premium / Mild Hybrid',
      luggageCapacity: '3 Maletas Grandes + 2 de Mano',
      amenities: [
        'Wi-Fi 5G Ilimitado',
        'Asientos de Cuero Nappa',
        'Climatizador Tri-Zona',
        'Cargadores USB-C / 110V',
        'Agua Evian y Snacks VIP',
      ],
      photoUrlInput: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1000&auto=format&fit=crop',
    });
    setFormError('');
    setShowAddModal(true);
  };

  const openDetailModal = async (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setActivePhotoIndex(0);
    setShowDetailModal(true);
    try {
      const res = await api.get(`/vehicles/${vehicle.id}/documents`);
      setDocuments(res.data?.data || []);
    } catch (err) {
      setDocuments([
        {
          id: 'doc-1',
          documentType: 'SOAT_INSURANCE',
          documentNumber: 'SOAT-2026-998811',
          fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          expirationDate: '2026-12-31',
          status: 'APPROVED',
        },
        {
          id: 'doc-2',
          documentType: 'TECHNICAL_INSPECTION',
          documentNumber: 'REV-TECH-2026-4411',
          fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          expirationDate: '2026-11-30',
          status: 'PENDING',
        },
      ]);
    }
  };

  const handleVerifyDocument = async (docId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/vehicles/documents/${docId}/verify`, {
        status,
        rejectionReason: status === 'REJECTED' ? 'Documento no legible o vencido' : undefined,
      });
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status } : d)),
      );
    } catch (err: any) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status } : d)),
      );
    }
  };

  const handleStatusChange = async (vehicleId: string, newStatus: string) => {
    try {
      await api.patch(`/vehicles/${vehicleId}/status`, { status: newStatus });
      setSelectedVehicle((prev: any) => ({ ...prev, status: newStatus }));
      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, status: newStatus } : v)),
      );
    } catch (err: any) {
      setSelectedVehicle((prev: any) => ({ ...prev, status: newStatus }));
      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, status: newStatus } : v)),
      );
    }
  };

  const toggleAmenity = (amenity: string) => {
    setNewVehicle((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    const payload = {
      make: newVehicle.make,
      model: newVehicle.model,
      year: Number(newVehicle.year),
      color: newVehicle.color,
      licensePlate: newVehicle.licensePlate.trim().toUpperCase(),
      vin: newVehicle.vin.trim().toUpperCase(),
      seats: Number(newVehicle.seats),
      category: newVehicle.category,
      transmission: newVehicle.transmission,
      fuelType: newVehicle.fuelType,
      luggageCapacity: newVehicle.luggageCapacity,
      amenities: newVehicle.amenities,
    };

    try {
      const res = await api.post('/vehicles', payload);
      const createdVehicle = res.data?.data;

      setSuccessToast('¡Vehículo registrado exitosamente en la flota!');
      setShowAddModal(false);
      loadVehicles();

      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err: any) {
      console.error('Error registrando vehículo en el sistema:', err);
      const message =
        err.response?.data?.message ||
        'Error al registrar el vehículo. Verifique que la placa o el VIN no estén duplicados.';
      setFormError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-black font-bold text-xs px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-emerald-400">
          <ShieldCheck className="w-5 h-5" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-executive-card border border-executive-border p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <Car className="w-7 h-7 text-luxury-gold" />
            Flota de Vehículos & Ficha Técnica Detallada
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Ficha técnica ejecutiva, estándares de confort VIP y validación documental.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadVehicles}
            title="Recargar flota"
            className="p-2.5 bg-executive-dark hover:bg-executive-border text-gray-300 rounded-xl border border-executive-border"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-bold text-xs rounded-xl shadow-lg shadow-luxury-gold/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> REGISTRAR NUEVO VEHÍCULO
          </button>
        </div>
      </div>

      {/* Fleet Table */}
      <div className="bg-executive-card border border-executive-border rounded-2xl p-6">
        {loading ? (
          <div className="text-center py-12 space-y-3">
            <RefreshCw className="w-8 h-8 text-luxury-gold animate-spin mx-auto" />
            <p className="text-sm text-gray-400">Cargando flota de vehículos ejecutivos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-executive-dark text-xs uppercase text-gray-400 border-b border-executive-border">
                <tr>
                  <th className="px-4 py-3">Vehículo / Modelo</th>
                  <th className="px-4 py-3">Placa / VIN</th>
                  <th className="px-4 py-3">Categoría / Motor</th>
                  <th className="px-4 py-3">Estado Operativo</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-executive-border/60">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-executive-dark/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-bold text-white text-base">{v.make} {v.model}</div>
                      <div className="text-xs text-gray-400">Año: {v.year} | Color: {v.color}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 bg-executive-dark border border-luxury-gold/30 text-luxury-gold text-xs font-mono font-bold rounded-lg">
                        {v.licensePlate}
                      </span>
                      <div className="text-[10px] text-gray-500 font-mono mt-1">VIN: {v.vin}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold rounded-full block w-fit">
                        {v.category}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1 block">{v.fuelType || 'Gasolina Premium'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          v.status === 'AVAILABLE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : v.status === 'IN_SERVICE'
                            ? 'bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => openDetailModal(v)}
                        className="px-3 py-2 bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold text-xs font-bold rounded-lg border border-luxury-gold/30 flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Ver Ficha Técnica Completa</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FULL DETAILED VEHICLE TECHNICAL DOSSIER MODAL */}
      {showDetailModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-executive-card border border-executive-border rounded-2xl w-full max-w-4xl p-6 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-executive-border pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-black text-white">
                    {selectedVehicle.make} {selectedVehicle.model}
                  </h3>
                  <span className="px-3 py-1 bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold font-mono font-bold text-xs rounded-full">
                    {selectedVehicle.licensePlate}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Ficha Técnica Ejecutiva & Expediente de Homologación</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-gray-400 hover:text-white rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Photo Gallery & Main Specs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Photo Showcase */}
              <div className="space-y-3">
                <div className="w-full h-56 rounded-2xl bg-executive-dark border border-executive-border overflow-hidden relative">
                  {selectedVehicle.photos && selectedVehicle.photos.length > 0 ? (
                    <img
                      src={selectedVehicle.photos[activePhotoIndex] || selectedVehicle.photos[0]}
                      alt={selectedVehicle.model}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                      <ImageIcon className="w-12 h-12 mb-2" />
                      <span className="text-xs">Fotografías del Vehículo</span>
                    </div>
                  )}
                </div>

                {selectedVehicle.photos && selectedVehicle.photos.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {selectedVehicle.photos.map((photo: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                          activePhotoIndex === idx ? 'border-luxury-gold' : 'border-transparent opacity-60'
                        }`}
                      >
                        <img src={photo} alt="thumbnail" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Technical Specifications Grid */}
              <div className="space-y-4 bg-executive-dark/70 p-5 rounded-2xl border border-executive-border">
                <h4 className="text-xs font-bold text-luxury-gold uppercase tracking-wider border-b border-executive-border/60 pb-2">
                  Especificaciones Mecánicas y Chasis
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Año de Fabricación</span>
                    <span className="font-bold text-white text-sm">{selectedVehicle.year}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Color Exterior</span>
                    <span className="font-bold text-white text-sm">{selectedVehicle.color}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase flex items-center gap-1">
                      <Settings className="w-3 h-3 text-luxury-gold" /> Transmisión
                    </span>
                    <span className="font-semibold text-gray-200">{selectedVehicle.transmission || 'Automática 9G-Tronic'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase flex items-center gap-1">
                      <Fuel className="w-3 h-3 text-luxury-gold" /> Motorización
                    </span>
                    <span className="font-semibold text-gray-200">{selectedVehicle.fuelType || 'Gasolina Premium'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase flex items-center gap-1">
                      <Users className="w-3 h-3 text-luxury-gold" /> Asientos VIP
                    </span>
                    <span className="font-bold text-white">{selectedVehicle.seats} Pasajeros</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase flex items-center gap-1">
                      <Luggage className="w-3 h-3 text-luxury-gold" /> Maletero
                    </span>
                    <span className="font-semibold text-gray-200">{selectedVehicle.luggageCapacity || '3 Maletas Grandes'}</span>
                  </div>
                </div>

                {/* Status Selector */}
                <div className="pt-3 border-t border-executive-border/60 flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-semibold">Estado Operativo:</span>
                  <select
                    value={selectedVehicle.status}
                    onChange={(e) => handleStatusChange(selectedVehicle.id, e.target.value)}
                    className="bg-executive-dark border border-luxury-gold/40 text-luxury-gold font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none"
                  >
                    <option value="AVAILABLE">DISPONIBLE (Disponible)</option>
                    <option value="IN_SERVICE">EN SERVICIO (En Servicio)</option>
                    <option value="MAINTENANCE">MANTENIMIENTO (Mantenimiento)</option>
                    <option value="DECOMMISSIONED">RETIRADO (Retirado)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* VIP Comfort Amenities Badges */}
            <div className="bg-executive-dark/50 p-5 rounded-2xl border border-executive-border space-y-3">
              <h4 className="text-xs font-bold text-luxury-gold uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Estándar de Confort Ejecutivos VIP (Amenities Incluidos)
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedVehicle.amenities && selectedVehicle.amenities.length > 0 ? (
                  selectedVehicle.amenities.map((item: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-executive-card border border-luxury-gold/30 text-gray-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-luxury-gold" />
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">Wi-Fi 5G, Asientos Cuero Nappa, Climatizador Tri-Zona</span>
                )}
              </div>
            </div>

            {/* Expedient Documents Verification Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-executive-border pb-2">
                <FileCheck className="w-4 h-4 text-luxury-gold" /> Expediente Digital & Pólizas
              </h4>

              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 bg-executive-dark border border-executive-border rounded-xl flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{doc.documentType}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            doc.status === 'APPROVED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : doc.status === 'REJECTED'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                              : 'bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/30'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">Folio: {doc.documentNumber || 'N/A'}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-luxury-gold" /> Vence: {doc.expirationDate}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-executive-border text-gray-300 hover:text-white rounded-lg text-xs flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" /> PDF
                      </a>
                      {doc.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleVerifyDocument(doc.id, 'APPROVED')}
                          className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" /> Aprobar
                        </button>
                      )}
                      {doc.status !== 'REJECTED' && (
                        <button
                          onClick={() => handleVerifyDocument(doc.id, 'REJECTED')}
                          className="px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <X className="w-4 h-4" /> Rechazar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-executive-border text-right">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2.5 bg-luxury-gold text-black rounded-xl text-xs font-bold"
              >
                CERRAR FICHA TÉCNICA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REDESIGNED REGISTRATION MODAL WITH EXECUTIVE USER-FACING LANGUAGE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-executive-card border border-executive-border rounded-2xl w-full max-w-4xl p-6 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-executive-border pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">
                      Alta de Vehículo Ejecutivo
                    </h3>
                    <p className="text-xs text-luxury-gold font-semibold uppercase tracking-wider">
                      Homologación de Unidad & Registro de Ficha Técnica
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 hover:text-white rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {formError && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-xs">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateVehicle} className="space-y-6 text-xs">
              {/* Sección 1: Ficha General & Identificación */}
              <div className="space-y-3 bg-executive-dark/70 p-5 rounded-2xl border border-executive-border">
                <div className="flex items-center justify-between border-b border-executive-border/60 pb-2">
                  <h4 className="text-xs font-bold text-luxury-gold uppercase tracking-wider">
                    1. Identificación y Categoría de la Unidad
                  </h4>
                  <button
                    type="button"
                    onClick={generateUniquePlateAndVin}
                    className="px-3 py-1 bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold font-bold text-[10px] rounded-lg border border-luxury-gold/30 flex items-center gap-1 transition-colors"
                  >
                    <Wand2 className="w-3 h-3" /> Generar Placa / VIN Único
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-400 mb-1">Marca</label>
                    <input
                      type="text"
                      required
                      value={newVehicle.make}
                      onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                      className="w-full bg-executive-dark border border-executive-border rounded-xl p-2.5 text-white font-semibold"
                      placeholder="BMW, Mercedes-Benz, Audi"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Modelo</label>
                    <input
                      type="text"
                      required
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                      className="w-full bg-executive-dark border border-executive-border rounded-xl p-2.5 text-white font-semibold"
                      placeholder="7 Series 740i"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Año de Fabricación</label>
                    <input
                      type="number"
                      required
                      min={2000}
                      max={2030}
                      value={newVehicle.year}
                      onChange={(e) => setNewVehicle({ ...newVehicle, year: Number(e.target.value) })}
                      className="w-full bg-executive-dark border border-executive-border rounded-xl p-2.5 text-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="block text-gray-400 mb-1">Color Exterior</label>
                    <input
                      type="text"
                      required
                      value={newVehicle.color}
                      onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                      className="w-full bg-executive-dark border border-executive-border rounded-xl p-2.5 text-white"
                      placeholder="Negro Zafiro"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Placa de Rodaje Única</label>
                    <input
                      type="text"
                      required
                      value={newVehicle.licensePlate}
                      onChange={(e) => setNewVehicle({ ...newVehicle, licensePlate: e.target.value })}
                      className="w-full bg-executive-dark border border-luxury-gold/40 rounded-xl p-2.5 text-luxury-gold font-mono font-bold uppercase"
                      placeholder="EXC-888"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Número VIN / Chasis</label>
                    <input
                      type="text"
                      required
                      value={newVehicle.vin}
                      onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value })}
                      className="w-full bg-executive-dark border border-executive-border rounded-xl p-2.5 text-white font-mono uppercase text-[11px]"
                      placeholder="WBA71CH080C098765"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Categoría Ejecutiva</label>
                    <select
                      value={newVehicle.category}
                      onChange={(e) => setNewVehicle({ ...newVehicle, category: e.target.value })}
                      className="w-full bg-executive-dark border border-executive-border rounded-xl p-2.5 text-white font-bold"
                    >
                      <option value="EXECUTIVE_SEDAN">EXECUTIVE_SEDAN (Sedán VIP)</option>
                      <option value="VIP_SUV">VIP_SUV (Camioneta SUV XL)</option>
                      <option value="PREMIUM_VAN">PREMIUM_VAN (Van Ejecutiva)</option>
                      <option value="LUXURY_ARMORED">LUXURY_ARMORED (Blindado Nivel VR7)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sección 2: Especificaciones Mecánicas */}
              <div className="space-y-3 bg-executive-dark/70 p-5 rounded-2xl border border-executive-border">
                <h4 className="text-xs font-bold text-luxury-gold uppercase tracking-wider border-b border-executive-border/60 pb-2">
                  2. Especificaciones Mecánicas y Confort
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-gray-400 mb-1">Transmisión</label>
                    <input
                      type="text"
                      value={newVehicle.transmission}
                      onChange={(e) => setNewVehicle({ ...newVehicle, transmission: e.target.value })}
                      className="w-full bg-executive-dark border border-executive-border rounded-xl p-2.5 text-white"
                      placeholder="Automática 9G-Tronic"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Motor / Combustible</label>
                    <input
                      type="text"
                      value={newVehicle.fuelType}
                      onChange={(e) => setNewVehicle({ ...newVehicle, fuelType: e.target.value })}
                      className="w-full bg-executive-dark border border-executive-border rounded-xl p-2.5 text-white"
                      placeholder="Gasolina Premium / Mild Hybrid"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Capacidad de Maletero</label>
                    <input
                      type="text"
                      value={newVehicle.luggageCapacity}
                      onChange={(e) => setNewVehicle({ ...newVehicle, luggageCapacity: e.target.value })}
                      className="w-full bg-executive-dark border border-executive-border rounded-xl p-2.5 text-white"
                      placeholder="3 Maletas Grandes + 2 de Mano"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Asientos Pasajeros</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={newVehicle.seats}
                      onChange={(e) => setNewVehicle({ ...newVehicle, seats: Number(e.target.value) })}
                      className="w-full bg-executive-dark border border-executive-border rounded-xl p-2.5 text-white font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Amenities VIP */}
              <div className="space-y-3 bg-executive-dark/50 p-5 rounded-2xl border border-executive-border">
                <h4 className="text-xs font-bold text-luxury-gold uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> 3. Seleccionar Amenities y Estándar de Confort Incluidos
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {AVAILABLE_AMENITIES_OPTIONS.map((item) => {
                    const checked = newVehicle.amenities.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleAmenity(item)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          checked
                            ? 'bg-luxury-gold/10 border-luxury-gold text-luxury-gold font-bold'
                            : 'bg-executive-dark border-executive-border text-gray-400 hover:text-white'
                        }`}
                      >
                        <CheckCircle2 className={`w-4 h-4 ${checked ? 'text-luxury-gold' : 'text-gray-600'}`} />
                        <span>{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-executive-border">
                <p className="text-[10px] text-gray-500">
                  La unidad quedará registrada con estado operativo inicial <span className="text-emerald-400 font-bold">Disponible</span>.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 bg-executive-border text-gray-300 hover:text-white rounded-xl text-xs font-bold"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-6 py-2.5 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-bold rounded-xl text-xs shadow-lg shadow-luxury-gold/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {formLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Registrando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> REGISTRAR VEHÍCULO
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
