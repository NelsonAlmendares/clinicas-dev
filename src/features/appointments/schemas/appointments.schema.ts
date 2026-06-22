import { z } from "zod";

/**
 * Schema canónico del paciente.
 * Derivar todos los schemas de API (create / update) desde aquí.
 */
export const appointmentBaseSchema = z.object({
  paciente_id: z.string().optional(),
  profesional_id: z.string().min(1, "El nombre es obligatorio"),
  servicio_id: z.string().min(1, "El apellido es obligatorio"),
  box_id: z.string().optional(),
  fecha_hora: z.string().optional(),
  estado: z.string().min(6, "Debe tener al menos 6 caracteres").optional(),
  origen: z.string().optional(),
  notas: z.string().email("Correo inválido").optional().or(z.literal("")),
});

export const createAppointmentSchema = appointmentBaseSchema;

export const updateAppointmentSchema = appointmentBaseSchema
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Se debe enviar al menos un campo para actualizar",
  });

export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentDto = z.infer<typeof updateAppointmentSchema>;
