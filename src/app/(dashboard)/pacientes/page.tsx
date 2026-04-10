import type { Metadata } from "next";
import PacientesView from "@/features/pacientes/components/PacientesView";

export const metadata: Metadata = { title: "Pacientes" };

export default function PacientesPage() {
  return <PacientesView />;
}
