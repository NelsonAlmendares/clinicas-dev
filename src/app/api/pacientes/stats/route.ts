import { NextResponse } from "next/server";
import { getPacientesStats } from "@/services/pacientes.service";

export async function GET() {
  try {
    const stats = await getPacientesStats();
    return NextResponse.json(stats);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al obtener estadísticas";
    console.error("[GET /api/pacientes/stats]", e);
    return NextResponse.json({ message }, { status: 500 });
  }
}