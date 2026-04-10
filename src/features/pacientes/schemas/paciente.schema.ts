import { z } from "zod";

/**
 * Schema canónico del paciente.
 * Derivar todos los schemas de API (create / update) desde aquí.
 */
export const pacienteBaseSchema = z.object({
  historia: z.string().optional(),
  nombres: z.string().min(1, "El nombre es obligatorio"),
  apellidos: z.string().min(1, "El apellido es obligatorio"),
  fecha_nacimiento: z.string().optional(),
  sexo: z.enum(["M", "F", "O"]).optional(),
  dpi_nit: z.string().min(6, "Debe tener al menos 6 caracteres").optional(),
  telefono: z.string().optional(),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  contacto_emergencia: z.string().optional(),
  alergias: z.string().optional(),
  antecedentes: z.string().optional(),
  medicamentos: z.string().optional(),
});

export const createPacienteSchema = pacienteBaseSchema;

export const updatePacienteSchema = pacienteBaseSchema
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Se debe enviar al menos un campo para actualizar",
  });

export type CreatePacienteDto = z.infer<typeof createPacienteSchema>;
export type UpdatePacienteDto = z.infer<typeof updatePacienteSchema>;
