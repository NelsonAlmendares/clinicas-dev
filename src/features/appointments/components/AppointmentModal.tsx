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

const { Item } = Form;
const { TextArea } = Input;
const { Option } = Select;

interface AppointmentModalProps {
  open: boolean;
  appointment: Appointment | null;   // null → modo creación
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
    }
  }, [open, appointment, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      fecha_nacimiento:
        values.fecha_hora
          ? dayjs(values.fecha_hora as unknown as dayjs.Dayjs).format("YYYY-MM-DD")
          : undefined,
      // Limpiar string vacío en email para no enviar "" a la API
      notas: values.notas || undefined,
    };
    await onSubmit(payload);
  };

  return (
    <Modal
      title={isEditing ? "Editar cita" : "Nueva cita"}
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
          {isEditing ? "Guardar cambios" : "Crear paciente"}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Row gutter={16}>
          <Col span={8}>
            <Item label="Historia" name="historia">
              <Input placeholder="Nº de historia clínica" />
            </Item>
          </Col>
          <Col span={8}>
            <Item
              label="Nombres"
              name="nombres"
              rules={[{ required: true, message: "El nombre es obligatorio" }]}
            >
              <Input placeholder="Nombres" />
            </Item>
          </Col>
          <Col span={8}>
            <Item
              label="Apellidos"
              name="apellidos"
              rules={[{ required: true, message: "El apellido es obligatorio" }]}
            >
              <Input placeholder="Apellidos" />
            </Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Item label="Fecha de nacimiento" name="fecha_nacimiento">
              <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" placeholder="Seleccione" />
            </Item>
          </Col>
          <Col span={8}>
            <Item label="Sexo" name="sexo">
              <Select placeholder="Seleccione">
                <Option value="M">Masculino</Option>
                <Option value="F">Femenino</Option>
                <Option value="O">Otro</Option>
              </Select>
            </Item>
          </Col>
          <Col span={8}>
            <Item label="DPI / NIT" name="dpi_nit">
              <Input placeholder="DPI o NIT" />
            </Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Item label="Teléfono" name="telefono">
              <Input placeholder="Teléfono" />
            </Item>
          </Col>
          <Col span={8}>
            <Item
              label="Email"
              name="email"
              rules={[{ type: "email", message: "Correo inválido" }]}
            >
              <Input placeholder="correo@ejemplo.com" />
            </Item>
          </Col>
          <Col span={8}>
            <Item label="Contacto de emergencia" name="contacto_emergencia">
              <Input placeholder="Nombre y teléfono" />
            </Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Item label="Alergias" name="alergias">
              <TextArea rows={2} placeholder="Alergias conocidas" />
            </Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Item label="Antecedentes médicos" name="antecedentes">
              <TextArea rows={2} placeholder="Antecedentes relevantes" />
            </Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Item label="Medicamentos actuales" name="medicamentos">
              <TextArea rows={2} placeholder="Medicamentos que toma actualmente" />
            </Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
