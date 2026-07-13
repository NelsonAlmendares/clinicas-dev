"use client";

import { useCallback, useMemo, useState } from "react";
import { App } from "antd";
import type { Paciente, PacienteCreate, PacienteStats, PacienteUpdate } from "@/types/paciente";
import { INITIAL_PACIENTES } from "../data/mock-catalog";

interface UsePacientesReturn {
  items: Paciente[];
  loading: boolean;
  stats: PacienteStats;
  create: (dto: PacienteCreate) => Promise<boolean>;
  update: (id: number, dto: PacienteUpdate) => Promise<boolean>;
  remove: (id: number) => Promise<boolean>;
}

/**
 * CRUD simulado en memoria — el servicio ORDS está apagado.
 * Mismo contrato que useCompras/useFacturas/useAppointments para mantener
 * el patrón de la referencia; cuando el backend vuelva, basta con
 * reemplazar el cuerpo por apiFetch.
 */
export function usePacientes(): UsePacientesReturn {
  const { message } = App.useApp();
  const [items, setItems] = useState<Paciente[]>(INITIAL_PACIENTES);
  const [loading, setLoading] = useState(false);

  const create = useCallback(async (dto: PacienteCreate): Promise<boolean> => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 350));
    setItems((prev) => {
      const nextId = Math.max(0, ...prev.map((p) => p.id ?? 0)) + 1;
      const fecha_registro = new Date().toISOString().slice(0, 10);
      return [{ ...dto, id: nextId, fecha_registro }, ...prev];
    });
    setLoading(false);
    message.success("Paciente creado correctamente");
    return true;
  }, [message]);

  const update = useCallback(async (id: number, dto: PacienteUpdate): Promise<boolean> => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 350));
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...dto } : p)));
    setLoading(false);
    message.success("Paciente actualizado correctamente");
    return true;
  }, [message]);

  const remove = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 250));
    setItems((prev) => prev.filter((p) => p.id !== id));
    setLoading(false);
    message.success("Paciente eliminado correctamente");
    return true;
  }, [message]);

  const stats = useMemo<PacienteStats>(() => ({
    total: items.length,
    masculino: items.filter((p) => p.sexo === "M").length,
    femenino: items.filter((p) => p.sexo === "F").length,
    otro: items.filter((p) => p.sexo === "O" || !p.sexo).length,
  }), [items]);

  return { items, loading, stats, create, update, remove };
}
