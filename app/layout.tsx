// 這裡必須是第一行，確保路徑正確指向同一個資料夾下的 globals.css
import "./globals.css"; 

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      {/* 這裡必須有 body 標籤包裹 children */}
      <body className="antialiased">{children}</body>
    </html>
  );
}
