export const metadata = {
  title: 'AI 旅遊規劃師',
  description: '你的專屬旅遊助手',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  )
}
