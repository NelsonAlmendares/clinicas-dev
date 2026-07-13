import { z } from "zod";

/**
 * Schema canónico de la cita.
 * Derivar todos los schemas de API (create / update) desde aquí.
 */
export const appointmentBaseSchema = z.object({
  paciente_id: z.number({ message: "Selecciona un paciente" }),
  profesional_id: z.number({ message: "Selecciona un profesional" }),
  servicio_id: z.number().optional(),
  box_id: z.number().optional(),
  fecha_hora: z.string().min(1, "La fecha y hora son obligatorias"),
  estado: z.enum(["PROGRAMADA", "CONFIRMADA", "EN_SALA", "ATENDIDA", "NO_SHOW", "CANCELADA"]),
  origen: z.enum(["WEB", "TEL", "WHATSAPP", "PRESENCIAL"]),
  notas: z.string().optional(),
});

export const createAppointmentSchema = appointmentBaseSchema;

export const updateAppointmentSchema = appointmentBaseSchema
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Se debe enviar al menos un campo para actualizar",
  });

export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentDto = z.infer<typeof updateAppointmentSchema>;
