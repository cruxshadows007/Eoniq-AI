import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command, Maximize2, Minimize2, Ruler, Clock, Globe2, Download, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { useGrid } from "@/lib/grid-store";
import { useGridData } from "@/lib/grid-source";
import { cn } from "@/lib/utils";

export function TopBar() {
  const presentation = useGrid((s) => s.presentationMode);
  const togglePresentation = useGrid((s) => s.togglePresentation);
  const selected = useGrid((s) => s.selected);
  const setView = useGrid((s) => s.setView);
  const measureMode = useGrid((s) => s.measureMode);
  const toggleMeasure = useGrid((s) => s.toggleMeasure);
  const { data } = useGridData();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "f" || e.key === "F") { e.preventDefault(); setPaletteOpen(true); }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        useGrid.getState().select(null);
      }
      if (e.key === "l" || e.key === "L") {
        useGrid.getState().toggleLeft();
      }
      if (e.key === "m" || e.key === "M") {
        useGrid.getState().toggleMeasure();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const handleGlobe = useCallback(() => {
    setView({ longitude: 8, latitude: 32, zoom: 2.2, pitch: 35, bearing: 0 });
    toast.success("View reset", { description: "Returning to global overview." });
  }, [setView]);

  const handleMeasure = useCallback(() => {
    toggleMeasure();
    toast(measureMode ? "Measure off" : "Measure on", {
      description: measureMode ? "Measurement tool disabled." : "Click two points on the map to measure distance.",
    });
  }, [toggleMeasure, measureMode]);

  const handleExport = useCallback(() => {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        counts: {
          plants: data.plants.length,
          substations: data.substations.length,
          datacenters: data.datacenters.length,
          lines: data.lines.length,
          cables: data.cables.length,
        },
        data,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gridatlas-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Export ready", { description: "Snapshot downloaded as JSON." });
    } catch (e) {
      toast.error("Export failed", { description: e instanceof Error ? e.message : String(e) });
    }
  }, [data]);

  return (
    <>
      <div className={cn(
        "absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 transition-opacity",
        presentation && "opacity-0 pointer-events-none"
      )}>
        <button
          onClick={() => setPaletteOpen(true)}
          className="glass-pill rounded-md h-9 pl-3 pr-2 flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition group min-w-[360px]"
        >
          <Search className="size-3.5" />
          <span className="flex-1 text-left">Search the global grid…</span>
          <kbd className="mono text-[9px] border border-[var(--panel-border)] rounded px-1.5 py-0.5 flex items-center gap-0.5">
            <Command className="size-2.5" />F
          </kbd>
        </button>
      </div>

      {/* Top-right utility cluster */}
      <div className={cn(
        "absolute top-3 right-3 z-40 flex items-center gap-2 transition-[margin,opacity] duration-300",
        presentation && "opacity-0 pointer-events-none"
      )}
        style={{ marginRight: selected ? 432 : 0 }}>
        <ToolBtn icon={Ruler} label="Measure" shortcut="M" onClick={handleMeasure} active={measureMode} />
        <ToolBtn icon={Globe2} label="Globe" onClick={handleGlobe} />
        <ToolBtn icon={Download} label="Export" onClick={handleExport} />
        <ToolBtn
          icon={presentation ? Minimize2 : Maximize2}
          label={presentation ? "Exit Presentation" : "Presentation"}
          onClick={togglePresentation}
        />
      </div>

      {/* Timeline */}
      <Timeline hidden={presentation} />

      {/* Presentation mode escape hint */}
      {presentation && (
        <button
          onClick={togglePresentation}
          className="absolute top-3 right-3 z-30 glass-pill rounded-md px-3 h-8 text-[11px] flex items-center gap-2"
        >
          <Minimize2 className="size-3" />
          Exit Presentation · ESC
        </button>
      )}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}

function ToolBtn({ icon: Icon, label, shortcut, onClick, active }: { icon: React.ComponentType<{ className?: string }>; label: string; shortcut?: string; onClick?: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "glass-pill rounded-md h-9 px-2.5 flex items-center gap-1.5 text-[11px] hover:text-foreground hover:border-primary/40 transition group",
        active ? "text-primary border-primary/60" : "text-muted-foreground"
      )}
    >
      <Icon className="size-3.5" />
      <span className="hidden md:inline">{label}</span>
      {shortcut && (
        <kbd className="mono text-[9px] border border-[var(--panel-border)] rounded px-1 py-0.5">{shortcut}</kbd>
      )}
    </button>
  );
}

function Timeline({ hidden }: { hidden: boolean }) {
  const [year, setYear] = useState(2024);
  const [playing, setPlaying] = useState(false);
  const yearRange = useGrid((s) => s.yearRange);
  const setYearRange = useGrid((s) => s.setYearRange);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setYear((y) => {
        const next = y >= 2030 ? 1970 : y + 1;
        setYearRange([1970, next]);
        return next;
      });
    }, 180);
    return () => clearInterval(t);
  }, [playing, setYearRange]);

  if (hidden) return null;

  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-3 z-20"
      style={{ marginRight: 0 }}
    >
      <div className="glass-panel rounded-lg px-3 py-2 flex items-center gap-3 min-w-[520px] shadow-2xl">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="size-7 grid place-items-center rounded-md bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary"
        >
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        </button>
        <Clock className="size-3.5 text-muted-foreground shrink-0" />
        <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">Timeline</div>

        <div className="relative flex-1 h-6 flex items-center">
          <div className="absolute inset-x-0 h-px bg-[var(--panel-border)]" />
          <div
            className="absolute h-px bg-primary"
            style={{
              left: `${((1970 - 1970) / 60) * 100}%`,
              right: `${100 - ((year - 1970) / 60) * 100}%`,
              boxShadow: "0 0 6px rgba(0,240,255,0.6)",
            }}
          />
          {[1980, 1990, 2000, 2010, 2020, 2030].map((y) => (
            <div
              key={y}
              className="absolute -translate-x-1/2 flex flex-col items-center gap-1"
              style={{ left: `${((y - 1970) / 60) * 100}%` }}
            >
              <div className="w-px h-2 bg-[var(--panel-border)]" />
              <div className="mono text-[9px] text-muted-foreground">{y}</div>
            </div>
          ))}
          <input
            type="range" min={1970} max={2030} value={year}
            onChange={(e) => { const v = Number(e.target.value); setYear(v); setYearRange([1970, v]); }}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
          <div
            className="absolute size-3 rounded-full bg-primary ring-2 ring-primary/30 -translate-x-1/2"
            style={{ left: `${((year - 1970) / 60) * 100}%`, boxShadow: "0 0 12px rgba(0,240,255,0.8)" }}
          />
        </div>

        <div className="mono text-[12px] text-primary tabular-nums w-12 text-right">{year}</div>
      </div>
    </div>
  );
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const select = useGrid((s) => s.select);
  const setSearch = useGrid((s) => s.setSearch);
  const { data } = useGridData();

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const term = q.toLowerCase();
    const all = [
      ...data.plants.map((p) => ({ ...p, kind: "plant" as const })),
      ...data.substations.map((s) => ({ ...s, kind: "substation" as const })),
      ...data.datacenters.map((d) => ({ ...d, kind: "datacenter" as const })),
    ];
    return all
      .filter((a) =>
        a.name.toLowerCase().includes(term) ||
        ("operator" in a && a.operator?.toLowerCase().includes(term)) ||
        ("country" in a && a.country?.toLowerCase().includes(term))
      )
      .slice(0, 20);
  }, [q, data]);

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-start pt-[12vh] bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -10, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="w-[640px] max-w-[92vw] mx-auto glass-panel rounded-xl shadow-2xl overflow-hidden ring-glow"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-3.5 h-12 border-b border-[var(--panel-border)]">
              <Search className="size-4 text-primary" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search plants, operators, data centers, countries…"
                className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-muted-foreground"
              />
              <kbd className="mono text-[10px] text-muted-foreground border border-[var(--panel-border)] rounded px-1.5 py-0.5">ESC</kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto thin-scrollbar">
              {results.length === 0 ? (
                <div className="px-4 py-10 text-center text-[12px] text-muted-foreground">
                  {q ? "No assets matched your query." : "Start typing to search the global infrastructure index."}
                </div>
              ) : (
                <ul>
                  {results.map((r) => (
                    <li key={r.id}>
                      <button
                        onClick={() => { select({ id: r.id, kind: r.kind }); setSearch(""); onClose(); }}
                        className="w-full px-3.5 py-2 flex items-center gap-3 text-[12px] hover:bg-white/[0.04] text-left"
                      >
                        <span className="mono text-[9px] uppercase tracking-wider text-primary w-20 shrink-0">{r.kind}</span>
                        <span className="flex-1 truncate">{r.name}</span>
                        <span className="mono text-[10px] text-muted-foreground">{("operator" in r) ? r.operator : ""}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
