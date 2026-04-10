"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Menu } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  CalendarOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  SettingOutlined,
} from "@ant-design/icons";

const NAV_ITEMS = [
  { key: "/",            icon: <DashboardOutlined />,    label: "Dashboard" },
  { key: "/pacientes",   icon: <UserOutlined />,         label: "Pacientes" },
  { key: "/appointments",icon: <CalendarOutlined />,     label: "Citas" },
  { key: "/purchases",   icon: <ShoppingCartOutlined />, label: "Compras" },
  { key: "/invoices",    icon: <FileTextOutlined />,     label: "Facturación" },
  { key: "/settings",    icon: <SettingOutlined />,      label: "Configuración" },
] as const;

interface SideNavProps {
  onNavigate?: () => void;
}

export default function SideNav({ onNavigate }: SideNavProps) {
  const pathname = usePathname();

  const selectedKey = useMemo(() => {
    if (pathname === "/") return "/";
    const match = NAV_ITEMS.slice(1).find((item) => pathname.startsWith(item.key));
    return match?.key ?? "/";
  }, [pathname]);

  const items = NAV_ITEMS.map(({ key, icon, label }) => ({
    key,
    icon,
    label: (
      <Link href={key} onClick={onNavigate}>
        {label}
      </Link>
    ),
  }));

  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[selectedKey]}
      items={items}
    />
  );
}
