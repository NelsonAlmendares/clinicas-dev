import { z } from "zod";

/**
 * Schema canónico de la compra.
 * Derivar todos los schemas de API (create / update) desde aquí.
 */
export const compraItemSchema = z.object({
  producto_id: z.number({ message: "Selecciona un producto" }),
  lote: z.string().optional(),
  cantidad: z.number().positive("La cantidad debe ser mayor a 0"),
  precio_unit: z.number().nonnegative("El precio no puede ser negativo"),
});

export const compraBaseSchema = z.object({
  proveedor_id: z.number({ message: "Selecciona un proveedor" }),
  fecha: z.string().optional(),
  numero_doc: z.string().optional(),
  items: z.array(compraItemSchema).min(1, "Agrega al menos un ítem"),
});

export const createCompraSchema = compraBaseSchema;

export const updateCompraSchema = compraBaseSchema
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Se debe enviar al menos un campo para actualizar",
  });

export type CreateCompraDto = z.infer<typeof createCompraSchema>;
export type UpdateCompraDto = z.infer<typeof updateCompraSchema>;
