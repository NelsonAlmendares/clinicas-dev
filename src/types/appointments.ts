/**
 * Tipo canónico de la cita.
 * Importar desde aquí en todos los componentes, hooks y schemas.
 */
export type EstadoCita = "PROGRAMADA" | "CONFIRMADA" | "EN_SALA" | "ATENDIDA" | "NO_SHOW" | "CANCELADA";
export type OrigenCita = "WEB" | "TEL" | "WHATSAPP" | "PRESENCIAL";

export type Appointment = {
  id?: number;
  paciente_id: number;
  profesional_id: number;
  servicio_id?: number;
  box_id?: number;
  fecha_hora: string;
  estado: EstadoCita;
  origen: OrigenCita;
  notas?: string;
  created_at?: string;
};

export type AppointmentStats = {
  total: number;
  proximas: number;
  atendidas: number;
  canceladas: number;
};

export type AppointmentCreate = Omit<Appointment, "id" | "created_at">;
export type AppointmentUpdate = Partial<AppointmentCreate>;
