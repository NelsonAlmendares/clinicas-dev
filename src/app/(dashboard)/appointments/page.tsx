import type { Metadata } from "next";
import AppointmentsView from "@/features/appointments/components/AppointmentsView";

export const metadata: Metadata = { title: "Citas" };

export default function AppointmentsPage() {
  return <AppointmentsView />;
}
