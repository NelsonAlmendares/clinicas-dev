import type { Metadata } from "next";
import FacturacionView from "@/features/invoices/components/FacturacionView";
export const metadata: Metadata = { title: "Facturación" };
export default function Page() { return <FacturacionView />; }
