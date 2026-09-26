# Rumbo Fino - Plataforma Tecnológica de Movilidad y Gestión de Flota Ejecutiva

![Rumbo Fino Banner](https://img.shields.io/badge/Architecture-Clean_DDD-gold?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Web_Backoffice-Next.js_14-black?style=for-the-badge&logo=nextdotjs)
![NestJS](https://img.shields.io/badge/Backend-NestJS_10-red?style=for-the-badge&logo=nestjs)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_PostGIS-blue?style=for-the-badge&logo=postgresql)
![Flutter](https://img.shields.io/badge/Mobile-Flutter_Monorepo-02569B?style=for-the-badge&logo=flutter)

**Rumbo Fino** es una solución prémium orientada al transporte ejecutivo y flota selecta de taxis.

---

## 🚀 Comando Unificado para Iniciar Backend y Frontend

Desde la **carpeta raíz del proyecto** (`rumbo_fino_master`), puedes iniciar en simultáneo la API Backend (NestJS) y el Panel Web (Next.js) con un solo comando:

```bash
npm run dev
```

Este comando lanzará automáticamente:
- 🔴 **BACKEND (NestJS):** `http://localhost:3000/api/v1` (Swagger en `http://localhost:3000/api/docs`)
- 🔵 **WEB BACKOFFICE (Next.js):** `http://localhost:3001`

---

## 🛠️ Comandos Adicionales en la Raíz

```bash
# Iniciar únicamente el Backend NestJS
npm run dev:backend

# Iniciar únicamente el Panel Web Next.js
npm run dev:web

# Sembrar datos de prueba en la base de datos PostgreSQL local
npm run seed

# Compilar producción de ambos proyectos
npm run build
```

---

## 🔑 Credenciales para Pruebas en el Panel Web (`http://localhost:3001`):

- **Super Admin:** `admin@rumbofino.com` / `Admin123!`
- **Despachador:** `despacho@rumbofino.com` / `Despacho123!`
