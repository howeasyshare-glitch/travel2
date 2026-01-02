import TravelForm from "@/components/TravelForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            🌏 AI 旅遊規劃師
          </h1>
          <p className="text-lg text-slate-500">
            您的私人導遊，只需幾秒鐘即可為您量身打造完美行程。
          </p>
        </div>
        
        <TravelForm />
        
        <footer className="mt-12 text-center text-slate-400 text-sm italic">
          Powered by Gemini AI
        </footer>
      </div>
    </main>
  );
}
