"use client";

import { useCallback, useMemo, useState } from "react";
import { App } from "antd";
import type { Factura, FacturaCreate, FacturaStats, FacturaUpdate, Pago } from "@/types/factura";
import { INITIAL_FACTURAS, IVA_RATE } from "../data/mock-catalog";

interface UseFacturasReturn {
  items: Factura[];
  loading: boolean;
  stats: FacturaStats;
  create: (dto: FacturaCreate) => Promise<boolean>;
  update: (id: number, dto: FacturaUpdate) => Promise<boolean>;
  remove: (id: number) => Promise<boolean>;
  registrarPago: (facturaId: number, pago: Omit<Pago, "id" | "fecha">) => Promise<boolean>;
}

function calcSubtotal(items: { cantidad: number; precio_unit: number }[]) {
  return items.reduce((sum, i) => sum + i.cantidad * i.precio_unit, 0);
}

/**
 * CRUD simulado en memoria — el servicio ORDS está apagado.
 * Mismo contrato que usePacientes/useCompras para mantener el patrón de la
 * referencia; cuando el backend vuelva, basta con reemplazar el cuerpo por apiFetch.
 */
export function useFacturas(): UseFacturasReturn {
  const { message } = App.useApp();
  const [items, setItems] = useState<Factura[]>(INITIAL_FACTURAS);
  const [loading, setLoading] = useState(false);

  const create = useCallback(async (dto: FacturaCreate): Promise<boolean> => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 350));
    setItems((prev) => {
      const nextId = Math.max(0, ...prev.map((f) => f.id ?? 0)) + 1;
      const subtotal = calcSubtotal(dto.items);
      const nuevaFactura: Factura = { ...dto, id: nextId, total: subtotal, iva: subtotal * IVA_RATE, pagos: [] };
      return [nuevaFactura, ...prev];
    });
    setLoading(false);
    message.success("Factura creada correctamente");
    return true;
  }, [message]);

  const update = useCallback(async (id: number, dto: FacturaUpdate): Promise<boolean> => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 350));
    setItems((prev) => prev.map((f) => {
      if (f.id !== id) return f;
      const merged = { ...f, ...dto };
      const subtotal = calcSubtotal(merged.items);
      return { ...merged, total: subtotal, iva: subtotal * IVA_RATE };
    }));
    setLoading(false);
    message.success("Factura actualizada correctamente");
    return true;
  }, [message]);

  const remove = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 250));
    setItems((prev) => prev.filter((f) => f.id !== id));
    setLoading(false);
    message.success("Factura eliminada correctamente");
    return true;
  }, [message]);

  const registrarPago = useCallback(async (facturaId: number, pago: Omit<Pago, "id" | "fecha">): Promise<boolean> => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    setItems((prev) => prev.map((f) => {
      if (f.id !== facturaId) return f;
      const nextPagoId = Math.max(0, ...f.pagos.map((p) => p.id ?? 0)) + 1;
      const pagos = [...f.pagos, { ...pago, id: nextPagoId }];
      const saldado = pagos.reduce((s, p) => s + p.monto, 0) >= f.total + f.iva;
      return { ...f, pagos, estado: saldado ? "PAGADA" : f.estado };
    }));
    setLoading(false);
    message.success("Pago registrado correctamente");
    return true;
  }, [message]);

  const stats = useMemo<FacturaStats>(() => {
    const pendientesList = items.filter((f) => f.estado === "PENDIENTE");
    const pagadasList = items.filter((f) => f.estado === "PAGADA");
    return {
      total: items.length,
      pendientes: pendientesList.length,
      montoPendiente: pendientesList.reduce((s, f) => s + f.total + f.iva, 0),
      recaudado: pagadasList.reduce((s, f) => s + f.total + f.iva, 0),
    };
  }, [items]);

  return { items, loading, stats, create, update, remove, registrarPago };
}
