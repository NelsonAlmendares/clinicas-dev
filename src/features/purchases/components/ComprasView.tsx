"use client";

import { useState } from "react";
import { App, Avatar, Button, Card, Input, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ShopOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { useCompras } from "../hooks/useCompras";
import CompraModal from "./CompraModal";
import { PROVEEDORES, PRODUCTOS } from "../data/mock-catalog";
import type { Compra, CompraCreate, CompraItem, CompraUpdate } from "@/types/compra";

const { Title, Text } = Typography;

const AVATAR_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#6366f1", "#14b8a6",
];

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

function proveedorNombre(id: number) {
  return PROVEEDORES.find((p) => p.id === id)?.nombre ?? "—";
}

function productoNombre(id: number) {
  return PRODUCTOS.find((p) => p.id === id)?.nombre ?? "—";
}

function productoUnidad(id: number) {
  return PRODUCTOS.find((p) => p.id === id)?.unidad ?? "";
}

export default function ComprasView() {
  const { modal } = App.useApp();
  const { items, loading, stats, create, update, remove } = useCompras();

  const [modalOpen, setModalOpen]     = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editing, setEditing]         = useState<Compra | null>(null);
  const [search, setSearch]           = useState("");

  const handleAdd   = () => { setEditing(null); setModalOpen(true); };
  const handleEdit  = (c: Compra) => { setEditing(c); setModalOpen(true); };
  const handleClose = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = async (values: CompraCreate | CompraUpdate) => {
    setFormLoading(true);
    const ok = editing?.id != null
      ? await update(editing.id, values as CompraUpdate)
      : await create(values as CompraCreate);
    setFormLoading(false);
    if (ok) handleClose();
  };

  const handleDelete = (id: number, doc: string) => {
    modal.confirm({
      title: "¿Eliminar compra?",
      content: `Esta acción eliminará permanentemente la compra "${doc}". No se puede deshacer.`,
      okText: "Eliminar",
      cancelText: "Cancelar",
      okType: "danger",
      onOk: async () => { await remove(id); },
    });
  };

  const filtered = items.filter((c) => {
    const q = search.toLowerCase();
    return !q ||
      proveedorNombre(c.proveedor_id).toLowerCase().includes(q) ||
      c.numero_doc?.toLowerCase().includes(q) ||
      c.items.some((i) => productoNombre(i.producto_id).toLowerCase().includes(q));
  });

  const columns: ColumnsType<Compra> = [
    {
      title: "Proveedor",
      key: "proveedor",
      width: 260,
      render: (_, r) => {
        const nombre = proveedorNombre(r.proveedor_id);
        const prov = PROVEEDORES.find((p) => p.id === r.proveedor_id);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar
              size={36}
              style={{ background: avatarColor(r.proveedor_id), fontWeight: 600, fontSize: 13, flexShrink: 0 }}
            >
              {getInitials(nombre)}
            </Avatar>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#111", lineHeight: 1.3 }}>
                {nombre}
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
                {prov?.contacto ?? <span style={{ color: "#ccc" }}>Sin contacto</span>}
              </div>
            </div>
          </div>
        );
      },
      sorter: (a, b) => proveedorNombre(a.proveedor_id).localeCompare(proveedorNombre(b.proveedor_id)),
    },
    {
      title: "Documento",
      dataIndex: "numero_doc",
      key: "numero_doc",
      width: 130,
      render: (v?: string) =>
        v ? <span style={{ fontFamily: "monospace", fontSize: 13 }}>{v}</span>
          : <span style={{ color: "#ccc" }}>—</span>,
    },
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      width: 120,
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
          {r.items.length} producto{r.items.length !== 1 ? "s" : ""}
        </span>
      ),
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      width: 130,
      render: (v: number) => <span style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>{money(v)}</span>,
      sorter: (a, b) => a.total - b.total,
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
            onClick={() => record.id != null && handleDelete(record.id, record.numero_doc ?? `#${record.id}`)}
            style={{ border: "1px solid #fca5a5", borderRadius: 6, color: "#ef4444", background: "#fff5f5", fontSize: 12 }}
          />
        </Space>
      ),
    },
  ];

  const itemColumns: ColumnsType<CompraItem> = [
    { title: "Producto", key: "producto", render: (_, i) => productoNombre(i.producto_id) },
    { title: "Lote", dataIndex: "lote", key: "lote", render: (v?: string) => v ?? <span style={{ color: "#ccc" }}>—</span> },
    {
      title: "Cantidad", key: "cantidad", width: 130,
      render: (_, i) => `${i.cantidad} ${productoUnidad(i.producto_id)}`,
    },
    { title: "Precio unit.", dataIndex: "precio_unit", key: "precio_unit", width: 120, render: (v: number) => money(v) },
    {
      title: "Subtotal", key: "subtotal", width: 120,
      render: (_, i) => <b>{money(i.cantidad * i.precio_unit)}</b>,
    },
  ];

  return (
    <div style={{ padding: "28px 32px", background: "#f8f9fb", minHeight: "100%" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 700, color: "#111" }}>
            Gestión de compras
          </Title>
          <Text style={{ color: "#888", fontSize: 13 }}>Inventario y proveedores</Text>
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
          Nueva compra
        </Button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { icon: <ShoppingCartOutlined />, label: "Total de compras",  value: stats.total,                 color: "#6366f1", bg: "#eef2ff" },
          { icon: <DollarOutlined />,       label: "Monto invertido",   value: money(stats.montoTotal),      color: "#10b981", bg: "#e6f9f1" },
          { icon: <ShopOutlined />,         label: "Proveedores activos", value: stats.proveedoresActivos,  color: "#1d6fa4", bg: "#e8f4fd" },
          { icon: <BarChartOutlined />,     label: "Promedio por compra", value: money(stats.promedio),     color: "#9c2a6e", bg: "#fce8f4" },
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
              ? `${filtered.length} de ${items.length} compras`
              : `${items.length} compra${items.length !== 1 ? "s" : ""}`}
          </Text>
          <Input
            prefix={<SearchOutlined style={{ color: "#aaa" }} />}
            placeholder="Buscar proveedor, documento, producto…"
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
          scroll={{ x: 900 }}
          pagination={{ pageSize: 20, showSizeChanger: true, style: { padding: "12px 20px" } }}
          locale={{ emptyText: "Sin registros" }}
          rowClassName={() => "compra-row"}
          expandable={{
            expandedRowRender: (record) => (
              <Table
                columns={itemColumns}
                dataSource={record.items}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ),
          }}
        />
      </Card>

      <style>{`
        .compra-row:hover > td { background: #f5f7ff !important; }
        .compra-row > td { border-bottom: 1px solid #f3f4f6 !important; padding: 12px 16px !important; }
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

      <CompraModal
        open={modalOpen}
        compra={editing}
        loading={formLoading}
        onSubmit={handleSubmit}
        onCancel={handleClose}
      />
    </div>
  );
}
