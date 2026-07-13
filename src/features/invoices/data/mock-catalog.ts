import type { Factura, Servicio } from "@/types/factura";

/**
 * Catálogo y facturas de ejemplo, calcados de los seeds en database/database.sql.
 * Solo para maquetar el front — el servicio ORDS está apagado por ahora.
 */
export const IVA_RATE = 0.12;

export type PacienteRef = { id: number; nombres: string; apellidos: string };

export const PACIENTES: PacienteRef[] = [
  { id: 1, nombres: "María", apellidos: "López" },
  { id: 2, nombres: "José",  apellidos: "Martínez" },
  { id: 3, nombres: "Lucía", apellidos: "Ramírez" },
];

export const SERVICIOS: Servicio[] = [
  { id: 1, codigo: "CONS", nombre: "Consulta",             duracion_min: 30, precio: 200 },
  { id: 2, codigo: "LIMP", nombre: "Limpieza",              duracion_min: 45, precio: 350 },
  { id: 3, codigo: "END1", nombre: "Endodoncia Unicanal",   duracion_min: 90, precio: 2500 },
  { id: 4, codigo: "RX",   nombre: "Radiografía",           duracion_min: 10, precio: 80 },
];

export const INITIAL_FACTURAS: Factura[] = [
  {
    id: 1,
    paciente_id: 1,
    fecha: "2025-09-05",
    estado: "PAGADA",
    items: [
      { id: 1, servicio_id: 4, descripcion: "Radiografía pieza 36", cantidad: 1, precio_unit: 80 },
      { id: 2, servicio_id: 1, descripcion: "Consulta",             cantidad: 1, precio_unit: 200 },
    ],
    total: 280,
    iva: 33.6,
    pagos: [
      { id: 1, metodo: "EFECTIVO", monto: 313.6, referencia: "Caja 1", fecha: "2025-09-05" },
    ],
  },
  {
    id: 2,
    paciente_id: 2,
    fecha: "2025-09-05",
    estado: "PENDIENTE",
    items: [
      { id: 3, servicio_id: 2, descripcion: "Limpieza", cantidad: 1, precio_unit: 350 },
    ],
    total: 350,
    iva: 42,
    pagos: [],
  },
  {
    id: 3,
    paciente_id: 3,
    fecha: "2025-09-06",
    estado: "PAGADA",
    items: [
      { id: 4, servicio_id: 4, descripcion: "Radiografía", cantidad: 1, precio_unit: 80 },
    ],
    total: 80,
    iva: 9.6,
    pagos: [
      { id: 2, metodo: "EFECTIVO", monto: 89.6, referencia: "", fecha: "2025-09-06" },
    ],
  },
  {
    id: 4,
    paciente_id: 1,
    fecha: "2025-10-12",
    estado: "ANULADA",
    items: [
      { id: 5, servicio_id: 3, descripcion: "Endodoncia Unicanal", cantidad: 1, precio_unit: 2500 },
    ],
    total: 2500,
    iva: 300,
    pagos: [],
  },
  {
    id: 5,
    paciente_id: 2,
    fecha: "2025-11-03",
    estado: "PENDIENTE",
    items: [
      { id: 6, servicio_id: 1, descripcion: "Consulta",                cantidad: 1, precio_unit: 200 },
      { id: 7, servicio_id: 4, descripcion: "Radiografías de control", cantidad: 2, precio_unit: 80 },
    ],
    total: 360,
    iva: 43.2,
    pagos: [],
  },
  {
    id: 6,
    paciente_id: 3,
    fecha: "2025-12-01",
    estado: "PAGADA",
    items: [
      { id: 8, servicio_id: 2, descripcion: "Limpieza", cantidad: 1, precio_unit: 350 },
      { id: 9, servicio_id: 1, descripcion: "Consulta", cantidad: 1, precio_unit: 200 },
    ],
    total: 550,
    iva: 66,
    pagos: [
      { id: 3, metodo: "TARJETA", monto: 616, referencia: "", fecha: "2025-12-01" },
    ],
  },
];
