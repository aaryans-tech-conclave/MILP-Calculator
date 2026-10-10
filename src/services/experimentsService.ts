import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { SolverConfig, FloorRates, SolutionResult } from '../types/allocation';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface ExperimentRunRecord {
  id: string;
  name: string;
  notes?: string;
  createdAt: string;
  runtimeMs: number;
  status: 'optimal' | 'feasible' | 'infeasible';
  config: SolverConfig;
  floorRates: FloorRates;
  activeShopsCount: number;
  totalArea: number;
  totalValue: number;
  targetAreaPerBucket: number;
  targetValuePerBucket: number;
  solutionsCount: number;
  summary: {
    bestObjective: number;
    maxAreaDeviation: number;
    maxValueDeviation: number;
    totalAreaDeviation: number;
    totalValueDeviation: number;
  };
  solutions: SolutionResult[];
}

const COLLECTION_PATH = 'experiments';

export async function saveExperimentRun(
  name: string,
  config: SolverConfig,
  floorRates: FloorRates,
  activeShopsCount: number,
  totalArea: number,
  totalValue: number,
  targetArea: number,
  targetValue: number,
  solutions: SolutionResult[],
  notes?: string
): Promise<ExperimentRunRecord> {
  const id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const topSol = solutions[0];

  let maxAreaDev = 0;
  let maxValDev = 0;
  let totalAreaDev = 0;
  let totalValDev = 0;

  if (topSol && topSol.buckets) {
    topSol.buckets.forEach(b => {
      const aDiff = Math.abs(b.areaDiff);
      const vDiff = Math.abs(b.valueDiff);
      totalAreaDev += aDiff;
      totalValDev += vDiff;
      if (aDiff > maxAreaDev) maxAreaDev = aDiff;
      if (vDiff > maxValDev) maxValDev = vDiff;
    });
  }

  const compactSolutions = solutions.map(sol => ({
    solutionIndex: sol.solutionIndex,
    objectiveVariance: Math.round(sol.objectiveVariance * 1000) / 1000,
    runtimeMs: sol.runtimeMs,
    activeShopsCount: sol.activeShopsCount,
    status: sol.status,
    buckets: sol.buckets.map(b => ({
      bucketId: b.bucketId,
      totalArea: Math.round(b.totalArea * 10) / 10,
      totalValue: Math.round(b.totalValue),
      targetArea: Math.round(b.targetArea * 10) / 10,
      targetValue: Math.round(b.targetValue),
      areaDiff: Math.round(b.areaDiff * 10) / 10,
      valueDiff: Math.round(b.valueDiff),
      areaVariancePct: Math.round(b.areaVariancePct * 100) / 100,
      valueVariancePct: Math.round(b.valueVariancePct * 100) / 100,
      floorsCount: b.floorsCount,
      shops: b.shops.map(s => ({
        id: s.id,
        floor: s.floor,
        area: Math.round(s.area * 10) / 10,
        value: Math.round(s.value),
      })),
    })),
  }));

  const record: ExperimentRunRecord = {
    id,
    name: name.trim() || `Run ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
    notes: notes ? notes.trim() : '',
    createdAt: new Date().toISOString(),
    runtimeMs: topSol ? topSol.runtimeMs : 0,
    status: topSol ? topSol.status : 'infeasible',
    config,
    floorRates,
    activeShopsCount,
    totalArea: Math.round(totalArea * 10) / 10,
    totalValue: Math.round(totalValue),
    targetAreaPerBucket: Math.round(targetArea * 10) / 10,
    targetValuePerBucket: Math.round(targetValue),
    solutionsCount: compactSolutions.length,
    summary: {
      bestObjective: topSol ? Math.round(topSol.objectiveVariance * 1000) / 1000 : 0,
      maxAreaDeviation: Math.round(maxAreaDev * 10) / 10,
      maxValueDeviation: Math.round(maxValDev),
      totalAreaDeviation: Math.round(totalAreaDev * 10) / 10,
      totalValueDeviation: Math.round(totalValDev),
    },
    solutions: compactSolutions,
  };

  try {
    const docRef = doc(db, COLLECTION_PATH, id);
    await setDoc(docRef, record);
    return record;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTION_PATH}/${id}`);
  }
}

export async function loadExperimentRuns(maxLimit = 50): Promise<ExperimentRunRecord[]> {
  try {
    const q = query(collection(db, COLLECTION_PATH), orderBy('createdAt', 'desc'), limit(maxLimit));
    const snapshot = await getDocs(q);
    const results: ExperimentRunRecord[] = [];
    snapshot.forEach(d => {
      results.push(d.data() as ExperimentRunRecord);
    });
    return results;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTION_PATH);
  }
}

export async function deleteExperimentRun(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_PATH, id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_PATH}/${id}`);
  }
}
