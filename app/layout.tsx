import type { Metadata } from "next";
import "./globals.css"; // 👈 這行絕對不能少！

export const metadata: Metadata = {
  title: "AI 旅遊規劃師",
  description: "您的專屬行程助手",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
