import { motion, AnimatePresence } from "framer-motion";
import { X, Star, MapPin, Building2, Zap, Calendar, Gauge, Hash, Download, Share2 } from "lucide-react";
import { useGrid } from "@/lib/grid-store";
import { useGridData } from "@/lib/grid-source";
import { TECH_HEX, TECH_LABEL, type GridDataset, type PowerPlant, type Substation, type DataCenter } from "@/lib/grid-data";
import { cn } from "@/lib/utils";

function findAsset(data: GridDataset, id: string) {
  return (
    data.plants.find((p) => p.id === id) ||
    data.substations.find((s) => s.id === id) ||
    data.datacenters.find((d) => d.id === id) ||
    data.lines.find((l) => l.id === id) ||
    data.cables.find((c) => c.id === id)
  );
}

export function DetailPanel() {
  const selected = useGrid((s) => s.selected);
  const select = useGrid((s) => s.select);
  const favs = useGrid((s) => s.favorites);
  const toggleFav = useGrid((s) => s.toggleFavorite);
  const { data } = useGridData();

  const asset = selected ? findAsset(data, selected.id) : null;

  return (
    <AnimatePresence>
      {asset && selected && (
        <motion.aside
          key={selected.id}
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 60, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-3 right-3 bottom-3 z-30 w-[420px] max-w-[calc(100vw-1.5rem)] glass-panel rounded-lg shadow-2xl flex flex-col overflow-hidden scanline"
        >
          {/* Header */}
          <div className="px-4 pt-3.5 pb-3 border-b border-[var(--panel-border)]">
            <div className="flex items-center justify-between gap-2">
              <Badge kind={selected.kind} asset={asset} />
              <div className="flex items-center gap-1">
                <IconBtn onClick={() => toggleFav(selected.id)} label="Favorite">
                  <Star className={cn("size-3.5", favs.includes(selected.id) && "fill-primary text-primary")} />
                </IconBtn>
                <IconBtn label="Share"><Share2 className="size-3.5" /></IconBtn>
                <IconBtn label="Export"><Download className="size-3.5" /></IconBtn>
                <IconBtn label="Close" onClick={() => select(null)}><X className="size-3.5" /></IconBtn>
              </div>
            </div>
            <h2 className="mt-2.5 text-[17px] font-semibold tracking-tight leading-snug">
              {("name" in asset ? asset.name : "Asset")}
            </h2>
            <div className="mt-1 mono text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Hash className="size-3" />
              {asset.id}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto thin-scrollbar">
            {selected.kind === "plant" && <PlantBody p={asset as PowerPlant} />}
            {selected.kind === "substation" && <SubBody s={asset as Substation} />}
            {selected.kind === "datacenter" && <DCBody d={asset as DataCenter} />}
            {(selected.kind === "line" || selected.kind === "cable") && <LineBody l={asset as { name: string; voltageKV?: number; capacityTbps?: number; lengthKm?: number; operator?: string; path: [number, number][] }} kind={selected.kind} />}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function Badge({ kind, asset }: { kind: string; asset: unknown }) {
  let color = "#8EC5FF";
  let label = kind.toUpperCase();
  if (kind === "plant") {
    const p = asset as PowerPlant;
    color = TECH_HEX[p.tech];
    label = TECH_LABEL[p.tech];
  } else if (kind === "datacenter") {
    color = TECH_HEX.datacenter;
    label = "Data Center";
  } else if (kind === "line") {
    color = TECH_HEX.transmission;
    label = "Transmission";
  } else if (kind === "cable") {
    color = TECH_HEX.hydrogen;
    label = "Submarine Cable";
  } else if (kind === "substation") {
    color = TECH_HEX.substation;
    label = "Substation";
  }
  return (
    <div className="flex items-center gap-2">
      <span className="size-2 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
      <span className="mono text-[10px] uppercase tracking-[0.2em]" style={{ color }}>{label}</span>
    </div>
  );
}

function IconBtn({ children, onClick, label }: { children: React.ReactNode; onClick?: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="size-7 grid place-items-center rounded-md border border-transparent hover:border-[var(--panel-border)] hover:bg-white/5 text-muted-foreground hover:text-foreground transition"
    >
      {children}
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-4 py-3 border-b border-[var(--panel-border)]">
      <h3 className="mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground mb-2">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-[12px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("mono tabular-nums text-foreground text-right", accent && "text-primary")}>{value}</span>
    </div>
  );
}

function PlantBody({ p }: { p: PowerPlant }) {
  return (
    <>
      <Group title="Overview">
        <Row label="Operator" value={p.operator} />
        <Row label="Country" value={p.country} />
        <Row label="Status" value={<StatusPill s={p.status} />} />
      </Group>
      <Group title="Technical">
        <Row label="Technology" value={TECH_LABEL[p.tech]} />
        <Row label="Capacity" value={`${p.capacityMW.toLocaleString()} MW`} accent />
        <Row label="Commissioning" value={String(p.year)} />
      </Group>
      <Group title="Location">
        <Row label="Latitude" value={p.lat.toFixed(4)} />
        <Row label="Longitude" value={p.lon.toFixed(4)} />
      </Group>
      <Group title="Utilization (last 12 mo)">
        <MiniChart />
      </Group>
    </>
  );
}

function SubBody({ s }: { s: Substation }) {
  return (
    <>
      <Group title="Overview">
        <Row label="Operator" value={s.operator} />
        <Row label="Country" value={s.country} />
      </Group>
      <Group title="Technical">
        <Row label="Voltage" value={`${s.voltageKV} kV`} accent />
        <Row label="Capacity" value={`${s.capacityMVA} MVA`} />
      </Group>
      <Group title="Location">
        <Row label="Latitude" value={s.lat.toFixed(4)} />
        <Row label="Longitude" value={s.lon.toFixed(4)} />
      </Group>
    </>
  );
}

function DCBody({ d }: { d: DataCenter }) {
  return (
    <>
      <Group title="Overview">
        <Row label="Operator" value={d.operator} />
        <Row label="Country" value={d.country} />
        <Row label="Tier" value={d.tier} />
      </Group>
      <Group title="Technical">
        <Row label="IT Power" value={`${d.powerMW} MW`} accent />
        <Row label="PUE (est.)" value={(1.15 + Math.random() * 0.3).toFixed(2)} />
      </Group>
      <Group title="Location">
        <Row label="Latitude" value={d.lat.toFixed(4)} />
        <Row label="Longitude" value={d.lon.toFixed(4)} />
      </Group>
    </>
  );
}

function LineBody({ l, kind }: { l: { name: string; voltageKV?: number; capacityTbps?: number; lengthKm?: number; operator?: string; path: [number, number][] }; kind: string }) {
  return (
    <>
      <Group title="Overview">
        {l.operator && <Row label="Operator" value={l.operator} />}
        <Row label="Vertices" value={String(l.path.length)} />
      </Group>
      <Group title="Technical">
        {kind === "line" ? (
          <>
            <Row label="Voltage" value={`${l.voltageKV} kV`} accent />
            <Row label="Length" value={`${(l.lengthKm ?? 0).toLocaleString()} km`} />
          </>
        ) : (
          <Row label="Capacity" value={`${l.capacityTbps} Tbps`} accent />
        )}
      </Group>
    </>
  );
}

function StatusPill({ s }: { s: string }) {
  const color =
    s === "operational" ? "#58D68D" :
    s === "construction" ? "#FFC857" :
    s === "planned" ? "#00C2FF" : "#6E6E6E";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      <span className="capitalize" style={{ color }}>{s}</span>
    </span>
  );
}

function MiniChart() {
  // deterministic sparkline
  const bars = Array.from({ length: 24 }, (_, i) => 0.4 + 0.4 * Math.sin(i * 0.7) + (i % 3) * 0.08);
  const max = Math.max(...bars);
  return (
    <div className="h-20 flex items-end gap-[3px]">
      {bars.map((b, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-gradient-to-t from-primary/20 to-primary/80"
          style={{ height: `${(b / max) * 100}%`, boxShadow: "0 0 6px rgba(0,240,255,0.3)" }}
        />
      ))}
    </div>
  );
}
