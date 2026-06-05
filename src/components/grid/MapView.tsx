import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MlMap } from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ScatterplotLayer, PathLayer } from "@deck.gl/layers";
import { useGrid } from "@/lib/grid-store";
import { TECH_COLOR, TECH_LABEL, type AnyAsset, type PowerPlant, type Substation, type DataCenter } from "@/lib/grid-data";
import { useGridData } from "@/lib/grid-source";

const BASEMAP =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

type HoverInfo = {
  x: number;
  y: number;
  object: AnyAsset | { name: string; voltageKV?: number; capacityTbps?: number; lengthKm?: number; operator?: string };
  kind: "plant" | "substation" | "datacenter" | "line" | "cable";
} | null;

export function MapView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const hoverRef = useRef<HoverInfo>(null);
  const [hover, setHover] = useState<HoverInfo>(null);
  const [viewSnap, setViewSnap] = useState({ lon: 8, lat: 32, zoom: 2.2 });
  const [mapReady, setMapReady] = useState(false);

  const layers = useGrid((s) => s.layers);
  const enabledTechs = useGrid((s) => s.enabledTechs);
  const search = useGrid((s) => s.search.toLowerCase().trim());
  const capacityRange = useGrid((s) => s.capacityRange);
  const yearRange = useGrid((s) => s.yearRange);
  const select = useGrid((s) => s.select);
  const { data: DATA } = useGridData();

  // Init map once
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!containerRef.current) {
      console.error("[GridAtlas] containerRef is null at init");
      return;
    }
    if (mapRef.current) return;

    const el = containerRef.current;
    const rect = el.getBoundingClientRect();
    console.info("[GridAtlas] init container size:", rect.width, "x", rect.height);
    if (rect.width === 0 || rect.height === 0) {
      console.warn("[GridAtlas] map container has zero dimensions — map will not render until resized");
    }

    const initialView = useGrid.getState().view;

    let map: MlMap;
    try {
      map = new maplibregl.Map({
        container: el,
        style: BASEMAP,
        center: [initialView.longitude, initialView.latitude],
        zoom: initialView.zoom,
        pitch: initialView.pitch,
        bearing: initialView.bearing,
        attributionControl: { compact: true },
      });
      console.info("[GridAtlas] maplibregl.Map instantiated");
    } catch (err) {
      console.error("[GridAtlas] failed to instantiate maplibregl.Map", err);
      return;
    }

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");

    map.on("error", (e) => {
      console.error("[GridAtlas] map error:", e?.error ?? e);
    });

    map.on("load", () => {
      console.info("[GridAtlas] map load event fired");
      // Attach deck.gl overlay AFTER load to avoid IControl race with MapLibre v5
      try {
        const overlay = new MapboxOverlay({ interleaved: false, layers: [] });
        map.addControl(overlay as unknown as maplibregl.IControl);
        overlayRef.current = overlay;
        setMapReady(true);
        console.info("[GridAtlas] deck.gl MapboxOverlay attached");
      } catch (err) {
        console.error("[GridAtlas] failed to attach MapboxOverlay", err);
        // Still mark ready so the map is usable without overlay
        setMapReady(true);
      }
    });

    map.on("move", () => {
      const c = map.getCenter();
      setViewSnap({ lon: c.lng, lat: c.lat, zoom: map.getZoom() });
    });

    mapRef.current = map;

    // Resize observer to handle late layout (Suspense fallback → real mount, panel collapse, etc.)
    const ro = new ResizeObserver(() => {
      try { map.resize(); } catch { /* noop */ }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
  }, []);

  // Update deck layers when filters change (overlay only — not the map itself)
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || !mapReady) return;

    const passText = (s: string) => !search || s.toLowerCase().includes(search);

    const plants = DATA.plants.filter((p) =>
      enabledTechs[p.tech] &&
      p.capacityMW >= capacityRange[0] &&
      p.capacityMW <= capacityRange[1] &&
      p.year >= yearRange[0] && p.year <= yearRange[1] &&
      (passText(p.name) || passText(p.operator) || passText(p.country))
    );
    const subs = DATA.substations.filter((s) =>
      passText(s.name) || passText(s.operator) || passText(s.country)
    );
    const dcs = DATA.datacenters.filter((d) =>
      passText(d.name) || passText(d.operator) || passText(d.country)
    );

    const onHoverFor = (kind: NonNullable<HoverInfo>["kind"]) => (info: any) => {
      if (info.object) {
        const next = { x: info.x, y: info.y, kind, object: info.object } as HoverInfo;
        hoverRef.current = next;
        setHover(next);
      } else if (hoverRef.current?.kind === kind) {
        hoverRef.current = null;
        setHover(null);
      }
    };

    const deckLayers: any[] = [];

    if (layers.cables) {
      deckLayers.push(
        new PathLayer({
          id: "cables",
          data: DATA.cables,
          getPath: (d: any) => d.path,
          getColor: [0, 240, 255, 110],
          getWidth: 1.6,
          widthMinPixels: 1,
          widthMaxPixels: 3,
          pickable: true,
          onHover: onHoverFor("cable"),
          onClick: (info: any) => info.object && select({ id: info.object.id, kind: "cable" }),
        })
      );
    }

    if (layers.transmission) {
      deckLayers.push(
        new PathLayer({
          id: "transmission",
          data: DATA.lines,
          getPath: (d: any) => d.path,
          getColor: (d: any) => {
            const v = d.voltageKV;
            const a = Math.min(220, 90 + v * 0.18);
            return [83, 167, 255, a];
          },
          getWidth: (d: any) => 0.8 + d.voltageKV / 250,
          widthMinPixels: 0.6,
          widthMaxPixels: 4,
          pickable: true,
          onHover: onHoverFor("line"),
          onClick: (info: any) => info.object && select({ id: info.object.id, kind: "line" }),
        })
      );
    }

    if (layers.substations) {
      deckLayers.push(
        new ScatterplotLayer<Substation>({
          id: "substations",
          data: subs,
          getPosition: (d) => [d.lon, d.lat],
          getFillColor: [142, 197, 255, 200],
          getLineColor: [142, 197, 255, 255],
          stroked: true,
          lineWidthMinPixels: 1,
          getRadius: (d) => 800 + d.voltageKV * 4,
          radiusMinPixels: 1.4,
          radiusMaxPixels: 6,
          pickable: true,
          onHover: onHoverFor("substation"),
          onClick: (info) => info.object && select({ id: info.object.id, kind: "substation" }),
        })
      );
    }

    if (layers.plants) {
      deckLayers.push(
        new ScatterplotLayer<PowerPlant>({
          id: "plants",
          data: plants,
          getPosition: (d) => [d.lon, d.lat],
          getFillColor: (d) => {
            const c = TECH_COLOR[d.tech];
            return [c[0], c[1], c[2], d.status === "operational" ? 220 : 130];
          },
          getLineColor: (d) => {
            const c = TECH_COLOR[d.tech];
            return [c[0], c[1], c[2], 255];
          },
          stroked: true,
          lineWidthMinPixels: 0.5,
          getRadius: (d) => 1500 + Math.sqrt(d.capacityMW) * 220,
          radiusMinPixels: 2,
          radiusMaxPixels: 22,
          pickable: true,
          updateTriggers: { getFillColor: [enabledTechs] },
          onHover: onHoverFor("plant"),
          onClick: (info) => info.object && select({ id: info.object.id, kind: "plant" }),
        })
      );
    }

    if (layers.datacenters) {
      deckLayers.push(
        new ScatterplotLayer<DataCenter>({
          id: "datacenters",
          data: dcs,
          getPosition: (d) => [d.lon, d.lat],
          getFillColor: [255, 255, 255, 230],
          getLineColor: [0, 240, 255, 220],
          stroked: true,
          lineWidthMinPixels: 1,
          getRadius: (d) => 1200 + d.powerMW * 30,
          radiusMinPixels: 2,
          radiusMaxPixels: 14,
          pickable: true,
          onHover: onHoverFor("datacenter"),
          onClick: (info) => info.object && select({ id: info.object.id, kind: "datacenter" }),
        })
      );
    }

    overlay.setProps({ layers: deckLayers });
  }, [mapReady, layers, enabledTechs, search, capacityRange, yearRange, select, DATA]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      {/* subtle vignette + grid overlay */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40 mix-blend-overlay" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(7,11,20,0.55) 100%)",
        }}
      />
      {/* Coordinate readout */}
      <div className="pointer-events-none absolute bottom-3 left-3 mono text-[10px] tracking-wider text-muted-foreground glass-pill rounded-md px-2 py-1">
        {viewSnap.lat.toFixed(3)}°, {viewSnap.lon.toFixed(3)}° · Z {viewSnap.zoom.toFixed(2)}
      </div>
      {hover && <Tooltip h={hover} />}
    </div>
  );
}

function Tooltip({ h }: { h: NonNullable<HoverInfo> }) {
  const o = h.object as Record<string, unknown>;
  const title = String(o.name ?? "Asset");
  let badge = "";
  const rows: Array<[string, string]> = [];
  if (h.kind === "plant") {
    const p = o as unknown as PowerPlant;
    badge = TECH_LABEL[p.tech];
    rows.push(["Capacity", `${p.capacityMW.toLocaleString()} MW`]);
    rows.push(["Operator", p.operator]);
    rows.push(["Status", p.status]);
    rows.push(["Year", String(p.year)]);
  } else if (h.kind === "substation") {
    const s = o as unknown as Substation;
    badge = "Substation";
    rows.push(["Voltage", `${s.voltageKV} kV`]);
    rows.push(["Capacity", `${s.capacityMVA} MVA`]);
    rows.push(["Operator", s.operator]);
  } else if (h.kind === "datacenter") {
    const d = o as unknown as DataCenter;
    badge = "Data Center";
    rows.push(["Power", `${d.powerMW} MW`]);
    rows.push(["Tier", d.tier]);
    rows.push(["Operator", d.operator]);
  } else if (h.kind === "line") {
    badge = "Transmission";
    rows.push(["Voltage", `${o.voltageKV} kV`]);
    rows.push(["Length", `${(o.lengthKm as number).toLocaleString()} km`]);
    rows.push(["Operator", String(o.operator)]);
  } else if (h.kind === "cable") {
    badge = "Submarine Cable";
    rows.push(["Capacity", `${o.capacityTbps} Tbps`]);
  }
  return (
    <div
      className="pointer-events-none absolute z-30 glass-panel rounded-md px-3 py-2 text-[11px] shadow-2xl"
      style={{
        left: Math.min(h.x + 14, window.innerWidth - 240),
        top: Math.min(h.y + 14, window.innerHeight - 140),
        minWidth: 200,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium text-foreground truncate max-w-[180px]">{title}</div>
        <span className="mono text-[9px] uppercase tracking-wider text-primary">{badge}</span>
      </div>
      <div className="mt-1.5 space-y-0.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 text-muted-foreground">
            <span>{k}</span>
            <span className="text-foreground mono">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
