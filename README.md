# 🚖 Rumbo Fino - Plataforma Tecnológica de Movilidad y Gestión de Flota Ejecutiva

![Rumbo Fino Banner](https://img.shields.io/badge/Architecture-Clean_Modular_Architecture-gold?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Web_Backoffice-Next.js_14_App_Router-black?style=for-the-badge&logo=nextdotjs)
![NestJS](https://img.shields.io/badge/Backend-NestJS_10-red?style=for-the-badge&logo=nestjs)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_TypeORM-blue?style=for-the-badge&logo=postgresql)
![WebSockets](https://img.shields.io/badge/Realtime-Socket.IO_WebSockets-010101?style=for-the-badge&logo=socketdotio)
![TailwindCSS](https://img.shields.io/badge/UI_UX-TailwindCSS_Dark_Theme-38B2AC?style=for-the-badge&logo=tailwindcss)

**Rumbo Fino** es una plataforma integral de alta gama para la gestión de flotas ejecutivas, despacho inteligente de viajes en tiempo real, control de choferes, liquidación multi-moneda (USD / Bs. BCV) y administración granular de permisos basada en roles (RBAC).

---

## 📑 Tabla de Contenidos
1. [Arquitectura del Sistema](#-arquitectura-del-sistema)
2. [Inicio Rápido](#-inicio-rápido)
3. [Perfiles de Usuario y Credenciales de Prueba](#-perfiles-de-usuario-y-credenciales-de-prueba)
4. [Módulos del Sistema](#-módulos-del-sistema)
5. [Sistema Dinámico de Roles y Permisos (RBAC)](#-sistema-dinámico-de-roles-y-permisos-rbac)
6. [Módulo Financiero y Tasas BCV](#-módulo-financiero-y-tasas-bcv)
7. [Centro de Despacho y Telemetría en Vivo](#-centro-de-despacho-y-telemetría-en-vivo)
8. [Bitácora de Desarrollo y Cambios Recientes](#-bitácora-de-desarrollo-y-cambios-recientes)

---

## 🏛️ Arquitectura del Sistema

El ecosistema está construido como un monorepositorio con separación limpia entre la capa de negocio y la interfaz de usuario:

```
rumbo_fino_master/
├── backend/                  # API REST & Servidor WebSockets (NestJS 10 + TypeORM)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/                 # Autenticación JWT y guards de seguridad
│   │   │   ├── users/                # Gestión de los 5 perfiles de usuario
│   │   │   ├── roles-permissions/    # Matriz dinámica de permisos y menú RBAC
│   │   │   ├── exchange-rates/       # Control de tasas de cambio oficiales BCV
│   │   │   ├── rides/                # Ciclo de vida del viaje, asignación y valoraciones
│   │   │   ├── vehicles/             # Control de flota y telemetría
│   │   │   └── websockets/           # Gateway de eventos en tiempo real
│   │   └── database/                 # Entidades PostgreSQL, semillas y migraciones
├── web_backoffice/           # Panel Administrativo Web (Next.js 14 App Router)
│   ├── src/
│   │   ├── app/dashboard/
│   │   │   ├── page.tsx              # Dashboard ejecutivo y métricas en vivo
│   │   │   ├── dispatch/             # Centro de despacho, mapa en vivo y HUD
│   │   │   ├── users/                # Administración de usuarios por rol
│   │   │   ├── roles-permissions/    # Constructor dinámico de permisos y sidebar
│   │   │   ├── exchange-rates/       # Monitor y actualizador de tasas BCV
│   │   │   ├── vehicles/             # Gestión de flota vehicular
│   │   │   ├── rides/                # Historial de servicios
│   │   │   └── financials/           # Liquidaciones y finanzas
│   │   ├── components/layout/        # Sidebar dinámico con filtrado de rutas RBAC
│   │   └── services/                 # Clientes API y conexión Socket.IO
```

---

## 🚀 Inicio Rápido

### Requisitos Previos
- **Node.js**: v18+ o v20+
- **PostgreSQL**: v14+ con base de datos `rumbo_fino` creada.

### Comando Unificado
Desde la **raíz del proyecto** (`rumbo_fino_master`), ejecuta:

```bash
npm run dev
```

Este comando inicia de forma concurrente:
- 🔴 **Backend API (NestJS):** `http://localhost:3000/api/v1`
  - 📖 **Documentación Swagger UI:** `http://localhost:3000/api/docs`
- 🔵 **Panel Web Backoffice (Next.js):** `http://localhost:3001`

### Otros Comandos de Utilidad

```bash
# Iniciar únicamente el Backend
npm run dev:backend

# Iniciar únicamente el Panel Web
npm run dev:web

# Sembrar la base de datos con usuarios, roles, tasas y viajes de prueba
npm run seed

# Compilar para producción
npm run build
```

---

## 👥 Perfiles de Usuario y Credenciales de Prueba

El sistema cuenta con **5 roles oficiales**, cada uno con su propio ámbito de responsabilidad y menú personalizado:

| Rol | Correo Electrónico | Contraseña | Alcance y Propósito |
| :--- | :--- | :--- | :--- |
| 👑 **Super Admin** | `admin@rumbofino.com` | `Admin2026*` | Acceso total al sistema, auditoría, configuración de tasas BCV y constructor de permisos RBAC. |
| 🏢 **Administrador de Flota** | `flota@rumbofino.com` | `AdminFlota2026*` | Supervisión de vehículos, asignación de choferes a unidades, mantenimiento y rendimiento. |
| 🎧 **Despachador** | `despacho@rumbofino.com` | `Despacho2026*` | Centro de control de viajes en vivo, asignación manual/automática y monitoreo de telemetría. |
| 🚖 **Chofer Ejecutivo** | `chofer1@rumbofino.com` | `Chofer2026*` | Recepción de viajes asignados, telemetría de ubicación y liquidaciones. |
| 👤 **Cliente / Pasajero** | `pasajero1@rumbofino.com` | `Pasajero2026*` | Historial de solicitudes corporativas, estado de viajes y calificaciones. |

> 💡 **Acceso Rápido:** En la pantalla de login (`http://localhost:3001/login`) se incluyen botones de 1-clic para iniciar sesión instantáneamente con cualquiera de los 5 perfiles.

---

## 📦 Módulos del Sistema

### 1. 📊 Dashboard Ejecutivo (`/dashboard`)
- Indicadores clave de rendimiento (KPIs): Total de viajes, ingresos brutos, choferes activos y satisfacción promedio.
- Gráficos en tiempo real con distribución de viajes por estado y facturación en USD y Bolívares (VES).

### 2. 🗺️ Centro de Despacho y Telemetría (`/dashboard/dispatch`)
- Mapa interactivo con tecnología Leaflet / OpenStreetMap.
- Marcadores circulares prémium en tiempo real para choferes (disponibles, ocupados y fuera de servicio).
- **HUD Flotante de Telemetría:** Muestra velocidad instantánea, nivel de batería, estado de conexión y coordenadas GPS.
- **Asignación en Caliente:** Asigna viajes entrantes a conductores cercanos en 1 clic.
- **Modal de Cierre y Valoración:** Sistema de calificación de 1 a 5 estrellas, propinas y comentarios de retroalimentación al finalizar el servicio.

### 3. 👥 Gestión de Usuarios (`/dashboard/users`)
- CRUD completo para administrar usuarios en los 5 roles del sistema.
- Filtros rápidos por rol (`SUPER_ADMIN`, `FLEET_ADMIN`, `DISPATCHER`, `DRIVER`, `PASSENGER`).
- Modal para creación y edición de perfiles con activación/suspensión de cuentas.

### 4. 🔐 Roles, Permisos y Menú Dinámico (`/dashboard/roles-permissions`)
- Permite al Super Administrador definir qué rutas del menú puede ver cada rol.
- Permisos granulares de acción: `Crear`, `Editar`, `Eliminar` y `Exportar Reportes`.
- **Simulador de Menú Lateral en Tiempo Real:** Visualiza cómo se verá el Sidebar para el rol seleccionado antes de guardar.
- Sincronización instantánea vía WebSockets (`system:roles_permissions_updated`).

### 5. 💵 Tasas de Cambio Oficiales BCV (`/dashboard/exchange-rates`)
- Control centralizado del tipo de cambio oficial del Banco Central de Venezuela (USD / VES).
- Conversor bidireccional en caliente.
- Historial de actualizaciones con registro de auditoría del usuario que realizó el cambio y exportación a CSV.
- Emisión de eventos WebSockets para recalcular cobros y balances automáticamente.

### 6. 🚖 Flota de Vehículos (`/dashboard/vehicles`)
- Registro de marcas, modelos, placas, años y categorías prémium (Sedán Ejecutivo, SUV VIP, Van Corporativa).
- Asociación vehículo-chofer y control de estado operativo.

### 7. 📍 Historial de Viajes (`/dashboard/rides`)
- Registro detallado de todos los servicios: origen, destino, tarifa calculada, conductor asignado, estado y valoraciones recibidas.

### 8. 📈 Finanzas y Liquidaciones (`/dashboard/financials`)
- Reportes consolidados de ingresos, comisiones de la plataforma y balances pendientes por pagar a choferes tanto en USD como en VES a la tasa oficial del día.

---

## 🛡️ Sistema Dinámico de Roles y Permisos (RBAC)

El panel web implementa un control de acceso basado en roles completamente dinámico:

1. **Almacenamiento en Base de Datos:** La tabla `role_permissions` en PostgreSQL almacena las rutas autorizadas (`allowed_routes`) y las acciones permitidas (`allowed_actions`) para cada rol.
2. **Sidebar Dinámico:** El componente `Sidebar.tsx` consulta las credenciales y permisos del usuario conectado y filtra los elementos visibles del menú de navegación.
3. **Protección en Backend:** Los controladores de NestJS validan el rol mediante decoradores `@Roles(...)` y Guards JWT.

---

## 📝 Bitácora de Desarrollo y Cambios Recientes

- **v1.4.0 (Septiembre 2026):**
  - ✨ Implementación del módulo de **Roles y Permisos Dinámicos (`/dashboard/roles-permissions`)** con constructor visual de menú y persistencia en base de datos.
  - ✨ Rediseño del **Sidebar de navegación** para adaptarse dinámicamente a los permisos del rol autenticado.
  - ✨ Creación del módulo de **Gestión de 5 Perfiles de Usuario (`/dashboard/users`)** con soporte para `SUPER_ADMIN`, `FLEET_ADMIN`, `DISPATCHER`, `DRIVER` y `PASSENGER`.
  - ✨ Creación del módulo de **Tasas de Cambio BCV (`/dashboard/exchange-rates`)** con actualización en tiempo real vía WebSockets.
  - ✨ Mejora sustancial en la **Consola de Despacho (`/dashboard/dispatch`)**: HUD flotante de telemetría, asignación de choferes y modal de calificación 5 estrellas + comentarios al cerrar servicios.
  - 🎨 Unificación de la identidad visual con paleta ejecutiva Oscura / Gold y tipografía de alta legibilidad.

---

© 2026 Rumbo Fino. Todos los derechos reservados.
