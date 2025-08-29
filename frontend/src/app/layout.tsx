// import type { Metadata } from "next";
import "@ant-design/v5-patch-for-react-19";
import "@/app/globals.css";
// import "@/app/antd.css"
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
// import GlobalApp from "@/components/GlobalApp";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  console.log("layout rendering")
  return (
    <html lang="en">
      <body className="antialiased" style={{ margin: 0 }}> 
        <AntdRegistry>
          <ConfigProvider
            theme={{
              components: {
                Slider: {
                  railBg: "rgba(233, 233, 233, 1)",
                  railHoverBg: "rgba(227, 227, 227, 1)",
                },
              },
            }}
          >
            <App>
              {/* <GlobalApp> */}
                {children}
              {/* </GlobalApp> */}
            </App>
          </ConfigProvider>
        </AntdRegistry>
        {/* {children} */}
      </body>
    </html>
  );
}
