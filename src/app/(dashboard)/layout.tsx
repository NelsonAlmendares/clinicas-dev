import AppFrame from "@/components/layout/AppFrame";

/**
 * Layout compartido para todas las rutas del dashboard.
 * Al usar un route group "(dashboard)", este layout se aplica
 * automáticamente a todas las páginas dentro sin afectar las URLs.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppFrame>{children}</AppFrame>;
}
