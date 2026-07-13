"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Input,
  List,
  Progress,
  Row,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  PlusOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import dayjs from "dayjs";
import { INITIAL_APPOINTMENTS, PROFESIONALES, SERVICIOS, BOXES } from "@/features/appointments/data/mock-catalog";
import { INITIAL_FACTURAS } from "@/features/invoices/data/mock-catalog";
import { INITIAL_COMPRAS, PROVEEDORES } from "@/features/purchases/data/mock-catalog";
import { INITIAL_PACIENTES } from "@/features/pacientes/data/mock-catalog";
import type { Appointment, EstadoCita } from "@/types/appointments";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const { Title: AntTitle, Text } = Typography;

function money(v: number) {
  return `Q ${v.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pacienteNombre(id: number) {
  const p = INITIAL_PACIENTES.find((x) => x.id === id);
  return p ? `${p.nombres} ${p.apellidos}` : "—";
}

function profesionalNombre(id: number) {
  return PROFESIONALES.find((p) => p.id === id)?.nombre ?? "—";
}

function proveedorNombre(id: number) {
  return PROVEEDORES.find((p) => p.id === id)?.nombre ?? "—";
}

const ESTADO_TAG: Record<EstadoCita, { color: string; label: string }> = {
  PROGRAMADA: { color: "blue",   label: "Programada" },
  CONFIRMADA: { color: "green",  label: "Confirmada" },
  EN_SALA:    { color: "purple", label: "En sala" },
  ATENDIDA:   { color: "cyan",   label: "Atendida" },
  NO_SHOW:    { color: "gold",   label: "No se presentó" },
  CANCELADA:  { color: "red",    label: "Cancelada" },
};

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "success" | "processing" | "warning" | "error";
}

interface DashboardStats {
  totalPatients: number;
  proximasCitas: number;
  facturasPendientes: number;
  recaudado: number;
}

interface MonthlyRevenue {
  mes: string;
  monto: number;
}

interface OperationalStatus {
  activeDoctors: number;
  availableBoxes: number;
  activeServices: number;
  attendanceRate: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

interface DashboardData {
  stats: DashboardStats;
  monthlyRevenue: MonthlyRevenue[];
  recentAppointments: Appointment[];
  activityFeed: ActivityItem[];
  operationalStatus: OperationalStatus;
  quickActions: QuickAction[];
}

const MESES = ["Sep", "Oct", "Nov", "Dic"];

function buildDashboardData(): DashboardData {
  const totalPatients = INITIAL_PACIENTES.length;
  const proximasCitas = INITIAL_APPOINTMENTS.filter(
    (c) => c.estado === "PROGRAMADA" || c.estado === "CONFIRMADA"
  ).length;
  const facturasPendientes = INITIAL_FACTURAS.filter((f) => f.estado === "PENDIENTE").length;
  const recaudado = INITIAL_FACTURAS
    .filter((f) => f.estado === "PAGADA")
    .reduce((s, f) => s + f.total + f.iva, 0);

  const monthlyRevenue: MonthlyRevenue[] = MESES.map((mes, idx) => {
    const monthNum = String(idx + 9).padStart(2, "0"); // 09..12
    const monto = INITIAL_FACTURAS
      .filter((f) => f.estado !== "ANULADA" && f.fecha?.slice(5, 7) === monthNum)
      .reduce((s, f) => s + f.total + f.iva, 0);
    return { mes, monto };
  });

  const recentAppointments = [...INITIAL_APPOINTMENTS]
    .sort((a, b) => b.fecha_hora.localeCompare(a.fecha_hora))
    .slice(0, 5);

  const citaActivity: ActivityItem[] = [...INITIAL_APPOINTMENTS]
    .sort((a, b) => b.fecha_hora.localeCompare(a.fecha_hora))
    .slice(0, 2)
    .map((c) => ({
      id: `cita-${c.id}`,
      title: c.estado === "CANCELADA" || c.estado === "NO_SHOW" ? "Cita cancelada" : c.estado === "ATENDIDA" ? "Cita atendida" : "Cita confirmada",
      description: `${pacienteNombre(c.paciente_id)} con ${profesionalNombre(c.profesional_id)}`,
      time: dayjs(c.fecha_hora).format("DD/MM HH:mm"),
      type: c.estado === "CANCELADA" || c.estado === "NO_SHOW" ? "error" : c.estado === "ATENDIDA" ? "success" : "processing",
    }));

  const pagoActivity: ActivityItem[] = INITIAL_FACTURAS
    .flatMap((f) => f.pagos.map((p) => ({ f, p })))
    .sort((a, b) => (b.p.fecha ?? "").localeCompare(a.p.fecha ?? ""))
    .slice(0, 1)
    .map(({ f, p }) => ({
      id: `pago-${p.id}`,
      title: "Pago registrado",
      description: `Factura de ${pacienteNombre(f.paciente_id)} — ${money(p.monto)}`,
      time: p.fecha ?? "",
      type: "success",
    }));

  const compraActivity: ActivityItem[] = [...INITIAL_COMPRAS]
    .sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""))
    .slice(0, 1)
    .map((c) => ({
      id: `compra-${c.id}`,
      title: "Compra registrada",
      description: `${proveedorNombre(c.proveedor_id)} — ${money(c.total)}`,
      time: c.fecha ?? "",
      type: "processing",
    }));

  const activityFeed = [...citaActivity, ...pagoActivity, ...compraActivity];

  const canceladas = INITIAL_APPOINTMENTS.filter((c) => c.estado === "CANCELADA" || c.estado === "NO_SHOW").length;
  const attendanceRate = INITIAL_APPOINTMENTS.length
    ? Math.round(((INITIAL_APPOINTMENTS.length - canceladas) / INITIAL_APPOINTMENTS.length) * 100)
    : 0;

  return {
    stats: { totalPatients, proximasCitas, facturasPendientes, recaudado },
    monthlyRevenue,
    recentAppointments,
    activityFeed,
    operationalStatus: {
      activeDoctors: PROFESIONALES.length,
      availableBoxes: BOXES.length,
      activeServices: SERVICIOS.length,
      attendanceRate,
    },
    quickActions: [
      { id: "QA-001", title: "Registrar paciente", description: "Crear expediente clínico", icon: <UserAddOutlined />, href: "/pacientes" },
      { id: "QA-002", title: "Agendar cita",        description: "Nueva atención",           icon: <CalendarOutlined />, href: "/appointments" },
      { id: "QA-003", title: "Facturar",            description: "Cobros y pagos",           icon: <DollarOutlined />, href: "/invoices" },
      { id: "QA-004", title: "Registrar compra",    description: "Inventario y proveedores", icon: <ShoppingCartOutlined />, href: "/purchases" },
    ],
  };
}

function useDashboard(): { data: DashboardData | null; loading: boolean } {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setData(buildDashboardData());
      setLoading(false);
    }, 650);

    return () => window.clearTimeout(timer);
  }, []);

  return { data, loading };
}

const activityStatusColor: Record<ActivityItem["type"], string> = {
  success:    "green",
  processing: "blue",
  warning:    "orange",
  error:      "red",
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "16px 28px 28px",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  search: {
    width: 330,
    maxWidth: "100%",
  },
  card: {
    borderRadius: 20,
    border: "1px solid #edf0f5",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.04)",
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    fontSize: 20,
    color: "#1677ff",
    background: "#eef6ff",
  },
  quickCard: {
    height: "100%",
    borderRadius: 18,
    border: "1px solid #edf0f5",
    cursor: "pointer",
    transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    fontSize: 20,
    color: "#1677ff",
    background: "#eef6ff",
  },
  rightPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
};

export default function DashboardView() {
  const { data, loading } = useDashboard();
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const columns: ColumnsType<Appointment> = [
    {
      title: "Paciente",
      key: "paciente",
      render: (_, r) => (
        <Space>
          <Avatar size={32} icon={<UserOutlined />} style={{ background: "#eaf3ff", color: "#1677ff" }} />
          <Text strong>{pacienteNombre(r.paciente_id)}</Text>
        </Space>
      ),
    },
    {
      title: "Profesional",
      key: "profesional",
      responsive: ["sm"],
      render: (_, r) => profesionalNombre(r.profesional_id),
    },
    {
      title: "Fecha", key: "fecha", width: 150,
      render: (_, r) => `${dayjs(r.fecha_hora).format("DD/MM/YYYY")} · ${dayjs(r.fecha_hora).format("HH:mm")}`,
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 140,
      render: (status: EstadoCita) => (
        <Tag color={ESTADO_TAG[status].color} style={{ borderRadius: 999, padding: "2px 10px" }}>
          {ESTADO_TAG[status].label}
        </Tag>
      ),
    },
  ];

  const chartData = useMemo(
    () => ({
      labels: data?.monthlyRevenue.map((item) => item.mes) ?? [],
      datasets: [
        {
          label: "Facturación",
          data: data?.monthlyRevenue.map((item) => item.monto) ?? [],
          borderColor: "#1677ff",
          backgroundColor: "rgba(22, 119, 255, 0.12)",
          pointBackgroundColor: "#1677ff",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 3,
          pointRadius: 5,
          tension: 0.42,
          fill: true,
        },
      ],
    }),
    [data]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.92)",
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            label: (ctx: { parsed: { y: number | null } }) => money(ctx.parsed.y ?? 0),
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#64748b" },
        },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(148, 163, 184, 0.18)" },
          ticks: { color: "#64748b", callback: (v: string | number) => money(Number(v)) },
        },
      },
    }),
    []
  );

  return (
    <div style={styles.page}>
      <header style={styles.pageHeader}>
        <div>
          <AntTitle level={3} style={{ margin: 0, color: "#0f172a" }}>
            Dashboard Clínico
          </AntTitle>
          <Text type="secondary">Resumen operativo de la clínica</Text>
        </div>

        <Space size={12} wrap>
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            placeholder="Buscar paciente, cita o expediente..."
            style={styles.search}
          />
          <Link href="/appointments">
            <Button type="primary" icon={<PlusOutlined />} size="large">
              Nueva Cita
            </Button>
          </Link>
        </Space>
      </header>

      <Row gutter={[18, 18]}>
        <Col xs={24} sm={12} xl={6}>
          <Card style={styles.card} bordered={false}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
                <Statistic title="Pacientes totales" value={data?.stats.totalPatients} />
                <div style={styles.statIcon}><UserOutlined /></div>
              </Space>
            )}
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card style={styles.card} bordered={false}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
                <Statistic title="Citas próximas" value={data?.stats.proximasCitas} />
                <div style={styles.statIcon}><CalendarOutlined /></div>
              </Space>
            )}
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card style={styles.card} bordered={false}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
                <Statistic title="Facturas pendientes" value={data?.stats.facturasPendientes} />
                <div style={styles.statIcon}><ClockCircleOutlined /></div>
              </Space>
            )}
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card style={styles.card} bordered={false}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
                <Statistic
                  title="Recaudado"
                  value={data?.stats.recaudado}
                  formatter={(v) => money(Number(v))}
                />
                <div style={styles.statIcon}><DollarOutlined /></div>
              </Space>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={17}>
          <Space direction="vertical" size={18} style={{ width: "100%" }}>
            <Card
              title="Facturación mensual"
              extra={<Tag color="blue">Sep – Dic 2025</Tag>}
              style={styles.card}
              bordered={false}
            >
              {loading ? (
                <Skeleton active paragraph={{ rows: 8 }} />
              ) : (
                <div style={{ height: 310 }}>
                  <Line data={chartData} options={chartOptions} />
                </div>
              )}
            </Card>

            <Card title="Accesos rápidos" style={styles.card} bordered={false}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : (
                <Row gutter={[14, 14]}>
                  {data?.quickActions.map((action) => (
                    <Col xs={24} sm={12} lg={6} key={action.id}>
                      <Link href={action.href}>
                        <Card
                          bordered={false}
                          style={{
                            ...styles.quickCard,
                            transform: hoveredAction === action.id ? "translateY(-4px)" : "translateY(0)",
                            boxShadow:
                              hoveredAction === action.id
                                ? "0 16px 34px rgba(22, 119, 255, 0.12)"
                                : "0 8px 22px rgba(15, 23, 42, 0.04)",
                            borderColor: hoveredAction === action.id ? "#bfdbfe" : "#edf0f5",
                          }}
                          onMouseEnter={() => setHoveredAction(action.id)}
                          onMouseLeave={() => setHoveredAction(null)}
                        >
                          <Space direction="vertical" size={12}>
                            <div style={styles.quickIcon}>{action.icon}</div>
                            <div>
                              <Text strong style={{ color: "#0f172a" }}>
                                {action.title}
                              </Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {action.description}
                              </Text>
                            </div>
                          </Space>
                        </Card>
                      </Link>
                    </Col>
                  ))}
                </Row>
              )}
            </Card>

            <Card title="Próximas citas" style={styles.card} bordered={false}>
              <Table<Appointment>
                rowKey="id"
                columns={columns}
                dataSource={data?.recentAppointments ?? []}
                loading={loading}
                pagination={false}
                scroll={{ x: 620 }}
              />
            </Card>
          </Space>
        </Col>

        <Col xs={24} xl={7}>
          <aside style={styles.rightPanel}>
            <Card title="Actividad reciente" style={styles.card} bordered={false}>
              {loading ? (
                <Skeleton active avatar paragraph={{ rows: 5 }} />
              ) : (
                <List
                  itemLayout="horizontal"
                  dataSource={data?.activityFeed ?? []}
                  renderItem={(item) => (
                    <List.Item style={{ paddingInline: 0 }}>
                      <List.Item.Meta
                        avatar={<Badge color={activityStatusColor[item.type]} />}
                        title={<Text strong>{item.title}</Text>}
                        description={
                          <Space direction="vertical" size={3}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {item.description}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {item.time}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>

            <Card title="Estado operativo" style={styles.card} bordered={false}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : (
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  <Row gutter={[12, 12]}>
                    <Col span={12}>
                      <Statistic
                        title="Profesionales activos"
                        value={data?.operationalStatus.activeDoctors}
                        valueStyle={{ fontSize: 22 }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Boxes disponibles"
                        value={data?.operationalStatus.availableBoxes}
                        valueStyle={{ fontSize: 22 }}
                      />
                    </Col>
                  </Row>

                  <Divider style={{ margin: "4px 0" }} />

                  <Statistic
                    title="Servicios activos"
                    value={data?.operationalStatus.activeServices}
                    valueStyle={{ fontSize: 24 }}
                  />

                  <div>
                    <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text type="secondary">Tasa de asistencia</Text>
                      <Text strong>{data?.operationalStatus.attendanceRate}%</Text>
                    </Space>
                    <Progress
                      percent={data?.operationalStatus.attendanceRate}
                      showInfo={false}
                      strokeColor="#1677ff"
                      trailColor="#e8eef7"
                    />
                  </div>
                </Space>
              )}
            </Card>
          </aside>
        </Col>
      </Row>
    </div>
  );
}
