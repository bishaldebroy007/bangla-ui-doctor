import { Suspense } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ReportWorkspace } from "@/components/report/ReportWorkspace";

export default function ScanReportPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Navbar />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl px-4 py-16 text-center font-mono text-sm text-slate-400">
              Loading diagnostic telemetry...
            </div>
          }
        >
          <ReportWorkspace />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
