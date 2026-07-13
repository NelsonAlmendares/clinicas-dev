"use client";

import { useEffect } from "react";
import { Modal, Form, InputNumber, Select, Input, Button, Typography } from "antd";
import { SaveOutlined, CloseOutlined } from "@ant-design/icons";
import type { Factura, Pago } from "@/types/factura";

const { Item } = Form;
const { Option } = Select;
const { Text } = Typography;

interface RegistrarPagoModalProps {
  open: boolean;
  factura: Factura | null;
  loading: boolean;
  onSubmit: (pago: Omit<Pago, "id" | "fecha">) => Promise<void>;
  onCancel: () => void;
}

function money(v: number) {
  return `Q ${v.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function RegistrarPagoModal({
  open,
  factura,
  loading,
  onSubmit,
  onCancel,
}: RegistrarPagoModalProps) {
  const [form] = Form.useForm<Omit<Pago, "id" | "fecha">>();

  const saldo = factura
    ? Math.max(0, factura.total + factura.iva - factura.pagos.reduce((s, p) => s + p.monto, 0))
    : 0;

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ metodo: "EFECTIVO", monto: Number(saldo.toFixed(2)) } as never);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, factura]);

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
  };

  if (!factura) return null;

  return (
    <Modal
      title="Registrar pago"
      open={open}
      width={440}
      onCancel={onCancel}
      maskClosable={false}
      footer={[
        <Button key="cancel" icon={<CloseOutlined />} onClick={onCancel}>
          Cancelar
        </Button>,
        <Button key="submit" type="primary" loading={loading} icon={<SaveOutlined />} onClick={handleOk}>
          Registrar pago
        </Button>,
      ]}
    >
      <div style={{
        marginBottom: 16, background: "#f8f9fb", border: "1px solid #e5e7eb",
        borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <Text style={{ color: "#888", fontSize: 13 }}>Saldo pendiente</Text>
        <Text style={{ fontWeight: 700, fontSize: 15 }}>{money(saldo)}</Text>
      </div>
      <Form form={form} layout="vertical" requiredMark="optional">
        <Item label="Método de pago" name="metodo" rules={[{ required: true, message: "Selecciona un método" }]}>
          <Select>
            <Option value="EFECTIVO">Efectivo</Option>
            <Option value="TARJETA">Tarjeta</Option>
            <Option value="TRANSFERENCIA">Transferencia</Option>
            <Option value="QR">QR</Option>
            <Option value="OTRO">Otro</Option>
          </Select>
        </Item>
        <Item label="Monto" name="monto" rules={[{ required: true, message: "El monto es obligatorio" }]}>
          <InputNumber min={0.01} step={0.01} style={{ width: "100%" }} prefix="Q" />
        </Item>
        <Item label="Referencia" name="referencia">
          <Input placeholder="Nº de recibo, autorización, etc." />
        </Item>
      </Form>
    </Modal>
  );
}
