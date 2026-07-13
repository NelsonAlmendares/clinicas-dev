"use client";

import { useState } from "react";
import { App, Avatar, Button, Card, Empty, Input, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusOutlined,
  SearchOutlined,
  WalletOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useFacturas } from "../hooks/useFacturas";
import FacturaModal from "./FacturaModal";
import RegistrarPagoModal from "./RegistrarPagoModal";
import { PACIENTES, SERVICIOS } from "../data/mock-catalog";
import type { Factura, FacturaCreate, FacturaItem, FacturaUpdate, Pago } from "@/types/factura";

const { Title, Text } = Typography;

const AVATAR_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#6366f1", "#14b8a6",
];

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  PENDIENTE: { label: "Pendiente", color: "#b45309", bg: "#fff7e6", dot: "#f59e0b" },
  PAGADA:    { label: "Pagada",    color: "#047857", bg: "#e6f9f1", dot: "#10b981" },
  ANULADA:   { label: "Anulada",  color: "#b91c1c", bg: "#fef2f2", dot: "#ef4444" },
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

function money(v: number) {
  return `Q ${v.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pacienteNombre(id: number) {
  const p = PACIENTES.find((x) => x.id === id);
  return p ? `${p.nombres} ${p.apellidos}` : "—";
}

function servicioNombre(id: number) {
  return SERVICIOS.find((s) => s.id === id)?.nombre ?? "—";
}

const METODO_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
  QR: "QR",
  OTRO: "Otro",
};

export default function FacturacionView() {
  const { modal } = App.useApp();
  const { items, loading, stats, create, update, remove, registrarPago } = useFacturas();

  const [modalOpen, setModalOpen]     = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editing, setEditing]         = useState<Factura | null>(null);

  const [pagoOpen, setPagoOpen]       = useState(false);
  const [pagoLoading, setPagoLoading] = useState(false);
  const [cobrando, setCobrando]       = useState<Factura | null>(null);

  const [search, setSearch] = useState("");

  const handleAdd   = () => { setEditing(null); setModalOpen(true); };
  const handleEdit  = (f: Factura) => { setEditing(f); setModalOpen(true); };
  const handleClose = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = async (values: FacturaCreate | FacturaUpdate) => {
    setFormLoading(true);
    const ok = editing?.id != null
      ? await update(editing.id, values as FacturaUpdate)
      : await create(values as FacturaCreate);
    setFormLoading(false);
    if (ok) handleClose();
  };

  const handleDelete = (id: number, paciente: string) => {
    modal.confirm({
      title: "¿Eliminar factura?",
      content: `Esta acción eliminará permanentemente la factura de "${paciente}". No se puede deshacer.`,
      okText: "Eliminar",
      cancelText: "Cancelar",
      okType: "danger",
      onOk: async () => { await remove(id); },
    });
  };

  const handleCobrar   = (f: Factura) => { setCobrando(f); setPagoOpen(true); };
  const handleClosePago = () => { setPagoOpen(false); setCobrando(null); };

  const handleSubmitPago = async (pago: Omit<Pago, "id" | "fecha">) => {
    if (cobrando?.id == null) return;
    setPagoLoading(true);
    const ok = await registrarPago(cobrando.id, pago);
    setPagoLoading(false);
    if (ok) handleClosePago();
  };

  const filtered = items.filter((f) => {
    const q = search.toLowerCase();
    return !q ||
      pacienteNombre(f.paciente_id).toLowerCase().includes(q) ||
      ESTADO_CONFIG[f.estado]?.label.toLowerCase().includes(q) ||
      f.items.some((i) => servicioNombre(i.servicio_id).toLowerCase().includes(q));
  });

  const columns: ColumnsType<Factura> = [
    {
      title: "Paciente",
      key: "paciente",
      width: 220,
      render: (_, r) => {
        const nombre = pacienteNombre(r.paciente_id);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar
              size={36}
              style={{ background: avatarColor(r.paciente_id), fontWeight: 600, fontSize: 13, flexShrink: 0 }}
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
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      width: 110,
      render: (v?: string) => v ?? <span style={{ color: "#ccc" }}>—</span>,
      sorter: (a, b) => (a.fecha ?? "").localeCompare(b.fecha ?? ""),
    },
    {
      title: "Ítems",
      key: "items",
      width: 100,
      render: (_, r) => (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: "#eef2ff", color: "#6366f1",
          borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 500,
        }}>
          {r.items.length} servicio{r.items.length !== 1 ? "s" : ""}
        </span>
      ),
    },
    {
      title: "Subtotal",
      dataIndex: "total",
      key: "subtotal",
      width: 110,
      render: (v: number) => <span style={{ fontSize: 13 }}>{money(v)}</span>,
    },
    {
      title: "IVA",
      dataIndex: "iva",
      key: "iva",
      width: 100,
      render: (v: number) => <span style={{ fontSize: 13, color: "#888" }}>{money(v)}</span>,
    },
    {
      title: "Total",
      key: "granTotal",
      width: 130,
      render: (_, r) => <span style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>{money(r.total + r.iva)}</span>,
      sorter: (a, b) => (a.total + a.iva) - (b.total + b.iva),
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 120,
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
      filters: [
        { text: "Pendiente", value: "PENDIENTE" },
        { text: "Pagada",    value: "PAGADA" },
        { text: "Anulada",   value: "ANULADA" },
      ],
      onFilter: (value, record) => record.estado === value,
    },
    {
      title: "",
      key: "acciones",
      width: 190,
      fixed: "right" as const,
      render: (_, record) => (
        <Space size={6}>
          {record.estado === "PENDIENTE" && (
            <Button
              size="small"
              icon={<DollarOutlined />}
              onClick={() => handleCobrar(record)}
              style={{ border: "1px solid #a7f3d0", borderRadius: 6, color: "#047857", background: "#ecfdf5", fontSize: 12 }}
            >
              Cobrar
            </Button>
          )}
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ border: "1px solid #d1d5db", borderRadius: 6, color: "#374151", fontSize: 12 }}
          />
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

  const itemColumns: ColumnsType<FacturaItem> = [
    { title: "Servicio", key: "servicio", render: (_, i) => servicioNombre(i.servicio_id) },
    { title: "Descripción", dataIndex: "descripcion", key: "descripcion", render: (v?: string) => v ?? <span style={{ color: "#ccc" }}>—</span> },
    { title: "Cantidad", dataIndex: "cantidad", key: "cantidad", width: 100 },
    { title: "Precio unit.", dataIndex: "precio_unit", key: "precio_unit", width: 120, render: (v: number) => money(v) },
    {
      title: "Subtotal", key: "subtotal", width: 120,
      render: (_, i) => <b>{money(i.cantidad * i.precio_unit)}</b>,
    },
  ];

  const pagoColumns: ColumnsType<Pago> = [
    { title: "Método", dataIndex: "metodo", key: "metodo", width: 140, render: (v: string) => METODO_LABEL[v] ?? v },
    { title: "Referencia", dataIndex: "referencia", key: "referencia", render: (v?: string) => v || <span style={{ color: "#ccc" }}>—</span> },
    { title: "Fecha", dataIndex: "fecha", key: "fecha", width: 120 },
    { title: "Monto", dataIndex: "monto", key: "monto", width: 120, render: (v: number) => <b>{money(v)}</b> },
  ];

  return (
    <div style={{ padding: "28px 32px", background: "#f8f9fb", minHeight: "100%" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 700, color: "#111" }}>
            Facturación
          </Title>
          <Text style={{ color: "#888", fontSize: 13 }}>Cobros, pagos y estado de cuenta</Text>
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
          Nueva factura
        </Button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { icon: <FileTextOutlined />,     label: "Total de facturas",       value: stats.total,                color: "#6366f1", bg: "#eef2ff" },
          { icon: <ClockCircleOutlined />,  label: "Facturas pendientes",     value: stats.pendientes,           color: "#b45309", bg: "#fff7e6" },
          { icon: <WalletOutlined />,       label: "Monto pendiente de cobro", value: money(stats.montoPendiente), color: "#9c2a6e", bg: "#fce8f4" },
          { icon: <DollarOutlined />,       label: "Recaudado",               value: money(stats.recaudado),      color: "#047857", bg: "#e6f9f1" },
        ].map(({ icon, label, value, color, bg }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#fff", border: "1px solid #e5e7eb",
            borderRadius: 10, padding: "10px 18px", flex: 1, minWidth: 170,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: bg, color,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.1, color: "#111" }}>{value}</div>
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
              ? `${filtered.length} de ${items.length} facturas`
              : `${items.length} factura${items.length !== 1 ? "s" : ""}`}
          </Text>
          <Input
            prefix={<SearchOutlined style={{ color: "#aaa" }} />}
            placeholder="Buscar paciente, servicio, estado…"
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
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 20, showSizeChanger: true, style: { padding: "12px 20px" } }}
          locale={{ emptyText: "Sin registros" }}
          rowClassName={() => "fact-row"}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Table
                  columns={itemColumns}
                  dataSource={record.items}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
                <div>
                  <Text style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: .5, fontWeight: 600 }}>
                    Pagos registrados
                  </Text>
                  {record.pagos.length > 0 ? (
                    <Table
                      columns={pagoColumns}
                      dataSource={record.pagos}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      style={{ marginTop: 6 }}
                    />
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Sin pagos registrados"
                      style={{ margin: "12px 0" }}
                    />
                  )}
                </div>
              </div>
            ),
          }}
        />
      </Card>

      <style>{`
        .fact-row:hover > td { background: #f5f7ff !important; }
        .fact-row > td { border-bottom: 1px solid #f3f4f6 !important; padding: 12px 16px !important; }
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

      <FacturaModal
        open={modalOpen}
        factura={editing}
        loading={formLoading}
        onSubmit={handleSubmit}
        onCancel={handleClose}
      />

      <RegistrarPagoModal
        open={pagoOpen}
        factura={cobrando}
        loading={pagoLoading}
        onSubmit={handleSubmitPago}
        onCancel={handleClosePago}
      />
    </div>
  );
}
