import { z } from "zod";

/**
 * Schema canónico de la factura.
 * Derivar todos los schemas de API (create / update) desde aquí.
 */
export const facturaItemSchema = z.object({
  servicio_id: z.number({ message: "Selecciona un servicio" }),
  descripcion: z.string().optional(),
  cantidad: z.number().positive("La cantidad debe ser mayor a 0"),
  precio_unit: z.number().nonnegative("El precio no puede ser negativo"),
});

export const facturaBaseSchema = z.object({
  paciente_id: z.number({ message: "Selecciona un paciente" }),
  fecha: z.string().optional(),
  estado: z.enum(["PENDIENTE", "PAGADA", "ANULADA"]),
  items: z.array(facturaItemSchema).min(1, "Agrega al menos un ítem"),
});

export const createFacturaSchema = facturaBaseSchema;

export const updateFacturaSchema = facturaBaseSchema
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Se debe enviar al menos un campo para actualizar",
  });

export const pagoSchema = z.object({
  metodo: z.enum(["EFECTIVO", "TARJETA", "TRANSFERENCIA", "QR", "OTRO"]),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  referencia: z.string().optional(),
});

export type CreateFacturaDto = z.infer<typeof createFacturaSchema>;
export type UpdateFacturaDto = z.infer<typeof updateFacturaSchema>;
export type PagoDto = z.infer<typeof pagoSchema>;
