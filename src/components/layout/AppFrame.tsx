"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Layout,
  Menu,
  Grid,
  Button,
  Breadcrumb,
  Drawer,
  Dropdown,
  Avatar,
  Space,
} from "antd";
import type { MenuProps } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  AppstoreOutlined,
  ReconciliationOutlined,
  HeartOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  EditOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import SideNav from "./SideNav";

const { Header, Sider, Content, Footer } = Layout;
const { useBreakpoint } = Grid;

// Etiquetas legibles para las rutas del breadcrumb
const ROUTE_LABELS: Record<string, string> = {
  pacientes: "Pacientes",
  appointments: "Citas",
  purchases: "Compras",
  invoices: "Facturación",
  settings: "Configuración",
};

const headerMenuItems: MenuProps["items"] = [
  {
    label: "Gestión de inventario",
    key: "inventory",
    icon: <ReconciliationOutlined />,
  },
  {
    label: "Aseguradoras",
    key: "insurers",
    icon: <HeartOutlined />,
  },
  {
    label: "Reportes",
    key: "reports",
    icon: <EditOutlined />,
    children: [
      {
        type: "group",
        label: "Inventario",
        children: [
          { label: "Parametrizado", key: "report-inventory-custom", icon: <FileExcelOutlined /> },
          { label: "General",       key: "report-inventory-general", icon: <FilePdfOutlined /> },
        ],
      },
      {
        type: "group",
        label: "Clínico",
        children: [
          { label: "Mensual",      key: "report-clinical-monthly", icon: <FileExcelOutlined /> },
          { label: "Estadístico",  key: "report-clinical-stats",   icon: <FilePdfOutlined /> },
        ],
      },
    ],
  },
];

interface AppFrameProps {
  children: React.ReactNode;
}

export default function AppFrame({ children }: AppFrameProps) {
  const screens = useBreakpoint();
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeHeaderKey, setActiveHeaderKey] = useState<string>("");

  const isMobile = !screens.lg;

  const breadcrumbItems = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    return [
      { title: <Link href="/">Inicio</Link> },
      ...parts.map((part, idx) => {
        const url = "/" + parts.slice(0, idx + 1).join("/");
        const label = ROUTE_LABELS[part] ?? part.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
        return { title: <Link href={url}>{label}</Link> };
      }),
    ];
  }, [pathname]);

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Mi perfil",
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Cerrar sesión",
      danger: true,
    },
  ];

  const handleUserMenu: MenuProps["onClick"] = ({ key }) => {
    if (key === "logout") {
      // TODO: implementar lógica de cierre de sesión
      router.push("/login");
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={240}
        >
          <div
            style={{
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              padding: collapsed ? 0 : "0 20px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span style={{ color: "#fff", fontWeight: 500, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden" }}>
              {!collapsed && "Gestión Clínica"}
            </span>
          </div>
          <SideNav />
        </Sider>
      )}

      <Layout>
        <Header
          style={{
            padding: "0 16px",
            background: "#fff",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {isMobile ? (
            <Button
              type="text"
              icon={<MenuUnfoldOutlined />}
              onClick={() => setDrawerOpen(true)}
            />
          ) : (
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((c) => !c)}
            />
          )}

          <div style={{ flex: 1 }} />

          {/* Menú principal — Dropdown en mobile, horizontal en desktop */}
          {isMobile ? (
            <Dropdown
              trigger={["click"]}
              menu={{ items: headerMenuItems, onClick: ({ key }) => setActiveHeaderKey(key) }}
              placement="bottomRight"
            >
              <Button type="default" icon={<AppstoreOutlined />}>
                Menú
              </Button>
            </Dropdown>
          ) : (
            <Menu
              mode="horizontal"
              selectedKeys={[activeHeaderKey]}
              onClick={({ key }) => setActiveHeaderKey(key)}
              items={headerMenuItems}
              style={{ borderBottom: "none", minWidth: "max-content" }}
            />
          )}

          {/* Avatar + menú de usuario */}
          <Dropdown
            menu={{ items: userMenuItems, onClick: handleUserMenu }}
            placement="bottomRight"
          >
            <Space style={{ cursor: "pointer", marginLeft: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} />
            </Space>
          </Dropdown>
        </Header>

        {/* Drawer para navegación mobile */}
        {isMobile && (
          <Drawer
            title="Navegación"
            placement="left"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            styles={{ body: { padding: 0 } }}
          >
            <SideNav onNavigate={() => setDrawerOpen(false)} />
          </Drawer>
        )}

        <Content style={{ margin: 16 }}>
          <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 12 }} />
          <div
            style={{
              minHeight: 320,
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            {children}
          </div>
        </Content>

        <Footer style={{ textAlign: "center", background: "#fff", color: "#999", fontSize: 12 }}>
          Gestión Clínica © {new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
}
