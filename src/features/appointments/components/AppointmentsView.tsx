"use client";

import { useState, type ReactNode } from "react";
import { App, Avatar, Button, Card, Input, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  GlobalOutlined,
  PhoneOutlined,
  PlusOutlined,
  SearchOutlined,
  ShopOutlined,
  WhatsAppOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAppointments } from "../hooks/useAppointments";
import AppointmentModal from "./AppointmentModal";
import { PACIENTES, PROFESIONALES, SERVICIOS, BOXES } from "../data/mock-catalog";
import type { Appointment, AppointmentCreate, AppointmentUpdate } from "@/types/appointments";

const { Title, Text } = Typography;

const AVATAR_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#6366f1", "#14b8a6",
];

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  PROGRAMADA: { label: "Programada",     color: "#1d6fa4", bg: "#e8f4fd", dot: "#3b9fd4" },
  CONFIRMADA: { label: "Confirmada",     color: "#047857", bg: "#e6f9f1", dot: "#10b981" },
  EN_SALA:    { label: "En sala",        color: "#6d28d9", bg: "#f3e8ff", dot: "#a78bfa" },
  ATENDIDA:   { label: "Atendida",       color: "#0f766e", bg: "#ccfbf1", dot: "#14b8a6" },
  NO_SHOW:    { label: "No se presentó", color: "#92400e", bg: "#fef3c7", dot: "#f59e0b" },
  CANCELADA:  { label: "Cancelada",      color: "#b91c1c", bg: "#fef2f2", dot: "#ef4444" },
};

const ORIGEN_ICON: Record<string, ReactNode> = {
  WEB: <GlobalOutlined />,
  TEL: <PhoneOutlined />,
  WHATSAPP: <WhatsAppOutlined />,
  PRESENCIAL: <ShopOutlined />,
};

const ORIGEN_LABEL: Record<string, string> = {
  WEB: "Web",
  TEL: "Teléfono",
  WHATSAPP: "WhatsApp",
  PRESENCIAL: "Presencial",
};

function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function getInitials(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";
}

function pacienteNombre(id: number) {
  const p = PACIENTES.find((x) => x.id === id);
  return p ? `${p.nombres} ${p.apellidos}` : "—";
}

function profesionalNombre(id: number) {
  return PROFESIONALES.find((p) => p.id === id)?.nombre ?? "—";
}

function servicioNombre(id?: number) {
  if (id == null) return undefined;
  return SERVICIOS.find((s) => s.id === id)?.nombre;
}

function boxNombre(id?: number) {
  if (id == null) return undefined;
  return BOXES.find((b) => b.id === id)?.nombre;
}

export default function AppointmentsView() {
  const { modal } = App.useApp();
  const { items, loading, stats, create, update, remove } = useAppointments();

  const [modalOpen, setModalOpen]     = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editing, setEditing]         = useState<Appointment | null>(null);
  const [search, setSearch]           = useState("");

  const handleAdd   = () => { setEditing(null); setModalOpen(true); };
  const handleEdit  = (a: Appointment) => { setEditing(a); setModalOpen(true); };
  const handleClose = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = async (values: AppointmentCreate | AppointmentUpdate) => {
    setFormLoading(true);
    const ok = editing?.id != null
      ? await update(editing.id, values as AppointmentUpdate)
      : await create(values as AppointmentCreate);
    setFormLoading(false);
    if (ok) handleClose();
  };

  const handleDelete = (id: number, paciente: string) => {
    modal.confirm({
      title: "¿Eliminar cita?",
      content: `Esta acción eliminará permanentemente la cita de "${paciente}". No se puede deshacer.`,
      okText: "Eliminar",
      cancelText: "Cancelar",
      okType: "danger",
      onOk: async () => { await remove(id); },
    });
  };

  const filtered = items.filter((a) => {
    const q = search.toLowerCase();
    return !q ||
      pacienteNombre(a.paciente_id).toLowerCase().includes(q) ||
      profesionalNombre(a.profesional_id).toLowerCase().includes(q) ||
      (servicioNombre(a.servicio_id) ?? "").toLowerCase().includes(q) ||
      ESTADO_CONFIG[a.estado]?.label.toLowerCase().includes(q) ||
      a.notas?.toLowerCase().includes(q);
  });

  const columns: ColumnsType<Appointment> = [
    {
      title: "Fecha y hora",
      dataIndex: "fecha_hora",
      key: "fecha_hora",
      width: 160,
      render: (v: string) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: "#111" }}>{dayjs(v).format("DD/MM/YYYY")}</div>
          <div style={{ fontSize: 11, color: "#888" }}>{dayjs(v).format("HH:mm")}</div>
        </div>
      ),
      sorter: (a, b) => a.fecha_hora.localeCompare(b.fecha_hora),
      defaultSortOrder: "ascend",
    },
    {
      title: "Paciente",
      key: "paciente",
      width: 200,
      render: (_, r) => {
        const nombre = pacienteNombre(r.paciente_id);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar
              size={32}
              style={{ background: avatarColor(r.paciente_id), fontWeight: 600, fontSize: 12, flexShrink: 0 }}
            >
              {getInitials(nombre)}
            </Avatar>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#111" }}>{nombre}</div>
          </div>
        );
      },
      sorter: (a, b) => pacienteNombre(a.paciente_id).localeCompare(pacienteNombre(b.paciente_id)),
    },
    {
      title: "Profesional",
      key: "profesional",
      width: 170,
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 13, color: "#111" }}>{profesionalNombre(r.profesional_id)}</div>
          <div style={{ fontSize: 11, color: "#888" }}>
            {PROFESIONALES.find((p) => p.id === r.profesional_id)?.especialidad ?? ""}
          </div>
        </div>
      ),
    },
    {
      title: "Servicio",
      key: "servicio",
      width: 150,
      render: (_, r) => servicioNombre(r.servicio_id) ?? <span style={{ color: "#ccc" }}>—</span>,
    },
    {
      title: "Box",
      key: "box",
      width: 90,
      render: (_, r) => boxNombre(r.box_id) ?? <span style={{ color: "#ccc" }}>—</span>,
    },
    {
      title: "Origen",
      dataIndex: "origen",
      key: "origen",
      width: 110,
      render: (v: string) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#666" }}>
          {ORIGEN_ICON[v]} {ORIGEN_LABEL[v] ?? v}
        </span>
      ),
      filters: Object.entries(ORIGEN_LABEL).map(([value, text]) => ({ text, value })),
      onFilter: (value, record) => record.origen === value,
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 130,
      render: (v: string) => {
        const cfg = ESTADO_CONFIG[v];
        if (!cfg) return v;
        return (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: cfg.bg, color: cfg.color,
            borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 500,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
            {cfg.label}
          </span>
        );
      },
      filters: Object.entries(ESTADO_CONFIG).map(([value, cfg]) => ({ text: cfg.label, value })),
      onFilter: (value, record) => record.estado === value,
    },
    {
      title: "",
      key: "acciones",
      width: 120,
      fixed: "right" as const,
      render: (_, record) => (
        <Space size={6}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ border: "1px solid #d1d5db", borderRadius: 6, color: "#374151", fontSize: 12 }}
          >
            Editar
          </Button>
          <Button
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => record.id != null && handleDelete(record.id, pacienteNombre(record.paciente_id))}
            style={{ border: "1px solid #fca5a5", borderRadius: 6, color: "#ef4444", background: "#fff5f5", fontSize: 12 }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "28px 32px", background: "#f8f9fb", minHeight: "100%" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 700, color: "#111" }}>
            Gestión de citas
          </Title>
          <Text style={{ color: "#888", fontSize: 13 }}>Agenda y seguimiento de pacientes</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{
            borderRadius: 8, fontWeight: 600,
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            border: "none", boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
            height: 38, paddingInline: 20,
          }}
        >
          Nueva cita
        </Button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { icon: <CalendarOutlined />,     label: "Total de citas", value: stats.total,     color: "#6366f1", bg: "#eef2ff" },
          { icon: <ClockCircleOutlined />,  label: "Próximas",       value: stats.proximas,  color: "#1d6fa4", bg: "#e8f4fd" },
          { icon: <CheckCircleOutlined />,  label: "Atendidas",      value: stats.atendidas, color: "#0f766e", bg: "#ccfbf1" },
          { icon: <CloseCircleOutlined />,  label: "Canceladas / No-show", value: stats.canceladas, color: "#b91c1c", bg: "#fef2f2" },
        ].map(({ icon, label, value, color, bg }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#fff", border: "1px solid #e5e7eb",
            borderRadius: 10, padding: "10px 18px", flex: 1, minWidth: 160,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: bg, color,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1, color: "#111" }}>{value}</div>
              <div style={{ fontSize: 11, color: "#888" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <Card
        styles={{ body: { padding: 0 } }}
        style={{ borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
      >
        <div style={{
          padding: "14px 20px", borderBottom: "1px solid #f0f0f0",
          display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafafa",
        }}>
          <Text style={{ fontSize: 13, color: "#555" }}>
            {filtered.length !== items.length
              ? `${filtered.length} de ${items.length} citas`
              : `${items.length} cita${items.length !== 1 ? "s" : ""}`}
          </Text>
          <Input
            prefix={<SearchOutlined style={{ color: "#aaa" }} />}
            placeholder="Buscar paciente, profesional, servicio…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 300, borderRadius: 8, fontSize: 13 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 20, showSizeChanger: true, style: { padding: "12px 20px" } }}
          locale={{ emptyText: "Sin registros" }}
          rowClassName={() => "cita-row"}
        />
      </Card>

      <style>{`
        .cita-row:hover > td { background: #f5f7ff !important; }
        .cita-row > td { border-bottom: 1px solid #f3f4f6 !important; padding: 12px 16px !important; }
        .ant-table-thead > tr > th {
          background: #f8f9fb !important;
          color: #6b7280 !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: .5px !important;
          border-bottom: 1px solid #e5e7eb !important;
          padding: 10px 16px !important;
        }
      `}</style>

      <AppointmentModal
        open={modalOpen}
        appointment={editing}
        loading={formLoading}
        onSubmit={handleSubmit}
        onCancel={handleClose}
      />
    </div>
  );
}
