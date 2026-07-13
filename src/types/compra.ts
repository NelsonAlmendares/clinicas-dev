/**
 * Tipos canónicos del módulo de compras.
 * Importar desde aquí en todos los componentes, hooks y schemas.
 */
export type Proveedor = {
  id: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
};

export type Producto = {
  id: number;
  nombre: string;
  tipo?: string;
  unidad: string;
};

export type CompraItem = {
  id?: number;
  producto_id: number;
  lote?: string;
  cantidad: number;
  precio_unit: number;
};

export type Compra = {
  id?: number;
  proveedor_id: number;
  fecha?: string;
  numero_doc?: string;
  total: number;
  items: CompraItem[];
};

export type CompraStats = {
  total: number;
  montoTotal: number;
  proveedoresActivos: number;
  promedio: number;
};

export type CompraCreate = Omit<Compra, "id" | "total"> & { items: Omit<CompraItem, "id">[] };
export type CompraUpdate = Partial<CompraCreate>;
