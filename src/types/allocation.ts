export interface Shop {
  id: string;          // e.g. "1", "7A", "10", "Flat-09"
  floor: number;       // 0, 1, 2, 4
  area: number;        // Super Built Area in sq.ft.
  active?: boolean;    // whether included in allocation
  customName?: string; // e.g. "Shop 01 (L.O.)"
}

export type FloorRates = Record<number, number>;

export interface BucketAllocation {
  bucketId: number;    // 1 to 7
  shops: Array<{
    floor: number;
    id: string;
    area: number;
    value: number;
  }>;
  totalArea: number;
  totalValue: number;
  targetArea: number;
  targetValue: number;
  areaDiff: number;       // totalArea - targetArea
  valueDiff: number;      // totalValue - targetValue
  areaVariancePct: number; // ((totalArea - targetArea) / targetArea) * 100
  valueVariancePct: number;// ((totalValue - targetValue) / targetValue) * 100
  floorsCount: number;    // distinct floors in this bucket
}

export interface SolutionResult {
  solutionIndex: number;
  objectiveVariance: number;
  buckets: BucketAllocation[];
  runtimeMs: number;
  activeShopsCount: number;
  status: 'optimal' | 'feasible' | 'infeasible';
}

export interface SolverConfig {
  D: number;              // min floors per bucket (e.g. 2 or 3)
  weight: number;         // weight w on value (1 - w on area)
  maxSolutions: number;   // number of integer cuts to explore
  symmetryBreaking: boolean;
  normalizeObjective: boolean;
  timeout?: number;       // solver time limit in seconds (default 20)
  mipGap?: number;        // MIP optimality gap (default 0.02 = 2%)
}

export interface ShopLayoutCoord {
  floor: number;
  id: string;
  label: string;
  x: number;      // percentage 0..100
  y: number;      // percentage 0..100
  width: number;  // percentage
  height: number; // percentage
  zone: 'north-left' | 'north-right' | 'mid-left' | 'mid-core' | 'south-left' | 'south-right' | 'amenity';
}

export interface BucketTheme {
  id: number;
  name: string;
  label: string;
  hex: string;
  borderHex: string;
  textHex: string;
  bgLightHex: string;
}
