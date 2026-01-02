import TravelForm from "@/components/TravelForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            AI 旅遊規劃師
          </h1>
          <p className="text-lg text-slate-500">
            您的私人導遊，只需幾秒鐘即可為您量身打造完美行程。
          </p>
        </div>
        
        <TravelForm />
      </div>
    </div>
  );
}

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
