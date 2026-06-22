"use client";

import { useCallback, useEffect, useState } from "react";
import { App } from "antd";
import { apiFetch, ApiError } from "@/lib/api";
import type { Appointment, AppointmentCreate, AppointmentUpdate } from "@/types/appointments";

interface UseAppointmentReturn {
  items: Appointment[];
  loading: boolean;
  reload: () => Promise<void>;
  create: (dto: AppointmentCreate) => Promise<boolean>;
  update: (id: number, dto: AppointmentUpdate) => Promise<boolean>;
  remove: (id: number) => Promise<boolean>;
}

export function useAppointment(): UseAppointmentReturn {
  const { message } = App.useApp();
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ items: Appointment[] }>("/api/pacientes");
      setItems(data.items ?? []);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al cargar citas";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = useCallback(async (dto: AppointmentCreate): Promise<boolean> => {
    try {
      await apiFetch("/api/appointments", {
        method: "POST",
        body: JSON.stringify(dto),
      });
      message.success("Cita creada correctamente");
      await reload();
      return true;
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al crear cita";
      message.error(msg);
      return false;
    }
  }, [reload, message]);

  const update = useCallback(async (id: number, dto: AppointmentUpdate): Promise<boolean> => {
    try {
      await apiFetch(`/api/appointments/${id}`, {
        method: "PUT",
        body: JSON.stringify(dto),
      });
      message.success("Cita actualizada correctamente");
      await reload();
      return true;
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al actualizar cita";
      message.error(msg);
      return false;
    }
  }, [reload, message]);

  const remove = useCallback(async (id: number): Promise<boolean> => {
    try {
      await apiFetch(`/api/appointments/${id}`, { method: "DELETE" });
      message.success("Cita eliminada correctamente");
      await reload();
      return true;
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al eliminar cita";
      message.error(msg);
      return false;
    }
  }, [reload, message]);

  return { items, loading, reload, create, update, remove };
}
