"use client";

import { useCallback, useMemo, useState } from "react";
import { App } from "antd";
import type { Compra, CompraCreate, CompraStats, CompraUpdate } from "@/types/compra";
import { INITIAL_COMPRAS } from "../data/mock-catalog";

interface UseComprasReturn {
  items: Compra[];
  loading: boolean;
  stats: CompraStats;
  create: (dto: CompraCreate) => Promise<boolean>;
  update: (id: number, dto: CompraUpdate) => Promise<boolean>;
  remove: (id: number) => Promise<boolean>;
}

function calcTotal(items: { cantidad: number; precio_unit: number }[]) {
  return items.reduce((sum, i) => sum + i.cantidad * i.precio_unit, 0);
}

/**
 * CRUD simulado en memoria — el servicio ORDS está apagado.
 * Mismo contrato que usePacientes para mantener el patrón de la referencia;
 * cuando el backend vuelva, basta con reemplazar el cuerpo por apiFetch.
 */
export function useCompras(): UseComprasReturn {
  const { message } = App.useApp();
  const [items, setItems] = useState<Compra[]>(INITIAL_COMPRAS);
  const [loading, setLoading] = useState(false);

  const create = useCallback(async (dto: CompraCreate): Promise<boolean> => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 350));
    setItems((prev) => {
      const nextId = Math.max(0, ...prev.map((c) => c.id ?? 0)) + 1;
      const nuevaCompra: Compra = { ...dto, id: nextId, total: calcTotal(dto.items) };
      return [nuevaCompra, ...prev];
    });
    setLoading(false);
    message.success("Compra registrada correctamente");
    return true;
  }, [message]);

  const update = useCallback(async (id: number, dto: CompraUpdate): Promise<boolean> => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 350));
    setItems((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      const merged = { ...c, ...dto };
      return { ...merged, total: calcTotal(merged.items) };
    }));
    setLoading(false);
    message.success("Compra actualizada correctamente");
    return true;
  }, [message]);

  const remove = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 250));
    setItems((prev) => prev.filter((c) => c.id !== id));
    setLoading(false);
    message.success("Compra eliminada correctamente");
    return true;
  }, [message]);

  const stats = useMemo<CompraStats>(() => {
    const montoTotal = items.reduce((s, c) => s + c.total, 0);
    const proveedoresActivos = new Set(items.map((c) => c.proveedor_id)).size;
    return {
      total: items.length,
      montoTotal,
      proveedoresActivos,
      promedio: items.length ? montoTotal / items.length : 0,
    };
  }, [items]);

  return { items, loading, stats, create, update, remove };
}
