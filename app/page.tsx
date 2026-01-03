import TravelForm from "../components/TravelForm";

export default function TravelPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-slate-900 mb-4">
            AI 旅遊規劃師
          </h1>
          <p className="text-slate-500 text-lg">
            讓人工智慧為您打造下一段難忘的旅程
          </p>
        </div>
        <TravelForm />
      </div>
    </main>
  );
}
