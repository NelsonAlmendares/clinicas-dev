import { type NextRequest, NextResponse } from "next/server";
import { updateAppointmentSchema } from "@/features/appointments/schemas/appointments.schema";
import { getAppointment, updateAppointment, deleteAppointment } from "@/services/appointment.service";

type RouteContext = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function GET(_: NextRequest, ctx: RouteContext) {
  const { id: rawId } = await ctx.params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ message: "ID inválido" }, { status: 400 });

  try {
    const item = await getAppointment(id);
    return NextResponse.json(item);
  } catch (e) {
    console.error(`[GET /api/appointments/${id}]`, e);
    return NextResponse.json({ message: "Cita no encontrada" }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const { id: rawId } = await ctx.params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ message: "ID inválido" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Cuerpo de la solicitud inválido" }, { status: 400 });
  }

  const parsed = updateAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Datos inválidos", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await updateAppointment(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al actualizar cita";
    console.error(`[PUT /api/appointments/${id}]`, e);
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, ctx: RouteContext) {
  const { id: rawId } = await ctx.params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ message: "ID inválido" }, { status: 400 });

  try {
    await deleteAppointment(id);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al eliminar cita";
    console.error(`[DELETE /api/appointments/${id}]`, e);
    return NextResponse.json({ message }, { status: 500 });
  }
}