# Plan de acción — Arreglar `AppointmentsView`

Estado actual: `src/features/appointments/components/AppointmentsView.ts` es una copia mal adaptada de `PacientesView.tsx`. No compila, mezcla el dominio `Paciente` con `Appointment`, y la extensión del archivo es `.ts` cuando contiene JSX. Adicionalmente se pide **eliminar el uso de `Avatar`** en la vista.

El módulo `appointments` debe seguir el patrón de `pacientes` (ver `README.md` y `CLAUDE.md`), pero adaptado al dominio de citas. Sin avatars.

---

## 0. Errores actuales (compilación + runtime)

Antes de tocar nada, estos son los problemas concretos en `AppointmentsView.ts`:

1. **Extensión incorrecta** — el archivo es `.ts` pero contiene JSX. Renombrar a `AppointmentsView.tsx`.
2. **Typography no destructurado** — se usa `<Title>` y `<Text>` (líneas 165, 168, 220) sin hacer `const { Title, Text } = Typography;`.
3. **`ColumnsType<Paciente>`** (línea 64) — `Paciente` no está importado y el genérico debería ser `Appointment`.
4. **Identificadores no definidos** — `getInitials`, `avatarColor` (líneas 73, 75), `SEXO_CONFIG` (línea 96), `stats` (líneas 188-190), `PacienteModal` (línea 262). Todos existen solo en `PacientesView.tsx`.
5. **Tipos de datos incompatibles** — el filtro y las columnas leen `nombres`, `apellidos`, `email`, `telefono`, `historia`, `sexo`. Esos campos no existen en el tipo `Appointment` (`src/types/appointments.ts`), que define `paciente_id`, `profesional_id`, `servicio_id`, `box_id`, `fecha_hora`, `estado`, `origen`, `notas`.
6. **Hook con tipos del módulo equivocado** — `useAppointments.ts` importa `Paciente` desde `@/types/paciente` y llama a `/api/pacientes`. Debe operar sobre `Appointment` y `/api/appointments`.
7. **Backend ausente** — no existen `src/services/appointments.service.ts`, ni `src/app/api/appointments/route.ts`, ni `src/app/api/appointments/[id]/route.ts`, ni `src/features/appointments/schemas/appointment.schema.ts`. Sin estas piezas el hook nunca responderá 200.
8. **Modal ausente** — no hay `AppointmentModal.tsx`. El form que se renderiza en la línea 262 no existe.
9. **Textos copiados** — header, breadcrumb, mensajes de confirmación (`"¿Eliminar paciente?"`, `"Gestión de pacientes"`, `"Nuevo paciente"`, etc.) siguen hablando de pacientes.
10. **`handleDelete` con variable sin usar** — `const ok = await remove(id)` (línea 49) nunca se consume; debe alinearse con el patrón de `PacientesView` o eliminar la asignación.
11. **Imports a limpiar** — `Avatar`, `UserOutlined`, `TeamOutlined` deben salir cuando se quiten los avatars y se redefinan las stats.

---

## 1. Eliminar `Avatar` — pasos a seguir

Objetivo: que la columna "Paciente" muestre un identificador sin la pastilla circular con iniciales.

**Pasos en `AppointmentsView.tsx` (tras renombrar):**

1. **Quitar el import** — eliminar `Avatar` del import de `antd`.
2. **Quitar helpers** — NO copiar `AVATAR_COLORS`, `getInitials`, ni `avatarColor` desde `PacientesView`. Eliminar cualquier referencia.
3. **Quitar el icono `UserOutlined`** si solo se usaba dentro del Avatar (revisar antes de borrarlo: las tarjetas de stats también lo usan; ajustar según el rediseño de stats del paso 4).
4. **Rediseñar la celda principal** — en la columna `"Cita"` (o como se llame), renderizar solo texto:
   ```tsx
   render: (_, r) => (
     <div>
       <div style={{ fontWeight: 600, fontSize: 13, color: "#111", lineHeight: 1.3 }}>
         {formatFechaHora(r.fecha_hora)}
       </div>
       <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
         {r.notas ?? <span style={{ color: "#ccc" }}>Sin notas</span>}
       </div>
     </div>
   )
   ```
   Sin `<Avatar>`, sin contenedor flex con `gap` para acomodar el círculo.
5. **Sin "marker" circular alternativo** — no introducir un `<span>` de color como reemplazo decorativo. La instrucción es eliminar avatars, no sustituirlos por otro adorno.
6. **Revisar otras celdas** — confirmar que ninguna columna restante (`estado`, `origen`, etc.) introduzca un Avatar.

---

## 2. Plan de implementación del módulo `appointments`

Sigue el patrón canónico de `pacientes`. Cada paso es independiente y revisable.

### 2.1 Tipos (`src/types/appointments.ts`)
- Ya existe. Validar que los campos coincidan con la tabla ORDS de citas. Añadir tipos derivados si hace falta (por ejemplo `AppointmentEstado = "agendada" | "confirmada" | "cancelada" | "atendida"`).

### 2.2 Schema Zod (`src/features/appointments/schemas/appointment.schema.ts`)
- Crear `appointmentCreateSchema` y `appointmentUpdateSchema` (`.partial()`).
- Exportar `CreateAppointmentDto` / `UpdateAppointmentDto` con `z.infer<...>`.
- Campos mínimos: `paciente_id` (number, required), `profesional_id` (number, required), `servicio_id` (number, required), `box_id` (number, optional), `fecha_hora` (string ISO, required), `estado` (enum), `origen` (string, optional), `notas` (string, optional).

### 2.3 Service (`src/services/appointments.service.ts`)
- Server-only. Importar `ordsConfig` y `buildAuthHeaders` de `src/lib/ords/`.
- Exponer `listAppointments()`, `getAppointmentById(id)`, `createAppointment(dto)`, `updateAppointment(id, dto)`, `deleteAppointment(id)`.
- Construir URLs vía `ordsConfig.endpoint(...)`. Lanzar `Error("ORDS error <status> …")` ante respuestas no-OK.
- **Recordatorio CLAUDE.md**: este archivo NO puede importarse desde código `"use client"`.

### 2.4 API Routes
- `src/app/api/appointments/route.ts` — `GET` (lista) y `POST` (create, valida con `appointmentCreateSchema.safeParse`).
- `src/app/api/appointments/[id]/route.ts` — `GET`, `PUT` (valida con `appointmentUpdateSchema`), `DELETE`.
- Traducir errores a `{ message }` con status apropiado.

### 2.5 Hook (`src/features/appointments/hooks/useAppointments.ts`)
- Reescribir el archivo actual:
  - Renombrar la función a `useAppointments` (plural, consistente con `usePacientes`).
  - Cambiar `Paciente` → `Appointment` en todas las firmas.
  - Cambiar `/api/pacientes` → `/api/appointments` en las 4 llamadas a `apiFetch`.
  - Ajustar mensajes (`"Cita creada correctamente"`, etc.).
- Considerar `useAppointmentsStats` si se quieren tarjetas tipo "Hoy / Esta semana / Canceladas".

### 2.6 Modal (`src/features/appointments/components/AppointmentModal.tsx`)
- Form con campos: paciente (Select async), profesional (Select async), servicio (Select), box (Select opcional), fecha/hora (`DatePicker showTime`), estado (Select), notas (TextArea).
- Recibe `appointment: Appointment | null`, `loading`, `onSubmit`, `onCancel`.

### 2.7 Vista (`src/features/appointments/components/AppointmentsView.tsx`)
- Renombrar el archivo (de `.ts` a `.tsx`).
- Destructurar `const { Title, Text } = Typography;`.
- Limpiar imports (`Avatar`, `UserOutlined`, `TeamOutlined` fuera si no se usan tras el rediseño).
- `ColumnsType<Appointment>`.
- Columnas sugeridas (sin avatar):
  - **Fecha / hora** — `fecha_hora` formateada (`dayjs`).
  - **Paciente** — `paciente_id` resuelto a nombre (vía join del backend o lookup).
  - **Profesional** — `profesional_id` resuelto a nombre.
  - **Servicio** — `servicio_id` resuelto a nombre.
  - **Estado** — pastilla coloreada por estado (sin círculo decorativo).
  - **Acciones** — Editar / Eliminar.
- Filtro de búsqueda sobre nombre de paciente, profesional, estado.
- Cambiar todos los strings (`"Gestión de pacientes"` → `"Gestión de citas"`, `"Nuevo paciente"` → `"Nueva cita"`, modal de confirmación, etc.).
- Mantener el `<style>` del hover de filas pero renombrar `pac-row` → `apt-row` para no colisionar si ambas vistas se montan.

### 2.8 Registrar en navegación
- `src/components/layout/SideNav.tsx` ya tiene `appointments` como `ComingSoon`. Quitar la marca cuando el módulo quede funcional.

---

## 3. Orden de ejecución sugerido

1. Renombrar `AppointmentsView.ts` → `AppointmentsView.tsx`.
2. Crear schema Zod.
3. Crear service (server-only).
4. Crear API routes y verificar con `curl` / browser.
5. Reescribir hook contra `/api/appointments`.
6. Crear `AppointmentModal.tsx`.
7. Limpiar `AppointmentsView.tsx`: quitar avatars, ajustar tipos, columnas, textos, stats.
8. `npm run typecheck` + `npm run lint` deben pasar.
9. Probar end-to-end en el navegador (alta, edición, borrado, filtros).

---

## 4. Checklist de verificación

- [ ] El archivo es `.tsx`, no `.ts`.
- [ ] No hay imports a `Avatar` ni helpers `getInitials` / `avatarColor`.
- [ ] `useAppointments` (plural) golpea `/api/appointments`.
- [ ] Tipos del hook, columnas y modal son `Appointment`, no `Paciente`.
- [ ] `npm run build` finaliza sin errores de tipo ni de lint.
- [ ] Servicio y schemas existen y la API Route los invoca.
- [ ] El token ORDS no aparece en ningún bundle de cliente (`src/services/` y `src/lib/ords/` no se importan desde código `"use client"`).
