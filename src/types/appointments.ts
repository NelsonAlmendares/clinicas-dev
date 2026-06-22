/**
 * Tipo canónico del paciente.
 * Importar desde aquí en todos los componentes, servicios y schemas.
 */
export type Appointment = {
  id?: number;
  paciente_id?: number;
  profesional_id?: number;
  servicio_id?: number;
  box_id?: number;
  fecha_hora?: string;
  estado?: string;
  origen?: string;
  notas?: string;
  created_at?: string;
};

export type AppointmentCreate = Omit<Appointment, "id" | "created_at">;
export type AppointmentUpdate = Partial<AppointmentCreate>;
