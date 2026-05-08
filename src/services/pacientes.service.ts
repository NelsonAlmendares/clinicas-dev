/**
 * Servicio de acceso a datos de pacientes via Oracle ORDS.
 *
 * Solo se usa desde API Routes (server-side). Nunca importar
 * desde componentes cliente — contiene lógica de autenticación.
 */
import { buildAuthHeaders } from "@/lib/ords/client";
import { ordsConfig } from "@/lib/ords/config";
import type { Paciente } from "@/types/paciente";
import type { CreatePacienteDto, UpdatePacienteDto } from "@/features/pacientes/schemas/paciente.schema";
import type { PacienteStats } from "@/types/paciente";

// Permite que el caller distinga 404/409/500 cuando el handler PL/SQL
// captura la excepción y solo setea :status_code (en ese caso ORDS no
// emite header `error-reason`, así que el código HTTP es la única señal).
class OrdsError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "OrdsError";
  }
}

async function ordsGet<T>(path: string): Promise<T> {
  const url = ordsConfig.endpoint(path);
  const headers = await buildAuthHeaders();
  const res = await fetch(url, { headers, cache: "no-store" });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[ORDS GET ${path}] ${res.status}`, body);
    throw new Error(`ORDS error ${res.status} en GET ${path}`);
  }

  return res.json() as Promise<T>;
}

// ORDS pone la causa real del error en el header `error-reason` con formato
// `error="..."; error_description*=UTF-8''<percent-encoded>`. Lo extraemos
// porque el body suele ser una página HTML de cientos de KB inservible.
function extractOrdsErrorReason(headers: Headers): string | null {
  const raw = headers.get("error-reason");
  if (!raw) return null;
  const match = raw.match(/error_description\*=UTF-8''([^;]+)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

// Recorta el preámbulo verboso de ORDS y el ruido del stack PL/SQL,
// dejando solo el primer ORA-NNNNN: <mensaje>.
function shortenSqlError(reason: string): string {
  const match = reason.match(/ORA-\d+:[^]+?(?=\s+ORA-|\s+https?:|$)/);
  return match ? match[0].trim() : reason;
}

async function ordsMutate<T>(
  method: "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const url = ordsConfig.endpoint(path);
  const headers = await buildAuthHeaders();
  const serializedBody = body ? JSON.stringify(body) : undefined;

  // Sin body no mandar Content-Type: JSON — ORDS intenta parsear el body
  // vacío y falla con "Expected one of: <<{,[>> but got: <<EOF>>".
  if (!serializedBody) delete headers["Content-Type"];

  const res = await fetch(url, {
    method,
    headers,
    body: serializedBody,
  });

  if (!res.ok) {
    const reason = extractOrdsErrorReason(res.headers);
    const text = reason ? "" : await res.text();
    console.error(`[ORDS ${method} ${path}] ${res.status} ${res.statusText}`);
    if (reason) console.error(`[ORDS ${method} ${path}] reason: ${reason}`);
    const trimmed = text.trim().replace(/\s+/g, " ").slice(0, 300);
    const message = reason
      ? shortenSqlError(reason)
      : (trimmed || `${res.status} ${res.statusText}`);
    throw new OrdsError(message, res.status);
  }

  // El handler PL/SQL responde 201/200 sin body (solo setea :status_code),
  // así que res.json() explotaría con "Unexpected end of JSON input".
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as T;
  }
}

// Claves que el handler POST de ORDS espera como bind variables.
// Las ausentes deben ir como null explícito; si se omiten del JSON,
// ORDS falla con ORA-01008 "not all variables bound".
const ORDS_CREATE_KEYS = [
  "historia", "nombres", "apellidos", "fecha_nacimiento", "sexo", "dpi_nit",
  "telefono", "email", "contacto_emergencia", "alergias", "antecedentes",
  "medicamentos",
] as const;

function toOrdsCreate(dto: CreatePacienteDto): Record<string, string | null> {
  const src = dto as Record<string, unknown>;
  const out: Record<string, string | null> = {};
  for (const k of ORDS_CREATE_KEYS) {
    const v = src[k];
    out[k] = typeof v === "string" && v !== "" ? v : null;
  }
  return out;
}

// El handler PUT no actualiza `historia` (es inmutable post-creación).
// Mandar la clave igual sería inocuo en ORDS, pero la dejamos fuera
// para que el JSON refleje exactamente los binds del PL/SQL.
const ORDS_UPDATE_KEYS = [
  "nombres", "apellidos", "fecha_nacimiento", "sexo", "dpi_nit",
  "telefono", "email", "contacto_emergencia", "alergias", "antecedentes",
  "medicamentos",
] as const;

function toOrdsUpdate(dto: UpdatePacienteDto): Record<string, string | null> {
  const src = dto as Record<string, unknown>;
  const out: Record<string, string | null> = {};
  for (const k of ORDS_UPDATE_KEYS) {
    const v = src[k];
    out[k] = typeof v === "string" && v !== "" ? v : null;
  }
  return out;
}

// ─── Operaciones ──────────────────────────────────────────────

export async function listPacientes(): Promise<Paciente[]> {
  const data = await ordsGet<{ items: Paciente[] } | Paciente[]>("getPaciente");
  return Array.isArray(data) ? data : (data.items ?? []);
}

export async function getPaciente(id: number): Promise<Paciente> {
  return ordsGet<Paciente>(`getPacientesById/${id}`);
}

export async function createPaciente(dto: CreatePacienteDto): Promise<void> {
  try {
    await ordsMutate<void>("POST", "getPaciente", toOrdsCreate(dto));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("UQ_PACIENTES_HISTORIA")) {
      throw new Error("Ya existe un paciente con ese número de historia clínica.");
    }
    throw e;
  }
}

export async function getPacientesStats(): Promise<PacienteStats> {
  const raw = await ordsGet<Partial<PacienteStats>>("getStatsPacientes");
  return {
    total:     Number(raw.total ?? 0),
    masculino: Number(raw.masculino ?? 0),
    femenino:  Number(raw.femenino ?? 0),
    otro:      Number(raw.otro ?? 0),
  };
}

export async function updatePaciente(id: number, dto: UpdatePacienteDto): Promise<void> {
  try {
    await ordsMutate<void>("PUT", `getPaciente?ID=${id}`, toOrdsUpdate(dto));
  } catch (e) {
    if (e instanceof OrdsError) {
      if (e.status === 404) throw new Error("El paciente no existe o fue eliminado.");
      if (e.status === 409) throw new Error("Ya existe un paciente con esos datos (email o DPI duplicado).");
    }
    throw e;
  }
}

export async function deletePaciente(id: number): Promise<void> {
  await ordsMutate<void>("DELETE", `getPaciente?ID=${id}`);
}
