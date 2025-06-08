import "./globals.css";
import type { Metadata, Viewport } from "next";
import BottomNav from "@/components/navigation/BottomNav";
import TopNav from "@/components/navigation/TopNav";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Pals Bot 2.0 - 漂流瓶",
  description: "Telegram 漂流瓶 Mini App",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "漂流瓶",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // 支持 iPhone X 系列的刘海屏
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
        {/* PWA 相关 */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0ea5e9" />
        {/* iOS Safari 优化 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-touch-fullscreen" content="yes" />
      </head>
      <body className="font-sans overflow-x-hidden">
        <div className="pals tg-app safe-area-container">
          <TopNav />
          <main className="pals-container safe-area-main">{children}</main>
          <BottomNav />
        </div>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
