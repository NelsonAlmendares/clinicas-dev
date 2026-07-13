"use client";

import { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Row,
  Col,
  Button,
} from "antd";
import { SaveOutlined, PlusOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { Appointment, AppointmentCreate, AppointmentUpdate } from "@/types/appointments";
import { PACIENTES, PROFESIONALES, SERVICIOS, BOXES } from "../data/mock-catalog";

const { Item } = Form;
const { TextArea } = Input;
const { Option } = Select;

interface AppointmentModalProps {
  open: boolean;
  appointment: Appointment | null; // null → modo creación
  loading: boolean;
  onSubmit: (values: AppointmentCreate | AppointmentUpdate) => Promise<void>;
  onCancel: () => void;
}

export default function AppointmentModal({
  open,
  appointment,
  loading,
  onSubmit,
  onCancel,
}: AppointmentModalProps) {
  const [form] = Form.useForm<AppointmentCreate>();
  const isEditing = appointment?.id != null;

  useEffect(() => {
    if (open && appointment) {
      form.setFieldsValue({
        ...appointment,
        fecha_hora: appointment.fecha_hora
          ? (dayjs(appointment.fecha_hora) as unknown as string)
          : undefined,
      });
    } else if (open) {
      form.resetFields();
      form.setFieldsValue({ estado: "PROGRAMADA", origen: "TEL" } as never);
    }
  }, [open, appointment, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      fecha_hora: values.fecha_hora
        ? dayjs(values.fecha_hora as unknown as dayjs.Dayjs).format("YYYY-MM-DDTHH:mm:ss")
        : undefined,
      notas: values.notas || undefined,
    };
    await onSubmit(payload);
  };

  return (
    <Modal
      title={isEditing ? "Editar cita" : "Nueva cita"}
      open={open}
      width={780}
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
          {isEditing ? "Guardar cambios" : "Crear cita"}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Row gutter={16}>
          <Col span={12}>
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
          <Col span={12}>
            <Item
              label="Profesional"
              name="profesional_id"
              rules={[{ required: true, message: "Selecciona un profesional" }]}
            >
              <Select placeholder="Selecciona un profesional" showSearch optionFilterProp="children">
                {PROFESIONALES.map((p) => (
                  <Option key={p.id} value={p.id}>{p.nombre}</Option>
                ))}
              </Select>
            </Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Item label="Servicio" name="servicio_id">
              <Select placeholder="Selecciona un servicio" allowClear showSearch optionFilterProp="children">
                {SERVICIOS.map((s) => (
                  <Option key={s.id} value={s.id}>{s.nombre}</Option>
                ))}
              </Select>
            </Item>
          </Col>
          <Col span={8}>
            <Item label="Box" name="box_id">
              <Select placeholder="Selecciona un box" allowClear>
                {BOXES.map((b) => (
                  <Option key={b.id} value={b.id}>{b.nombre}</Option>
                ))}
              </Select>
            </Item>
          </Col>
          <Col span={8}>
            <Item
              label="Fecha y hora"
              name="fecha_hora"
              rules={[{ required: true, message: "La fecha y hora son obligatorias" }]}
            >
              <DatePicker
                showTime={{ format: "HH:mm" }}
                format="YYYY-MM-DD HH:mm"
                style={{ width: "100%" }}
                placeholder="Seleccione"
              />
            </Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Item label="Estado" name="estado" rules={[{ required: true, message: "Selecciona un estado" }]}>
              <Select>
                <Option value="PROGRAMADA">Programada</Option>
                <Option value="CONFIRMADA">Confirmada</Option>
                <Option value="EN_SALA">En sala</Option>
                <Option value="ATENDIDA">Atendida</Option>
                <Option value="NO_SHOW">No se presentó</Option>
                <Option value="CANCELADA">Cancelada</Option>
              </Select>
            </Item>
          </Col>
          <Col span={12}>
            <Item label="Origen" name="origen" rules={[{ required: true, message: "Selecciona un origen" }]}>
              <Select>
                <Option value="WEB">Web</Option>
                <Option value="TEL">Teléfono</Option>
                <Option value="WHATSAPP">WhatsApp</Option>
                <Option value="PRESENCIAL">Presencial</Option>
              </Select>
            </Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Item label="Notas" name="notas">
              <TextArea rows={2} placeholder="Observaciones de la cita" />
            </Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
