import { type NextRequest, NextResponse } from "next/server";
import { updatePacienteSchema } from "@/features/pacientes/schemas/paciente.schema";
import { getPaciente, updatePaciente, deletePaciente } from "@/services/pacientes.service";

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
    const item = await getPaciente(id);
    return NextResponse.json(item);
  } catch (e) {
    console.error(`[GET /api/pacientes/${id}]`, e);
    return NextResponse.json({ message: "Paciente no encontrado" }, { status: 404 });
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

  const parsed = updatePacienteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Datos inválidos", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await updatePaciente(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al actualizar paciente";
    console.error(`[PUT /api/pacientes/${id}]`, e);
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, ctx: RouteContext) {
  const { id: rawId } = await ctx.params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ message: "ID inválido" }, { status: 400 });

  try {
    await deletePaciente(id);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al eliminar paciente";
    console.error(`[DELETE /api/pacientes/${id}]`, e);
    return NextResponse.json({ message }, { status: 500 });
  }
}