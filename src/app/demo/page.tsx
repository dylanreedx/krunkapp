import { LandingScene } from "@/components/landing/landing-scene";

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-gray-950 p-8">
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[24px] border-3 border-black">
        <LandingScene className="aspect-[3/2]" />
      </div>
    </main>
  );
}
