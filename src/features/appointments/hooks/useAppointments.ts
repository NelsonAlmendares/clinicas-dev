"use client";

import { useCallback, useMemo, useState } from "react";
import { App } from "antd";
import type { Appointment, AppointmentCreate, AppointmentStats, AppointmentUpdate } from "@/types/appointments";
import { INITIAL_APPOINTMENTS } from "../data/mock-catalog";

interface UseAppointmentsReturn {
  items: Appointment[];
  loading: boolean;
  stats: AppointmentStats;
  create: (dto: AppointmentCreate) => Promise<boolean>;
  update: (id: number, dto: AppointmentUpdate) => Promise<boolean>;
  remove: (id: number) => Promise<boolean>;
}

/**
 * CRUD simulado en memoria — el servicio ORDS está apagado.
 * Mismo contrato que usePacientes/useCompras/useFacturas para mantener el
 * patrón de la referencia; cuando el backend vuelva, basta con reemplazar
 * el cuerpo por apiFetch.
 */
export function useAppointments(): UseAppointmentsReturn {
  const { message } = App.useApp();
  const [items, setItems] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [loading, setLoading] = useState(false);

  const create = useCallback(async (dto: AppointmentCreate): Promise<boolean> => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 350));
    setItems((prev) => {
      const nextId = Math.max(0, ...prev.map((c) => c.id ?? 0)) + 1;
      return [{ ...dto, id: nextId }, ...prev];
    });
    setLoading(false);
    message.success("Cita creada correctamente");
    return true;
  }, [message]);

  const update = useCallback(async (id: number, dto: AppointmentUpdate): Promise<boolean> => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 350));
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...dto } : c)));
    setLoading(false);
    message.success("Cita actualizada correctamente");
    return true;
  }, [message]);

  const remove = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 250));
    setItems((prev) => prev.filter((c) => c.id !== id));
    setLoading(false);
    message.success("Cita eliminada correctamente");
    return true;
  }, [message]);

  const stats = useMemo<AppointmentStats>(() => ({
    total: items.length,
    proximas: items.filter((c) => c.estado === "PROGRAMADA" || c.estado === "CONFIRMADA").length,
    atendidas: items.filter((c) => c.estado === "ATENDIDA").length,
    canceladas: items.filter((c) => c.estado === "CANCELADA" || c.estado === "NO_SHOW").length,
  }), [items]);

  return { items, loading, stats, create, update, remove };
}
