import GLPK from 'glpk.js';
import { Shop, FloorRates, SolverConfig, SolutionResult, BucketAllocation } from '../types/allocation';

let cachedGlpk: any = null;

export async function getGlpkInstance(): Promise<any> {
  if (cachedGlpk) return cachedGlpk;
  try {
    if (typeof GLPK === 'function') {
      const res = (GLPK as any)();
      cachedGlpk = res instanceof Promise ? await res : res;
    } else if ((GLPK as any).default && typeof (GLPK as any).default === 'function') {
      const res = (GLPK as any).default();
      cachedGlpk = res instanceof Promise ? await res : res;
    } else {
      cachedGlpk = GLPK;
    }
  } catch {
    try {
      const nodeGlpk: any = await import('glpk.js/node' as any);
      const fn = nodeGlpk.default || nodeGlpk;
      cachedGlpk = typeof fn === 'function' ? await fn() : fn;
    } catch {
      cachedGlpk = (typeof window !== 'undefined' && (window as any).glpk) || GLPK;
    }
  }
  return cachedGlpk;
}

export interface GlpkJsModel {
  name: string;
  objective: {
    direction: number; // 1 = GLP_MIN, 2 = GLP_MAX
    name: string;
    vars: Array<{ name: string; coef: number }>;
  };
  subjectTo: Array<{
    name: string;
    bnds: {
      type: number; // 1=GLP_FR, 2=GLP_LO, 3=GLP_UP, 4=GLP_DB, 5=GLP_FX
      lb: number;
      ub: number;
    };
    vars: Array<{ name: string; coef: number }>;
  }>;
  binaries: string[];
  generals?: string[];
}

/**
 * Builds the exact GLPK JSON model matching glpk.js specifications.
 */
export function buildGlpkModel(
  glpk: any,
  shops: Shop[],
  rates: FloorRates,
  D: number,
  w: number,
  historicalCuts: string[][] = [],
  normalize = true
): { model: GlpkJsModel; targetAmount: number; targetArea: number; activeShops: (Shop & { amount: number })[] } {
  const buckets = [1, 2, 3, 4, 5, 6, 7];
  const activeFloors = Object.keys(rates).map(Number).filter(f => rates[f] !== undefined && rates[f] > 0);

  let totalAmount = 0;
  let totalArea = 0;

  const shopsByFloor: Record<number, (Shop & { amount: number })[]> = {};
  activeFloors.forEach(f => {
    shopsByFloor[f] = [];
  });

  const activeShops: (Shop & { amount: number })[] = [];

  shops.forEach(shop => {
    if (shop.active !== false && activeFloors.includes(shop.floor)) {
      const rate = rates[shop.floor] || 0;
      const amount = shop.area * rate;
      const enrichedShop = { ...shop, amount };
      totalAmount += amount;
      totalArea += shop.area;
      shopsByFloor[shop.floor].push(enrichedShop);
      activeShops.push(enrichedShop);
    }
  });

  const targetAmount = buckets.length > 0 ? totalAmount / buckets.length : 0;
  const targetArea = buckets.length > 0 ? totalArea / buckets.length : 0;

  // Scaling weights: normalize so area and value percentage errors are on a comparable scale
  const scaleFactor = 1000;
  let wAmount = w;
  let wArea = 1 - w;

  if (normalize && targetAmount > 0 && targetArea > 0) {
    wAmount = (w / targetAmount) * scaleFactor;
    wArea = ((1 - w) / targetArea) * scaleFactor;
  }

  const objVars: Array<{ name: string; coef: number }> = [];
  const binaries: string[] = [];
  const subjectTo: GlpkJsModel['subjectTo'] = [];

  // 1. Decision variables x_f{floor}_i{id}_j{bucket}
  activeShops.forEach(s => {
    buckets.forEach(j => {
      const varName = `x_f${s.floor}_i${s.id}_j${j}`;
      binaries.push(varName);
    });
  });

  // 2. Floor presence variables y_f{floor}_j{bucket}
  activeFloors.forEach(f => {
    buckets.forEach(j => {
      const varName = `y_f${f}_j${j}`;
      binaries.push(varName);
    });
  });

  // 3. Deviation variables dV_pos, dV_neg, dA_pos, dA_neg
  buckets.forEach(j => {
    objVars.push({ name: `dV_pos_j${j}`, coef: wAmount });
    objVars.push({ name: `dV_neg_j${j}`, coef: wAmount });
    objVars.push({ name: `dA_pos_j${j}`, coef: wArea });
    objVars.push({ name: `dA_neg_j${j}`, coef: wArea });
  });

  // Constraint A: Unique Assignment (Each shop assigned to exactly one bucket)
  activeShops.forEach(s => {
    const rowVars: Array<{ name: string; coef: number }> = [];
    buckets.forEach(j => {
      rowVars.push({ name: `x_f${s.floor}_i${s.id}_j${j}`, coef: 1 });
    });
    subjectTo.push({
      name: `Assign_f${s.floor}_i${s.id}`,
      bnds: { type: glpk.GLP_FX, lb: 1, ub: 1 },
      vars: rowVars,
    });
  });

  // Constraint B: Target Balance Matching (Amount & Area)
  buckets.forEach(j => {
    const amountVars: Array<{ name: string; coef: number }> = [];
    const areaVars: Array<{ name: string; coef: number }> = [];

    activeShops.forEach(s => {
      const xVar = `x_f${s.floor}_i${s.id}_j${j}`;
      amountVars.push({ name: xVar, coef: s.amount });
      areaVars.push({ name: xVar, coef: s.area });
    });

    amountVars.push({ name: `dV_pos_j${j}`, coef: -1 });
    amountVars.push({ name: `dV_neg_j${j}`, coef: 1 });
    areaVars.push({ name: `dA_pos_j${j}`, coef: -1 });
    areaVars.push({ name: `dA_neg_j${j}`, coef: 1 });

    subjectTo.push({
      name: `AmountBalance_j${j}`,
      bnds: { type: glpk.GLP_FX, lb: targetAmount, ub: targetAmount },
      vars: amountVars,
    });

    subjectTo.push({
      name: `AreaBalance_j${j}`,
      bnds: { type: glpk.GLP_FX, lb: targetArea, ub: targetArea },
      vars: areaVars,
    });
  });

  // Constraint C: Linking Shops to Floors (Big-M Logic)
  activeFloors.forEach(f => {
    const floorList = shopsByFloor[f] || [];
    const numShopsOnFloor = floorList.length;
    if (numShopsOnFloor === 0) return;

    buckets.forEach(j => {
      const upVars: Array<{ name: string; coef: number }> = [];
      const lowVars: Array<{ name: string; coef: number }> = [];

      floorList.forEach(s => {
        const xVar = `x_f${s.floor}_i${s.id}_j${j}`;
        upVars.push({ name: xVar, coef: 1 });
        lowVars.push({ name: xVar, coef: 1 });
      });

      const yVar = `y_f${f}_j${j}`;
      upVars.push({ name: yVar, coef: -numShopsOnFloor });
      lowVars.push({ name: yVar, coef: -1 });

      subjectTo.push({
        name: `FloorLinkUp_f${f}_j${j}`,
        bnds: { type: glpk.GLP_UP, lb: 0, ub: 0 },
        vars: upVars,
      });

      subjectTo.push({
        name: `FloorLinkLow_f${f}_j${j}`,
        bnds: { type: glpk.GLP_LO, lb: 0, ub: 0 },
        vars: lowVars,
      });
    });
  });

  // Constraint D: Floor Diversity Limit (Sum_f y >= D)
  const availableFloorsWithShops = activeFloors.filter(f => (shopsByFloor[f] || []).length > 0).length;
  const effectiveD = Math.min(D, availableFloorsWithShops);

  if (effectiveD > 0) {
    buckets.forEach(j => {
      const diversityVars: Array<{ name: string; coef: number }> = [];
      activeFloors.forEach(f => {
        if ((shopsByFloor[f] || []).length > 0) {
          diversityVars.push({ name: `y_f${f}_j${j}`, coef: 1 });
        }
      });
      subjectTo.push({
        name: `FloorDiversity_j${j}`,
        bnds: { type: glpk.GLP_LO, lb: effectiveD, ub: 0 },
        vars: diversityVars,
      });
    });
  }

  // Constraint E: Integer Cuts for subsequent solutions
  historicalCuts.forEach((cutMatrix, cutIndex) => {
    const cutVars: Array<{ name: string; coef: number }> = [];
    cutMatrix.forEach(varName => {
      cutVars.push({ name: varName, coef: 1 });
    });

    subjectTo.push({
      name: `IntegerCut_${cutIndex}`,
      bnds: { type: glpk.GLP_UP, lb: 0, ub: cutMatrix.length - 1 },
      vars: cutVars,
    });
  });

  // Symmetry Breaking Anchor:
  // Fix the single largest shop on Ground Floor (Floor 0, Shop 1) to Bucket 1
  // This eliminates 7! = 5,040 equivalent bucket permutations and drastically speeds up search
  const anchorShop = activeShops.find(s => s.floor === 0 && s.id === '1');
  if (anchorShop && historicalCuts.length === 0) {
    subjectTo.push({
      name: 'SymmetryBreak_Anchor',
      bnds: { type: glpk.GLP_FX, lb: 1, ub: 1 },
      vars: [{ name: 'x_f0_i1_j1', coef: 1 }],
    });
  }

  return {
    model: {
      name: 'ShopAllocationMILP',
      objective: {
        direction: glpk.GLP_MIN, // 1
        name: 'Objective',
        vars: objVars,
      },
      subjectTo,
      binaries,
    },
    targetAmount,
    targetArea,
    activeShops,
  };
}

/**
 * Solve MILP asynchronously with glpk.js, iterating with Integer Cuts.
 */
export async function solveShopAllocation(
  shops: Shop[],
  rates: FloorRates,
  config: SolverConfig,
  onProgress?: (msg: string) => void
): Promise<SolutionResult[]> {
  const startTime = performance.now();
  const glpk = await getGlpkInstance();
  if (!glpk) {
    throw new Error('GLPK WebAssembly solver failed to initialize.');
  }

  onProgress?.(`Configuring MILP constraints (Diversity D = ${config.D}, Weight w = ${config.weight.toFixed(2)})...`);

  const verifiedSolutions: SolutionResult[] = [];
  const historicalCuts: string[][] = [];
  let absoluteBestObjective: number | null = null;
  let lookForMore = true;
  const maxSol = Math.max(1, Math.min(config.maxSolutions, 5));

  while (lookForMore && verifiedSolutions.length < maxSol) {
    const iterNum = verifiedSolutions.length + 1;
    onProgress?.(`Solving scenario iteration ${iterNum} of ${maxSol}...`);

    // Yield control to browser rendering loop
    await new Promise(resolve => setTimeout(resolve, 30));

    const { model, targetAmount, targetArea, activeShops } = buildGlpkModel(
      glpk,
      shops,
      rates,
      config.D,
      config.weight,
      historicalCuts,
      config.normalizeObjective
    );

    const options = {
      kind: glpk.GLP_MIP,
      skip: false,
      msglev: glpk.GLP_MSG_OFF,
      presolve: true,
      mipgap: config.mipGap !== undefined ? config.mipGap : 0.02, // 2% MIP gap
      tmlim: config.timeout !== undefined ? config.timeout : 20,    // 20s timeout per scenario
    };

    let solveResult: any = null;
    try {
      // In the browser, glpk.solve returns a Promise from a Web Worker
      solveResult = await glpk.solve(model, options);
    } catch (e: any) {
      console.error('GLPK solve execution exception:', e);
      break;
    }

    // Crucial: in glpk.js, status is at solveResult.result.status
    const innerResult = solveResult?.result;
    const statusCode = innerResult?.status;
    const isOptimal = statusCode === glpk.GLP_OPT;   // 5
    const isFeasible = statusCode === glpk.GLP_FEAS; // 2
    const hasVars = innerResult && innerResult.vars && Object.keys(innerResult.vars).length > 0;

    if (innerResult && (isOptimal || isFeasible || hasVars) && innerResult.vars) {
      const currentObj = innerResult.z;

      if (absoluteBestObjective === null) {
        absoluteBestObjective = currentObj;
      } else if (Math.abs(currentObj - absoluteBestObjective) > 0.15 * Math.abs(absoluteBestObjective) + 1e-3) {
        // Stop if alternative solution quality degrades too much
        lookForMore = false;
      }

      // Extract assignments
      const activeAssignments: string[] = [];
      const bucketShopMap: Record<number, Array<{ floor: number; id: string; area: number; value: number }>> = {
        1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [],
      };

      const shopsLookup: Record<string, Shop & { amount: number }> = {};
      activeShops.forEach(s => {
        shopsLookup[`${s.floor}_${s.id}`] = s;
      });

      Object.keys(innerResult.vars).forEach(varName => {
        const val = Math.round(innerResult.vars[varName]);
        if (varName.startsWith('x_') && val === 1) {
          activeAssignments.push(varName);

          const parts = varName.split('_');
          const floorNum = parseInt(parts[1].replace('f', ''), 10);
          const shopId = parts[2].replace('i', '');
          const bucketId = parseInt(parts[3].replace('j', ''), 10);

          const matchedShop = shopsLookup[`${floorNum}_${shopId}`];
          if (matchedShop && bucketShopMap[bucketId]) {
            bucketShopMap[bucketId].push({
              floor: floorNum,
              id: shopId,
              area: matchedShop.area,
              value: matchedShop.amount,
            });
          }
        }
      });

      // Compute statistics for each bucket
      const buckets: BucketAllocation[] = [1, 2, 3, 4, 5, 6, 7].map(bId => {
        const allocatedShops = bucketShopMap[bId] || [];
        const totalArea = allocatedShops.reduce((sum, s) => sum + s.area, 0);
        const totalValue = allocatedShops.reduce((sum, s) => sum + s.value, 0);
        const areaDiff = totalArea - targetArea;
        const valueDiff = totalValue - targetAmount;
        const areaVariancePct = targetArea > 0 ? (areaDiff / targetArea) * 100 : 0;
        const valueVariancePct = targetAmount > 0 ? (valueDiff / targetAmount) * 100 : 0;
        const distinctFloors = new Set(allocatedShops.map(s => s.floor)).size;

        return {
          bucketId: bId,
          shops: allocatedShops,
          totalArea,
          totalValue,
          targetArea,
          targetValue: targetAmount,
          areaDiff,
          valueDiff,
          areaVariancePct,
          valueVariancePct,
          floorsCount: distinctFloors,
        };
      });

      verifiedSolutions.push({
        solutionIndex: verifiedSolutions.length + 1,
        objectiveVariance: currentObj,
        buckets,
        runtimeMs: Math.round(performance.now() - startTime),
        activeShopsCount: activeShops.length,
        status: isOptimal ? 'optimal' : 'feasible',
      });

      // Append integer cut constraint
      historicalCuts.push(activeAssignments);
    } else {
      if (verifiedSolutions.length === 0) {
        onProgress?.(`No solution found with current constraints (D = ${config.D}). Try relaxing D.`);
      }
      lookForMore = false;
      break;
    }
  }

  onProgress?.(`Solved in ${(performance.now() - startTime).toFixed(0)}ms: ${verifiedSolutions.length} solution set(s) generated.`);
  return verifiedSolutions;
}
