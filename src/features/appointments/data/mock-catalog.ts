import type { Appointment } from "@/types/appointments";

/**
 * Catálogo y citas de ejemplo, calcados de los seeds en database/database.sql.
 * Solo para maquetar el front — el servicio ORDS está apagado por ahora.
 */
export type PacienteRef = { id: number; nombres: string; apellidos: string };
export type ProfesionalRef = { id: number; nombre: string; especialidad?: string };
export type ServicioRef = { id: number; nombre: string; duracion_min: number };
export type BoxRef = { id: number; nombre: string };

export const PACIENTES: PacienteRef[] = [
  { id: 1, nombres: "María", apellidos: "López" },
  { id: 2, nombres: "José",  apellidos: "Martínez" },
  { id: 3, nombres: "Lucía", apellidos: "Ramírez" },
];

export const PROFESIONALES: ProfesionalRef[] = [
  { id: 2, nombre: "Dra. Ana Gómez", especialidad: "Odontología General" },
  { id: 3, nombre: "Dr. Luis Pérez",  especialidad: "Endodoncia" },
];

export const SERVICIOS: ServicioRef[] = [
  { id: 1, nombre: "Consulta",           duracion_min: 30 },
  { id: 2, nombre: "Limpieza",           duracion_min: 45 },
  { id: 3, nombre: "Endodoncia Unicanal", duracion_min: 90 },
  { id: 4, nombre: "Radiografía",         duracion_min: 10 },
];

export const BOXES: BoxRef[] = [
  { id: 1, nombre: "Box 1" },
  { id: 2, nombre: "Box 2" },
  { id: 3, nombre: "Box 3" },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: 1, paciente_id: 1, profesional_id: 2, servicio_id: 1, box_id: 1, fecha_hora: "2025-09-05T09:30:00", estado: "CONFIRMADA", origen: "TEL",        notas: "Primera consulta" },
  { id: 2, paciente_id: 2, profesional_id: 3, servicio_id: 2, box_id: 2, fecha_hora: "2025-09-05T10:30:00", estado: "PROGRAMADA", origen: "WEB",        notas: "Limpieza semestral" },
  { id: 3, paciente_id: 3, profesional_id: 2, servicio_id: 4, box_id: 1, fecha_hora: "2025-09-06T14:00:00", estado: "PROGRAMADA", origen: "WHATSAPP",   notas: "Radiografía molar" },
  { id: 4, paciente_id: 1, profesional_id: 3, servicio_id: 3, box_id: 2, fecha_hora: "2025-09-10T11:00:00", estado: "ATENDIDA",   origen: "PRESENCIAL",  notas: "Endodoncia pieza 46" },
  { id: 5, paciente_id: 2, profesional_id: 2, servicio_id: 1, box_id: 1, fecha_hora: "2025-09-12T08:30:00", estado: "NO_SHOW",    origen: "TEL",        notas: "" },
  { id: 6, paciente_id: 3, profesional_id: 3, servicio_id: 2, box_id: 3, fecha_hora: "2025-09-15T16:00:00", estado: "CANCELADA",  origen: "WEB",        notas: "Paciente reprogramará" },
  { id: 7, paciente_id: 1, profesional_id: 2, servicio_id: 4, box_id: 1, fecha_hora: "2025-09-18T09:00:00", estado: "EN_SALA",    origen: "PRESENCIAL",  notas: "Control post-endodoncia" },
];
