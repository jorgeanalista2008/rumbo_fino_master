'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  XCircle,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Wand2,
  ShieldCheck,
  Search,
  Filter,
  LayoutGrid,
  List,
  Upload,
  Phone,
  FileText,
  Clock,
  UserCheck,
  UserPlus,
  StopCircle,
} from 'lucide-react';
import { api } from '@/lib/api';

interface DocumentItem {
  id: string;
  vehicleId: string;
  documentType: 'SOAT_INSURANCE' | 'TECHNICAL_INSPECTION' | 'VEHICLE_TITLE' | string;
  documentNumber?: string;
  fileUrl: string;
  expirationDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  rejectionReason?: string;
  createdAt?: string;
}

interface AssignedDriver {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vin: string;
  seats: number;
  category: string;
  status: 'AVAILABLE' | 'IN_SERVICE' | 'MAINTENANCE' | 'DECOMMISSIONED' | string;
  transmission?: string;
  fuelType?: string;
  luggageCapacity?: string;
  amenities?: string[];
  photos?: string[];
  documents?: DocumentItem[];
  documentStats?: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  assignedDriver?: AssignedDriver | null;
  createdAt?: string;
}

const DOCUMENT_LABELS: Record<string, { title: string; desc: string }> = {
  SOAT_INSURANCE: {
    title: 'Póliza RCV / Seguro Todo Riesgo',
    desc: 'Cobertura de responsabilidad civil vehicular y daños a terceros vigente.',
  },
  TECHNICAL_INSPECTION: {
    title: 'Revisión Técnico-Mecánica',
    desc: 'Certificado de homologación y óptimo estado mecánico de la unidad.',
  },
  VEHICLE_TITLE: {
    title: 'Título de Propiedad / Carnet de Circulación',
    desc: 'Documento legal de propiedad emitido por el INTT / Registro Automotor.',
  },
};

const CATEGORY_LABELS: Record<string, { label: string; badgeColor: string }> = {
  EXECUTIVE_SEDAN: { label: 'Sedán VIP Ejecutivo', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  VIP_SUV: { label: 'Camioneta SUV XL VIP', badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  PREMIUM_VAN: { label: 'Van Ejecutiva VIP', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  LUXURY_ARMORED: { label: 'Blindado Nivel VR7', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
};

const AVAILABLE_AMENITIES_OPTIONS = [
  'Wi-Fi 5G Ilimitado',
  'Asientos de Cuero Nappa',
  'Climatizador Tri-Zona',
  'Cargadores USB-C / 110V',
  'Agua Mineral & Snacks VIP',
  'Cristales Tintados de Privacidad',
  'Sistema de Sonido Burmester® 3D',
  'Nevera / Refrigerador Integrado',
  'Pantallas de Entretenimiento Traseras',
  'Blindaje Nivel VR7',
];

const REJECTION_PRESETS = [
  'Documento borroso o ilegible',
  'Póliza de seguro vencida o caducada',
  'La placa de rodaje no coincide con la unidad',
  'El número VIN o serial de carrocería no coincide',
  'Documento recortado o incompleto',
];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [allDrivers, setAllDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [docFilter, setDocFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'specs' | 'documents' | 'upload_doc'>('specs');
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Driver Assignment inside modal
  const [showAssignDriverForm, setShowAssignDriverForm] = useState(false);
  const [selectedDriverIdToAssign, setSelectedDriverIdToAssign] = useState('');
  const [assignOdometer, setAssignOdometer] = useState(45000);
  const [assignNotes, setAssignNotes] = useState('');
  const [submittingDriverAssign, setSubmittingDriverAssign] = useState(false);

  // End Shift inside modal
  const [showEndShiftPrompt, setShowEndShiftPrompt] = useState(false);
  const [endShiftOdometer, setEndShiftOdometer] = useState(45000);
  const [submittingEndShift, setSubmittingEndShift] = useState(false);

  // Document verification state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Upload document form state
  const [uploadDocType, setUploadDocType] = useState('SOAT_INSURANCE');
  const [uploadDocNumber, setUploadDocNumber] = useState('');
  const [uploadDocExpiration, setUploadDocExpiration] = useState('2027-12-31');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Add vehicle modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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
      'Agua Mineral & Snacks VIP',
    ],
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const generatePlateAndVin = () => {
    const letters = ['EXC', 'VIP', 'LUX', 'RF', 'GLX'][Math.floor(Math.random() * 5)];
    const num = Math.floor(100 + Math.random() * 900);
    const vinRandom = `WBA71CH${Math.floor(10000000 + Math.random() * 90000000)}`;
    setNewVehicle((prev) => ({
      ...prev,
      licensePlate: `${letters}-${num}`,
      vin: vinRandom,
    }));
  };

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vehicles');
      if (res.data?.data) {
        setVehicles(res.data.data);
      }
    } catch (err: any) {
      console.error('Error cargando vehículos:', err);
      showToast('No se pudo sincronizar la flota con el servidor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAllDrivers = async () => {
    try {
      const res = await api.get('/drivers');
      if (res.data?.data) {
        setAllDrivers(res.data.data);
      }
    } catch (err) {
      console.warn('Error cargando lista de choferes:', err);
    }
  };

  useEffect(() => {
    loadVehicles();
    loadAllDrivers();
  }, []);

  const openAddModal = () => {
    generatePlateAndVin();
    setFormError('');
    setShowAddModal(true);
  };

  const openDetailModal = async (vehicle: Vehicle, defaultTab: 'specs' | 'documents' | 'upload_doc' = 'specs') => {
    setSelectedVehicle(vehicle);
    setActivePhotoIndex(0);
    setActiveModalTab(defaultTab);
    setShowAssignDriverForm(false);
    setShowEndShiftPrompt(false);
    setShowDetailModal(true);
    loadVehicleDocuments(vehicle.id);
    loadAllDrivers();
  };

  const loadVehicleDocuments = async (vehicleId: string) => {
    setLoadingDocs(true);
    try {
      const res = await api.get(`/vehicles/${vehicleId}/documents`);
      setDocuments(res.data?.data || []);
    } catch (err) {
      console.error('Error cargando documentos del vehículo:', err);
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Assign Driver to Vehicle Action
  const handleAssignDriverToVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !selectedDriverIdToAssign) return;

    setSubmittingDriverAssign(true);
    try {
      await api.post(`/drivers/${selectedDriverIdToAssign}/assign-vehicle`, {
        vehicleId: selectedVehicle.id,
        initialOdometer: Number(assignOdometer) || 45000,
        notes: assignNotes || 'Asignación desde Ficha Técnica Ejecutiva',
      });

      const assignedDriverObj = allDrivers.find((d) => d.id === selectedDriverIdToAssign);
      const driverInfo: AssignedDriver = {
        id: selectedDriverIdToAssign,
        name: `${assignedDriverObj?.user?.firstName || ''} ${assignedDriverObj?.user?.lastName || ''}`.trim(),
        phone: assignedDriverObj?.user?.phoneNumber,
        email: assignedDriverObj?.user?.email,
        avatarUrl: assignedDriverObj?.user?.avatarUrl,
        isOnline: assignedDriverObj?.isOnline || false,
      };

      setSelectedVehicle((prev) => (prev ? { ...prev, status: 'IN_SERVICE', assignedDriver: driverInfo } : null));
      setVehicles((prev) =>
        prev.map((v) => (v.id === selectedVehicle.id ? { ...v, status: 'IN_SERVICE', assignedDriver: driverInfo } : v)),
      );

      showToast('🚗 ¡Conductor asignado exitosamente a la unidad!');
      setShowAssignDriverForm(false);
      setSelectedDriverIdToAssign('');
      setAssignNotes('');
      loadVehicles();
      loadAllDrivers();
    } catch (err: any) {
      console.error('Error asignando conductor:', err);
      const msg = err.response?.data?.message || 'Error al asignar conductor al vehículo.';
      showToast(Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    } finally {
      setSubmittingDriverAssign(false);
    }
  };

  // Unassign / End Shift Action
  const handleUnassignDriverFromVehicle = async () => {
    if (!selectedVehicle) return;

    setSubmittingEndShift(true);
    try {
      try {
        await api.post(`/vehicles/${selectedVehicle.id}/release-driver`, {
          finalOdometer: Number(endShiftOdometer) || 50000,
          notes: 'Cierre de turno y liberación desde Ficha Técnica',
        });
      } catch (err1) {
        if (selectedVehicle.assignedDriver?.id) {
          await api.post(`/drivers/${selectedVehicle.assignedDriver.id}/end-shift-admin`, {
            finalOdometer: Number(endShiftOdometer) || 50000,
            notes: 'Cierre de turno y liberación desde Ficha Técnica',
          });
        } else {
          throw err1;
        }
      }

      setSelectedVehicle((prev) => (prev ? { ...prev, status: 'AVAILABLE', assignedDriver: null } : null));
      setVehicles((prev) =>
        prev.map((v) => (v.id === selectedVehicle.id ? { ...v, status: 'AVAILABLE', assignedDriver: null } : v)),
      );

      showToast('✅ Unidad liberada y conductor desasignado correctamente.');
      setShowEndShiftPrompt(false);
      loadVehicles();
      loadAllDrivers();
    } catch (err: any) {
      console.error('Error liberando unidad:', err);
      const msg = err.response?.data?.message || 'Error al liberar el vehículo.';
      showToast(Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    } finally {
      setSubmittingEndShift(false);
    }
  };

  const handleVerifyDocument = async (docId: string, status: 'APPROVED' | 'REJECTED', customReason?: string) => {
    setActionLoading(true);
    try {
      const reason = status === 'REJECTED' ? (customReason || rejectionReason || 'Documento no legible o vencido') : undefined;
      await api.patch(`/vehicles/documents/${docId}/verify`, {
        status,
        rejectionReason: reason,
      });

      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status, rejectionReason: reason } : d)),
      );

      setVehicles((prev) =>
        prev.map((v) => {
          if (v.id === selectedVehicle?.id) {
            const updatedDocs = (v.documents || []).map((d) =>
              d.id === docId ? { ...d, status, rejectionReason: reason } : d,
            );
            return {
              ...v,
              documents: updatedDocs,
              documentStats: {
                total: updatedDocs.length,
                approved: updatedDocs.filter((d) => d.status === 'APPROVED').length,
                pending: updatedDocs.filter((d) => d.status === 'PENDING').length,
                rejected: updatedDocs.filter((d) => d.status === 'REJECTED').length,
              },
            };
          }
          return v;
        }),
      );

      showToast(
        status === 'APPROVED'
          ? '✅ Documento aprobado y certificado con éxito.'
          : '⚠️ Documento rechazado. Se notificó la observación.',
        status === 'APPROVED' ? 'success' : 'error',
      );

      setRejectingDocId(null);
      setRejectionReason('');
    } catch (err: any) {
      console.error('Error verificando documento:', err);
      const msg = err.response?.data?.message || 'Error al procesar la verificación del documento.';
      showToast(Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    if (!uploadFile) {
      showToast('Por favor selecciona un archivo PDF o imagen', 'error');
      return;
    }

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('documentType', uploadDocType);
      formData.append('documentNumber', uploadDocNumber);
      formData.append('expirationDate', uploadDocExpiration);

      await api.post(`/vehicles/${selectedVehicle.id}/documents`, formData);

      showToast('📄 Documento subido exitosamente al expediente.');
      setUploadFile(null);
      setUploadDocNumber('');
      setActiveModalTab('documents');
      loadVehicleDocuments(selectedVehicle.id);
      loadVehicles();
    } catch (err: any) {
      console.error('Error subiendo documento:', err);
      const msg = err.response?.data?.message || 'Error al subir el documento.';
      showToast(Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleStatusChange = async (vehicleId: string, newStatus: string) => {
    try {
      await api.patch(`/vehicles/${vehicleId}/status`, { status: newStatus });
      setSelectedVehicle((prev: any) => (prev ? { ...prev, status: newStatus } : null));
      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, status: newStatus } : v)),
      );
      showToast(`Estado operativo actualizado a: ${newStatus}`);
    } catch (err: any) {
      console.error('Error cambiando estado del vehículo:', err);
      showToast('Error al actualizar el estado operativo.', 'error');
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
      make: newVehicle.make.trim(),
      model: newVehicle.model.trim(),
      year: Number(newVehicle.year),
      color: newVehicle.color.trim(),
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
      await api.post('/vehicles', payload);
      showToast('🚗 ¡Vehículo registrado exitosamente en la flota ejecutiva!');
      setShowAddModal(false);
      loadVehicles();
    } catch (err: any) {
      console.error('Error registrando vehículo:', err);
      const message =
        err.response?.data?.message ||
        'Error al registrar el vehículo. Verifique que la placa o el VIN no estén duplicados.';
      setFormError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setFormLoading(false);
    }
  };

  // KPIs calculation
  const kpis = useMemo(() => {
    const total = vehicles.length;
    const available = vehicles.filter((v) => v.status === 'AVAILABLE').length;
    const inService = vehicles.filter((v) => v.status === 'IN_SERVICE').length;
    const maintenance = vehicles.filter((v) => v.status === 'MAINTENANCE').length;
    
    let pendingDocsCount = 0;
    let vehiclesWithPending = 0;
    vehicles.forEach((v) => {
      const p = v.documentStats?.pending || 0;
      if (p > 0) {
        pendingDocsCount += p;
        vehiclesWithPending++;
      }
    });

    return { total, available, inService, maintenance, pendingDocsCount, vehiclesWithPending };
  }, [vehicles]);

  // Filtering
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        v.make?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q) ||
        v.licensePlate?.toLowerCase().includes(q) ||
        v.vin?.toLowerCase().includes(q) ||
        v.assignedDriver?.name?.toLowerCase().includes(q);

      const matchCat = categoryFilter === 'ALL' || v.category === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || v.status === statusFilter;

      let matchDoc = true;
      if (docFilter === 'PENDING') {
        matchDoc = (v.documentStats?.pending || 0) > 0;
      } else if (docFilter === 'APPROVED') {
        matchDoc = (v.documentStats?.total || 0) > 0 && (v.documentStats?.pending || 0) === 0 && (v.documentStats?.rejected || 0) === 0;
      } else if (docFilter === 'REJECTED') {
        matchDoc = (v.documentStats?.rejected || 0) > 0;
      }

      return matchSearch && matchCat && matchStatus && matchDoc;
    });
  }, [vehicles, searchQuery, categoryFilter, statusFilter, docFilter]);

  // Drivers available for assignment (without active vehicle)
  const availableDriversForAssignment = useMemo(() => {
    return allDrivers.filter((dr) => !dr.currentVehicleId && !dr.currentVehicle);
  }, [allDrivers]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-6 z-50 font-bold text-xs px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border transition-all animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-500 text-black border-emerald-400'
              : 'bg-red-500 text-white border-red-400'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <ShieldCheck className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-executive-card border border-executive-border p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
          <Car className="w-64 h-64 text-luxury-gold" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                Gestión de Flota Ejecutiva & Homologación
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Control de unidades de alta gama, verificación de pólizas RCV y expedientes mecánicos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => {
              loadVehicles();
              loadAllDrivers();
            }}
            title="Recargar flota"
            className="p-3 bg-executive-dark hover:bg-executive-border text-gray-300 rounded-xl border border-executive-border transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-luxury-gold' : ''}`} />
          </button>
          <button
            onClick={openAddModal}
            className="px-5 py-3 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-extrabold text-xs rounded-xl shadow-lg shadow-luxury-gold/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> REGISTRAR NUEVO VEHÍCULO
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-executive-card border border-executive-border rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Flota Total</span>
            <Car className="w-4 h-4 text-luxury-gold" />
          </div>
          <p className="text-2xl font-black text-white">{kpis.total}</p>
          <p className="text-[10px] text-gray-500">Unidades en inventario</p>
        </div>

        <div className="bg-executive-card border border-emerald-500/20 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-emerald-400 text-xs">
            <span>Disponibles</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{kpis.available}</p>
          <p className="text-[10px] text-gray-500">Listos para despacho</p>
        </div>

        <div className="bg-executive-card border border-luxury-gold/20 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-luxury-gold text-xs">
            <span>En Servicio</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-luxury-gold">{kpis.inService}</p>
          <p className="text-[10px] text-gray-500">En ruta o turno activo</p>
        </div>

        <div className="bg-executive-card border border-orange-500/20 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-orange-400 text-xs">
            <span>Mantenimiento</span>
            <Settings className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-orange-400">{kpis.maintenance}</p>
          <p className="text-[10px] text-gray-500">En taller preventivo</p>
        </div>

        <div
          onClick={() => setDocFilter(docFilter === 'PENDING' ? 'ALL' : 'PENDING')}
          className={`bg-executive-card rounded-2xl p-4 space-y-1 cursor-pointer transition-all border ${
            kpis.pendingDocsCount > 0
              ? 'border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10'
              : 'border-executive-border'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 text-xs">
            <span className="font-bold">Docs por Aprobar</span>
            <FileCheck className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-amber-400">{kpis.pendingDocsCount}</p>
            <span className="text-[10px] text-gray-400">({kpis.vehiclesWithPending} vehículos)</span>
          </div>
          <p className="text-[10px] text-amber-400/80 font-medium">Click para filtrar pendientes</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-executive-card border border-executive-border rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por placa, modelo, marca, VIN o chofer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-executive-dark border border-executive-border rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-luxury-gold/50 transition-colors"
            />
          </div>

          {/* Filters and View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-executive-dark border border-executive-border text-gray-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-luxury-gold/50"
            >
              <option value="ALL">Todas las Categorías</option>
              <option value="EXECUTIVE_SEDAN">Sedán VIP</option>
              <option value="VIP_SUV">SUV XL VIP</option>
              <option value="PREMIUM_VAN">Van Ejecutiva</option>
              <option value="LUXURY_ARMORED">Blindado VR7</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-executive-dark border border-executive-border text-gray-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-luxury-gold/50"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="AVAILABLE">🟢 Disponible</option>
              <option value="IN_SERVICE">🟡 En Servicio</option>
              <option value="MAINTENANCE">🟠 Mantenimiento</option>
              <option value="DECOMMISSIONED">🔴 Retirado</option>
            </select>

            <select
              value={docFilter}
              onChange={(e) => setDocFilter(e.target.value)}
              className="bg-executive-dark border border-executive-border text-gray-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-luxury-gold/50 font-medium"
            >
              <option value="ALL">Auditoría: Todos</option>
              <option value="PENDING">⏳ Con Docs Pendientes</option>
              <option value="APPROVED">✅ 100% Homologados</option>
              <option value="REJECTED">❌ Con Rechazos</option>
            </select>

            <div className="flex items-center bg-executive-dark border border-executive-border rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-luxury-gold text-black' : 'text-gray-400 hover:text-white'
                }`}
                title="Vista Cuadrícula VIP"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-luxury-gold text-black' : 'text-gray-400 hover:text-white'
                }`}
                title="Vista Tabla Detallada"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Vehicle List */}
      {loading ? (
        <div className="bg-executive-card border border-executive-border rounded-2xl p-16 text-center space-y-3">
          <RefreshCw className="w-10 h-10 text-luxury-gold animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-300">Sincronizando flota y expedientes...</p>
          <p className="text-xs text-gray-500">Consultando base de datos y validaciones de pólizas</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-executive-card border border-executive-border rounded-2xl p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-executive-dark border border-executive-border flex items-center justify-center mx-auto text-gray-500">
            <Car className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">No se encontraron vehículos</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            No hay unidades que coincidan con los filtros aplicados. Intenta restablecer los filtros o registra un nuevo vehículo.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('ALL');
              setStatusFilter('ALL');
              setDocFilter('ALL');
            }}
            className="px-4 py-2 bg-executive-dark hover:bg-executive-border text-luxury-gold text-xs font-bold rounded-xl border border-luxury-gold/30 inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Restablecer Filtros
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVehicles.map((v) => {
            const catInfo = CATEGORY_LABELS[v.category] || { label: v.category, badgeColor: 'bg-gray-500/10 text-gray-400 border-gray-500/30' };
            const pendingDocs = v.documentStats?.pending || 0;
            const approvedDocs = v.documentStats?.approved || 0;
            const totalDocs = v.documentStats?.total || 0;

            return (
              <div
                key={v.id}
                className="bg-executive-card border border-executive-border hover:border-luxury-gold/40 rounded-2xl p-5 space-y-4 transition-all hover:shadow-xl hover:shadow-black/40 flex flex-col justify-between"
              >
                {/* Top: Plate, Category & Status */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-executive-dark border border-luxury-gold/40 text-luxury-gold font-mono font-black text-sm rounded-lg shadow-inner">
                          {v.licensePlate}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            v.status === 'AVAILABLE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : v.status === 'IN_SERVICE'
                              ? 'bg-luxury-gold/10 text-luxury-gold border-luxury-gold/30 animate-pulse'
                              : v.status === 'MAINTENANCE'
                              ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {v.status === 'AVAILABLE'
                            ? 'DISPONIBLE'
                            : v.status === 'IN_SERVICE'
                            ? 'EN SERVICIO'
                            : v.status === 'MAINTENANCE'
                            ? 'MANTENIMIENTO'
                            : 'RETIRADO'}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white mt-1.5">
                        {v.make} {v.model}
                      </h3>
                      <p className="text-xs text-gray-400">
                        Año {v.year} • {v.color}
                      </p>
                    </div>

                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-xl border ${catInfo.badgeColor} shrink-0`}>
                      {catInfo.label}
                    </span>
                  </div>

                  {/* Vehicle Specs Bar */}
                  <div className="grid grid-cols-3 gap-2 bg-executive-dark/70 p-3 rounded-xl border border-executive-border/60 text-[11px]">
                    <div>
                      <span className="text-gray-500 block text-[9px] uppercase">Pasajeros</span>
                      <span className="font-bold text-white flex items-center gap-1">
                        <Users className="w-3 h-3 text-luxury-gold" /> {v.seats} VIP
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[9px] uppercase">Transmisión</span>
                      <span className="font-medium text-gray-200 truncate block">{v.transmission || 'Automática'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[9px] uppercase">Combustible</span>
                      <span className="font-medium text-gray-200 truncate block">{v.fuelType || 'Gasolina'}</span>
                    </div>
                  </div>

                  {/* Assigned Driver Badge */}
                  <div className="p-3 bg-executive-dark/40 border border-executive-border/80 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold font-black text-xs">
                        {v.assignedDriver ? v.assignedDriver.name.charAt(0) : <Users className="w-4 h-4 text-gray-500" />}
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">Conductor Asignado</span>
                        <span className="text-xs font-bold text-white">
                          {v.assignedDriver ? v.assignedDriver.name : 'Sin conductor asignado'}
                        </span>
                      </div>
                    </div>
                    {v.assignedDriver ? (
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          v.assignedDriver.isOnline
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                        }`}
                      >
                        {v.assignedDriver.isOnline ? 'EN LÍNEA' : 'OFFLINE'}
                      </span>
                    ) : (
                      <button
                        onClick={() => openDetailModal(v, 'specs')}
                        className="text-luxury-gold hover:underline text-[10px] font-bold flex items-center gap-1"
                      >
                        <UserPlus className="w-3 h-3" /> Asignar
                      </button>
                    )}
                  </div>

                  {/* Document Audit Indicator */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-gray-400 text-[11px] flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-luxury-gold" /> Expediente Digital:
                    </span>
                    {pendingDocs > 0 ? (
                      <button
                        onClick={() => openDetailModal(v, 'documents')}
                        className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/40 text-amber-400 text-[11px] font-bold rounded-lg flex items-center gap-1 animate-pulse"
                      >
                        <AlertTriangle className="w-3 h-3" /> {pendingDocs} Doc{pendingDocs > 1 ? 's' : ''} Pendiente{pendingDocs > 1 ? 's' : ''}
                      </button>
                    ) : totalDocs > 0 ? (
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {approvedDocs}/{totalDocs} Homologado
                      </span>
                    ) : (
                      <button
                        onClick={() => openDetailModal(v, 'upload_doc')}
                        className="text-luxury-gold hover:underline text-[11px] font-bold flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" /> Subir Pólizas
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-executive-border flex items-center gap-2">
                  <button
                    onClick={() => openDetailModal(v, 'specs')}
                    className="flex-1 py-2.5 bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold text-xs font-bold rounded-xl border border-luxury-gold/30 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-4 h-4" /> Ver Ficha Técnica
                  </button>
                  <button
                    onClick={() => openDetailModal(v, 'documents')}
                    className="p-2.5 bg-executive-dark hover:bg-executive-border text-gray-300 hover:text-white rounded-xl border border-executive-border transition-colors"
                    title="Expediente de Documentos"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-executive-card border border-executive-border rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-executive-dark text-xs uppercase text-gray-400 border-b border-executive-border">
                <tr>
                  <th className="px-5 py-4">Vehículo & Modelo</th>
                  <th className="px-5 py-4">Placa / VIN</th>
                  <th className="px-5 py-4">Categoría</th>
                  <th className="px-5 py-4">Conductor Asignado</th>
                  <th className="px-5 py-4">Estado Operativo</th>
                  <th className="px-5 py-4">Expediente Digital</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-executive-border/60">
                {filteredVehicles.map((v) => {
                  const catInfo = CATEGORY_LABELS[v.category] || { label: v.category, badgeColor: 'bg-gray-500/10 text-gray-400 border-gray-500/30' };
                  const pendingDocs = v.documentStats?.pending || 0;
                  const approvedDocs = v.documentStats?.approved || 0;
                  const totalDocs = v.documentStats?.total || 0;

                  return (
                    <tr key={v.id} className="hover:bg-executive-dark/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-base">
                          {v.make} {v.model}
                        </div>
                        <div className="text-xs text-gray-400">
                          Año {v.year} • {v.color} • {v.seats} Asientos VIP
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 bg-executive-dark border border-luxury-gold/40 text-luxury-gold text-xs font-mono font-black rounded-lg">
                          {v.licensePlate}
                        </span>
                        <div className="text-[10px] text-gray-500 font-mono mt-1">VIN: {v.vin}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-xl border ${catInfo.badgeColor} inline-block`}>
                          {catInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {v.assignedDriver ? (
                          <div>
                            <div className="font-bold text-white text-xs">{v.assignedDriver.name}</div>
                            <div className="text-[10px] text-gray-400">{v.assignedDriver.phone || 'Sin tlf'}</div>
                          </div>
                        ) : (
                          <button
                            onClick={() => openDetailModal(v, 'specs')}
                            className="text-luxury-gold hover:underline text-xs font-bold flex items-center gap-1"
                          >
                            <UserPlus className="w-3.5 h-3.5" /> Asignar Chofer
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                            v.status === 'AVAILABLE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : v.status === 'IN_SERVICE'
                              ? 'bg-luxury-gold/10 text-luxury-gold border-luxury-gold/30'
                              : v.status === 'MAINTENANCE'
                              ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {pendingDocs > 0 ? (
                          <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-lg flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3.5 h-3.5" /> {pendingDocs} Pendiente{pendingDocs > 1 ? 's' : ''}
                          </span>
                        ) : totalDocs > 0 ? (
                          <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {approvedDocs}/{totalDocs} Homologado
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">Sin documentos</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => openDetailModal(v, 'specs')}
                          className="px-3 py-1.5 bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold text-xs font-bold rounded-lg border border-luxury-gold/30 inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Expediente
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FULL EXECUTIVE VEHICLE TECHNICAL DOSSIER & DOCUMENT AUDIT MODAL */}
      {showDetailModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-executive-card border border-executive-border rounded-3xl w-full max-w-4xl p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-executive-border pb-5">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 bg-executive-dark border border-luxury-gold/40 text-luxury-gold font-mono font-black text-sm rounded-xl">
                    {selectedVehicle.licensePlate}
                  </span>
                  <h2 className="text-2xl font-black text-white">
                    {selectedVehicle.make} {selectedVehicle.model}
                  </h2>
                </div>
                <p className="text-xs text-gray-400">
                  VIN / Chasis: <span className="font-mono text-gray-300 font-bold">{selectedVehicle.vin}</span> • Año {selectedVehicle.year}
                </p>
              </div>

              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-gray-400 hover:text-white rounded-xl bg-executive-dark border border-executive-border transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-executive-border pb-2">
              <button
                onClick={() => setActiveModalTab('specs')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                  activeModalTab === 'specs'
                    ? 'bg-luxury-gold text-black shadow-lg shadow-luxury-gold/20'
                    : 'text-gray-400 hover:text-white hover:bg-executive-dark'
                }`}
              >
                <Car className="w-4 h-4" /> Ficha Técnica & Confort
              </button>

              <button
                onClick={() => setActiveModalTab('documents')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                  activeModalTab === 'documents'
                    ? 'bg-luxury-gold text-black shadow-lg shadow-luxury-gold/20'
                    : 'text-gray-400 hover:text-white hover:bg-executive-dark'
                }`}
              >
                <FileCheck className="w-4 h-4" /> Expediente Digital ({documents.length})
                {documents.some((d) => d.status === 'PENDING') && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>

              <button
                onClick={() => setActiveModalTab('upload_doc')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                  activeModalTab === 'upload_doc'
                    ? 'bg-luxury-gold text-black shadow-lg shadow-luxury-gold/20'
                    : 'text-gray-400 hover:text-white hover:bg-executive-dark'
                }`}
              >
                <Upload className="w-4 h-4" /> Subir Nuevo Documento
              </button>
            </div>

            {/* TAB 1: TECHNICAL SPECS & COMFORT */}
            {activeModalTab === 'specs' && (
              <div className="space-y-6">
                {/* Status Switcher Bar */}
                <div className="bg-executive-dark/90 p-4 rounded-2xl border border-executive-border flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-300">Estado Operativo Actual:</span>
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full border ${
                        selectedVehicle.status === 'AVAILABLE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : selectedVehicle.status === 'IN_SERVICE'
                          ? 'bg-luxury-gold/10 text-luxury-gold border-luxury-gold/30'
                          : selectedVehicle.status === 'MAINTENANCE'
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {selectedVehicle.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-gray-400">Modificar:</span>
                    <select
                      value={selectedVehicle.status}
                      onChange={(e) => handleStatusChange(selectedVehicle.id, e.target.value)}
                      className="bg-executive-dark border border-luxury-gold/40 text-luxury-gold font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-luxury-gold"
                    >
                      <option value="AVAILABLE">🟢 DISPONIBLE (Listo para asignar)</option>
                      <option value="IN_SERVICE">🟡 EN SERVICIO (En turno/viaje)</option>
                      <option value="MAINTENANCE">🟠 MANTENIMIENTO (Taller)</option>
                      <option value="DECOMMISSIONED">🔴 RETIRADO (Baja temporal)</option>
                    </select>
                  </div>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* General Mechanics */}
                  <div className="bg-executive-dark/60 p-5 rounded-2xl border border-executive-border space-y-3">
                    <h4 className="text-xs font-bold text-luxury-gold uppercase tracking-wider border-b border-executive-border/60 pb-2 flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Mecánica y Chasis
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase">Marca / Fabricante</span>
                        <span className="font-bold text-white text-sm">{selectedVehicle.make}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase">Modelo</span>
                        <span className="font-bold text-white text-sm">{selectedVehicle.model}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase">Color Exterior</span>
                        <span className="font-semibold text-gray-200">{selectedVehicle.color}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase">Transmisión</span>
                        <span className="font-semibold text-gray-200">{selectedVehicle.transmission || 'Automática'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase">Motor / Combustible</span>
                        <span className="font-semibold text-gray-200">{selectedVehicle.fuelType || 'Gasolina'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase">Capacidad Maletero</span>
                        <span className="font-semibold text-gray-200">{selectedVehicle.luggageCapacity || '3 Maletas'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Driver Assignment Card (INTERACTIVE) */}
                  <div className="bg-executive-dark/60 p-5 rounded-2xl border border-executive-border space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-executive-border/60 pb-2">
                        <h4 className="text-xs font-bold text-luxury-gold uppercase tracking-wider flex items-center gap-2">
                          <UserCheck className="w-4 h-4" /> Conductor Ejecutivo Asignado
                        </h4>
                        {!selectedVehicle.assignedDriver && !showAssignDriverForm && (
                          <button
                            onClick={() => {
                              setShowAssignDriverForm(true);
                              if (availableDriversForAssignment.length > 0) {
                                setSelectedDriverIdToAssign(availableDriversForAssignment[0].id);
                              }
                            }}
                            className="px-2.5 py-1 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-extrabold text-[10px] rounded-lg shadow-sm flex items-center gap-1 transition-all"
                          >
                            <UserPlus className="w-3 h-3" /> Asignar Chofer
                          </button>
                        )}
                      </div>

                      {/* Driver Status Display */}
                      <div className="pt-3">
                        {selectedVehicle.assignedDriver ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold font-black text-lg">
                                  {selectedVehicle.assignedDriver.name.charAt(0)}
                                </div>
                                <div>
                                  <h5 className="font-bold text-white text-sm">{selectedVehicle.assignedDriver.name}</h5>
                                  <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-luxury-gold" /> {selectedVehicle.assignedDriver.phone || 'Sin teléfono'}
                                  </p>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 inline-block ${
                                      selectedVehicle.assignedDriver.isOnline
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                        : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                                    }`}
                                  >
                                    {selectedVehicle.assignedDriver.isOnline ? '🟢 Chofer en línea (GPS Activo)' : '⚪ Desconectado'}
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => setShowEndShiftPrompt(!showEndShiftPrompt)}
                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                              >
                                <StopCircle className="w-3.5 h-3.5" /> Liberar
                              </button>
                            </div>

                            {/* End Shift Prompt Inline */}
                            {showEndShiftPrompt && (
                              <div className="p-3.5 bg-executive-card border border-red-500/40 rounded-xl space-y-2.5 animate-fadeIn">
                                <h6 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Finalizar Turno y Liberar Vehículo
                                </h6>
                                <div>
                                  <label className="block text-[10px] text-gray-400 uppercase mb-1">Odómetro Final (km)</label>
                                  <input
                                    type="number"
                                    value={endShiftOdometer}
                                    onChange={(e) => setEndShiftOdometer(Number(e.target.value))}
                                    className="w-full bg-executive-dark border border-executive-border rounded-lg p-2 text-xs text-white font-mono"
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setShowEndShiftPrompt(false)}
                                    className="px-2.5 py-1 bg-executive-dark text-gray-400 text-xs rounded-lg"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    disabled={submittingEndShift}
                                    onClick={handleUnassignDriverFromVehicle}
                                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-lg disabled:opacity-50"
                                  >
                                    {submittingEndShift ? 'Liberando...' : 'Confirmar'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : !showAssignDriverForm ? (
                          <div className="text-center py-5 space-y-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-executive-dark border border-executive-border flex items-center justify-center mx-auto text-gray-500">
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-300 font-semibold">Esta unidad no tiene ningún conductor en turno asignado.</p>
                              <p className="text-[11px] text-gray-500">Asigna un chofer disponible para habilitarla al despacho.</p>
                            </div>
                            <button
                              onClick={() => {
                                setShowAssignDriverForm(true);
                                if (availableDriversForAssignment.length > 0) {
                                  setSelectedDriverIdToAssign(availableDriversForAssignment[0].id);
                                }
                              }}
                              className="px-4 py-2 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-extrabold text-xs rounded-xl shadow-md inline-flex items-center gap-1.5 transition-all mt-1"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> ASIGNAR CONDUCTOR EJECUTIVO
                            </button>
                          </div>
                        ) : (
                          /* Inline Assignment Form */
                          <form onSubmit={handleAssignDriverToVehicle} className="space-y-3 bg-executive-dark p-4 rounded-xl border border-luxury-gold/40 animate-fadeIn">
                            <div className="flex items-center justify-between border-b border-executive-border/60 pb-2">
                              <h5 className="text-xs font-bold text-luxury-gold flex items-center gap-1.5">
                                <UserPlus className="w-3.5 h-3.5" /> Asignar Turno de Conducción
                              </h5>
                              <button
                                type="button"
                                onClick={() => setShowAssignDriverForm(false)}
                                className="text-gray-400 hover:text-white"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="space-y-2.5 text-xs">
                              <div>
                                <label className="block text-gray-300 font-semibold mb-1">Seleccionar Chofer Disponible</label>
                                <select
                                  required
                                  value={selectedDriverIdToAssign}
                                  onChange={(e) => setSelectedDriverIdToAssign(e.target.value)}
                                  className="w-full bg-executive-card border border-executive-border rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-luxury-gold font-medium"
                                >
                                  {availableDriversForAssignment.length === 0 ? (
                                    <option value="">No hay choferes libres sin vehículo</option>
                                  ) : (
                                    availableDriversForAssignment.map((dr) => (
                                      <option key={dr.id} value={dr.id}>
                                        {dr.user?.firstName} {dr.user?.lastName} (Lic: {dr.licenseNumber} - ⭐ {Number(dr.ratingAvg || 5).toFixed(1)})
                                      </option>
                                    ))
                                  )}
                                </select>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-gray-300 font-semibold mb-1">Odómetro Inicial (km)</label>
                                  <input
                                    type="number"
                                    required
                                    min={0}
                                    value={assignOdometer}
                                    onChange={(e) => setAssignOdometer(Number(e.target.value))}
                                    className="w-full bg-executive-card border border-executive-border rounded-xl p-2 text-white font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-300 font-semibold mb-1">Notas (Opcional)</label>
                                  <input
                                    type="text"
                                    placeholder="Ej: Turno ejecutivo"
                                    value={assignNotes}
                                    onChange={(e) => setAssignNotes(e.target.value)}
                                    className="w-full bg-executive-card border border-executive-border rounded-xl p-2 text-white"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setShowAssignDriverForm(false)}
                                className="px-3 py-1.5 bg-executive-card text-gray-400 text-xs rounded-lg"
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                disabled={submittingDriverAssign || !selectedDriverIdToAssign}
                                className="px-4 py-1.5 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-extrabold text-xs rounded-lg shadow-md disabled:opacity-50 flex items-center gap-1.5"
                              >
                                {submittingDriverAssign ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Asignando...
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5" /> Confirmar Asignación
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amenities Badges */}
                <div className="bg-executive-dark/60 p-5 rounded-2xl border border-executive-border space-y-3">
                  <h4 className="text-xs font-bold text-luxury-gold uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Estándar de Confort Ejecutivo VIP (Amenities Verificados)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedVehicle.amenities && selectedVehicle.amenities.length > 0 ? (
                      selectedVehicle.amenities.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-executive-card border border-luxury-gold/30 text-gray-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-luxury-gold" />
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500 italic">No se han registrado amenities específicos.</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DIGITAL EXPEDIENT & VERIFICATION */}
            {activeModalTab === 'documents' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Documentos de Homologación & Pólizas</h4>
                    <p className="text-xs text-gray-400">
                      Revisa, aprueba o rechaza los documentos legales y pólizas RCV del vehículo.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveModalTab('upload_doc')}
                    className="px-3.5 py-1.5 bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold text-xs font-bold rounded-xl border border-luxury-gold/30 flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Subir Documento
                  </button>
                </div>

                {loadingDocs ? (
                  <div className="text-center py-10 space-y-2">
                    <RefreshCw className="w-6 h-6 text-luxury-gold animate-spin mx-auto" />
                    <p className="text-xs text-gray-400">Cargando expediente digital...</p>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="bg-executive-dark/50 border border-executive-border rounded-2xl p-8 text-center space-y-3">
                    <FileText className="w-10 h-10 text-gray-600 mx-auto" />
                    <h5 className="font-bold text-white text-sm">No hay documentos registrados para esta unidad</h5>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      Para homologar este vehículo y habilitarlo al despacho, sube la póliza RCV y la revisión técnica.
                    </p>
                    <button
                      onClick={() => setActiveModalTab('upload_doc')}
                      className="px-4 py-2 bg-luxury-gold text-black font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" /> Subir Documento Ahora
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => {
                      const meta = DOCUMENT_LABELS[doc.documentType] || {
                        title: doc.documentType,
                        desc: 'Documento de soporte vehicular',
                      };

                      return (
                        <div
                          key={doc.id}
                          className="bg-executive-dark border border-executive-border rounded-2xl p-5 space-y-3 hover:border-luxury-gold/30 transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-sm text-white">{meta.title}</h5>
                                <span
                                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                                    doc.status === 'APPROVED'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : doc.status === 'REJECTED'
                                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                                  }`}
                                >
                                  {doc.status === 'APPROVED'
                                    ? 'Aprobado'
                                    : doc.status === 'REJECTED'
                                    ? 'Rechazado'
                                    : 'Pendiente Revisión'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400">{meta.desc}</p>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 pt-1">
                                {doc.documentNumber && (
                                  <span>
                                    Folio / N°:{' '}
                                    <strong className="text-gray-200 font-mono">{doc.documentNumber}</strong>
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-luxury-gold" /> Vence:{' '}
                                  <strong className="text-gray-200">{String(doc.expirationDate).split('T')[0]}</strong>
                                </span>
                              </div>
                            </div>

                            {/* Actions for Document */}
                            <div className="flex items-center gap-2 shrink-0">
                              {doc.fileUrl && (
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-2 bg-executive-card hover:bg-executive-border text-gray-300 hover:text-white rounded-xl text-xs font-bold border border-executive-border flex items-center gap-1.5 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5 text-luxury-gold" /> Ver Archivo
                                </a>
                              )}

                              {doc.status !== 'APPROVED' && (
                                <button
                                  disabled={actionLoading}
                                  onClick={() => handleVerifyDocument(doc.id, 'APPROVED')}
                                  className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                >
                                  <Check className="w-4 h-4" /> Aprobar
                                </button>
                              )}

                              {doc.status !== 'REJECTED' && (
                                <button
                                  disabled={actionLoading}
                                  onClick={() => {
                                    setRejectingDocId(doc.id);
                                    setRejectionReason('');
                                  }}
                                  className="px-3.5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-xs font-bold border border-red-500/30 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                >
                                  <X className="w-4 h-4" /> Rechazar
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Rejection Note Display */}
                          {doc.status === 'REJECTED' && doc.rejectionReason && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2 text-xs text-red-400">
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Motivo del rechazo: </span>
                                <span>{doc.rejectionReason}</span>
                              </div>
                            </div>
                          )}

                          {/* Rejection Prompt Box */}
                          {rejectingDocId === doc.id && (
                            <div className="p-4 bg-executive-card border border-red-500/40 rounded-xl space-y-3 animate-fadeIn">
                              <h6 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4" /> Especificar Motivo de Rechazo:
                              </h6>
                              <div className="flex flex-wrap gap-1.5">
                                {REJECTION_PRESETS.map((preset, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setRejectionReason(preset)}
                                    className="px-2.5 py-1 bg-executive-dark hover:bg-red-500/20 text-gray-300 hover:text-red-300 text-[10px] rounded-lg border border-executive-border transition-colors text-left"
                                  >
                                    {preset}
                                  </button>
                                ))}
                              </div>
                              <input
                                type="text"
                                placeholder="Escribe el motivo detallado de rechazo..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full bg-executive-dark border border-red-500/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setRejectingDocId(null)}
                                  className="px-3 py-1.5 bg-executive-dark text-gray-400 text-xs rounded-lg"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  disabled={actionLoading || !rejectionReason.trim()}
                                  onClick={() => handleVerifyDocument(doc.id, 'REJECTED', rejectionReason)}
                                  className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-lg disabled:opacity-50"
                                >
                                  Confirmar Rechazo
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: UPLOAD DOCUMENT FORM */}
            {activeModalTab === 'upload_doc' && (
              <form onSubmit={handleUploadDocument} className="space-y-4 bg-executive-dark/70 p-6 rounded-2xl border border-executive-border">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Upload className="w-4 h-4 text-luxury-gold" /> Carga de Póliza o Documento para {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.licensePlate})
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Adjunta el archivo escaneado (PDF o Imagen) para someterlo al proceso de homologación.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-300 font-semibold mb-1">Tipo de Documento</label>
                    <select
                      value={uploadDocType}
                      onChange={(e) => setUploadDocType(e.target.value)}
                      className="w-full bg-executive-dark border border-executive-border rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-luxury-gold"
                    >
                      <option value="SOAT_INSURANCE">Póliza RCV / Seguro Todo Riesgo</option>
                      <option value="TECHNICAL_INSPECTION">Revisión Técnico-Mecánica</option>
                      <option value="VEHICLE_TITLE">Título de Propiedad / Carnet de Circulación</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-300 font-semibold mb-1">Número de Folio / Póliza (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: POL-2026-998811"
                      value={uploadDocNumber}
                      onChange={(e) => setUploadDocNumber(e.target.value)}
                      className="w-full bg-executive-dark border border-executive-border rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-luxury-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-300 font-semibold mb-1">Fecha de Vencimiento</label>
                    <input
                      type="date"
                      required
                      value={uploadDocExpiration}
                      onChange={(e) => setUploadDocExpiration(e.target.value)}
                      className="w-full bg-executive-dark border border-executive-border rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-luxury-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-300 font-semibold mb-1">Archivo Digital (PDF o Imagen PNG/JPG)</label>
                    <input
                      type="file"
                      required
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                      className="w-full bg-executive-dark border border-executive-border rounded-xl p-2 text-xs text-gray-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-luxury-gold file:text-black hover:file:bg-luxury-gold-hover cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-executive-border flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('documents')}
                    className="px-4 py-2 bg-executive-border text-gray-300 text-xs font-bold rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingDoc}
                    className="px-6 py-2 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-extrabold text-xs rounded-xl shadow-lg shadow-luxury-gold/20 flex items-center gap-2 disabled:opacity-50 transition-all"
                  >
                    {uploadingDoc ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Subiendo Archivo...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" /> Subir al Expediente
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-executive-border flex items-center justify-between">
              <span className="text-[11px] text-gray-500 font-mono">ID: {selectedVehicle.id}</span>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2.5 bg-executive-border hover:bg-executive-border/80 text-white font-bold text-xs rounded-xl transition-colors"
              >
                CERRAR EXPEDIENTE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW VEHICLE REGISTRATION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-executive-card border border-executive-border rounded-3xl w-full max-w-4xl p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-executive-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Alta de Vehículo Ejecutivo</h3>
                  <p className="text-xs text-luxury-gold font-semibold uppercase tracking-wider">
                    Homologación de Unidad & Registro de Ficha Técnica
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 hover:text-white rounded-xl bg-executive-dark border border-executive-border"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-xs">
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
                    onClick={generatePlateAndVin}
                    className="px-3 py-1.5 bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold font-bold text-[11px] rounded-xl border border-luxury-gold/30 flex items-center gap-1.5 transition-colors"
                  >
                    <Wand2 className="w-3.5 h-3.5" /> Generar Placa & VIN
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-400 mb-1">Marca / Fabricante</label>
                    <input
                      type="text"
                      required
                      value={newVehicle.make}
                      onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                      className="w-full bg-executive-dark border border-executive-border rounded-xl p-2.5 text-white font-semibold"
                      placeholder="Mercedes-Benz, BMW, Cadillac, Audi"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Modelo de Unidad</label>
                    <input
                      type="text"
                      required
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                      className="w-full bg-executive-dark border border-executive-border rounded-xl p-2.5 text-white font-semibold"
                      placeholder="E-Class 350 AMG Line, 740i, Escalade"
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
                      placeholder="Negro Zafiro Metalizado"
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
                      placeholder="VIP-777"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Número VIN / Serial Chasis</label>
                    <input
                      type="text"
                      required
                      value={newVehicle.vin}
                      onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value })}
                      className="w-full bg-executive-dark border border-executive-border rounded-xl p-2.5 text-white font-mono uppercase text-[11px]"
                      placeholder="WDD2130421A123456"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Categoría Ejecutiva</label>
                    <select
                      value={newVehicle.category}
                      onChange={(e) => setNewVehicle({ ...newVehicle, category: e.target.value })}
                      className="w-full bg-executive-dark border border-executive-border rounded-xl p-2.5 text-white font-bold"
                    >
                      <option value="EXECUTIVE_SEDAN">Sedán VIP Ejecutivo</option>
                      <option value="VIP_SUV">Camioneta SUV XL VIP</option>
                      <option value="PREMIUM_VAN">Van Ejecutiva VIP</option>
                      <option value="LUXURY_ARMORED">Blindado Nivel VR7</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sección 2: Mecánica & Confort */}
              <div className="space-y-3 bg-executive-dark/70 p-5 rounded-2xl border border-executive-border">
                <h4 className="text-xs font-bold text-luxury-gold uppercase tracking-wider border-b border-executive-border/60 pb-2">
                  2. Especificaciones Mecánicas y Capacidad
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
                    <label className="block text-gray-400 mb-1">Asientos Pasajeros VIP</label>
                    <input
                      type="number"
                      min={1}
                      max={14}
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
                  <Sparkles className="w-4 h-4" /> 3. Amenities y Estándar de Confort VIP Incluidos
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
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
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${checked ? 'text-luxury-gold' : 'text-gray-600'}`} />
                        <span className="truncate">{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-executive-border">
                <p className="text-[10px] text-gray-500">
                  La unidad quedará registrada con estado inicial <strong className="text-emerald-400 font-bold">DISPONIBLE</strong>.
                </p>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-executive-border text-gray-300 hover:text-white rounded-xl text-xs font-bold"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-luxury-gold hover:bg-luxury-gold-hover text-black font-extrabold rounded-xl text-xs shadow-lg shadow-luxury-gold/20 flex items-center justify-center gap-2 disabled:opacity-50"
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
