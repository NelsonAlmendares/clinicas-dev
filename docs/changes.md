# Plan de cambios

**Fecha:** 2026-04-22
**Alcance:** dos cambios independientes pero hechos juntos.

1. **Toast de antd no se muestra** — fix de configuración.
2. **Conteos de pacientes calculados en cliente** — moverlos a una consulta directa a la base via ORDS.

---

## 1. Toast de antd no aparece

### 1.1 Diagnóstico

`usePacientes` usa la **API estática** de antd:

```ts
import { message } from "antd";
…
message.success("Paciente creado correctamente");
message.error(msg);
```

En antd v5 con React 19 esa API estática **no lee el `ConfigProvider`** ni el contexto de la app. El warning que ves en consola (*"antd v5 support React is 16 ~ 18"*) es justo eso. El fix oficial de antd es envolver el árbol con su componente `<App>` y usar `App.useApp().message` dentro de los hooks.

### 1.2 Cambios

**Archivo:** `src/app/providers.tsx`

Importar y envolver con `App`:

```tsx
import { App, ConfigProvider } from "antd";
import esES from "antd/locale/es_ES";
import "antd/dist/reset.css";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={esES}
      theme={{ /* … sin cambios … */ }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
```

> `<App>` provee los hosts de `message`, `notification` y `Modal.useModal()`. No agrega DOM visible.

**Archivo:** `src/features/pacientes/hooks/usePacientes.ts`

Reemplazar el import estático por el hook contextual:

```ts
// ❌ quitar
// import { message } from "antd";

// ✅ usar el hook
import { App } from "antd";

export function usePacientes(): UsePacientesReturn {
  const { message } = App.useApp();   // ← agregar
  // …resto igual; las llamadas a message.success/error funcionan tal cual
}
```

**Archivo:** `src/features/pacientes/components/PacientesView.tsx`

`Modal.confirm({...})` también es API estática (línea ~60 de `handleDelete`). Cambiar por `useModal()`:

```tsx
import { App } from "antd";
…
const { modal } = App.useApp();

const handleDelete = (id: number, nombre: string) => {
  modal.confirm({
    title: "¿Eliminar paciente?",
    /* …resto igual… */
  });
};
```

### 1.3 Validación

- Crear paciente con datos válidos → toast verde *"Paciente creado correctamente"*.
- Crear paciente con `historia` duplicada → toast rojo *"Ya existe un paciente con ese número de historia clínica."*.
- Eliminar paciente → modal de confirmación aparece y se ve estilizado.

---

## 2. Conteos directos a la base

### 2.1 Diagnóstico

Hoy `PacientesView.tsx` (líneas 202–225) calcula los stats así:

```tsx
{ label: "Total pacientes", value: items.length },
{ label: "Femenino",         value: items.filter(p => p.sexo === "F").length },
{ label: "Masculino",        value: items.filter(p => p.sexo === "M").length },
```

**Problemas:**
- Cuenta solo lo que vino en el GET. Si en el futuro el endpoint pagina, los números van a estar mal.
- Trae datos completos al cliente solo para contarlos — desperdicia ancho de banda y tiempo.
- No distingue entre "no hay datos" y "estoy esperando la lista".

**Lo que pediste:** que los conteos vengan de un `SELECT COUNT(*)` directo a Oracle.

### 2.2 Diseño

Una sola request al backend que devuelve los tres conteos en un objeto. Más eficiente que hacer 3 requests separadas.

```
Browser
  └─► GET /api/pacientes/stats          (Next.js)
        └─► GET .../api/getPacientesStats   (ORDS)
              └─► PL/SQL block con 3 COUNT(*)
                    SELECT INTO :total, :masculino, :femenino
```

Mantiene el patrón de las 4 capas (UI → hook → API route → service → ORDS).

### 2.3 Cambios

#### Paso 1 — Definir el handler en ORDS (fuera del repo)

En tu módulo REST de ORDS, agregar un nuevo template GET. Sugerencia de nombre: `getPacientesStats`. Source type: **PL/SQL**.

```sql
DECLARE
   v_total      NUMBER;
   v_masculino  NUMBER;
   v_femenino   NUMBER;
   v_otro       NUMBER;
BEGIN
   SELECT COUNT(*),
          COUNT(CASE WHEN sexo = 'M' THEN 1 END),
          COUNT(CASE WHEN sexo = 'F' THEN 1 END),
          COUNT(CASE WHEN sexo = 'O' THEN 1 END)
     INTO v_total, v_masculino, v_femenino, v_otro
     FROM pacientes;

   :total      := v_total;
   :masculino  := v_masculino;
   :femenino   := v_femenino;
   :otro       := v_otro;
   :status_code := 200;
EXCEPTION
   WHEN OTHERS THEN
      :status_code := 500;
END;
```

**Importante:** declarar los 4 parámetros como **OUT** en la pestaña de parámetros del handler (`total`, `masculino`, `femenino`, `otro` — todos `INTEGER`/`NUMBER`). Si se quedan como bind defaults, ORDS no los expondrá en el JSON de respuesta y vamos a recibir un body vacío.

ORDS los devuelve como JSON:
```json
{ "total": 42, "masculino": 18, "femenino": 22, "otro": 2 }
```

#### Paso 2 — Tipo TypeScript

**Archivo nuevo:** ya existe `src/types/paciente.ts`, agregamos al final:

```ts
export type PacienteStats = {
  total: number;
  masculino: number;
  femenino: number;
  otro: number;
};
```

#### Paso 3 — Servicio (server-only)

**Archivo:** `src/services/pacientes.service.ts`

Agregar al final:

```ts
import type { PacienteStats } from "@/types/paciente";

export async function getPacientesStats(): Promise<PacienteStats> {
  const raw = await ordsGet<Partial<PacienteStats>>("getPacientesStats");
  return {
    total:     Number(raw.total ?? 0),
    masculino: Number(raw.masculino ?? 0),
    femenino:  Number(raw.femenino ?? 0),
    otro:      Number(raw.otro ?? 0),
  };
}
```

> Normalizamos a `Number(... ?? 0)` porque ORDS a veces devuelve los `NUMBER` de Oracle como string.

#### Paso 4 — API Route

**Archivo nuevo:** `src/app/api/pacientes/stats/route.ts`

```ts
import { NextResponse } from "next/server";
import { getPacientesStats } from "@/services/pacientes.service";

export async function GET() {
  try {
    const stats = await getPacientesStats();
    return NextResponse.json(stats);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al obtener estadísticas";
    console.error("[GET /api/pacientes/stats]", e);
    return NextResponse.json({ message }, { status: 500 });
  }
}
```

#### Paso 5 — Hook de cliente

**Archivo nuevo:** `src/features/pacientes/hooks/usePacientesStats.ts`

```ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { App } from "antd";
import { apiFetch, ApiError } from "@/lib/api";
import type { PacienteStats } from "@/types/paciente";

const EMPTY: PacienteStats = { total: 0, masculino: 0, femenino: 0, otro: 0 };

export function usePacientesStats() {
  const { message } = App.useApp();
  const [stats, setStats] = useState<PacienteStats>(EMPTY);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await apiFetch<PacienteStats>("/api/pacientes/stats"));
    } catch (e) {
      message.error(e instanceof ApiError ? e.message : "Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => { void reload(); }, [reload]);
  return { stats, loading, reload };
}
```

#### Paso 6 — Usar el hook en `PacientesView`

**Archivo:** `src/features/pacientes/components/PacientesView.tsx`

Importar el hook y consumirlo:

```tsx
import { usePacientesStats } from "../hooks/usePacientesStats";
…
const { items, loading, create, update, remove } = usePacientes();
const { stats, reload: reloadStats } = usePacientesStats();   // ← agregar
```

Reemplazar las 3 líneas de cálculo de stats:

```tsx
{[
  { icon: <TeamOutlined />, label: "Total pacientes", value: stats.total,     color: "#6366f1", bg: "#eef2ff" },
  { icon: <UserOutlined />, label: "Femenino",         value: stats.femenino, color: "#9c2a6e", bg: "#fce8f4" },
  { icon: <UserOutlined />, label: "Masculino",        value: stats.masculino,color: "#1d6fa4", bg: "#e8f4fd" },
].map(/* … */)}
```

**Mantener los conteos sincronizados después de mutaciones.** Cada vez que la lista cambia, los stats deben refrescarse. La forma más simple: llamar `reloadStats()` después de un create/update/remove exitoso.

```tsx
const handleSubmit = async (values: PacienteCreate | PacienteUpdate) => {
  setFormLoading(true);
  const ok = editing?.id != null
    ? await update(editing.id, values as PacienteUpdate)
    : await create(values as PacienteCreate);
  setFormLoading(false);
  if (ok) {
    handleClose();
    void reloadStats();   // ← agregar
  }
};

const handleDelete = (id: number, nombre: string) => {
  modal.confirm({
    /* … */
    onOk: async () => {
      const ok = await remove(id);
      if (ok) void reloadStats();   // ← agregar
    },
  });
};
```

### 2.4 Validación

1. Carga inicial: los 3 stats reflejan el conteo real de la tabla, **incluso si la API de listado paginase y trajese menos filas**.
2. Crear paciente nuevo → conteo `total` (y `masculino`/`femenino` según el sexo) sube en 1.
3. Eliminar → baja en 1.
4. Editar el `sexo` de un paciente → los conteos M/F se ajustan correctamente.

---

## 3. Orden de ejecución sugerido

1. **(2.3 Paso 1)** Crear el handler `getPacientesStats` en ORDS y declarar los 4 parámetros OUT. Probar la URL directa desde el browser autenticado para confirmar que devuelve `{ "total": ..., ... }`.
2. **(1.2)** Aplicar el fix del toast (`<App>` + `App.useApp()`). Validar.
3. **(2.3 Pasos 2–6)** Cablear el endpoint, hook y vista para los conteos.
4. Probar el flujo completo: crear → toast verde → conteos suben → eliminar → conteos bajan.

---

## 4. Lo que **no** se cambia

- El GET de listado (`/api/pacientes`) sigue trayendo la lista igual; solo dejamos de usar `items.length` para los KPIs.
- El servicio de mutaciones (POST/PUT/DELETE) ya está correcto.
- El layout, la tabla, los filtros y la búsqueda no se tocan.

---

## 5. Riesgos

- **ORDS y los parámetros OUT.** Si los 4 parámetros no quedan declarados como OUT en el handler, el JSON de respuesta vendrá vacío y el frontend mostrará todos los stats en `0`. Es el bug más probable; verificar con un GET directo desde el browser antes de tocar el cliente.
- **Latencia adicional.** Una request más en cada carga de la página de pacientes. Es despreciable (un `COUNT(*)` indexado), pero queda mencionado por completitud.
- **Cache.** El hook hace `cache: "no-store"` (a través de `apiFetch`), así que los conteos siempre van fresh. Si en el futuro se quiere optimizar (ej. revalidar cada N segundos), se puede sumar React Query u otra capa, pero hoy no hace falta.

---

## 6. Cablear UPDATE y DELETE al nuevo patrón ORDS

**Contexto:** los handlers PL/SQL ya están creados en la base. Falta apuntar el servicio a las URLs correctas y ajustar el código que asumía que ORDS devolvía el paciente actualizado.

### 6.1 Diagnóstico

`src/services/pacientes.service.ts:136-142` quedó sin migrar cuando se rehízo `createPaciente`:

```ts
export async function updatePaciente(id: number, dto: UpdatePacienteDto): Promise<Paciente> {
  return ordsMutate<Paciente>("PUT", `pacientes/${id}`, dto);   // ← path viejo, tipo mentiroso
}

export async function deletePaciente(id: number): Promise<void> {
  return ordsMutate<void>("DELETE", `pacientes/${id}`);          // ← path viejo
}
```

Tres problemas concretos:

1. **Path equivocado.** La ruta `pacientes/${id}` es la que tenía la versión REST autogenerada de ORDS. Los nuevos handlers PL/SQL viven en otro template (probablemente `updatePaciente/${id}` y `deletePaciente/${id}` siguiendo el mismo estilo que `getPaciente` para POST y `getStatsPacientes` para stats — confirmar nombre exacto en la consola de ORDS).
2. **Tipo de retorno mentiroso en `updatePaciente`.** El handler PL/SQL responde `200` sin body (igual que el POST nuevo), así que el `Promise<Paciente>` nunca se cumple — `ordsMutate` retorna `undefined` y el route handler de PUT lo serializa como `null`.
3. **Sin normalización de bind variables en update.** Si el DTO parcial trae solo `nombres`, ORDS va a fallar con `ORA-01008: not all variables bound` para los campos faltantes — el mismo bug que `toOrdsCreate` ya resuelve para POST.

### 6.2 Cambios

#### Paso 1 — Confirmar en ORDS

Antes de tocar código, anotar de la consola de ORDS:

- Path exacto del handler PUT (ej. `updatePaciente/:id`).
- Path exacto del handler DELETE (ej. `deletePaciente/:id`).
- Bind variables que espera el PUT — si son los mismos 12 que `ORDS_CREATE_KEYS`, podemos reutilizar la lista. Si son distintos, hay que ajustar.
- **Importante:** confirmar si el `UPDATE` en SQL usa `NVL(:campo, campo_actual)` para preservar el valor existente cuando el bind viene null. Si **no** usa NVL, mandar null implica **borrar el campo**, lo cual rompe el caso "edito solo el teléfono y los demás campos quedan intactos".

#### Paso 2 — Helper `toOrdsUpdate` en el servicio

**Archivo:** `src/services/pacientes.service.ts` — agregar debajo de `toOrdsCreate` (línea ~101).

```ts
// Mismo patrón que toOrdsCreate: rellena con null los campos que el DTO
// parcial no incluye, para que ORDS no falle con ORA-01008.
// El handler PL/SQL debe usar NVL(:campo, campo_actual) para que esto
// signifique "no cambies este campo".
function toOrdsUpdate(dto: UpdatePacienteDto): Record<string, string | null> {
  const src = dto as Record<string, unknown>;
  const out: Record<string, string | null> = {};
  for (const k of ORDS_CREATE_KEYS) {
    const v = src[k];
    out[k] = typeof v === "string" && v !== "" ? v : null;
  }
  return out;
}
```

> Si las claves del PUT difieren de `ORDS_CREATE_KEYS`, definir un `ORDS_UPDATE_KEYS` propio.

#### Paso 3 — Reescribir `updatePaciente` y `deletePaciente`

**Archivo:** `src/services/pacientes.service.ts:136-142` — reemplazar las dos funciones:

```ts
export async function updatePaciente(id: number, dto: UpdatePacienteDto): Promise<void> {
  await ordsMutate<void>("PUT", `<PUT_PATH>/${id}`, toOrdsUpdate(dto));
}

export async function deletePaciente(id: number): Promise<void> {
  await ordsMutate<void>("DELETE", `<DELETE_PATH>/${id}`);
}
```

Reemplazar `<PUT_PATH>` y `<DELETE_PATH>` con los nombres del Paso 1 (ej. `updatePaciente`, `deletePaciente`).

#### Paso 4 — Ajustar el route handler PUT

**Archivo:** `src/app/api/pacientes/[id]/route.ts:46-53` — dejar de serializar el valor (que ya no existe):

```ts
try {
  await updatePaciente(id, parsed.data);
  return NextResponse.json({ ok: true });
} catch (e) {
  const message = e instanceof Error ? e.message : "Error al actualizar paciente";
  console.error(`[PUT /api/pacientes/${id}]`, e);
  return NextResponse.json({ message }, { status: 500 });
}
```

> El handler DELETE (línea 56-69) ya estaba bien: hace `await deletePaciente(id)` y devuelve `204` sin tocar el retorno. No cambia.

#### Paso 5 — Hook y vista: nada que tocar

`usePacientes.update` / `usePacientes.remove` ya hacen `await reload()` después del éxito y muestran el toast con `App.useApp().message`. `PacientesView` ya llama `reloadStats()` después de mutaciones exitosas. El flujo completo cierra sin más cambios.

### 6.3 Validación

1. **Editar campos individuales.** Tomar un paciente con todos los campos llenos. Editar solo el `nombres`. Guardar.
   - Toast verde "Paciente actualizado correctamente".
   - La fila refleja el nuevo nombre.
   - **`telefono`, `email`, `dpi_nit`, etc. siguen presentes** (esto valida el NVL del Paso 1; si quedaron vacíos, el handler no usa NVL y hay que ajustarlo en la base o cambiar la estrategia del helper).
2. **Cambiar sexo M → F.** Conteos `masculino` / `femenino` se ajustan en los KPIs (gracias a `reloadStats`).
3. **Eliminar paciente.** Modal de confirmación → confirmar → toast verde → fila desaparece → `total` baja en 1.
4. **Error simulado.** Probar PUT a un id inexistente — debe llegar un toast rojo con el `ORA-…` recortado (no la página HTML completa de ORDS).

### 6.4 Riesgos

- **Borrado accidental por falta de NVL.** Es el riesgo principal — la prueba 1 de validación está justamente para detectarlo. Si el handler no usa NVL, dos opciones: (a) arreglar el SQL para usarlo (recomendado); o (b) cambiar `toOrdsUpdate` para que solo incluya las claves presentes en el DTO y dejar el bind como opcional en ORDS, lo cual requiere que el handler maneje binds faltantes (más frágil).
- **Path equivocado silencioso.** Si el path en `<PUT_PATH>` no existe en ORDS, vas a recibir un 404 con HTML — el `extractOrdsErrorReason` no lo va a parsear y el toast mostrará un fragmento truncado. Validar primero con un PUT crudo desde Postman / `curl` antes de cablear el cliente.
