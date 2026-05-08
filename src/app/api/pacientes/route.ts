import { type NextRequest, NextResponse } from "next/server";
import { createPacienteSchema } from "@/features/pacientes/schemas/paciente.schema";
import { listPacientes, createPaciente } from "@/services/pacientes.service";

export async function GET() {
  console.log("=== ENV CHECK ===");
  console.log("ORDS_BASE_URL:", JSON.stringify(process.env.ORDS_BASE_URL));
  console.log("ORDS_MODULE:", JSON.stringify(process.env.ORDS_MODULE));
  console.log("ORDS_BASIC_AUTH:", process.env.ORDS_BASIC_AUTH ? "OK" : "UNDEFINED");
  console.log("=================");
  try {
    const items = await listPacientes();
    return NextResponse.json({ items });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al listar pacientes";
    console.error("[GET /api/pacientes]", e);
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Cuerpo de la solicitud inválido" }, { status: 400 });
  }

  const parsed = createPacienteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Datos inválidos", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await createPaciente(parsed.data);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al crear paciente";
    console.error("[POST /api/pacientes]", e);
    return NextResponse.json({ message }, { status: 500 });
  }
}
