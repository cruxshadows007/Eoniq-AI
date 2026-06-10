import { useGrid } from "@/lib/grid-store";
import { cn } from "@/lib/utils";

// Lightweight world bounds for orientation
const WORLD = { minLon: -180, maxLon: 180, minLat: -60, maxLat: 75 };

// Simulated land outlines via dot grid (super cheap)
const DOTS = generateLandDots();

export function MiniMap() {
  // Hooks must run unconditionally before any early return to keep React's
  // hook order stable across renders (toggling presentation mode would
  // otherwise trip "Rendered fewer hooks than expected").
  const presentation = useGrid((s) => s.presentationMode);
  const view = useGrid((s) => s.view);
  if (presentation) return null;

  const cx = lonToX(view.longitude);
  const cy = latToY(view.latitude);

  return (
    <div className="absolute bottom-3 right-3 z-20">
      <div className="glass-panel rounded-md p-2 shadow-2xl">
        <div className="mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1 px-0.5">Overview</div>
        <div className="relative w-[200px] h-[110px] rounded overflow-hidden bg-[#050811] border border-[var(--panel-border)]">
          <svg viewBox="0 0 200 110" className="absolute inset-0">
            {DOTS.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={0.7} fill="#3a6ea5" opacity={0.85} />
            ))}
            <rect x={cx - 14} y={cy - 9} width={28} height={18} fill="none" stroke="#00F0FF" strokeWidth={0.8} opacity={0.8} />
            <circle cx={cx} cy={cy} r={1.5} fill="#00F0FF" />
          </svg>
          <div className={cn("absolute inset-0 pointer-events-none grid-bg opacity-25")} />
        </div>
      </div>
    </div>
  );
}

function lonToX(lon: number) {
  return ((lon - WORLD.minLon) / (WORLD.maxLon - WORLD.minLon)) * 200;
}
function latToY(lat: number) {
  return 110 - ((lat - WORLD.minLat) / (WORLD.maxLat - WORLD.minLat)) * 110;
}

// Rough continental footprint via parametric blobs
function generateLandDots(): Array<[number, number]> {
  const continents = [
    // [centerLon, centerLat, rLon, rLat]
    [-100, 45, 40, 22], // NA
    [-60, -15, 18, 28], // SA
    [15, 50, 22, 18],   // EU
    [20, 5, 25, 30],    // Africa
    [85, 35, 38, 22],   // Asia
    [135, -25, 16, 12], // Australia
  ];
  const dots: Array<[number, number]> = [];
  for (let lon = -180; lon <= 180; lon += 3) {
    for (let lat = -60; lat <= 75; lat += 3) {
      for (const [clon, clat, rlon, rlat] of continents) {
        const dx = (lon - clon) / rlon;
        const dy = (lat - clat) / rlat;
        if (dx * dx + dy * dy < 1 + (Math.sin(lon * 0.3) + Math.cos(lat * 0.4)) * 0.04) {
          dots.push([lonToX(lon), latToY(lat)]);
          break;
        }
      }
    }
  }
  return dots;
}
