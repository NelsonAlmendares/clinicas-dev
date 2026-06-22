import { type NextRequest, NextResponse } from "next/server";
import { appointmentBaseSchema } from "@/features/appointments/schemas/appointments.schema";
import { listAppointments, createAppointment } from "@/services/appointment.service";

export async function GET() {
  console.log("=== ENV CHECK ===");
  console.log("ORDS_BASE_URL:", JSON.stringify(process.env.ORDS_BASE_URL));
  console.log("ORDS_MODULE:", JSON.stringify(process.env.ORDS_MODULE));
  console.log("ORDS_BASIC_AUTH:", process.env.ORDS_BASIC_AUTH ? "OK" : "UNDEFINED");
  console.log("=================");
  try {
    const items = await listAppointments();
    return NextResponse.json({ items });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al listar citas";
    console.error("[GET /api/appointments]", e);
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

  const parsed = appointmentBaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Datos inválidos", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await createAppointment(parsed.data);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al crear cita";
    console.error("[POST /api/appointments]", e);
    return NextResponse.json({ message }, { status: 500 });
  }
}
