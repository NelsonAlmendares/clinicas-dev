import type { Compra, Producto, Proveedor } from "@/types/compra";

/**
 * Catálogo y compras de ejemplo, calcados de los seeds en database/database.sql.
 * Solo para maquetar el front — el servicio ORDS está apagado por ahora.
 */
export const PROVEEDORES: Proveedor[] = [
  { id: 1, nombre: "Distribuidora Dental SA", contacto: "Pedro Ruiz",  telefono: "5555-6001", email: "ventas@ddsa.com" },
  { id: 2, nombre: "Insumos Médicos GT",       contacto: "Laura Méndez", telefono: "5555-6002", email: "lmendez@insumosgt.com" },
];

export const PRODUCTOS: Producto[] = [
  { id: 1, nombre: "Anestésico Lidocaína", tipo: "Medicamento", unidad: "ml" },
  { id: 2, nombre: "Resina Fotocurable",   tipo: "Insumo",      unidad: "g" },
  { id: 3, nombre: "Guantes Nitrilo",      tipo: "Desechable",  unidad: "caja" },
];

export const INITIAL_COMPRAS: Compra[] = [
  {
    id: 1,
    proveedor_id: 1,
    fecha: "2025-09-01",
    numero_doc: "FAC-1001",
    total: 570,
    items: [
      { id: 1, producto_id: 1, lote: "LID-2025-01", cantidad: 10, precio_unit: 15 },
      { id: 2, producto_id: 3, lote: "GUA-2025-02", cantidad: 5,  precio_unit: 84 },
    ],
  },
  {
    id: 2,
    proveedor_id: 2,
    fecha: "2025-09-03",
    numero_doc: "FAC-2001",
    total: 240,
    items: [
      { id: 3, producto_id: 2, lote: "RES-2025-07", cantidad: 8, precio_unit: 30 },
    ],
  },
  {
    id: 3,
    proveedor_id: 1,
    fecha: "2025-10-05",
    numero_doc: "FAC-1002",
    total: 2180,
    items: [
      { id: 4, producto_id: 3, lote: "GUA-2025-03", cantidad: 20, precio_unit: 85 },
      { id: 5, producto_id: 1, lote: "LID-2025-02", cantidad: 30, precio_unit: 16 },
    ],
  },
  {
    id: 4,
    proveedor_id: 2,
    fecha: "2025-11-12",
    numero_doc: "FAC-2002",
    total: 480,
    items: [
      { id: 6, producto_id: 2, lote: "RES-2025-08", cantidad: 15, precio_unit: 32 },
    ],
  },
  {
    id: 5,
    proveedor_id: 1,
    fecha: "2025-12-02",
    numero_doc: "FAC-1003",
    total: 750,
    items: [
      { id: 7, producto_id: 1, lote: "LID-2025-03", cantidad: 50, precio_unit: 15 },
    ],
  },
];
