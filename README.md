# Gestión Clínica — Guía de arquitectura

> **Stack:** Next.js 15 · TypeScript (strict) · Ant Design 5 · Oracle ORDS  
> **Última revisión:** Abril 2025

---

## Tabla de contenidos

1. [Árbol de carpetas](#1-árbol-de-carpetas)
2. [Capas de la aplicación](#2-capas-de-la-aplicación)
3. [Dónde va cada cosa](#3-dónde-va-cada-cosa)
4. [Cómo agregar un nuevo módulo](#4-cómo-agregar-un-nuevo-módulo)
5. [Convenciones de código](#5-convenciones-de-código)
6. [Variables de entorno](#6-variables-de-entorno)
7. [Comandos útiles](#7-comandos-útiles)

---

## 1. Árbol de carpetas

```
clinicas-v2/
│
├── database/                        # Scripts SQL — fuera de src/ a propósito
│   ├── clinica_dental.sql           # DDL completo de la base de datos
│   ├── database.sql                 # Seeds / datos iniciales
│   └── export.csv
│
├── public/                          # Assets estáticos servidos en /
│
├── src/
│   │
│   ├── app/                         # Next.js App Router — SOLO rutas y layouts
│   │   │
│   │   ├── (dashboard)/             # Route group: aplica AppFrame a todas las rutas
│   │   │   ├── layout.tsx           # ← AppFrame se monta UNA SOLA VEZ aquí
│   │   │   ├── page.tsx             # /  →  Dashboard
│   │   │   ├── pacientes/
│   │   │   │   └── page.tsx         # /pacientes
│   │   │   ├── appointments/
│   │   │   │   └── page.tsx         # /appointments
│   │   │   ├── purchases/
│   │   │   │   └── page.tsx         # /purchases
│   │   │   ├── invoices/
│   │   │   │   └── page.tsx         # /invoices
│   │   │   └── settings/
│   │   │       └── page.tsx         # /settings
│   │   │
│   │   ├── api/                     # API Routes (server-side)
│   │   │   └── pacientes/
│   │   │       ├── route.ts         # GET /api/pacientes · POST /api/pacientes
│   │   │       ├── [id]/
│   │   │       │   └── route.ts     # GET · PUT · DELETE /api/pacientes/:id
│   │   │       └── token/
│   │   │           └── route.ts     # GET /api/pacientes/token  (diagnóstico)
│   │   │
│   │   ├── layout.tsx               # Root layout: AntdRegistry + Providers + fuentes
│   │   ├── providers.tsx            # ConfigProvider de Ant Design (client component)
│   │   └── globals.css
│   │
│   ├── components/                  # Componentes reutilizables sin lógica de negocio
│   │   ├── layout/
│   │   │   ├── AppFrame.tsx         # Shell: Sider + Header + Content + Footer
│   │   │   └── SideNav.tsx          # Menú lateral con navegación activa
│   │   └── shared/
│   │       ├── ComingSoon.tsx       # Placeholder para módulos en desarrollo
│   │       └── DashboardView.tsx    # Vista del dashboard principal
│   │
│   ├── features/                    # ← AQUÍ CRECE EL PROYECTO
│   │   └── pacientes/               # Un directorio por módulo de negocio
│   │       ├── components/
│   │       │   ├── PacientesView.tsx    # Vista principal (tabla + búsqueda + stats)
│   │       │   └── PacienteModal.tsx    # Modal crear / editar
│   │       ├── hooks/
│   │       │   └── usePacientes.ts      # Estado, CRUD y llamadas a /api/pacientes
│   │       └── schemas/
│   │           └── paciente.schema.ts   # Validación Zod — fuente única de verdad
│   │
│   ├── lib/                         # Utilidades técnicas sin lógica de negocio
│   │   ├── api.ts                   # apiFetch — wrapper de fetch para el cliente
│   │   └── ords/
│   │       ├── client.ts            # getOrdsToken · buildAuthHeaders (SERVER ONLY)
│   │       └── config.ts            # Lectura y validación de variables de entorno ORDS
│   │
│   ├── services/                    # Acceso a datos — SERVER ONLY
│   │   └── pacientes.service.ts     # listPacientes · getPaciente · create · update · delete
│   │
│   └── types/                       # Tipos TypeScript compartidos
│       └── paciente.ts              # Tipo Paciente · PacienteCreate · PacienteUpdate
│
├── .env.example                     # Plantilla de variables (sin valores reales)
├── .gitignore
├── eslint.config.mjs
├── next.config.mjs
├── package.json
└── tsconfig.json
```

---

## 2. Capas de la aplicación

El proyecto tiene **4 capas** con dirección de dependencia estricta.  
Las capas superiores pueden importar de las inferiores, **nunca al revés**.

```
┌─────────────────────────────────────────────────────────────┐
│  4. UI                                                       │
│     src/features/**/components/  ·  src/components/         │
│     Renderiza datos, captura eventos del usuario             │
├─────────────────────────────────────────────────────────────┤
│  3. Estado cliente                                           │
│     src/features/**/hooks/                                   │
│     Gestiona estado local, llama a /api/* del browser        │
├─────────────────────────────────────────────────────────────┤
│  2. API Routes                                               │
│     src/app/api/**/route.ts                                  │
│     Valida input (Zod), delega a services, responde JSON     │
├─────────────────────────────────────────────────────────────┤
│  1. Servicios + Infraestructura                              │
│     src/services/  ·  src/lib/ords/                          │
│     Llama a Oracle ORDS con token OAuth — solo en servidor   │
└─────────────────────────────────────────────────────────────┘
```

### Regla de oro — el token OAuth nunca llega al browser

```
Browser  ──►  /api/pacientes (Next.js)  ──►  Oracle ORDS
                   ↑ token vive aquí ↑
```

`src/lib/ords/` y `src/services/` **solo se importan desde API Routes**.  
Importarlos desde un componente cliente expone las credenciales al browser.

---

## 3. Dónde va cada cosa

| Necesito crear...                         | Lo pongo en...                                           |
|-------------------------------------------|----------------------------------------------------------|
| Una nueva página / ruta                   | `src/app/(dashboard)/mi-modulo/page.tsx`                 |
| Un endpoint de API                        | `src/app/api/mi-modulo/route.ts`                         |
| Un componente visual sin lógica de negocio| `src/components/shared/MiComponente.tsx`                 |
| La vista principal de un módulo           | `src/features/mi-modulo/components/MiModuloView.tsx`     |
| Un formulario o modal de un módulo        | `src/features/mi-modulo/components/MiModal.tsx`          |
| Estado y llamadas fetch del cliente       | `src/features/mi-modulo/hooks/useMiModulo.ts`            |
| Validación de datos con Zod               | `src/features/mi-modulo/schemas/mi-modulo.schema.ts`     |
| Llamadas a Oracle ORDS (servidor)         | `src/services/mi-modulo.service.ts`                      |
| Un tipo TypeScript compartido             | `src/types/mi-modulo.ts`                                 |
| Una utilidad técnica genérica             | `src/lib/mi-utilidad.ts`                                 |

---

## 4. Cómo agregar un nuevo módulo

Ejemplo completo: módulo **Citas** en `/appointments`.

### Paso 1 — Tipo TypeScript

```ts
// src/types/cita.ts
export type Cita = {
  id?: number;
  paciente_id: number;
  fecha: string;
  hora: string;
  motivo?: string;
  estado?: "pendiente" | "confirmada" | "cancelada";
};

export type CitaCreate = Omit<Cita, "id">;
export type CitaUpdate = Partial<CitaCreate>;
```

### Paso 2 — Schema Zod

```ts
// src/features/appointments/schemas/cita.schema.ts
import { z } from "zod";

export const createCitaSchema = z.object({
  paciente_id: z.number().positive(),
  fecha: z.string().min(1),
  hora: z.string().min(1),
  motivo: z.string().optional(),
  estado: z.enum(["pendiente", "confirmada", "cancelada"]).optional(),
});

export const updateCitaSchema = createCitaSchema
  .partial()
  .refine(obj => Object.keys(obj).length > 0, { message: "Sin cambios" });
```

### Paso 3 — Servicio (server-only)

```ts
// src/services/citas.service.ts
import { buildAuthHeaders } from "@/lib/ords/client";
import { ordsConfig } from "@/lib/ords/config";
import type { Cita } from "@/types/cita";
import type { CreateCitaDto, UpdateCitaDto } from "@/features/appointments/schemas/cita.schema";

export async function listCitas(): Promise<Cita[]> {
  const headers = await buildAuthHeaders();
  const res = await fetch(ordsConfig.endpoint("getCitas"), { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`ORDS error ${res.status}`);
  const json = await res.json();
  return json.items ?? json;
}

export async function createCita(dto: CreateCitaDto): Promise<Cita> {
  const headers = await buildAuthHeaders();
  const res = await fetch(ordsConfig.endpoint("citas/"), {
    method: "POST", headers, body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(`ORDS error ${res.status}`);
  return res.json();
}
// ... updateCita, deleteCita con el mismo patrón
```

### Paso 4 — API Route

```ts
// src/app/api/appointments/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createCitaSchema } from "@/features/appointments/schemas/cita.schema";
import { listCitas, createCita } from "@/services/citas.service";

export async function GET() {
  try {
    const items = await listCitas();
    return NextResponse.json({ items });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al listar citas";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createCitaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }
  const created = await createCita(parsed.data);
  return NextResponse.json(created, { status: 201 });
}
```

### Paso 5 — Hook de cliente

```ts
// src/features/appointments/hooks/useCitas.ts
"use client";
import { useCallback, useEffect, useState } from "react";
import { message } from "antd";
import { apiFetch, ApiError } from "@/lib/api";
import type { Cita, CitaCreate, CitaUpdate } from "@/types/cita";

export function useCitas() {
  const [items, setItems] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ items: Cita[] }>("/api/appointments");
      setItems(data.items ?? []);
    } catch (e) {
      message.error(e instanceof ApiError ? e.message : "Error al cargar citas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  return { items, loading, reload };
}
```

### Paso 6 — Vista y página

```tsx
// src/features/appointments/components/AppointmentsView.tsx
"use client";
import { useCitas } from "../hooks/useCitas";
export default function AppointmentsView() {
  const { items, loading } = useCitas();
  // ... tabla con items
}

// src/app/(dashboard)/appointments/page.tsx
import type { Metadata } from "next";
import AppointmentsView from "@/features/appointments/components/AppointmentsView";
export const metadata: Metadata = { title: "Citas" };
export default function Page() { return <AppointmentsView />; }
```

### Paso 7 — Agregar al menú lateral

```ts
// src/components/layout/SideNav.tsx — añadir en NAV_ITEMS:
{ key: "/appointments", icon: <CalendarOutlined />, label: "Citas" },
```

**Checklist al agregar un módulo:**

- [ ] `src/types/mi-modulo.ts` — tipo base
- [ ] `src/features/mi-modulo/schemas/` — schema Zod (create + update)
- [ ] `src/services/mi-modulo.service.ts` — llamadas a ORDS
- [ ] `src/app/api/mi-modulo/route.ts` — endpoint GET + POST
- [ ] `src/app/api/mi-modulo/[id]/route.ts` — endpoint GET + PUT + DELETE
- [ ] `src/features/mi-modulo/hooks/useMiModulo.ts` — estado cliente
- [ ] `src/features/mi-modulo/components/MiModuloView.tsx` — vista
- [ ] `src/features/mi-modulo/components/MiModal.tsx` — formulario
- [ ] `src/app/(dashboard)/mi-modulo/page.tsx` — página
- [ ] `SideNav.tsx` — entrada en el menú

---

## 5. Convenciones de código

### Nombrado de archivos

| Tipo                    | Convención           | Ejemplo                      |
|-------------------------|----------------------|------------------------------|
| Componente React        | PascalCase `.tsx`    | `PacientesView.tsx`          |
| Hook                    | camelCase `.ts`      | `usePacientes.ts`            |
| Schema Zod              | kebab-case `.ts`     | `paciente.schema.ts`         |
| Servicio                | kebab-case `.ts`     | `pacientes.service.ts`       |
| Tipo TypeScript         | kebab-case `.ts`     | `paciente.ts`                |
| Utilidad                | kebab-case `.ts`     | `format-date.ts`             |
| API Route               | siempre `route.ts`   | `route.ts`                   |

### Imports — siempre el alias `@/`

```ts
// ✅ Correcto
import { apiFetch } from "@/lib/api";
import type { Paciente } from "@/types/paciente";

// ❌ Incorrecto — rutas relativas largas
import { apiFetch } from "../../../lib/api";
```

### Tipos — una sola fuente de verdad

```ts
// ✅ El tipo vive en src/types/ y se importa en todos lados
import type { Paciente } from "@/types/paciente";

// ❌ No redefinir el mismo tipo en el componente ni en el servicio
type Paciente = { id: number; nombres: string; }  // duplicado garantiza desincronización
```

### Páginas — delgadas, sin lógica

```tsx
// ✅ La página solo importa y delega
export default function PacientesPage() {
  return <PacientesView />;
}

// ❌ La página no tiene estado ni fetch directo
export default function PacientesPage() {
  const [data, setData] = useState([]);
  useEffect(() => { fetch("/api/...").then(...) }, []);
  return <Table dataSource={data} />;
}
```

### Manejo de errores — siempre visible al usuario

```ts
// ✅ El usuario sabe que algo falló
} catch (e) {
  message.error(e instanceof ApiError ? e.message : "Error inesperado");
}

// ❌ Error silencioso — el usuario no sabe qué pasó
} catch (e) {
  console.error(e);
}
```

---

## 6. Variables de entorno

Documentadas en `.env.example`. El archivo real es `.env.local` (no versionado).

| Variable          | Descripción                                     | Requerida |
|-------------------|-------------------------------------------------|-----------|
| `ORDS_TOKEN_URL`  | URL del endpoint OAuth de ORDS                  | Opcional* |
| `ORDS_BASIC_AUTH` | `Basic <base64(client_id:client_secret)>`       | ✅        |
| `ORDS_BASE_URL`   | URL base del schema ORDS (sin `/` al final)     | ✅        |
| `ORDS_MODULE`     | URI prefix del módulo REST definido en ORDS     | ✅        |

*`ORDS_TOKEN_URL` tiene fallback al endpoint del tenant de desarrollo.  
En producción siempre definirlo explícitamente.

Las variables se validan en `src/lib/ords/config.ts` al arrancar.  
Si falta alguna requerida, el servidor lanza un error descriptivo antes de servir tráfico.

---

## 7. Comandos útiles

```bash
# Desarrollo
npm run dev           # Servidor local con Turbopack en localhost:3000

# Calidad de código — ejecutar antes de cada commit
npm run typecheck     # Verifica tipos sin compilar
npm run lint          # ESLint
npm run build         # Build de producción — falla si hay errores de tipo o lint

# Diagnóstico de conexión ORDS
# Abrir en el browser después de npm run dev:
# http://localhost:3000/api/pacientes/token
# Respuesta esperada: { "ok": true, "message": "Conexión ORDS verificada" }
```

---

## Estado de módulos

| Módulo        | Ruta             | Estado        | ORDS endpoint  |
|---------------|------------------|---------------|----------------|
| Pacientes     | `/pacientes`     | ✅ Activo     | `getPaciente`  |
| Citas         | `/appointments`  | 🔲 Pendiente  | Por definir    |
| Compras       | `/purchases`     | 🔲 Pendiente  | Por definir    |
| Facturación   | `/invoices`      | 🔲 Pendiente  | Por definir    |
| Configuración | `/settings`      | 🔲 Pendiente  | Por definir    |