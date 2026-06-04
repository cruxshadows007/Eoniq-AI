// Realistic mock data for GridAtlas. Seeded so the map looks the same on each load.

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

// --- seeded RNG ---
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const jitter = (v: number, a: number) => v + (rand() - 0.5) * a;

// Population-like clusters: [name, country, lon, lat, weight, primaryTech bias]
const HUBS: Array<[string, string, number, number, number, TechType[]]> = [
  ["Madrid", "ES", -3.70, 40.42, 1.0, ["solar", "wind", "gas"]],
  ["Sevilla", "ES", -5.99, 37.39, 0.8, ["solar", "gas"]],
  ["Barcelona", "ES", 2.17, 41.39, 0.9, ["gas", "solar", "wind"]],
  ["Lisbon", "PT", -9.14, 38.72, 0.7, ["wind", "offshore", "solar"]],
  ["Paris", "FR", 2.35, 48.86, 1.2, ["nuclear", "gas", "wind"]],
  ["Lyon", "FR", 4.83, 45.76, 0.7, ["nuclear", "hydro"]],
  ["London", "UK", -0.13, 51.51, 1.3, ["offshore", "gas", "nuclear"]],
  ["Manchester", "UK", -2.24, 53.48, 0.6, ["wind", "gas"]],
  ["Edinburgh", "UK", -3.19, 55.95, 0.5, ["offshore", "wind", "hydro"]],
  ["Berlin", "DE", 13.40, 52.52, 1.1, ["solar", "wind", "coal"]],
  ["Hamburg", "DE", 9.99, 53.55, 0.7, ["offshore", "wind", "gas"]],
  ["Munich", "DE", 11.58, 48.14, 0.8, ["solar", "gas", "biomass"]],
  ["Amsterdam", "NL", 4.90, 52.37, 0.9, ["offshore", "wind", "gas"]],
  ["Copenhagen", "DK", 12.57, 55.68, 0.6, ["offshore", "wind"]],
  ["Stockholm", "SE", 18.07, 59.33, 0.6, ["hydro", "nuclear", "wind"]],
  ["Oslo", "NO", 10.75, 59.91, 0.6, ["hydro", "wind"]],
  ["Helsinki", "FI", 24.94, 60.17, 0.5, ["nuclear", "hydro", "biomass"]],
  ["Warsaw", "PL", 21.01, 52.23, 0.7, ["coal", "gas", "wind"]],
  ["Rome", "IT", 12.50, 41.90, 0.8, ["solar", "gas", "geothermal"]],
  ["Milan", "IT", 9.19, 45.46, 0.7, ["gas", "hydro", "solar"]],
  ["Athens", "GR", 23.73, 37.98, 0.5, ["solar", "wind"]],
  ["Istanbul", "TR", 28.98, 41.01, 0.9, ["gas", "hydro", "coal"]],
  ["Moscow", "RU", 37.62, 55.75, 1.0, ["gas", "nuclear", "coal"]],
  ["Dubai", "AE", 55.27, 25.20, 0.9, ["solar", "gas", "nuclear"]],
  ["Riyadh", "SA", 46.67, 24.71, 0.9, ["solar", "gas", "oil"]],
  ["Cairo", "EG", 31.24, 30.04, 0.7, ["solar", "gas"]],
  ["Lagos", "NG", 3.38, 6.52, 0.7, ["gas", "oil", "solar"]],
  ["Nairobi", "KE", 36.82, -1.29, 0.5, ["geothermal", "solar", "hydro"]],
  ["Johannesburg", "ZA", 28.04, -26.20, 0.6, ["coal", "solar"]],
  ["Mumbai", "IN", 72.88, 19.08, 1.0, ["coal", "solar", "gas"]],
  ["Delhi", "IN", 77.21, 28.61, 1.1, ["coal", "solar", "gas"]],
  ["Bengaluru", "IN", 77.59, 12.97, 0.8, ["solar", "wind"]],
  ["Beijing", "CN", 116.41, 39.90, 1.3, ["coal", "nuclear", "wind", "solar"]],
  ["Shanghai", "CN", 121.47, 31.23, 1.3, ["coal", "nuclear", "offshore"]],
  ["Shenzhen", "CN", 114.06, 22.54, 1.0, ["nuclear", "solar", "offshore"]],
  ["Hong Kong", "HK", 114.17, 22.32, 0.7, ["gas", "nuclear"]],
  ["Tokyo", "JP", 139.69, 35.69, 1.2, ["nuclear", "gas", "solar"]],
  ["Osaka", "JP", 135.50, 34.69, 0.8, ["nuclear", "gas"]],
  ["Seoul", "KR", 126.98, 37.57, 1.0, ["nuclear", "coal", "gas"]],
  ["Taipei", "TW", 121.57, 25.03, 0.7, ["coal", "nuclear", "offshore"]],
  ["Singapore", "SG", 103.82, 1.35, 0.9, ["gas", "solar"]],
  ["Jakarta", "ID", 106.83, -6.21, 0.9, ["coal", "geothermal", "gas"]],
  ["Bangkok", "TH", 100.50, 13.76, 0.7, ["gas", "coal", "solar"]],
  ["Manila", "PH", 120.98, 14.60, 0.6, ["geothermal", "coal", "solar"]],
  ["Sydney", "AU", 151.21, -33.87, 0.8, ["coal", "solar", "wind"]],
  ["Melbourne", "AU", 144.96, -37.81, 0.7, ["wind", "solar", "gas"]],
  ["Perth", "AU", 115.86, -31.95, 0.6, ["gas", "solar", "wind"]],
  ["Auckland", "NZ", 174.76, -36.85, 0.4, ["hydro", "geothermal", "wind"]],
  ["New York", "US", -74.01, 40.71, 1.3, ["gas", "nuclear", "offshore"]],
  ["Washington", "US", -77.04, 38.91, 0.7, ["gas", "nuclear"]],
  ["Atlanta", "US", -84.39, 33.75, 0.7, ["nuclear", "gas", "solar"]],
  ["Miami", "US", -80.19, 25.76, 0.7, ["gas", "solar"]],
  ["Chicago", "US", -87.63, 41.88, 0.9, ["nuclear", "wind", "gas"]],
  ["Houston", "US", -95.37, 29.76, 1.0, ["gas", "oil", "wind", "solar"]],
  ["Dallas", "US", -96.80, 32.78, 0.8, ["gas", "wind", "solar"]],
  ["Denver", "US", -104.99, 39.74, 0.6, ["wind", "solar", "gas"]],
  ["Phoenix", "US", -112.07, 33.45, 0.7, ["solar", "nuclear", "gas"]],
  ["Los Angeles", "US", -118.24, 34.05, 1.1, ["gas", "solar", "wind"]],
  ["San Francisco", "US", -122.42, 37.77, 1.0, ["solar", "wind", "gas"]],
  ["Seattle", "US", -122.33, 47.61, 0.8, ["hydro", "wind", "gas"]],
  ["Vancouver", "CA", -123.12, 49.28, 0.6, ["hydro", "wind"]],
  ["Toronto", "CA", -79.38, 43.65, 0.8, ["nuclear", "hydro", "gas"]],
  ["Montreal", "CA", -73.57, 45.50, 0.6, ["hydro", "wind"]],
  ["Mexico City", "MX", -99.13, 19.43, 0.9, ["gas", "solar", "geothermal"]],
  ["São Paulo", "BR", -46.63, -23.55, 1.0, ["hydro", "wind", "solar"]],
  ["Rio de Janeiro", "BR", -43.20, -22.91, 0.7, ["hydro", "gas", "offshore"]],
  ["Buenos Aires", "AR", -58.38, -34.60, 0.7, ["gas", "hydro", "wind"]],
  ["Santiago", "CL", -70.65, -33.45, 0.6, ["solar", "hydro", "wind"]],
  ["Lima", "PE", -77.04, -12.05, 0.5, ["hydro", "gas"]],
  ["Bogotá", "CO", -74.08, 4.71, 0.6, ["hydro", "gas"]],
];

const OPERATORS = [
  "Iberdrola", "Endesa", "EDP", "Enel", "EDF", "RWE", "E.ON", "Vattenfall",
  "Ørsted", "SSE", "National Grid", "TenneT", "Statnett", "Terna",
  "NextEra Energy", "Duke Energy", "Dominion", "Exelon", "PG&E", "Berkshire",
  "State Grid", "CGN", "CTG", "TEPCO", "KEPCO", "Tata Power", "Adani Green",
  "ACWA Power", "Masdar", "TAQA", "Eskom", "AGL Energy",
];

const DC_OPERATORS = [
  "Equinix", "Digital Realty", "AWS", "Google Cloud", "Microsoft Azure",
  "Meta", "Oracle Cloud", "NTT", "CyrusOne", "Iron Mountain",
];

function plantName(tech: TechType, hub: string, i: number) {
  const labels: Record<TechType, string> = {
    solar: "Solar Park",
    wind: "Wind Farm",
    offshore: "Offshore Wind",
    hydro: "Hydroelectric",
    nuclear: "Nuclear Station",
    gas: "CCGT",
    coal: "Coal Plant",
    oil: "Oil Plant",
    biomass: "Biomass",
    geothermal: "Geothermal",
    storage: "BESS",
  };
  return `${hub} ${labels[tech]} ${String.fromCharCode(65 + (i % 26))}${i}`;
}

function capacityFor(tech: TechType): number {
  const base: Record<TechType, [number, number]> = {
    solar: [20, 800],
    wind: [40, 600],
    offshore: [200, 1400],
    hydro: [100, 2200],
    nuclear: [900, 1650],
    gas: [200, 1600],
    coal: [400, 2400],
    oil: [80, 600],
    biomass: [20, 200],
    geothermal: [20, 300],
    storage: [20, 400],
  };
  const [a, b] = base[tech];
  return Math.round(a + rand() * (b - a));
}

const allPlants: PowerPlant[] = [];
const allSubs: Substation[] = [];
const allDCs: DataCenter[] = [];

let pid = 0, sid = 0, did = 0;
for (const [name, country, lon, lat, weight, techs] of HUBS) {
  const nPlants = Math.round(18 + weight * 30);
  for (let i = 0; i < nPlants; i++) {
    const tech = techs[Math.floor(rand() * techs.length * 0.999)];
    const offsetScale = tech === "offshore" ? 3.5 : 2.2;
    const isOffshore = tech === "offshore";
    allPlants.push({
      id: `p_${pid++}`,
      kind: "plant",
      name: plantName(tech, name, i),
      tech,
      capacityMW: capacityFor(tech),
      operator: pick(OPERATORS),
      country,
      status: rand() < 0.86 ? "operational" : rand() < 0.6 ? "construction" : "planned",
      year: 1970 + Math.floor(rand() * 55),
      lon: jitter(lon, offsetScale) + (isOffshore ? (rand() < 0.5 ? -1 : 1) * 1.2 : 0),
      lat: jitter(lat, offsetScale),
    });
  }
  const nSubs = Math.round(10 + weight * 18);
  for (let i = 0; i < nSubs; i++) {
    const v = pick([110, 132, 220, 230, 275, 345, 400, 500, 765]);
    allSubs.push({
      id: `s_${sid++}`,
      kind: "substation",
      name: `${name} Substation ${i + 1}`,
      voltageKV: v,
      capacityMVA: Math.round(200 + rand() * 1800),
      operator: pick(OPERATORS),
      country,
      lon: jitter(lon, 1.4),
      lat: jitter(lat, 1.4),
    });
  }
  const nDC = Math.round(weight * 4);
  for (let i = 0; i < nDC; i++) {
    allDCs.push({
      id: `d_${did++}`,
      kind: "datacenter",
      name: `${name} ${pick(["North", "South", "East", "West", "Central", "Park"])} DC${i + 1}`,
      operator: pick(DC_OPERATORS),
      powerMW: Math.round(8 + rand() * 180),
      tier: pick(["Tier III", "Tier III", "Tier IV", "Tier II"]),
      country,
      lon: jitter(lon, 0.6),
      lat: jitter(lat, 0.6),
    });
  }
}

// Transmission lines connecting nearby hubs of the same continent
function dist(a: [number, number], b: [number, number]) {
  const dx = a[0] - b[0], dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

const allLines: TransmissionLine[] = [];
let lid = 0;
for (let i = 0; i < HUBS.length; i++) {
  const [, , lon1, lat1] = HUBS[i];
  // connect to 2 nearest hubs within range
  const sorted = HUBS
    .map((h, j) => ({ h, j, d: dist([lon1, lat1], [h[2], h[3]]) }))
    .filter(x => x.j !== i && x.d < 22)
    .sort((a, b) => a.d - b.d)
    .slice(0, 3);
  for (const { h } of sorted) {
    const [name2, , lon2, lat2] = h;
    // create a slightly curved path
    const mx = (lon1 + lon2) / 2 + (rand() - 0.5) * 2;
    const my = (lat1 + lat2) / 2 + (rand() - 0.5) * 2;
    allLines.push({
      id: `l_${lid++}`,
      name: `${HUBS[i][0]}–${name2} Interconnector`,
      voltageKV: pick([220, 230, 275, 345, 400, 500, 765]),
      operator: pick(OPERATORS),
      lengthKm: Math.round(dist([lon1, lat1], [lon2, lat2]) * 111),
      path: [[lon1, lat1], [mx, my], [lon2, lat2]],
    });
  }
}

// A handful of submarine cables (great-circle approximations)
const allCables: SubmarineCable[] = [
  { id: "c1", name: "MAREA", capacityTbps: 200, path: [[-74.0, 40.7], [-50, 42], [-20, 42], [-9.14, 38.72]] },
  { id: "c2", name: "Dunant", capacityTbps: 250, path: [[-74.0, 40.7], [-40, 45], [-10, 46], [-1.5, 47]] },
  { id: "c3", name: "2Africa", capacityTbps: 180, path: [[-9.14, 38.72], [-7, 33], [-5, 30], [2, 25], [10, 12], [20, 0], [31, -10], [36, -18], [40, -22], [55.27, 25.20]] },
  { id: "c4", name: "Pacific Light", capacityTbps: 144, path: [[-118.24, 34.05], [-150, 35], [180, 30], [140, 28], [114.17, 22.32]] },
  { id: "c5", name: "JUPITER", capacityTbps: 60, path: [[-118.24, 34.05], [-160, 25], [170, 20], [139.69, 35.69]] },
  { id: "c6", name: "EllaLink", capacityTbps: 100, path: [[-9.14, 38.72], [-25, 30], [-35, 10], [-40, -10], [-43.2, -22.91]] },
  { id: "c7", name: "SEA-ME-WE 6", capacityTbps: 130, path: [[103.82, 1.35], [80, 6], [73, 15], [55, 22], [40, 24], [32, 30], [12.5, 41.9]] },
];

export const DATA = {
  plants: allPlants,
  substations: allSubs,
  datacenters: allDCs,
  lines: allLines,
  cables: allCables,
};

export const TOTALS = {
  assets: allPlants.length + allSubs.length + allDCs.length,
  capacityGW: Math.round(allPlants.reduce((s, p) => s + p.capacityMW, 0) / 1000),
  countries: new Set(allPlants.map(p => p.country)).size,
  operators: new Set([...allPlants.map(p => p.operator), ...allSubs.map(s => s.operator)]).size,
  transmissionKm: allLines.reduce((s, l) => s + l.lengthKm, 0),
  datacenters: allDCs.length,
};

export const TECH_LABEL: Record<string, string> = {
  solar: "Solar", wind: "Wind", offshore: "Offshore Wind", hydro: "Hydro",
  nuclear: "Nuclear", gas: "Gas", coal: "Coal", oil: "Oil",
  biomass: "Biomass", geothermal: "Geothermal", storage: "Storage",
  hydrogen: "Hydrogen", datacenter: "Data Center", substation: "Substation",
  transmission: "Transmission",
};
