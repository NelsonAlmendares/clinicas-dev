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
import type { Compra, CompraCreate, CompraUpdate } from "@/types/compra";
import { PROVEEDORES, PRODUCTOS } from "../data/mock-catalog";

const { Item } = Form;
const { Option } = Select;
const { Text } = Typography;

interface CompraModalProps {
  open: boolean;
  compra: Compra | null; // null → modo creación
  loading: boolean;
  onSubmit: (values: CompraCreate | CompraUpdate) => Promise<void>;
  onCancel: () => void;
}

function money(v: number) {
  return `Q ${v.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CompraModal({
  open,
  compra,
  loading,
  onSubmit,
  onCancel,
}: CompraModalProps) {
  const [form] = Form.useForm<CompraCreate>();
  const isEditing = compra?.id != null;

  useEffect(() => {
    if (open && compra) {
      form.setFieldsValue({
        proveedor_id: compra.proveedor_id,
        fecha: (compra.fecha ? dayjs(compra.fecha) : undefined) as unknown as string,
        numero_doc: compra.numero_doc,
        items: compra.items.map(({ producto_id, lote, cantidad, precio_unit }) => ({
          producto_id, lote, cantidad, precio_unit,
        })),
      });
    } else if (open) {
      form.resetFields();
      form.setFieldsValue({ items: [{ cantidad: 1, precio_unit: 0 }] as never });
    }
  }, [open, compra, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      fecha: values.fecha
        ? dayjs(values.fecha as unknown as dayjs.Dayjs).format("YYYY-MM-DD")
        : undefined,
      numero_doc: values.numero_doc || undefined,
    };
    await onSubmit(payload);
  };

  return (
    <Modal
      title={isEditing ? "Editar compra" : "Nueva compra"}
      open={open}
      width={820}
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
          {isEditing ? "Guardar cambios" : "Registrar compra"}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Row gutter={16}>
          <Col span={10}>
            <Item
              label="Proveedor"
              name="proveedor_id"
              rules={[{ required: true, message: "Selecciona un proveedor" }]}
            >
              <Select placeholder="Selecciona un proveedor" showSearch optionFilterProp="children">
                {PROVEEDORES.map((p) => (
                  <Option key={p.id} value={p.id}>{p.nombre}</Option>
                ))}
              </Select>
            </Item>
          </Col>
          <Col span={7}>
            <Item label="Fecha" name="fecha">
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" placeholder="Seleccione" />
            </Item>
          </Col>
          <Col span={7}>
            <Item label="Nº de documento" name="numero_doc">
              <Input placeholder="FAC-1001" />
            </Item>
          </Col>
        </Row>

        <Divider orientation="left" orientationMargin={0} style={{ margin: "4px 0 16px", fontSize: 13, color: "#888" }}>
          Ítems de la compra
        </Divider>

        <Form.List name="items" rules={[{ validator: async (_, items) => {
          if (!items || items.length === 0) return Promise.reject(new Error("Agrega al menos un ítem"));
        } }]}>
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={12} align="top" style={{ marginBottom: 4 }}>
                  <Col span={7}>
                    <Item
                      {...restField}
                      name={[name, "producto_id"]}
                      rules={[{ required: true, message: "Producto requerido" }]}
                    >
                      <Select placeholder="Producto" showSearch optionFilterProp="children">
                        {PRODUCTOS.map((p) => (
                          <Option key={p.id} value={p.id}>{p.nombre} ({p.unidad})</Option>
                        ))}
                      </Select>
                    </Item>
                  </Col>
                  <Col span={5}>
                    <Item {...restField} name={[name, "lote"]}>
                      <Input placeholder="Nº de lote" />
                    </Item>
                  </Col>
                  <Col span={4}>
                    <Item
                      {...restField}
                      name={[name, "cantidad"]}
                      rules={[{ required: true, message: "Requerida" }]}
                    >
                      <InputNumber min={0.001} step={1} placeholder="Cant." style={{ width: "100%" }} />
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
            const total = items.reduce((s, i) => s + (i.cantidad ?? 0) * (i.precio_unit ?? 0), 0);
            return (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "#f8f9fb", border: "1px solid #e5e7eb",
                borderRadius: 8, padding: "8px 16px",
              }}>
                <Text style={{ color: "#888", fontSize: 13 }}>Total de la compra</Text>
                <Text style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>{money(total)}</Text>
              </div>
            );
          }}
        </Item>
      </Form>
    </Modal>
  );
}
