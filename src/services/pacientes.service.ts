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

async function ordsMutate<T>(
  method: "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const url = ordsConfig.endpoint(path);
  const headers = await buildAuthHeaders();
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ORDS ${method} ${path}] ${res.status}`, text);
    throw new Error(`ORDS error ${res.status} en ${method} ${path}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Operaciones ──────────────────────────────────────────────

export async function listPacientes(): Promise<Paciente[]> {
  const data = await ordsGet<{ items: Paciente[] } | Paciente[]>("getPaciente");
  return Array.isArray(data) ? data : (data.items ?? []);
}

export async function getPaciente(id: number): Promise<Paciente> {
  return ordsGet<Paciente>(`getPacientesById/${id}`);
}

export async function createPaciente(dto: CreatePacienteDto): Promise<Paciente> {
  return ordsMutate<Paciente>("POST", "pacientes/", dto);
}

export async function updatePaciente(id: number, dto: UpdatePacienteDto): Promise<Paciente> {
  return ordsMutate<Paciente>("PUT", `pacientes/${id}`, dto);
}

export async function deletePaciente(id: number): Promise<void> {
  return ordsMutate<void>("DELETE", `pacientes/${id}`);
}
