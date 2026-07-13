/**
 * Tipos canónicos del módulo de facturación.
 * Importar desde aquí en todos los componentes, hooks y schemas.
 */
export type EstadoFactura = "PENDIENTE" | "PAGADA" | "ANULADA";
export type MetodoPago = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA" | "QR" | "OTRO";

export type Servicio = {
  id: number;
  codigo: string;
  nombre: string;
  duracion_min?: number;
  precio: number;
};

export type FacturaItem = {
  id?: number;
  servicio_id: number;
  descripcion?: string;
  cantidad: number;
  precio_unit: number;
};

export type Pago = {
  id?: number;
  metodo: MetodoPago;
  monto: number;
  referencia?: string;
  fecha?: string;
};

export type Factura = {
  id?: number;
  paciente_id: number;
  fecha?: string;
  total: number; // subtotal antes de IVA — mismo nombre que la columna en la BD
  iva: number;
  estado: EstadoFactura;
  items: FacturaItem[];
  pagos: Pago[];
};

export type FacturaStats = {
  total: number;
  pendientes: number;
  montoPendiente: number;
  recaudado: number;
};

export type FacturaCreate = Omit<Factura, "id" | "total" | "iva" | "pagos"> & {
  items: Omit<FacturaItem, "id">[];
};
export type FacturaUpdate = Partial<FacturaCreate>;
