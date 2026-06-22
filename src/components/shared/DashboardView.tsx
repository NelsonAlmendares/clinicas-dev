"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  BarChartOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
  SearchOutlined,
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

type AppointmentStatus = "pendiente" | "confirmada" | "cancelada";

interface RecentAppointment {
  id: string;
  paciente_name: string;
  fecha: string;
  hora: string;
  estado: AppointmentStatus;
}

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingConsultations: number;
  monthlyRevenue: number;
}

interface WeeklyAppointment {
  day: string;
  citas: number;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "success" | "processing" | "warning" | "error";
}

interface OperationalStatus {
  activeDoctors: number;
  availableRooms: number;
  averageWaitingTime: number;
  occupancyPercentage: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface DashboardData {
  stats: DashboardStats;
  weeklyAppointments: WeeklyAppointment[];
  recentAppointments: RecentAppointment[];
  activityFeed: ActivityItem[];
  operationalStatus: OperationalStatus;
  quickActions: QuickAction[];
}

const mockDashboardData: DashboardData = {
  stats: {
    totalPatients: 2847,
    todayAppointments: 38,
    pendingConsultations: 14,
    monthlyRevenue: 18750,
  },
  weeklyAppointments: [
    { day: "Lun", citas: 31 },
    { day: "Mar", citas: 42 },
    { day: "Mié", citas: 35 },
    { day: "Jue", citas: 48 },
    { day: "Vie", citas: 44 },
    { day: "Sáb", citas: 27 },
    { day: "Dom", citas: 18 },
  ],
  recentAppointments: [
    { id: "APT-1001", paciente_name: "María Hernández", fecha: "2026-05-07", hora: "08:30", estado: "confirmada" },
    { id: "APT-1002", paciente_name: "Carlos Mejía",    fecha: "2026-05-07", hora: "09:15", estado: "pendiente" },
    { id: "APT-1003", paciente_name: "Ana Rodríguez",   fecha: "2026-05-07", hora: "10:00", estado: "confirmada" },
    { id: "APT-1004", paciente_name: "José Martínez",   fecha: "2026-05-07", hora: "11:30", estado: "cancelada" },
    { id: "APT-1005", paciente_name: "Sofía Castillo",  fecha: "2026-05-07", hora: "14:00", estado: "pendiente" },
  ],
  activityFeed: [
    { id: "ACT-001", title: "Cita confirmada",    description: "María Hernández confirmó su cita de medicina general.", time: "Hace 8 min",  type: "success" },
    { id: "ACT-002", title: "Paciente registrado", description: "Se creó el expediente clínico de Roberto Flores.",     time: "Hace 22 min", type: "processing" },
    { id: "ACT-003", title: "Consulta finalizada", description: "Dra. Morales cerró una consulta pediátrica.",            time: "Hace 36 min", type: "success" },
    { id: "ACT-004", title: "Cita cancelada",      description: "José Martínez canceló su cita programada.",              time: "Hace 1 h",    type: "error" },
  ],
  operationalStatus: {
    activeDoctors: 9,
    availableRooms: 5,
    averageWaitingTime: 18,
    occupancyPercentage: 72,
  },
  quickActions: [
    { id: "QA-001", title: "Registrar Paciente", description: "Crear expediente clínico", icon: <UserAddOutlined /> },
    { id: "QA-002", title: "Crear Cita",         description: "Agendar nueva atención",   icon: <CalendarOutlined /> },
    { id: "QA-003", title: "Nueva Consulta",     description: "Iniciar atención médica",  icon: <MedicineBoxOutlined /> },
    { id: "QA-004", title: "Ver Reportes",       description: "Indicadores clínicos",     icon: <BarChartOutlined /> },
  ],
};

function useDashboard(): { data: DashboardData | null; loading: boolean } {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setData(mockDashboardData);
      setLoading(false);
    }, 650);

    return () => window.clearTimeout(timer);
  }, []);

  return { data, loading };
}

const statusConfig: Record<AppointmentStatus, { color: string; label: string }> = {
  pendiente:  { color: "orange", label: "Pendiente" },
  confirmada: { color: "green",  label: "Confirmada" },
  cancelada:  { color: "red",    label: "Cancelada" },
};

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

  const columns: ColumnsType<RecentAppointment> = [
    {
      title: "Paciente",
      dataIndex: "paciente_name",
      key: "paciente_name",
      render: (value: string) => (
        <Space>
          <Avatar size={32} icon={<UserOutlined />} style={{ background: "#eaf3ff", color: "#1677ff" }} />
          <Text strong>{value}</Text>
        </Space>
      ),
    },
    { title: "Fecha", dataIndex: "fecha", key: "fecha", responsive: ["sm"] },
    { title: "Hora",  dataIndex: "hora",  key: "hora",  width: 110 },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 140,
      render: (status: AppointmentStatus) => (
        <Tag color={statusConfig[status].color} style={{ borderRadius: 999, padding: "2px 10px" }}>
          {statusConfig[status].label}
        </Tag>
      ),
    },
  ];

  const chartData = useMemo(
    () => ({
      labels: data?.weeklyAppointments.map((item) => item.day) ?? [],
      datasets: [
        {
          label: "Citas",
          data: data?.weeklyAppointments.map((item) => item.citas) ?? [],
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
          ticks: { color: "#64748b", precision: 0 },
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
          <Button type="primary" icon={<PlusOutlined />} size="large">
            Nueva Cita
          </Button>
        </Space>
      </header>

      <Row gutter={[18, 18]}>
        <Col xs={24} sm={12} xl={6}>
          <Card style={styles.card} bordered={false}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
                <Statistic title="Pacientes Totales" value={data?.stats.totalPatients} />
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
                <Statistic title="Citas Hoy" value={data?.stats.todayAppointments} />
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
                <Statistic title="Consultas Pendientes" value={data?.stats.pendingConsultations} />
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
                  title="Ingresos del Mes"
                  value={data?.stats.monthlyRevenue}
                  prefix="$"
                  precision={0}
                />
                <div style={styles.statIcon}><DollarOutlined /></div>
              </Space>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={17}>
          <Space direction="vertical" size={18} style={{ width: "100%" }}>
            <Card
              title="Resumen de la Semana"
              extra={<Tag color="blue">Últimos 7 días</Tag>}
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

            <Card title="Accesos Rápidos" style={styles.card} bordered={false}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : (
                <Row gutter={[14, 14]}>
                  {data?.quickActions.map((action) => (
                    <Col xs={24} sm={12} lg={6} key={action.id}>
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
                    </Col>
                  ))}
                </Row>
              )}
            </Card>

            <Card title="Actividad de Citas Recientes" style={styles.card} bordered={false}>
              <Table<RecentAppointment>
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
            <Card title="Actividad Reciente" style={styles.card} bordered={false}>
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

            <Card title="Estado Operativo" style={styles.card} bordered={false}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : (
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  <Row gutter={[12, 12]}>
                    <Col span={12}>
                      <Statistic
                        title="Médicos activos"
                        value={data?.operationalStatus.activeDoctors}
                        valueStyle={{ fontSize: 22 }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Salas disponibles"
                        value={data?.operationalStatus.availableRooms}
                        valueStyle={{ fontSize: 22 }}
                      />
                    </Col>
                  </Row>

                  <Divider style={{ margin: "4px 0" }} />

                  <Statistic
                    title="Tiempo promedio de espera"
                    value={data?.operationalStatus.averageWaitingTime}
                    suffix="min"
                    valueStyle={{ fontSize: 24 }}
                  />

                  <div>
                    <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text type="secondary">Ocupación clínica</Text>
                      <Text strong>{data?.operationalStatus.occupancyPercentage}%</Text>
                    </Space>
                    <Progress
                      percent={data?.operationalStatus.occupancyPercentage}
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
