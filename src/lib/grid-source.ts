// GridAtlas data-source layer.
//
// Visualization components never import data directly — they call `useGridData()`,
// which is fed by a pluggable `GridDataSource`. The default implementation reads
// static GeoJSON files from `/public/data/`, but the interface allows swapping in
// remote API endpoints (REST, tile server, PostGIS-backed service) later without
// touching the components.

import { useEffect } from "react";
import { create } from "zustand";
import {
  EMPTY_DATASET,
  EMPTY_TOTALS,
  type GridDataset,
  type GridTotals,
  type PowerPlant,
  type Substation,
  type DataCenter,
  type TransmissionLine,
  type SubmarineCable,
} from "./grid-data";

// ----- GeoJSON minimal shape -----
type Pt = { type: "Point"; coordinates: [number, number] };
type Ln = { type: "LineString"; coordinates: [number, number][] };
interface Feature<G, P> { type: "Feature"; geometry: G; properties: P }
interface FC<G, P> { type: "FeatureCollection"; features: Feature<G, P>[] }

// ----- DataSource contract -----
export interface GridDataSource {
  loadPlants(): Promise<PowerPlant[]>;
  loadSubstations(): Promise<Substation[]>;
  loadDatacenters(): Promise<DataCenter[]>;
  loadTransmissionLines(): Promise<TransmissionLine[]>;
  loadSubmarineCables(): Promise<SubmarineCable[]>;
}

// ----- Default implementation: static GeoJSON over fetch() -----

export interface GeoJsonSourceConfig {
  plants?: string;
  substations?: string;
  datacenters?: string;
  transmissionLines?: string;
  submarineCables?: string;
}

const DEFAULT_PATHS: Required<GeoJsonSourceConfig> = {
  plants: "/data/power-plants.geojson",
  substations: "/data/substations.geojson",
  datacenters: "/data/datacenters.geojson",
  transmissionLines: "/data/transmission-lines.geojson",
  submarineCables: "/data/submarine-cables.geojson",
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  return (await res.json()) as T;
}

export class GeoJsonDataSource implements GridDataSource {
  private cfg: Required<GeoJsonSourceConfig>;
  constructor(cfg: GeoJsonSourceConfig = {}) {
    this.cfg = { ...DEFAULT_PATHS, ...cfg };
  }

  async loadPlants() {
    const fc = await fetchJson<FC<Pt, Omit<PowerPlant, "lon" | "lat">>>(this.cfg.plants);
    return fc.features.map((f) => ({
      ...f.properties,
      lon: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
    })) as PowerPlant[];
  }
  async loadSubstations() {
    const fc = await fetchJson<FC<Pt, Omit<Substation, "lon" | "lat">>>(this.cfg.substations);
    return fc.features.map((f) => ({
      ...f.properties,
      lon: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
    })) as Substation[];
  }
  async loadDatacenters() {
    const fc = await fetchJson<FC<Pt, Omit<DataCenter, "lon" | "lat">>>(this.cfg.datacenters);
    return fc.features.map((f) => ({
      ...f.properties,
      lon: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
    })) as DataCenter[];
  }
  async loadTransmissionLines() {
    const fc = await fetchJson<FC<Ln, Omit<TransmissionLine, "path">>>(this.cfg.transmissionLines);
    return fc.features.map((f) => ({
      ...f.properties,
      path: f.geometry.coordinates as [number, number][],
    })) as TransmissionLine[];
  }
  async loadSubmarineCables() {
    const fc = await fetchJson<FC<Ln, Omit<SubmarineCable, "path">>>(this.cfg.submarineCables);
    return fc.features.map((f) => ({
      ...f.properties,
      path: f.geometry.coordinates as [number, number][],
    })) as SubmarineCable[];
  }
}

// ----- Reactive store backed by the source -----

interface GridDataState {
  ready: boolean;
  loading: boolean;
  error: string | null;
  data: GridDataset;
  totals: GridTotals;
  load: (source?: GridDataSource) => Promise<void>;
}

function computeTotals(d: GridDataset): GridTotals {
  return {
    assets: d.plants.length + d.substations.length + d.datacenters.length,
    capacityGW: Math.round(d.plants.reduce((s, p) => s + p.capacityMW, 0) / 1000),
    countries: new Set(d.plants.map((p) => p.country)).size,
    operators: new Set([
      ...d.plants.map((p) => p.operator),
      ...d.substations.map((s) => s.operator),
    ]).size,
    transmissionKm: d.lines.reduce((s, l) => s + l.lengthKm, 0),
    datacenters: d.datacenters.length,
  };
}

let defaultSource: GridDataSource = new GeoJsonDataSource();
export function setDefaultGridSource(src: GridDataSource) {
  defaultSource = src;
}

const useGridDataStore = create<GridDataState>((set, get) => ({
  ready: false,
  loading: false,
  error: null,
  data: EMPTY_DATASET,
  totals: EMPTY_TOTALS,
  load: async (source) => {
    if (get().ready || get().loading) return;
    const src = source ?? defaultSource;
    set({ loading: true, error: null });
    try {
      const [plants, substations, datacenters, lines, cables] = await Promise.all([
        src.loadPlants(),
        src.loadSubstations(),
        src.loadDatacenters(),
        src.loadTransmissionLines(),
        src.loadSubmarineCables(),
      ]);
      const data: GridDataset = { plants, substations, datacenters, lines, cables };
      set({ data, totals: computeTotals(data), ready: true, loading: false });
    } catch (e) {
      console.error("[GridAtlas] data load failed", e);
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },
}));

// Public hook — components subscribe to this and re-render once data lands.
export function useGridData() {
  const state = useGridDataStore();
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!state.ready && !state.loading) {
      void state.load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}

// Non-reactive accessor (useful inside event handlers / one-off lookups).
export const getGridSnapshot = () => useGridDataStore.getState();
