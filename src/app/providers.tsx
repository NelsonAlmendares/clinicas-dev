"use client";

import { App, ConfigProvider, theme } from "antd";
import esES from "antd/locale/es_ES";
import "antd/dist/reset.css";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={esES}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 14,
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
        components: {
          Card: {
            headerFontSize: 16,
          },
          Menu: {
            itemBorderRadius: 12,
            itemSelectedBg: "#eef6ff",
            itemSelectedColor: "#1677ff",
          },
          Table: {
            headerBg: "#f8fafc",
            headerColor: "#475569",
            rowHoverBg: "#f4f8ff",
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
