"use client";

import { ConfigProvider } from "antd";
import esES from "antd/locale/es_ES";
import "antd/dist/reset.css";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={esES}
      theme={{
        token: {
          borderRadius: 8,
          colorPrimary: "#1677ff",
        },
        components: {
          Layout: {
            siderBg: "#001529",
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
