import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pals Bot 2.0 - 漂流瓶",
  description: "Telegram 漂流瓶 Mini App",
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
      </head>
      <body className="font-sans">
        <div className="tg-app">{children}</div>
      </body>
    </html>
  );
}
