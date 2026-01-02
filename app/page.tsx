import TravelForm from "@/components/TravelForm";

export default function TravelPage() {
  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-blue-600 mb-2">AI 旅遊規劃師</h1>
          <p className="text-gray-500">專屬行程，即刻生成</p>
        </div>
        <TravelForm />
      </div>
    </main>
  );
}
