"use client";

import { useState } from "react";
import { Button, Card, Modal, Space, Table, Typography, Input, Avatar } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { usePacientes } from "../hooks/usePacientes";
import PacienteModal from "./PacienteModal";
import type { Paciente, PacienteCreate, PacienteUpdate } from "@/types/paciente";

const { Title, Text } = Typography;

const SEXO_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  M: { label: "Masculino", color: "#1d6fa4", bg: "#e8f4fd", dot: "#3b9fd4" },
  F: { label: "Femenino",  color: "#9c2a6e", bg: "#fce8f4", dot: "#d45eb0" },
  O: { label: "Otro",      color: "#5a5a7a", bg: "#f0f0f6", dot: "#8888aa" },
};

const AVATAR_COLORS = [
  "#3b82f6","#8b5cf6","#ec4899","#f59e0b","#10b981","#ef4444","#6366f1","#14b8a6",
];

function getInitials(nombres?: string, apellidos?: string) {
  return ((nombres?.[0] ?? "") + (apellidos?.[0] ?? "")).toUpperCase() || "?";
}

function avatarColor(id?: number) {
  return AVATAR_COLORS[(id ?? 0) % AVATAR_COLORS.length];
}

export default function PacientesView() {
  const { items, loading, create, update, remove } = usePacientes();

  const [modalOpen, setModalOpen]     = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editing, setEditing]         = useState<Paciente | null>(null);
  const [search, setSearch]           = useState("");

  const handleAdd   = () => { setEditing(null); setModalOpen(true); };
  const handleEdit  = (p: Paciente) => { setEditing(p); setModalOpen(true); };
  const handleClose = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = async (values: PacienteCreate | PacienteUpdate) => {
    setFormLoading(true);
    const ok = editing?.id != null
      ? await update(editing.id, values as PacienteUpdate)
      : await create(values as PacienteCreate);
    setFormLoading(false);
    if (ok) handleClose();
  };

  const handleDelete = (id: number, nombre: string) => {
    Modal.confirm({
      title: "¿Eliminar paciente?",
      content: `Esta acción eliminará permanentemente a "${nombre}". No se puede deshacer.`,
      okText: "Eliminar",
      cancelText: "Cancelar",
      okType: "danger",
      onOk: () => remove(id),
    });
  };

  const filtered = items.filter((p) => {
    const q = search.toLowerCase();
    return !q ||
      p.nombres?.toLowerCase().includes(q) ||
      p.apellidos?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.telefono?.includes(q) ||
      p.historia?.toLowerCase().includes(q);
  });

  const columns: ColumnsType<Paciente> = [
    {
      title: "Paciente",
      key: "paciente",
      width: 260,
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            size={36}
            style={{ background: avatarColor(r.id), fontWeight: 600, fontSize: 13, flexShrink: 0 }}
          >
            {getInitials(r.nombres, r.apellidos)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#111", lineHeight: 1.3 }}>
              {r.nombres} {r.apellidos}
            </div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
              {r.historia ? `Historia: ${r.historia}` : <span style={{ color: "#ccc" }}>Sin historia</span>}
            </div>
          </div>
        </div>
      ),
      sorter: (a, b) => `${a.nombres} ${a.apellidos}`.localeCompare(`${b.nombres} ${b.apellidos}`),
    },
    {
      title: "Sexo",
      dataIndex: "sexo",
      key: "sexo",
      width: 130,
      render: (v?: string) => {
        if (!v) return <span style={{ color: "#ccc" }}>—</span>;
        const cfg = SEXO_CONFIG[v];
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
      filters: [
        { text: "Masculino", value: "M" },
        { text: "Femenino",  value: "F" },
        { text: "Otro",      value: "O" },
      ],
      onFilter: (value, record) => record.sexo === value,
    },
    {
      title: "Teléfono",
      dataIndex: "telefono",
      key: "telefono",
      width: 140,
      render: (v?: string) =>
        v ? <span style={{ fontFamily: "monospace", fontSize: 13 }}>{v}</span>
          : <span style={{ color: "#ccc" }}>—</span>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (v?: string) =>
        v ? <a href={`mailto:${v}`} style={{ color: "#3b82f6", fontSize: 13 }}>{v}</a>
          : <span style={{ color: "#ccc" }}>—</span>,
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
            onClick={() => record.id != null && handleDelete(record.id, `${record.nombres} ${record.apellidos}`)}
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
            Gestión de pacientes
          </Title>
          <Text style={{ color: "#888", fontSize: 13 }}>Registro clínico</Text>
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
          Nuevo paciente
        </Button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { icon: <TeamOutlined />, label: "Total pacientes", value: items.length,                          color: "#6366f1", bg: "#eef2ff" },
          { icon: <UserOutlined />, label: "Femenino",         value: items.filter(p => p.sexo === "F").length, color: "#9c2a6e", bg: "#fce8f4" },
          { icon: <UserOutlined />, label: "Masculino",        value: items.filter(p => p.sexo === "M").length, color: "#1d6fa4", bg: "#e8f4fd" },
        ].map(({ icon, label, value, color, bg }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#fff", border: "1px solid #e5e7eb",
            borderRadius: 10, padding: "10px 18px", flex: 1, minWidth: 140,
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
              ? `${filtered.length} de ${items.length} pacientes`
              : `${items.length} paciente${items.length !== 1 ? "s" : ""}`}
          </Text>
          <Input
            prefix={<SearchOutlined style={{ color: "#aaa" }} />}
            placeholder="Buscar nombre, historia, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 280, borderRadius: 8, fontSize: 13 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{ pageSize: 20, showSizeChanger: true, style: { padding: "12px 20px" } }}
          locale={{ emptyText: "Sin registros" }}
          rowClassName={() => "pac-row"}
        />
      </Card>

      <style>{`
        .pac-row:hover > td { background: #f5f7ff !important; }
        .pac-row > td { border-bottom: 1px solid #f3f4f6 !important; padding: 12px 16px !important; }
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

      <PacienteModal
        open={modalOpen}
        paciente={editing}
        loading={formLoading}
        onSubmit={handleSubmit}
        onCancel={handleClose}
      />
    </div>
  );
}