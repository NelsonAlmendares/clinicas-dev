"use client";

import { useCallback, useEffect, useState } from "react";
import { message } from "antd";
import { apiFetch, ApiError } from "@/lib/api";
import type { Paciente, PacienteCreate, PacienteUpdate } from "@/types/paciente";

interface UsePacientesReturn {
  items: Paciente[];
  loading: boolean;
  reload: () => Promise<void>;
  create: (dto: PacienteCreate) => Promise<boolean>;
  update: (id: number, dto: PacienteUpdate) => Promise<boolean>;
  remove: (id: number) => Promise<boolean>;
}

export function usePacientes(): UsePacientesReturn {
  const [items, setItems] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ items: Paciente[] }>("/api/pacientes");
      setItems(data.items ?? []);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al cargar pacientes";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = useCallback(async (dto: PacienteCreate): Promise<boolean> => {
    try {
      await apiFetch("/api/pacientes", {
        method: "POST",
        body: JSON.stringify(dto),
      });
      message.success("Paciente creado correctamente");
      await reload();
      return true;
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al crear paciente";
      message.error(msg);
      return false;
    }
  }, [reload]);

  const update = useCallback(async (id: number, dto: PacienteUpdate): Promise<boolean> => {
    try {
      await apiFetch(`/api/pacientes/${id}`, {
        method: "PUT",
        body: JSON.stringify(dto),
      });
      message.success("Paciente actualizado correctamente");
      await reload();
      return true;
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al actualizar paciente";
      message.error(msg);
      return false;
    }
  }, [reload]);

  const remove = useCallback(async (id: number): Promise<boolean> => {
    try {
      await apiFetch(`/api/pacientes/${id}`, { method: "DELETE" });
      message.success("Paciente eliminado correctamente");
      await reload();
      return true;
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al eliminar paciente";
      message.error(msg);
      return false;
    }
  }, [reload]);

  return { items, loading, reload, create, update, remove };
}
