import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Search, Layers, Filter, Star, Activity,
  Sun, Wind, Waves, Droplets, Atom, Flame, Factory, Cylinder, Leaf,
  Mountain, Battery, Server, Zap, Cable, Settings, Eye, EyeOff,
} from "lucide-react";
import { useGrid } from "@/lib/grid-store";
import { useGridData } from "@/lib/grid-source";
import { TECH_HEX, TECH_LABEL } from "@/lib/grid-data";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const TECH_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  solar: Sun, wind: Wind, offshore: Waves, hydro: Droplets, nuclear: Atom,
  gas: Flame, coal: Factory, oil: Cylinder, biomass: Leaf, geothermal: Mountain,
  storage: Battery,
};

type LayerMeta = {
  id: "plants" | "substations" | "transmission" | "datacenters" | "cables";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

const LAYER_META: LayerMeta[] = [
  { id: "plants", label: "Power Plants", icon: Zap, color: TECH_HEX.solar },
  { id: "substations", label: "Substations", icon: Activity, color: TECH_HEX.substation },
  { id: "transmission", label: "Transmission", icon: Cable, color: TECH_HEX.transmission },
  { id: "datacenters", label: "Data Centers", icon: Server, color: TECH_HEX.datacenter },
  { id: "cables", label: "Submarine Cables", icon: Waves, color: TECH_HEX.hydrogen },
];

export function LeftPanel() {
  const collapsed = useGrid((s) => s.leftCollapsed);
  const toggle = useGrid((s) => s.toggleLeft);
  const search = useGrid((s) => s.search);
  const setSearch = useGrid((s) => s.setSearch);
  const layers = useGrid((s) => s.layers);
  const toggleLayer = useGrid((s) => s.toggleLayer);
  const enabledTechs = useGrid((s) => s.enabledTechs);
  const toggleTech = useGrid((s) => s.toggleTech);
  const setAllTechs = useGrid((s) => s.setAllTechs);
  const capacityRange = useGrid((s) => s.capacityRange);
  const setCapacityRange = useGrid((s) => s.setCapacityRange);
  const yearRange = useGrid((s) => s.yearRange);
  const setYearRange = useGrid((s) => s.setYearRange);
  const favorites = useGrid((s) => s.favorites);
  const { data } = useGridData();

  // Apply same filters as MapView so telemetry reflects the visible subset
  const q = search.toLowerCase().trim();
  const passText = (s: string) => !q || s.toLowerCase().includes(q);

  const fPlants = data.plants.filter((p) =>
    enabledTechs[p.tech] &&
    p.capacityMW >= capacityRange[0] && p.capacityMW <= capacityRange[1] &&
    p.year >= yearRange[0] && p.year <= yearRange[1] &&
    (passText(p.name) || passText(p.operator) || passText(p.country))
  );
  const fSubs = data.substations.filter((s) =>
    passText(s.name) || passText(s.operator) || passText(s.country)
  );
  const fDcs = data.datacenters.filter((d) =>
    passText(d.name) || passText(d.operator) || passText(d.country)
  );
  const fLines = layers.transmission ? data.lines : [];
  const fCables = layers.cables ? data.cables : [];

  const visPlants = layers.plants ? fPlants : [];
  const visSubs = layers.substations ? fSubs : [];
  const visDcs = layers.datacenters ? fDcs : [];

  const TOTALS = {
    assets: visPlants.length + visSubs.length + visDcs.length,
    capacityGW: Math.round(visPlants.reduce((s, p) => s + p.capacityMW, 0) / 1000),
    countries: new Set([
      ...visPlants.map((p) => p.country),
      ...visSubs.map((s) => s.country),
      ...visDcs.map((d) => d.country),
    ]).size,
    operators: new Set([
      ...visPlants.map((p) => p.operator),
      ...visSubs.map((s) => s.operator),
      ...visDcs.map((d) => d.operator),
    ]).size,
    transmissionKm: fLines.reduce((s, l) => s + l.lengthKm, 0),
    datacenters: visDcs.length,
  };

  const LAYER_COUNTS: Record<LayerMeta["id"], number> = {
    plants: fPlants.length,
    substations: fSubs.length,
    transmission: fLines.length,
    datacenters: fDcs.length,
    cables: fCables.length,
  };
  const LAYERS = LAYER_META.map((l) => ({ ...l, count: LAYER_COUNTS[l.id] }));

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 56 : 380 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-20 h-full glass-panel border-r flex flex-col shrink-0"
    >
      {/* Header / brand */}
      <div className="flex items-center gap-3 px-3 h-14 border-b border-[var(--panel-border)]">
        <div className="relative shrink-0 size-9 rounded-md bg-gradient-to-br from-[#00F0FF]/30 to-[#7B61FF]/20 ring-glow flex items-center justify-center">
          <div className="absolute inset-0 rounded-md opacity-60" style={{
            background: "conic-gradient(from 0deg, transparent, rgba(0,240,255,0.6), transparent)"
          }} />
          <Zap className="size-4 text-primary text-glow-primary relative" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold tracking-tight text-glow-primary">EONIQ</div>
            <div className="mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              AI Powered Energy Intelligence Platform
            </div>
          </div>
        )}
        <button
          onClick={toggle}
          className="size-7 grid place-items-center rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground transition"
          aria-label="Toggle panel"
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>

      {collapsed ? (
        <div className="flex-1 flex flex-col items-center py-3 gap-2">
          {[Search, Layers, Filter, Star, Settings].map((Icon, i) => (
            <button key={i} className="size-9 grid place-items-center rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground transition">
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto thin-scrollbar">
          {/* Search */}
          <div className="px-3 pt-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search plants, operators, countries…"
                className="w-full h-9 pl-8 pr-12 rounded-md bg-[rgba(255,255,255,0.04)] border border-[var(--panel-border)] text-[12px] placeholder:text-muted-foreground/70 outline-none focus:border-primary/60 focus:ring-glow transition"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 mono text-[9px] text-muted-foreground border border-[var(--panel-border)] rounded px-1 py-0.5">F</kbd>
            </div>
          </div>

          {/* Stats */}
          <Section title="System Telemetry" icon={Activity}>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Total Assets" value={fmt(TOTALS.assets)} />
              <Stat label="Capacity" value={`${fmtNum(TOTALS.capacityGW)} GW`} accent />
              <Stat label="Countries" value={String(TOTALS.countries)} />
              <Stat label="Operators" value={String(TOTALS.operators)} />
              <Stat label="Transmission" value={`${(TOTALS.transmissionKm / 1000).toFixed(1)}k km`} />
              <Stat label="Data Centers" value={String(TOTALS.datacenters)} />
            </div>
          </Section>

          {/* Layers */}
          <Section title="Layers" icon={Layers}>
            <ul className="space-y-1">
              {LAYERS.map((l) => {
                const Icon = l.icon;
                const on = layers[l.id];
                return (
                  <li key={l.id}>
                    <button
                      onClick={() => toggleLayer(l.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2 py-2 rounded-md border text-left transition group",
                        on
                          ? "bg-white/[0.03] border-[var(--panel-border)] hover:bg-white/[0.05]"
                          : "bg-transparent border-transparent opacity-55 hover:opacity-80"
                      )}
                    >
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ background: l.color, boxShadow: on ? `0 0 10px ${l.color}` : "none" }}
                      />
                      <Icon className="size-3.5 text-muted-foreground group-hover:text-foreground" />
                      <span className="text-[12px] flex-1">{l.label}</span>
                      <span className="mono text-[10px] text-muted-foreground">{fmt(l.count)}</span>
                      {on ? <Eye className="size-3.5 text-primary/80" /> : <EyeOff className="size-3.5 text-muted-foreground" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Section>

          {/* Technology filter */}
          <Section
            title="Generation Mix"
            icon={Filter}
            right={
              <div className="flex gap-1">
                <MiniBtn onClick={() => setAllTechs(true)}>All</MiniBtn>
                <MiniBtn onClick={() => setAllTechs(false)}>None</MiniBtn>
              </div>
            }
          >
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(enabledTechs).map(([t, on]) => {
                const Icon = TECH_ICONS[t] ?? Zap;
                return (
                  <button
                    key={t}
                    onClick={() => toggleTech(t as never)}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md border text-[11px] transition",
                      on
                        ? "border-[var(--panel-border)] bg-white/[0.03]"
                        : "border-transparent bg-transparent opacity-45 hover:opacity-70"
                    )}
                  >
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ background: TECH_HEX[t], boxShadow: on ? `0 0 8px ${TECH_HEX[t]}` : "none" }}
                    />
                    <Icon className="size-3 text-muted-foreground" />
                    <span className="truncate">{TECH_LABEL[t]}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Sliders */}
          <Section title="Advanced Filters" icon={Filter}>
            <div className="space-y-4">
              <RangeBlock
                label="Capacity"
                unit="MW"
                value={capacityRange}
                onChange={(v) => setCapacityRange(v as [number, number])}
                min={0}
                max={2500}
                step={50}
              />
              <RangeBlock
                label="Commissioning"
                unit=""
                value={yearRange}
                onChange={(v) => setYearRange(v as [number, number])}
                min={1970}
                max={2030}
                step={1}
              />
            </div>
          </Section>

          {/* Favorites */}
          <Section title="Favorites" icon={Star} right={<span className="mono text-[10px] text-muted-foreground">{favorites.length}</span>}>
            {favorites.length === 0 ? (
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Star any asset from its detail panel to pin it here for quick access.
              </p>
            ) : (
              <FavoritesList ids={favorites} />
            )}
          </Section>

          {/* Footer */}
          <div className="px-3 py-4 mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400 pulse-dot" />
              Live · v1.0
            </span>
            <span>WebGL · Vector Tiles</span>
          </div>
        </div>
      )}
    </motion.aside>
  );
}

function Section({
  title, icon: Icon, children, right,
}: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="px-3 pt-4">
      <header className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon className="size-3 text-primary/70" />
          <h3 className="mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">{title}</h3>
        </div>
        {right}
      </header>
      {children}
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-[var(--panel-border)] bg-white/[0.02] px-2.5 py-2">
      <div className="mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-[15px] font-semibold tabular-nums", accent && "text-primary text-glow-primary")}>{value}</div>
    </div>
  );
}

function MiniBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mono text-[9px] uppercase tracking-wider text-muted-foreground hover:text-foreground border border-[var(--panel-border)] rounded px-1.5 py-0.5 hover:bg-white/5 transition"
    >
      {children}
    </button>
  );
}

function RangeBlock({
  label, unit, value, onChange, min, max, step,
}: { label: string; unit: string; value: [number, number]; onChange: (v: number[]) => void; min: number; max: number; step: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="mono text-foreground">{value[0]}{unit && ` ${unit}`} – {value[1]}{unit && ` ${unit}`}</span>
      </div>
      <Slider value={value} onValueChange={onChange} min={min} max={max} step={step} />
    </div>
  );
}

function FavoritesList({ ids }: { ids: string[] }) {
  const { data } = useGridData();
  const all = [...data.plants, ...data.substations, ...data.datacenters];
  const items = ids.map((id) => all.find((a) => a.id === id)).filter(Boolean) as typeof all;
  const select = useGrid((s) => s.select);
  return (
    <ul className="space-y-1">
      {items.map((a) => (
        <li key={a.id}>
          <button
            onClick={() => select({ id: a.id, kind: a.kind })}
            className="w-full text-left px-2 py-1.5 rounded border border-[var(--panel-border)] bg-white/[0.02] hover:bg-white/[0.05] text-[11px] truncate"
          >
            {a.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

function fmtNum(n: number) {
  // Locale-stable thousands separator (avoid SSR/CSR hydration mismatch from toLocaleString)
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return fmtNum(n);
}
