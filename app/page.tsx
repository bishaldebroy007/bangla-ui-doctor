import { Navbar } from "@/components/layout/Navbar";
import { HeroScanner } from "@/components/scanner/HeroScanner";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroScanner />
      </main>
    </div>
  );
}
