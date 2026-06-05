// GridAtlas data model: types, color palette and labels.
// The actual data is loaded at runtime from GeoJSON sources (see grid-source.ts),
// so this module no longer ships any synthetic generator.

export type TechType =
  | "solar" | "wind" | "offshore" | "hydro" | "nuclear"
  | "gas" | "coal" | "oil" | "biomass" | "geothermal" | "storage";

export type AssetKind =
  | "plant" | "substation" | "datacenter" | "lng" | "hydrogen" | "ix";

export const TECH_COLOR: Record<string, [number, number, number]> = {
  solar: [255, 200, 87],
  wind: [80, 227, 194],
  offshore: [0, 194, 255],
  hydro: [77, 166, 255],
  nuclear: [123, 97, 255],
  gas: [181, 140, 255],
  coal: [110, 110, 110],
  oil: [211, 107, 95],
  biomass: [88, 214, 141],
  geothermal: [255, 138, 61],
  storage: [255, 93, 162],
  hydrogen: [0, 240, 255],
  datacenter: [255, 255, 255],
  substation: [142, 197, 255],
  transmission: [83, 167, 255],
};

export const TECH_HEX: Record<string, string> = Object.fromEntries(
  Object.entries(TECH_COLOR).map(([k, [r, g, b]]) => [k, `rgb(${r},${g},${b})`])
);

export const TECH_LABEL: Record<string, string> = {
  solar: "Solar", wind: "Wind", offshore: "Offshore Wind", hydro: "Hydro",
  nuclear: "Nuclear", gas: "Gas", coal: "Coal", oil: "Oil",
  biomass: "Biomass", geothermal: "Geothermal", storage: "Storage",
  hydrogen: "Hydrogen", datacenter: "Data Center", substation: "Substation",
  transmission: "Transmission",
};

export interface PowerPlant {
  id: string;
  kind: "plant";
  name: string;
  tech: TechType;
  capacityMW: number;
  operator: string;
  country: string;
  status: "operational" | "construction" | "planned" | "decommissioned";
  year: number;
  lon: number;
  lat: number;
}

export interface Substation {
  id: string;
  kind: "substation";
  name: string;
  voltageKV: number;
  capacityMVA: number;
  operator: string;
  country: string;
  lon: number;
  lat: number;
}

export interface DataCenter {
  id: string;
  kind: "datacenter";
  name: string;
  operator: string;
  powerMW: number;
  tier: "Tier II" | "Tier III" | "Tier IV";
  country: string;
  lon: number;
  lat: number;
}

export interface TransmissionLine {
  id: string;
  name: string;
  voltageKV: number;
  operator: string;
  lengthKm: number;
  path: [number, number][];
}

export interface SubmarineCable {
  id: string;
  name: string;
  capacityTbps: number;
  path: [number, number][];
}

export type AnyAsset = PowerPlant | Substation | DataCenter;

export interface GridTotals {
  assets: number;
  capacityGW: number;
  countries: number;
  operators: number;
  transmissionKm: number;
  datacenters: number;
}

export interface GridDataset {
  plants: PowerPlant[];
  substations: Substation[];
  datacenters: DataCenter[];
  lines: TransmissionLine[];
  cables: SubmarineCable[];
}

export const EMPTY_DATASET: GridDataset = {
  plants: [], substations: [], datacenters: [], lines: [], cables: [],
};

export const EMPTY_TOTALS: GridTotals = {
  assets: 0, capacityGW: 0, countries: 0, operators: 0, transmissionKm: 0, datacenters: 0,
};
