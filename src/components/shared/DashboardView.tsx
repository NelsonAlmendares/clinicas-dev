"use client";

import { Card, Col, Row, Statistic, Typography } from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

const STATS = [
  { title: "Pacientes",    value: 0, icon: <UserOutlined />,         color: "#1677ff" },
  { title: "Citas hoy",    value: 0, icon: <CalendarOutlined />,     color: "#52c41a" },
  { title: "Facturas",     value: 0, icon: <FileTextOutlined />,     color: "#faad14" },
  { title: "Compras",      value: 0, icon: <ShoppingCartOutlined />, color: "#f5222d" },
];

export default function DashboardView() {
  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        Dashboard
      </Title>

      <Row gutter={[16, 16]}>
        {STATS.map(({ title, value, icon, color }) => (
          <Col xs={24} sm={12} lg={6} key={title}>
            <Card>
              <Statistic
                title={title}
                value={value}
                prefix={
                  <span style={{ color, marginRight: 4, fontSize: 16 }}>{icon}</span>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
