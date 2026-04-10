"use client";

import { Empty } from "antd";

interface ComingSoonProps {
  title: string;
}

export default function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div style={{ padding: 40 }}>
      <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 32 }}>{title}</h2>
      <Empty description="Módulo en desarrollo" />
    </div>
  );
}
