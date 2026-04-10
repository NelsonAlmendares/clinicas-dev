/**
 * GET /api/pacientes/token
 *
 * Endpoint interno usado ÚNICAMENTE para verificar conectividad con ORDS
 * desde herramientas de diagnóstico del equipo técnico.
 *
 * ⚠️  Este endpoint NO debe ser llamado desde componentes de UI.
 *     El token no debe mostrarse nunca al usuario final.
 *
 * En producción, considera deshabilitar este endpoint o protegerlo
 * con autenticación de sesión.
 */
import { NextResponse } from "next/server";
import { getOrdsToken } from "@/lib/ords/client";

export async function GET() {
  try {
    await getOrdsToken();
    // Solo confirmamos que el token se obtuvo — no lo exponemos
    return NextResponse.json({ ok: true, message: "Conexión ORDS verificada" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al obtener token";
    console.error("[GET /admin/oauth/token]", e);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
