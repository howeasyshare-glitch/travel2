import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      {/* 樣式會透過 import "./globals.css" 被 Next.js 自動注入到 head 中 */}
      <body>{children}</body>
    </html>
  );
}
