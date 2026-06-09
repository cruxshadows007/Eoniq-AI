import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { LeftPanel } from "@/components/grid/LeftPanel";
import { TopBar } from "@/components/grid/TopBar";
import { DetailPanel } from "@/components/grid/DetailPanel";
import { MiniMap } from "@/components/grid/MiniMap";
import { Toaster } from "@/components/ui/sonner";

const MapView = lazy(() => import("@/components/grid/MapView").then((m) => ({ default: m.MapView })));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GridAtlas — Global Infrastructure Intelligence" },
      { name: "description", content: "Explore the world's energy, electrical, industrial and digital infrastructure on a premium interactive 3D map." },
      { property: "og:title", content: "GridAtlas — Global Infrastructure Intelligence" },
      { property: "og:description", content: "Explore the world's energy, electrical, industrial and digital infrastructure on a premium interactive 3D map." },
    ],
  }),
  component: GridAtlasPage,
});

function GridAtlasPage() {
  return (
    <div className="dark relative h-screen w-screen flex bg-background text-foreground overflow-hidden">
      <LeftPanel />
      <main className="relative flex-1 h-full">
        <Suspense fallback={<MapLoading />}>
          <MapView />
        </Suspense>
        <TopBar />
        <DetailPanel />
        <MiniMap />
      </main>
      <Toaster />
    </div>
  );
}

function MapLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-background grid-bg">
      <div className="text-center">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-primary text-glow-primary animate-pulse">
          Loading global grid…
        </div>
        <div className="mt-3 mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          Initializing WebGL · Vector Tiles · Spatial Index
        </div>
      </div>
    </div>
  );
}
