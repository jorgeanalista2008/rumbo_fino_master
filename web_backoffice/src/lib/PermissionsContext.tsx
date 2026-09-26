'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getAuthUser } from './api';
import { getSocket } from './socket';

export interface UserPermissions {
  role: string;
  displayName: string;
  allowedRoutes: string[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

interface PermissionsContextType {
  user: any;
  permissions: UserPermissions | null;
  loading: boolean;
  hasRouteAccess: (route?: string | null) => boolean;
  can: (action: 'create' | 'edit' | 'delete' | 'export') => boolean;
  refreshPermissions: () => Promise<void>;
}

const DEFAULT_FALLBACK_PERMISSIONS: Record<string, UserPermissions> = {
  SUPER_ADMIN: {
    role: 'SUPER_ADMIN',
    displayName: 'Super Admin',
    allowedRoutes: [
      '/dashboard',
      '/dashboard/vehicles',
      '/dashboard/drivers',
      '/dashboard/dispatch',
      '/dashboard/financials',
      '/dashboard/exchange-rates',
      '/dashboard/users',
      '/dashboard/roles-permissions',
    ],
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
  },
  FLEET_ADMIN: {
    role: 'FLEET_ADMIN',
    displayName: 'Administrador de Flota',
    allowedRoutes: [
      '/dashboard',
      '/dashboard/vehicles',
      '/dashboard/drivers',
      '/dashboard/exchange-rates',
    ],
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
  },
  DISPATCHER: {
    role: 'DISPATCHER',
    displayName: 'Despachador Central',
    allowedRoutes: [
      '/dashboard',
      '/dashboard/dispatch',
      '/dashboard/drivers',
      '/dashboard/vehicles',
    ],
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
  },
  DRIVER: {
    role: 'DRIVER',
    displayName: 'Chofer VIP',
    allowedRoutes: ['/dashboard/drivers', '/dashboard/dispatch'],
    canCreate: false,
    canEdit: true,
    canDelete: false,
    canExport: false,
  },
  PASSENGER: {
    role: 'PASSENGER',
    displayName: 'Cliente / Pasajero',
    allowedRoutes: ['/dashboard/dispatch'],
    canCreate: true,
    canEdit: false,
    canDelete: false,
    canExport: false,
  },
};

const PermissionsContext = createContext<PermissionsContextType>({
  user: null,
  permissions: null,
  loading: true,
  hasRouteAccess: () => false,
  can: () => false,
  refreshPermissions: async () => {},
});

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPermissions = useCallback(async () => {
    const authUser = getAuthUser();
    if (!authUser) {
      setUser(null);
      setPermissions(null);
      setLoading(false);
      return;
    }

    setUser(authUser);

    if (authUser.role === 'SUPER_ADMIN') {
      setPermissions(DEFAULT_FALLBACK_PERMISSIONS.SUPER_ADMIN);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get<any>('/roles-permissions/my-permissions');
      const data = res.data?.data || res.data;
      if (data && Array.isArray(data.allowedRoutes)) {
        setPermissions({
          role: data.role || authUser.role,
          displayName: data.displayName || authUser.role,
          allowedRoutes: data.allowedRoutes,
          canCreate: data.canCreate ?? true,
          canEdit: data.canEdit ?? true,
          canDelete: data.canDelete ?? false,
          canExport: data.canExport ?? true,
        });
      } else {
        const fallback = DEFAULT_FALLBACK_PERMISSIONS[authUser.role] || DEFAULT_FALLBACK_PERMISSIONS.DISPATCHER;
        setPermissions(fallback);
      }
    } catch (err) {
      console.warn('⚠️ Usando permisos de respaldo para el rol:', authUser.role);
      const fallback = DEFAULT_FALLBACK_PERMISSIONS[authUser.role] || DEFAULT_FALLBACK_PERMISSIONS.DISPATCHER;
      setPermissions(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();

    const socket = getSocket();
    if (socket) {
      const handleRoleUpdate = (data: any) => {
        const currentAuth = getAuthUser();
        if (currentAuth && currentAuth.role === data.role) {
          fetchPermissions();
        }
      };

      socket.on('system:roles_permissions_updated', handleRoleUpdate);
      return () => {
        socket.off('system:roles_permissions_updated', handleRoleUpdate);
      };
    }
  }, [fetchPermissions]);

  const hasRouteAccess = useCallback(
    (route?: string | null): boolean => {
      if (!route) return true;
      if (!user) return false;
      if (user.role === 'SUPER_ADMIN') return true;
      if (!permissions || !Array.isArray(permissions.allowedRoutes)) return false;

      // Exact match or base match
      return permissions.allowedRoutes.some((allowed) => {
        if (allowed === route) return true;
        // Allow subpaths like /dashboard/vehicles/123 if /dashboard/vehicles is allowed
        if (route.startsWith(allowed + '/')) return true;
        return false;
      });
    },
    [user, permissions],
  );

  const can = useCallback(
    (action: 'create' | 'edit' | 'delete' | 'export'): boolean => {
      if (!user) return false;
      if (user.role === 'SUPER_ADMIN') return true;
      if (!permissions) return false;

      switch (action) {
        case 'create':
          return !!permissions.canCreate;
        case 'edit':
          return !!permissions.canEdit;
        case 'delete':
          return !!permissions.canDelete;
        case 'export':
          return !!permissions.canExport;
        default:
          return false;
      }
    },
    [user, permissions],
  );

  return (
    <PermissionsContext.Provider
      value={{
        user,
        permissions,
        loading,
        hasRouteAccess,
        can,
        refreshPermissions: fetchPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
