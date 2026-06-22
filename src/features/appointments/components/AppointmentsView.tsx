"use client";

import { useState } from "react";
import { App, Button, Card, Input, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useAppointment } from "../hooks/useAppointments";
import type { Appointment, AppointmentCreate, AppointmentUpdate } from "@/types/appointments";
import AppointmentModal from "./AppointmentModal";

const { Title, Text } = Typography;

export default function AppointmentsView() {
  const { modal } = App.useApp();
  const { items, loading, create, update, remove } = useAppointment();

  const [modalOpen, setModalOpen]     = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editing, setEditing]         = useState<Appointment | null>(null);
  const [search, setSearch]           = useState("");

  const handleAdd   = () => { setEditing(null); setModalOpen(true); };
  const handleEdit  = (p: Appointment) => { setEditing(p); setModalOpen(true); };
  const handleClose = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = async (values: AppointmentCreate | AppointmentUpdate) => {
    setFormLoading(true);
    const ok = editing?.id != null
      ? await update(editing.id, values as AppointmentUpdate)
      : await create(values as AppointmentCreate);
    setFormLoading(false);
    if (ok) {
      handleClose();
    }
  };

  const handleDelete = (id: number, nombre: string) => {
    modal.confirm({
      title: "¿Eliminar paciente?",
      content: `Esta acción eliminará permanentemente a "${nombre}". No se puede deshacer.`,
      okText: "Eliminar",
      cancelText: "Cancelar",
      okType: "danger",
      onOk: async () => {
        const ok = await remove(id);
      },
    });
  };

  const filtered = items.filter((p) => {
    const q = search.toLowerCase();
    return !q ||
      p.estado?.toLowerCase().includes(q) ||
      p.notas?.toLowerCase().includes(q) ||
      p.origen?.includes(q) ||
      p.created_at?.toLowerCase().includes(q);
  });

  const columns: ColumnsType<Appointment> = [
      {
        title: "Citas",
        key: "cita",
        width: 260,
        render: (_, r) => (
          <div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
              {r.notas ?? <span style={{ color: "#ccc" }}>Sin notas</span>}
            </div>
          </div>
        ),
        sorter: (a, b) => `${a.paciente_id} ${a.profesional_id}`.localeCompare(`${b.paciente_id} ${b.profesional_id}`),
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
              onClick={() => record.id != null && handleDelete(record.id, `${record.paciente_id} ${record.profesional_id}`)}
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