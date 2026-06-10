import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TechType } from "./grid-data";

export type LayerId =
  | "plants" | "substations" | "transmission" | "datacenters" | "cables";

export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

export interface SelectedAsset {
  id: string;
  kind: "plant" | "substation" | "datacenter" | "line" | "cable";
}

export type MeasurePoint = { lon: number; lat: number };

interface GridState {
  view: ViewState;
  setView: (v: Partial<ViewState>) => void;
  viewVersion: number;

  layers: Record<LayerId, boolean>;
  toggleLayer: (id: LayerId) => void;

  enabledTechs: Record<TechType, boolean>;
  toggleTech: (t: TechType) => void;
  setAllTechs: (v: boolean) => void;

  search: string;
  setSearch: (s: string) => void;

  selected: SelectedAsset | null;
  select: (s: SelectedAsset | null) => void;

  leftCollapsed: boolean;
  toggleLeft: () => void;

  presentationMode: boolean;
  togglePresentation: () => void;

  measureMode: boolean;
  toggleMeasure: () => void;
  measurePoints: MeasurePoint[];
  addMeasurePoint: (p: MeasurePoint) => void;
  clearMeasure: () => void;

  capacityRange: [number, number]; // MW
  setCapacityRange: (r: [number, number]) => void;

  yearRange: [number, number];
  setYearRange: (r: [number, number]) => void;

  favorites: string[];
  toggleFavorite: (id: string) => void;

  chatOpen: boolean;
  toggleChat: () => void;
}

const ALL_TECHS: TechType[] = [
  "solar", "wind", "offshore", "hydro", "nuclear",
  "gas", "coal", "oil", "biomass", "geothermal", "storage",
];

export const useGrid = create<GridState>()(
  persist(
    (set, get) => ({
      view: { longitude: 8, latitude: 32, zoom: 2.2, pitch: 35, bearing: 0 },
      setView: (v) => set((s) => ({ view: { ...s.view, ...v } })),

      layers: {
        plants: true, substations: true, transmission: true,
        datacenters: true, cables: true,
      },
      toggleLayer: (id) =>
        set((s) => ({ layers: { ...s.layers, [id]: !s.layers[id] } })),

      enabledTechs: Object.fromEntries(ALL_TECHS.map((t) => [t, true])) as Record<TechType, boolean>,
      toggleTech: (t) =>
        set((s) => ({ enabledTechs: { ...s.enabledTechs, [t]: !s.enabledTechs[t] } })),
      setAllTechs: (v) =>
        set(() => ({ enabledTechs: Object.fromEntries(ALL_TECHS.map((t) => [t, v])) as Record<TechType, boolean> })),

      search: "",
      setSearch: (s) => set({ search: s }),

      selected: null,
      select: (s) => set({ selected: s }),

      leftCollapsed: false,
      toggleLeft: () => set((s) => ({ leftCollapsed: !s.leftCollapsed })),

      presentationMode: false,
      togglePresentation: () => set((s) => ({ presentationMode: !s.presentationMode })),

      measureMode: false,
      toggleMeasure: () => set((s) => ({ measureMode: !s.measureMode })),

      capacityRange: [0, 2500],
      setCapacityRange: (r) => set({ capacityRange: r }),

      yearRange: [1970, 2030],
      setYearRange: (r) => set({ yearRange: r }),

      favorites: [],
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((x) => x !== id)
            : [...s.favorites, id],
        })),
    }),
    {
      name: "gridatlas-state",
      partialize: (s) => ({
        favorites: s.favorites,
        layers: s.layers,
        enabledTechs: s.enabledTechs,
      }),
    }
  )
);
