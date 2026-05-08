# Plan — Fix del POST de pacientes

**Fecha:** 2026-04-22
**Archivos a tocar:** `src/services/pacientes.service.ts` (principal) · opcionalmente `src/features/pacientes/schemas/paciente.schema.ts`.

---

## 1. Diagnóstico final

### 1.1 La URL está correcta

- Handler ORDS (POST): `https://…/ords/admin/api/getPaciente`
- URL que genera el código hoy: `ordsConfig.endpoint("getPaciente")` → la misma. ✅

El edit pendiente en `git diff` (`"pacientes/"` → `"getPaciente"`) está bien. Conservarlo.

### 1.2 El bug real: el JSON del cliente no tiene todas las bind variables

El handler PL/SQL declara **13 binds**:

```
:historia  :nombres  :apellidos  :fecha_nacimiento  :sexo  :dpi_nit
:telefono  :email    :contacto_emergencia  :alergias  :antecedentes
:medicamentos  :status_code
```

`:status_code` lo setea el propio handler (output). Los otros 12 los toma ORDS del JSON del request.

El problema: **los campos opcionales del formulario llegan como `undefined`, y `JSON.stringify` los omite del body**. Cuando ORDS no encuentra la key que corresponde al bind, ejecuta el PL/SQL con ese bind sin asignar → típicamente `ORA-01008: not all variables bound` (o un 500 genérico que ORDS traduce al 500 del `EXCEPTION WHEN OTHERS`).

**Ruta del `undefined`:**

1. `PacienteModal.handleOk` arma `payload` con spread de `values` + dos campos corregidos:
   ```ts
   const payload = {
     ...values,
     fecha_nacimiento: values.fecha_nacimiento ? … : undefined,
     email: values.email || undefined,
   };
   ```
   Si el usuario no llena `historia`, `sexo`, `telefono`, etc., esos keys no existen en `values`.
2. `usePacientes.create` → `JSON.stringify(dto)` → omite los keys `undefined`.
3. API route valida con Zod (todos son `.optional()`, pasa).
4. Servicio → `JSON.stringify(body)` → vuelve a omitir `undefined`.
5. ORDS recibe, por ejemplo, `{"nombres":"Juan","apellidos":"Pérez"}` y falla al bindear `:historia`, `:sexo`, etc.

### 1.3 Puntos secundarios pero reales

- **Error con cuerpo oculto**: hoy `ordsMutate` hace `throw new Error("ORDS error <status> en POST <path>")` y el body con la causa real solo va a `console.error`. El `message.error` de la UI nunca muestra el motivo.
- **`fecha_registro`**: el handler lo setea con `SYSDATE`. No hay que mandarlo; el tipo ya lo marca como campo de solo lectura. OK, no se toca.

---

## 2. Cambios propuestos

### 2.1 Normalizar el payload a null antes del POST (bloqueante)

Elegí hacerlo **en el servicio**, no en el formulario ni en Zod. Razón: la forma "12 claves siempre presentes" es un requisito del handler ORDS, no del dominio de la app. Aislarlo ahí evita contaminar el schema y el tipo `Paciente` con `null | undefined` por todos lados.

Agregar en `src/services/pacientes.service.ts` una función pura:

```ts
const ORDS_CREATE_KEYS = [
  "historia", "nombres", "apellidos", "fecha_nacimiento", "sexo", "dpi_nit",
  "telefono", "email", "contacto_emergencia", "alergias", "antecedentes",
  "medicamentos",
] as const;

function toOrdsCreate(dto: CreatePacienteDto): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const k of ORDS_CREATE_KEYS) {
    const v = (dto as Record<string, unknown>)[k];
    out[k] = typeof v === "string" && v !== "" ? v : null;
  }
  return out;
}
```

Y cambiar `createPaciente`:

```ts
export async function createPaciente(dto: CreatePacienteDto): Promise<Paciente> {
  return ordsMutate<Paciente>("POST", "getPaciente", toOrdsCreate(dto));
}
```

Con esto el body siempre tendrá las 12 claves, con `null` en las que el usuario no llenó. ORDS bindea `NULL` sin errores; `TO_DATE(NULL, 'YYYY-MM-DD')` devuelve `NULL` sin explotar, así que `fecha_nacimiento` opcional queda resuelto también.

### 2.2 Propagar el body del error de ORDS

En `ordsMutate`, cambiar el `throw` para incluir la respuesta real:

```ts
if (!res.ok) {
  const text = await res.text();
  console.error(`[ORDS ${method} ${path}] ${res.status}`, text);
  throw new Error(`ORDS ${res.status} en ${method} ${path}: ${text.slice(0, 300)}`);
}
```

El error burbujea hasta `message.error(...)` en `usePacientes` y el usuario (y nosotros) vemos `ORA-01008` o lo que ORDS devuelva, sin abrir DevTools.

### 2.3 Opcional — tipar el update igual

Cuando confirmemos el path del PUT, aplicar el mismo `toOrdsUpdate` que llene con `null` los campos no enviados. En UPDATE a veces conviene lo contrario (no tocar lo omitido), así que esperar a ver la definición del handler PUT antes de decidir.

### 2.4 No tocar

- El schema Zod — sigue aceptando `undefined` en el borde público de la app; la normalización es interna al servicio.
- El tipo `Paciente` / `PacienteCreate` — se mantiene con `string | undefined`; la app no necesita saber que ORDS quiere `null`.
- El modal y el hook — no cambian.

---

## 3. Orden de ejecución

1. Editar `src/services/pacientes.service.ts`:
   - Agregar `ORDS_CREATE_KEYS` + `toOrdsCreate`.
   - Usar `toOrdsCreate(dto)` en `createPaciente`.
   - Enriquecer el `throw` de `ordsMutate` con el body (aplica para crear/editar/eliminar).
2. Probar desde la UI:
   - **Caso 1:** crear paciente llenando solo nombre y apellido → debe guardar, con NULL en el resto.
   - **Caso 2:** crear paciente con todos los campos → debe guardar con todos los valores.
   - **Caso 3:** forzar un error (ej. email muy largo o DPI que rompa un check) → el toast de la UI ahora debe mostrar el mensaje de ORDS, no un genérico.
3. Confirmar que el GET de la UI sigue mostrando el nuevo registro.
4. Commit: `fix(pacientes): enviar todas las bind vars como null al POST ORDS y propagar error real`.

---

## 4. Por qué este approach y no otro

- **Convertir en el schema Zod (`.default(null)`)**: ensucia el tipo público con `null` cuando el resto de la app no lo necesita. Descartado.
- **Convertir en el modal**: mezcla responsabilidades; el modal no debería saber nada de ORDS. Descartado.
- **Convertir en el API route**: es tentador, pero el API route hoy es un pasamanos tonto del DTO validado. Si mañana otra parte del servidor (ej. un script de importación) usa el servicio, el servicio debe ser autosuficiente. Por eso va en el servicio.

---

## 5. Una línea de resumen

El POST está llegando a la URL correcta con un body incompleto; el handler PL/SQL falla al bindear las variables ausentes. Fix: en `pacientes.service.ts`, normalizar el DTO a `null` para las 12 bind vars antes de enviar, y propagar el body de error de ORDS al mensaje de la UI.
