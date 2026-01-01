export default function Home() {
  return (
    <main style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌏 AI 旅遊規劃師</h1>
      <p style={{ color: '#666', fontSize: '1.2rem' }}>地基已經打好，準備開始串接 Gemini AI！</p>
      <div style={{ marginTop: '2rem', padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
        ✅ Vercel 部署環境測試成功
      </div>
    </main>
  );
}
