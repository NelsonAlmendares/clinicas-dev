"use client";

import { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Row,
  Col,
  Button,
  Divider,
  Typography,
} from "antd";
import { SaveOutlined, PlusOutlined, CloseOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { Factura, FacturaCreate, FacturaUpdate } from "@/types/factura";
import { PACIENTES, SERVICIOS, IVA_RATE } from "../data/mock-catalog";

const { Item } = Form;
const { Option } = Select;
const { Text } = Typography;

interface FacturaModalProps {
  open: boolean;
  factura: Factura | null; // null → modo creación
  loading: boolean;
  onSubmit: (values: FacturaCreate | FacturaUpdate) => Promise<void>;
  onCancel: () => void;
}

function money(v: number) {
  return `Q ${v.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function FacturaModal({
  open,
  factura,
  loading,
  onSubmit,
  onCancel,
}: FacturaModalProps) {
  const [form] = Form.useForm<FacturaCreate>();
  const isEditing = factura?.id != null;

  useEffect(() => {
    if (open && factura) {
      form.setFieldsValue({
        paciente_id: factura.paciente_id,
        fecha: (factura.fecha ? dayjs(factura.fecha) : undefined) as unknown as string,
        estado: factura.estado,
        items: factura.items.map(({ servicio_id, descripcion, cantidad, precio_unit }) => ({
          servicio_id, descripcion, cantidad, precio_unit,
        })),
      });
    } else if (open) {
      form.resetFields();
      form.setFieldsValue({
        estado: "PENDIENTE",
        items: [{ cantidad: 1, precio_unit: 0 }] as never,
      });
    }
  }, [open, factura, form]);

  const handleServicioChange = (name: number, servicioId: number) => {
    const servicio = SERVICIOS.find((s) => s.id === servicioId);
    if (!servicio) return;
    const items = form.getFieldValue("items") ?? [];
    items[name] = {
      ...items[name],
      precio_unit: servicio.precio,
      descripcion: items[name]?.descripcion || servicio.nombre,
    };
    form.setFieldsValue({ items });
  };

  const handleOk = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      fecha: values.fecha
        ? dayjs(values.fecha as unknown as dayjs.Dayjs).format("YYYY-MM-DD")
        : undefined,
    };
    await onSubmit(payload);
  };

  return (
    <Modal
      title={isEditing ? "Editar factura" : "Nueva factura"}
      open={open}
      width={860}
      onCancel={onCancel}
      maskClosable={false}
      footer={[
        <Button key="cancel" icon={<CloseOutlined />} onClick={onCancel}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          icon={isEditing ? <SaveOutlined /> : <PlusOutlined />}
          onClick={handleOk}
        >
          {isEditing ? "Guardar cambios" : "Crear factura"}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Row gutter={16}>
          <Col span={9}>
            <Item
              label="Paciente"
              name="paciente_id"
              rules={[{ required: true, message: "Selecciona un paciente" }]}
            >
              <Select placeholder="Selecciona un paciente" showSearch optionFilterProp="children">
                {PACIENTES.map((p) => (
                  <Option key={p.id} value={p.id}>{p.nombres} {p.apellidos}</Option>
                ))}
              </Select>
            </Item>
          </Col>
          <Col span={7}>
            <Item label="Fecha" name="fecha">
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" placeholder="Seleccione" />
            </Item>
          </Col>
          <Col span={8}>
            <Item label="Estado" name="estado" rules={[{ required: true, message: "Selecciona un estado" }]}>
              <Select>
                <Option value="PENDIENTE">Pendiente</Option>
                <Option value="PAGADA">Pagada</Option>
                <Option value="ANULADA">Anulada</Option>
              </Select>
            </Item>
          </Col>
        </Row>

        <Divider orientation="left" orientationMargin={0} style={{ margin: "4px 0 16px", fontSize: 13, color: "#888" }}>
          Ítems / servicios
        </Divider>

        <Form.List name="items" rules={[{ validator: async (_, items) => {
          if (!items || items.length === 0) return Promise.reject(new Error("Agrega al menos un ítem"));
        } }]}>
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={12} align="top" style={{ marginBottom: 4 }}>
                  <Col span={6}>
                    <Item
                      {...restField}
                      name={[name, "servicio_id"]}
                      rules={[{ required: true, message: "Servicio requerido" }]}
                    >
                      <Select
                        placeholder="Servicio"
                        showSearch
                        optionFilterProp="children"
                        onChange={(v) => handleServicioChange(name, v)}
                      >
                        {SERVICIOS.map((s) => (
                          <Option key={s.id} value={s.id}>{s.nombre}</Option>
                        ))}
                      </Select>
                    </Item>
                  </Col>
                  <Col span={7}>
                    <Item {...restField} name={[name, "descripcion"]}>
                      <Input placeholder="Descripción" />
                    </Item>
                  </Col>
                  <Col span={3}>
                    <Item
                      {...restField}
                      name={[name, "cantidad"]}
                      rules={[{ required: true, message: "Requerida" }]}
                    >
                      <InputNumber min={0.01} step={1} placeholder="Cant." style={{ width: "100%" }} />
                    </Item>
                  </Col>
                  <Col span={5}>
                    <Item
                      {...restField}
                      name={[name, "precio_unit"]}
                      rules={[{ required: true, message: "Requerido" }]}
                    >
                      <InputNumber
                        min={0}
                        step={0.01}
                        placeholder="Precio unit."
                        style={{ width: "100%" }}
                        prefix="Q"
                      />
                    </Item>
                  </Col>
                  <Col span={3}>
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                      disabled={fields.length === 1}
                    />
                  </Col>
                </Row>
              ))}
              <Form.ErrorList errors={errors} />
              <Button
                type="dashed"
                onClick={() => add({ cantidad: 1, precio_unit: 0 })}
                icon={<PlusOutlined />}
                style={{ width: "100%", marginTop: 4 }}
              >
                Agregar ítem
              </Button>
            </>
          )}
        </Form.List>

        <Item shouldUpdate style={{ marginTop: 16, marginBottom: 0, textAlign: "right" }}>
          {() => {
            const items = (form.getFieldValue("items") ?? []) as { cantidad?: number; precio_unit?: number }[];
            const subtotal = items.reduce((s, i) => s + (i.cantidad ?? 0) * (i.precio_unit ?? 0), 0);
            const iva = subtotal * IVA_RATE;
            const total = subtotal + iva;
            return (
              <div style={{
                display: "inline-flex", flexDirection: "column", gap: 4,
                background: "#f8f9fb", border: "1px solid #e5e7eb",
                borderRadius: 8, padding: "10px 18px", minWidth: 240,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888" }}>
                  <span>Subtotal</span><span>{money(subtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888" }}>
                  <span>IVA (12%)</span><span>{money(iva)}</span>
                </div>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  fontSize: 15, fontWeight: 700, color: "#111",
                  borderTop: "1px dashed #e5e7eb", paddingTop: 4, marginTop: 2,
                }}>
                  <Text style={{ fontWeight: 700 }}>Total</Text><span>{money(total)}</span>
                </div>
              </div>
            );
          }}
        </Item>
      </Form>
    </Modal>
  );
}
