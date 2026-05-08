"use client";

import { useCallback, useEffect, useState } from "react";
import { App } from "antd";
import { apiFetch, ApiError } from "@/lib/api";
import type { PacienteStats } from "@/types/paciente";

const EMPTY: PacienteStats = { total: 0, masculino: 0, femenino: 0, otro: 0 };

export function usePacientesStats() {
  const { message } = App.useApp();
  const [stats, setStats] = useState<PacienteStats>(EMPTY);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await apiFetch<PacienteStats>("/api/pacientes/stats"));
    } catch (e) {
      message.error(e instanceof ApiError ? e.message : "Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => { void reload(); }, [reload]);
  return { stats, loading, reload };
}