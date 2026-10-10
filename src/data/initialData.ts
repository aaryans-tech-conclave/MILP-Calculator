import { FloorRates, Shop, ShopLayoutCoord, BucketTheme } from '../types/allocation';

export const DEFAULT_FLOOR_RATES: FloorRates = {
  0: 12000, // Ground Floor Rate ($ / sq.ft.)
  1: 8000,  // 1st Floor Rate
  2: 6000,  // 2nd Floor Rate
  4: 4500,  // 4th Floor Rate
};

export const FLOOR_NAMES: Record<number, string> = {
  0: 'Ground Floor (G)',
  1: '1st Floor (1F)',
  2: '2nd Floor (2F)',
  4: '4th Floor (4F)',
};

export const BUCKET_THEMES: BucketTheme[] = [
  {
    id: 1,
    name: 'Sage',
    label: 'Bucket 1',
    hex: '#8EA89D',
    borderHex: '#718D82',
    textHex: '#223830',
    bgLightHex: '#F0F4F2',
  },
  {
    id: 2,
    name: 'Dusty Rose',
    label: 'Bucket 2',
    hex: '#C49A9B',
    borderHex: '#AD7B7D',
    textHex: '#4A2526',
    bgLightHex: '#F8F1F1',
  },
  {
    id: 3,
    name: 'Pale Slate',
    label: 'Bucket 3',
    hex: '#8E9EB2',
    borderHex: '#718298',
    textHex: '#23344A',
    bgLightHex: '#F0F3F7',
  },
  {
    id: 4,
    name: 'Warm Ochre',
    label: 'Bucket 4',
    hex: '#BDB295',
    borderHex: '#A29676',
    textHex: '#3E361F',
    bgLightHex: '#F7F5EE',
  },
  {
    id: 5,
    name: 'Soft Lilac',
    label: 'Bucket 5',
    hex: '#A598B8',
    borderHex: '#8A7B9F',
    textHex: '#382A4C',
    bgLightHex: '#F4F1F7',
  },
  {
    id: 6,
    name: 'Muted Terracotta',
    label: 'Bucket 6',
    hex: '#C99B87',
    borderHex: '#B07E68',
    textHex: '#4B2818',
    bgLightHex: '#F8F2EE',
  },
  {
    id: 7,
    name: 'Pale Moss',
    label: 'Bucket 7',
    hex: '#9FB188',
    borderHex: '#829768',
    textHex: '#2C3E17',
    bgLightHex: '#F2F6ED',
  },
];

export const DEFAULT_SHOPS: Shop[] = [
  // --- GR Floor Shops (Floor 0) ---
  { floor: 0, id: '1', area: 640, active: true },
  { floor: 0, id: '3', area: 320, active: true },
  { floor: 0, id: '7', area: 470, active: true },
  { floor: 0, id: '10', area: 490, active: true },
  { floor: 0, id: '11', area: 260, active: true },
  { floor: 0, id: '12', area: 250, active: true },
  { floor: 0, id: '13', area: 250, active: true },

  // --- 1ST Floor Shops (Floor 1) ---
  { floor: 1, id: '2', area: 620, active: true },
  { floor: 1, id: '7A', area: 235, active: true },
  { floor: 1, id: '7B', area: 235, active: true },
  { floor: 1, id: '8', area: 465, active: true },
  { floor: 1, id: '9', area: 465, active: true },
  { floor: 1, id: '12', area: 250, active: true },
  { floor: 1, id: '13', area: 250, active: true },

  // --- 2ND Floor Shops (Floor 2) ---
  { floor: 2, id: '1', area: 640, active: true },
  { floor: 2, id: '4', area: 320, active: true },
  { floor: 2, id: '5', area: 290, active: true },
  { floor: 2, id: '7A', area: 235, active: true },
  { floor: 2, id: '7B', area: 235, active: true },
  { floor: 2, id: '11', area: 260, active: true },
  { floor: 2, id: '12', area: 250, active: true },
  { floor: 2, id: '14', area: 255, active: true },
  { floor: 2, id: '8', area: 250, active: true },

  // --- 4th Floor Shops (Floor 4) ---
  { floor: 4, id: '1', area: 540, active: true },
  { floor: 4, id: '2', area: 525, active: true },
  { floor: 4, id: '3', area: 425, active: true },
  { floor: 4, id: '4', area: 400, active: true },
  { floor: 4, id: '5', area: 525, active: true },
  { floor: 4, id: '6', area: 450, active: true },
  { floor: 4, id: '7', area: 350, active: true },
  { floor: 4, id: '11', area: 350, active: true },
  { floor: 4, id: '12', area: 380, active: true },
  { floor: 4, id: '13', area: 165, active: true },
  { floor: 4, id: '14', area: 165, active: true },
];

/**
 * Architectural spatial mapping approximating the exact blueprint geometry.
 * Normalized to 0..100 coordinate grid space (width x depth).
 * Width: X from 4 (west passage) to 96 (east passage)
 * Depth: Y from 4 (north facade) to 96 (south entrance)
 */
export const ARCHITECTURAL_LAYOUTS: Record<number, ShopLayoutCoord[]> = {
  0: [
    // North Left Wing
    { floor: 0, id: '10', label: 'Shop 10', x: 6, y: 5, width: 38, height: 9.5, zone: 'north-left' },
    { floor: 0, id: '9', label: 'Shop 09', x: 6, y: 15, width: 38, height: 9.5, zone: 'north-left' },
    { floor: 0, id: '8', label: 'Shop 08', x: 6, y: 25, width: 38, height: 9.5, zone: 'north-left' },
    { floor: 0, id: '7', label: 'Shop 07', x: 6, y: 35, width: 38, height: 9.5, zone: 'north-left' },

    // North Right Wing
    { floor: 0, id: '11', label: 'Shop 11', x: 56, y: 5, width: 38, height: 9.5, zone: 'north-right' },
    { floor: 0, id: '12', label: 'Shop 12', x: 56, y: 15, width: 38, height: 9.5, zone: 'north-right' },
    { floor: 0, id: '13', label: 'Shop 13', x: 56, y: 25, width: 38, height: 9.5, zone: 'north-right' },
    { floor: 0, id: '14', label: 'Shop 14', x: 56, y: 35, width: 38, height: 9.5, zone: 'north-right' },

    // Core Amenities (Stairs & Lifts)
    { floor: 0, id: 'STAIRS', label: 'Stairs', x: 44, y: 51, width: 17, height: 14, zone: 'amenity' },
    { floor: 0, id: 'LIFT', label: 'Lifts', x: 63, y: 51, width: 18, height: 14, zone: 'amenity' },

    // Mid Wing
    { floor: 0, id: '5', label: 'Shop 05', x: 6, y: 51, width: 18, height: 14, zone: 'mid-left' },
    { floor: 0, id: '6', label: 'Shop 06', x: 25, y: 51, width: 18, height: 14, zone: 'mid-left' },

    // South Wing
    { floor: 0, id: '4', label: 'Shop 04', x: 6, y: 66, width: 27, height: 13, zone: 'south-left' },
    { floor: 0, id: '3', label: 'Shop 03', x: 6, y: 80, width: 27, height: 15, zone: 'south-left' },
    { floor: 0, id: '2', label: 'Shop 02', x: 35, y: 66, width: 28, height: 29, zone: 'south-right' },
    { floor: 0, id: '1', label: 'Shop 01', x: 65, y: 66, width: 29, height: 29, zone: 'south-right' },
  ],

  1: [
    // North Left Wing
    { floor: 1, id: '10', label: 'Shop 10', x: 6, y: 5, width: 38, height: 9.5, zone: 'north-left' },
    { floor: 1, id: '9', label: 'Shop 09', x: 6, y: 15, width: 38, height: 9.5, zone: 'north-left' },
    { floor: 1, id: '8', label: 'Shop 08', x: 6, y: 25, width: 38, height: 9.5, zone: 'north-left' },
    { floor: 1, id: '7A', label: 'Shop 07(A)', x: 6, y: 35, width: 18.5, height: 9.5, zone: 'north-left' },
    { floor: 1, id: '7B', label: 'Shop 07(B)', x: 25.5, y: 35, width: 18.5, height: 9.5, zone: 'north-left' },

    // North Right Wing
    { floor: 1, id: '11', label: 'Shop 11', x: 56, y: 5, width: 38, height: 9.5, zone: 'north-right' },
    { floor: 1, id: '12', label: 'Shop 12', x: 56, y: 15, width: 38, height: 9.5, zone: 'north-right' },
    { floor: 1, id: '13', label: 'Shop 13', x: 56, y: 25, width: 38, height: 9.5, zone: 'north-right' },
    { floor: 1, id: 'WASH', label: 'Wash Area', x: 56, y: 35, width: 38, height: 9.5, zone: 'amenity' },

    // Core Amenities
    { floor: 1, id: 'STAIRS', label: 'Stairs', x: 44, y: 51, width: 17, height: 14, zone: 'amenity' },
    { floor: 1, id: 'LIFT', label: 'Lifts', x: 63, y: 51, width: 18, height: 14, zone: 'amenity' },

    // Mid Wing
    { floor: 1, id: '5', label: 'Shop 05', x: 6, y: 51, width: 18, height: 14, zone: 'mid-left' },
    { floor: 1, id: '6', label: 'Shop 06', x: 25, y: 51, width: 18, height: 14, zone: 'mid-left' },

    // South Wing
    { floor: 1, id: '4', label: 'Shop 04', x: 6, y: 66, width: 27, height: 13, zone: 'south-left' },
    { floor: 1, id: '3', label: 'Shop 03', x: 6, y: 80, width: 27, height: 15, zone: 'south-left' },
    { floor: 1, id: '2', label: 'Shop 02', x: 35, y: 66, width: 28, height: 29, zone: 'south-right' },
    { floor: 1, id: '1', label: 'Shop 01', x: 65, y: 66, width: 29, height: 29, zone: 'south-right' },
  ],

  2: [
    // North Left Wing
    { floor: 2, id: '10', label: 'Shop 10', x: 6, y: 5, width: 38, height: 9.5, zone: 'north-left' },
    { floor: 2, id: '9', label: 'Shop 09', x: 6, y: 15, width: 38, height: 9.5, zone: 'north-left' },
    { floor: 2, id: '8', label: 'Shop 08', x: 6, y: 25, width: 38, height: 9.5, zone: 'north-left' },
    { floor: 2, id: '7A', label: 'Shop 07(A)', x: 6, y: 35, width: 18.5, height: 9.5, zone: 'north-left' },
    { floor: 2, id: '7B', label: 'Shop 07(B)', x: 25.5, y: 35, width: 18.5, height: 9.5, zone: 'north-left' },

    // North Right Wing
    { floor: 2, id: '11', label: 'Shop 11', x: 56, y: 5, width: 38, height: 9.5, zone: 'north-right' },
    { floor: 2, id: '12', label: 'Shop 12', x: 56, y: 15, width: 38, height: 9.5, zone: 'north-right' },
    { floor: 2, id: '13', label: 'Shop 13', x: 56, y: 25, width: 38, height: 9.5, zone: 'north-right' },
    { floor: 2, id: '14', label: 'Shop 14', x: 56, y: 35, width: 38, height: 9.5, zone: 'north-right' },

    // Core Amenities
    { floor: 2, id: 'STAIRS', label: 'Stairs', x: 44, y: 51, width: 17, height: 14, zone: 'amenity' },
    { floor: 2, id: 'LIFT', label: 'Lifts', x: 63, y: 51, width: 18, height: 14, zone: 'amenity' },

    // Mid Wing
    { floor: 2, id: '5', label: 'Shop 05', x: 6, y: 51, width: 18, height: 14, zone: 'mid-left' },
    { floor: 2, id: '6', label: 'Shop 06', x: 25, y: 51, width: 18, height: 14, zone: 'mid-left' },

    // South Wing
    { floor: 2, id: '4', label: 'Shop 04', x: 6, y: 66, width: 27, height: 13, zone: 'south-left' },
    { floor: 2, id: '3', label: 'Shop 03', x: 6, y: 80, width: 27, height: 15, zone: 'south-left' },
    { floor: 2, id: '2', label: 'Shop 02', x: 35, y: 66, width: 28, height: 29, zone: 'south-right' },
    { floor: 2, id: '1', label: 'Shop 01', x: 65, y: 66, width: 29, height: 29, zone: 'south-right' },
  ],

  4: [
    // 4th Floor - Flat units mapping
    // North Left Wing (Flats 09, 08, 07, 06)
    { floor: 4, id: '10', label: 'Flat 09', x: 6, y: 5, width: 38, height: 9.5, zone: 'north-left' },
    { floor: 4, id: '11', label: 'Flat 08', x: 6, y: 15, width: 38, height: 9.5, zone: 'north-left' },
    { floor: 4, id: '12', label: 'Flat 07', x: 6, y: 25, width: 38, height: 9.5, zone: 'north-left' },
    { floor: 4, id: '6', label: 'Flat 06', x: 6, y: 35, width: 38, height: 9.5, zone: 'north-left' },

    // North Right Wing (Flats 10, 11, 12, 13, 14)
    { floor: 4, id: '7', label: 'Flat 10', x: 56, y: 5, width: 38, height: 9.5, zone: 'north-right' },
    { floor: 4, id: '5', label: 'Flat 11', x: 56, y: 15, width: 38, height: 9.5, zone: 'north-right' },
    { floor: 4, id: '4', label: 'Flat 12', x: 56, y: 25, width: 38, height: 9.5, zone: 'north-right' },
    { floor: 4, id: '13', label: 'Flat 13', x: 56, y: 35, width: 18.5, height: 9.5, zone: 'north-right' },
    { floor: 4, id: '14', label: 'Flat 14', x: 75.5, y: 35, width: 18.5, height: 9.5, zone: 'north-right' },

    // Core Amenities
    { floor: 4, id: 'STAIRS', label: 'Stairs', x: 44, y: 51, width: 17, height: 14, zone: 'amenity' },
    { floor: 4, id: 'LIFT', label: 'Lifts', x: 63, y: 51, width: 18, height: 14, zone: 'amenity' },

    // Mid Wing
    { floor: 4, id: '5', label: 'Flat 05', x: 6, y: 51, width: 36, height: 14, zone: 'mid-left' },

    // South Wing (Flats 04, 03, 02, 01)
    { floor: 4, id: '4', label: 'Flat 04', x: 6, y: 66, width: 27, height: 13, zone: 'south-left' },
    { floor: 4, id: '3', label: 'Flat 03', x: 6, y: 80, width: 27, height: 15, zone: 'south-left' },
    { floor: 4, id: '2', label: 'Flat 02', x: 35, y: 66, width: 28, height: 29, zone: 'south-right' },
    { floor: 4, id: '1', label: 'Flat 01', x: 65, y: 66, width: 29, height: 29, zone: 'south-right' },
  ],
};

import { SolutionResult } from '../types/allocation';

export const INITIAL_SOLUTIONS: SolutionResult[] = [
  {
    solutionIndex: 1,
    objectiveVariance: 176.85,
    status: 'feasible',
    runtimeMs: 120,
    activeShopsCount: 34,
    buckets: [
      {
        bucketId: 1,
        shops: [
          { floor: 0, id: '1', area: 640, value: 7680000 },
          { floor: 4, id: '3', area: 425, value: 1912500 },
          { floor: 4, id: '11', area: 350, value: 1575000 },
          { floor: 4, id: '12', area: 380, value: 1710000 },
        ],
        totalArea: 1795,
        totalValue: 12877500,
        targetArea: 1744.3,
        targetValue: 12566785.7,
        areaDiff: 50.7,
        valueDiff: 310714.3,
        areaVariancePct: 2.91,
        valueVariancePct: 2.47,
        floorsCount: 2,
      },
      {
        bucketId: 2,
        shops: [
          { floor: 0, id: '11', area: 260, value: 3120000 },
          { floor: 0, id: '13', area: 250, value: 3000000 },
          { floor: 1, id: '7B', area: 235, value: 1880000 },
          { floor: 2, id: '12', area: 250, value: 1500000 },
          { floor: 4, id: '2', area: 525, value: 2362500 },
          { floor: 4, id: '14', area: 165, value: 742500 },
        ],
        totalArea: 1685,
        totalValue: 12605000,
        targetArea: 1744.3,
        targetValue: 12566785.7,
        areaDiff: -59.3,
        valueDiff: 38214.3,
        areaVariancePct: -3.4,
        valueVariancePct: 0.3,
        floorsCount: 4,
      },
      {
        bucketId: 3,
        shops: [
          { floor: 0, id: '7', area: 470, value: 5640000 },
          { floor: 2, id: '1', area: 640, value: 3840000 },
          { floor: 4, id: '1', area: 540, value: 2430000 },
        ],
        totalArea: 1650,
        totalValue: 11910000,
        targetArea: 1744.3,
        targetValue: 12566785.7,
        areaDiff: -94.3,
        valueDiff: -656785.7,
        areaVariancePct: -5.41,
        valueVariancePct: -5.23,
        floorsCount: 3,
      },
      {
        bucketId: 4,
        shops: [
          { floor: 0, id: '3', area: 320, value: 3840000 },
          { floor: 1, id: '7A', area: 235, value: 1880000 },
          { floor: 1, id: '13', area: 250, value: 2000000 },
          { floor: 4, id: '5', area: 525, value: 2362500 },
          { floor: 4, id: '6', area: 450, value: 2025000 },
        ],
        totalArea: 1780,
        totalValue: 12107500,
        targetArea: 1744.3,
        targetValue: 12566785.7,
        areaDiff: 35.7,
        valueDiff: -459285.7,
        areaVariancePct: 2.05,
        valueVariancePct: -3.65,
        floorsCount: 3,
      },
      {
        bucketId: 5,
        shops: [
          { floor: 0, id: '12', area: 250, value: 3000000 },
          { floor: 1, id: '2', area: 620, value: 4960000 },
          { floor: 2, id: '7B', area: 235, value: 1410000 },
          { floor: 2, id: '14', area: 255, value: 1530000 },
          { floor: 4, id: '4', area: 400, value: 1800000 },
        ],
        totalArea: 1760,
        totalValue: 12700000,
        targetArea: 1744.3,
        targetValue: 12566785.7,
        areaDiff: 15.7,
        valueDiff: 133214.3,
        areaVariancePct: 0.9,
        valueVariancePct: 1.06,
        floorsCount: 4,
      },
      {
        bucketId: 6,
        shops: [
          { floor: 1, id: '8', area: 465, value: 3720000 },
          { floor: 1, id: '9', area: 465, value: 3720000 },
          { floor: 2, id: '4', area: 320, value: 1920000 },
          { floor: 2, id: '5', area: 290, value: 1740000 },
          { floor: 2, id: '8', area: 250, value: 1500000 },
        ],
        totalArea: 1790,
        totalValue: 12600000,
        targetArea: 1744.3,
        targetValue: 12566785.7,
        areaDiff: 45.7,
        valueDiff: 33214.3,
        areaVariancePct: 2.62,
        valueVariancePct: 0.26,
        floorsCount: 2,
      },
      {
        bucketId: 7,
        shops: [
          { floor: 0, id: '10', area: 490, value: 5880000 },
          { floor: 1, id: '12', area: 250, value: 2000000 },
          { floor: 2, id: '7A', area: 235, value: 1410000 },
          { floor: 2, id: '11', area: 260, value: 1560000 },
          { floor: 4, id: '7', area: 350, value: 1575000 },
          { floor: 4, id: '13', area: 165, value: 742500 },
        ],
        totalArea: 1750,
        totalValue: 13167500,
        targetArea: 1744.3,
        targetValue: 12566785.7,
        areaDiff: 5.7,
        valueDiff: 600714.3,
        areaVariancePct: 0.33,
        valueVariancePct: 4.78,
        floorsCount: 4,
      },
    ],
  },
];
