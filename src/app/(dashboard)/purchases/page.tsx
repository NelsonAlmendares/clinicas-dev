import type { Metadata } from "next";
import ComprasView from "@/features/purchases/components/ComprasView";
export const metadata: Metadata = { title: "Compras" };
export default function Page() { return <ComprasView />; }
