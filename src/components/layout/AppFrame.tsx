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
  Typography,
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
  MedicineBoxOutlined,
} from "@ant-design/icons";
import SideNav from "./SideNav";

const { Header, Sider, Content, Footer } = Layout;
const { useBreakpoint } = Grid;
const { Text } = Typography;

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

const shellStyles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #e9eef5 0%, #f7f9fc 100%)",
    padding: 24,
  },
  shell: {
    minHeight: "calc(100vh - 48px)",
    overflow: "hidden",
    borderRadius: 24,
    background: "#f5f7fb",
    boxShadow: "0 24px 80px rgba(15, 23, 42, 0.12)",
    border: "1px solid rgba(255, 255, 255, 0.78)",
  },
  sider: {
    background: "#ffffff",
    borderRight: "1px solid #edf0f5",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "20px 18px 16px",
    minHeight: 72,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    color: "#ffffff",
    background: "linear-gradient(135deg, #1677ff 0%, #0f4fd7 100%)",
    boxShadow: "0 10px 24px rgba(22, 119, 255, 0.28)",
    flexShrink: 0,
    fontSize: 16,
  },
  header: {
    height: 64,
    padding: "0 24px",
    background: "transparent",
    borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  content: {
    background: "transparent",
  },
  breadcrumbWrap: {
    padding: "16px 28px 0",
  },
  footer: {
    textAlign: "center",
    background: "transparent",
    color: "#94a3b8",
    fontSize: 12,
    padding: "12px 24px 18px",
  },
};

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
      router.push("/login");
    }
  };

  return (
    <main style={shellStyles.page}>
      <Layout style={shellStyles.shell}>
        {!isMobile && (
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            width={236}
            theme="light"
            trigger={null}
            style={shellStyles.sider}
          >
            <div style={{ ...shellStyles.brand, justifyContent: collapsed ? "center" : "flex-start" }}>
              <div style={shellStyles.brandMark}>
                <MedicineBoxOutlined />
              </div>
              {!collapsed && (
                <div style={{ lineHeight: 1.2 }}>
                  <Text strong style={{ fontSize: 15, color: "#0f172a" }}>
                    Clínica Pro
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Gestión médica
                  </Text>
                </div>
              )}
            </div>
            <SideNav />
          </Sider>
        )}

        <Layout style={{ background: "transparent" }}>
          <Header style={shellStyles.header}>
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
                style={{ background: "transparent", borderBottom: "none", minWidth: "max-content" }}
              />
            )}

            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenu }}
              placement="bottomRight"
            >
              <Space style={{ cursor: "pointer", marginLeft: 8 }}>
                <Avatar
                  size={36}
                  icon={<UserOutlined />}
                  style={{ background: "#dbeafe", color: "#1677ff" }}
                />
              </Space>
            </Dropdown>
          </Header>

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

          <div style={shellStyles.breadcrumbWrap}>
            <Breadcrumb items={breadcrumbItems} />
          </div>

          <Content style={shellStyles.content}>{children}</Content>

          <Footer style={shellStyles.footer}>
            Gestión Clínica © {new Date().getFullYear()}
          </Footer>
        </Layout>
      </Layout>
    </main>
  );
}
