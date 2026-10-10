import React from 'react';
import { SolutionResult, BucketAllocation } from '../types/allocation';
import { BUCKET_THEMES } from '../data/initialData';
import { formatINR, formatINRDelta } from '../utils/formatters';
import { CheckCircle2, Layers, BarChart2, BookmarkPlus, History } from 'lucide-react';

interface BucketResultsGridProps {
  solutions: SolutionResult[];
  activeSolutionIndex: number;
  onSelectSolution: (index: number) => void;
  hoveredShop: { floor: number; id: string } | null;
  onHoverShop: (shop: { floor: number; id: string } | null) => void;
  selectedBucketId: number | null;
  onSelectBucketId: (id: number | null) => void;
  onSaveExperiment?: () => void;
  onOpenHistory?: () => void;
  isSavingExperiment?: boolean;
}

export const BucketResultsGrid: React.FC<BucketResultsGridProps> = ({
  solutions,
  activeSolutionIndex,
  onSelectSolution,
  hoveredShop,
  onHoverShop,
  selectedBucketId,
  onSelectBucketId,
  onSaveExperiment,
  onOpenHistory,
  isSavingExperiment,
}) => {
  const currentSolution = solutions[activeSolutionIndex] || solutions[0];

  if (!currentSolution || !currentSolution.buckets || currentSolution.buckets.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-xs">
        <p className="text-gray-500 text-sm">
          No allocation solution loaded. Click &ldquo;Start Calculation&rdquo; to solve using glpk.js.
        </p>
      </div>
    );
  }

  // Aggregate solution-level statistics
  const numBuckets = currentSolution.buckets.length;
  const totalCreatedValue = currentSolution.buckets.reduce((acc, b) => acc + b.totalValue, 0);
  const totalCreatedArea = currentSolution.buckets.reduce((acc, b) => acc + b.totalArea, 0);
  const avgCreatedValue = numBuckets > 0 ? totalCreatedValue / numBuckets : 0;
  const avgCreatedArea = numBuckets > 0 ? totalCreatedArea / numBuckets : 0;
  const targetValue = currentSolution.buckets[0]?.targetValue || avgCreatedValue;
  const targetArea = currentSolution.buckets[0]?.targetArea || avgCreatedArea;

  // Mean Absolute Deviation (MAD) & Max deviations
  let sumAbsValDiff = 0;
  let sumAbsAreaDiff = 0;
  let maxAbsValPct = 0;
  let maxAbsAreaPct = 0;

  currentSolution.buckets.forEach(b => {
    sumAbsValDiff += Math.abs(b.valueDiff);
    sumAbsAreaDiff += Math.abs(b.areaDiff);
    if (Math.abs(b.valueVariancePct) > maxAbsValPct) maxAbsValPct = Math.abs(b.valueVariancePct);
    if (Math.abs(b.areaVariancePct) > maxAbsAreaPct) maxAbsAreaPct = Math.abs(b.areaVariancePct);
  });

  const madValue = numBuckets > 0 ? sumAbsValDiff / numBuckets : 0;
  const madArea = numBuckets > 0 ? sumAbsAreaDiff / numBuckets : 0;

  // Severity styling for variance depth gradients
  const getVarianceStyle = (pct: number) => {
    const abs = Math.abs(pct);
    if (abs <= 1.5) {
      return {
        bg: 'bg-emerald-50/70 border-emerald-200',
        text: 'text-emerald-900 font-medium',
      };
    } else if (abs <= 4.0) {
      return {
        bg: 'bg-slate-100 border-slate-200',
        text: 'text-slate-800 font-medium',
      };
    } else if (abs <= 8.0) {
      return {
        bg: 'bg-amber-50 border-amber-300',
        text: 'text-amber-900 font-semibold',
      };
    } else {
      return {
        bg: 'bg-gray-800 text-white border-gray-900',
        text: 'text-white font-bold',
      };
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col gap-3">
      {/* Solution Header & Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs uppercase tracking-wider text-gray-600">
            Optimization Solution Sets
          </span>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {currentSolution.status === 'optimal' ? 'Global Optimum' : 'Feasible Configuration'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Alternative Solution Tabs (Integer Cuts) */}
          {solutions.length > 1 && (
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              {solutions.map((sol, idx) => (
                <button
                  key={sol.solutionIndex}
                  onClick={() => onSelectSolution(idx)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    activeSolutionIndex === idx
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Set #{sol.solutionIndex}
                </button>
              ))}
            </div>
          )}

          {/* Firestore Experiment Actions */}
          {onSaveExperiment && (
            <button
              onClick={onSaveExperiment}
              disabled={isSavingExperiment}
              title="Save this solver outcome and configuration to Firestore"
              className="px-2.5 py-1 text-xs font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-gray-600" />
              <span>{isSavingExperiment ? 'Saving...' : 'Save Run'}</span>
            </button>
          )}

          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              title="View saved experiment runs from Cloud Firestore"
              className="px-2.5 py-1 text-xs font-semibold text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <History className="w-3.5 h-3.5 text-gray-700" />
              <span>Saved Runs</span>
            </button>
          )}
        </div>
      </div>

      {/* Solution-Level Aggregate Metrics Ribbon */}
      <div className="bg-gray-50/80 border border-gray-200 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs tabular-nums">
        <div className="flex items-center gap-1.5 font-semibold text-gray-800">
          <BarChart2 className="w-3.5 h-3.5 text-gray-600" />
          <span>Solution #{currentSolution.solutionIndex} Aggregate Performance:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-gray-600">
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Avg Value:</span>
            <strong className="text-gray-900">{formatINR(avgCreatedValue)}</strong>
            <span className="text-[11px] text-gray-400">(Tgt: {formatINR(targetValue)})</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500">Mean Dev:</span>
            <strong className="text-gray-900">±{formatINR(madValue)}</strong>
          </div>

          <div className="h-3 w-px bg-gray-300 hidden md:block" />

          <div className="flex items-center gap-1">
            <span className="text-gray-500">Avg Area:</span>
            <strong className="text-gray-900">{avgCreatedArea.toFixed(1)} sq.ft</strong>
            <span className="text-[11px] text-gray-400">(Tgt: {targetArea.toFixed(1)})</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500">Mean Dev:</span>
            <strong className="text-gray-900">±{madArea.toFixed(1)} sq.ft</strong>
          </div>

          <div className="h-3 w-px bg-gray-300 hidden md:block" />

          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-gray-500">Max Spread:</span>
            <span className="text-gray-900 font-medium">Val ±{maxAbsValPct.toFixed(1)}%</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">Area ±{maxAbsAreaPct.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* 3 Cards Horizontal Side-by-Side Grid (Row 1: 1..3, Row 2: 4..6, Row 3: 7) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3.5">
        {currentSolution.buckets.map((bucket: BucketAllocation) => {
          const theme = BUCKET_THEMES.find(t => t.id === bucket.bucketId) || BUCKET_THEMES[0];
          const isSelected = selectedBucketId === bucket.bucketId;
          const areaVarStyle = getVarianceStyle(bucket.areaVariancePct);
          const valVarStyle = getVarianceStyle(bucket.valueVariancePct);

          const formattedValDelta = `${formatINRDelta(bucket.valueDiff)} (${bucket.valueVariancePct >= 0 ? '+' : ''}${bucket.valueVariancePct.toFixed(1)}%)`;
          const formattedAreaDelta = `${bucket.areaDiff >= 0 ? '+' : ''}${Math.round(bucket.areaDiff)} sq.ft (${bucket.areaVariancePct >= 0 ? '+' : ''}${bucket.areaVariancePct.toFixed(1)}%)`;

          return (
            <div
              key={bucket.bucketId}
              onClick={() => onSelectBucketId(isSelected ? null : bucket.bucketId)}
              className={`min-w-0 w-full flex flex-col rounded-xl border transition-all cursor-pointer overflow-hidden shadow-2xs ${
                isSelected
                  ? 'ring-2 ring-gray-900 shadow-sm border-gray-900'
                  : 'hover:border-gray-400 border-gray-200'
              }`}
              style={{
                backgroundColor: theme.bgLightHex,
              }}
            >
              {/* Bucket Card Header */}
              <div
                className="px-3 py-2 flex items-center justify-between border-b text-xs w-full min-w-0"
                style={{
                  borderBottomColor: theme.borderHex,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                <div className="flex items-center gap-2 font-bold truncate" style={{ color: theme.textHex }}>
                  <span
                    className="w-3 h-3 rounded-full inline-block shrink-0 shadow-2xs"
                    style={{ backgroundColor: theme.hex }}
                  />
                  <span className="truncate text-sm">Bucket {bucket.bucketId}</span>
                </div>
                <span className="text-xs text-gray-500 tabular-nums flex items-center gap-1 font-medium shrink-0">
                  <Layers className="w-3.5 h-3.5 text-gray-400" />
                  {bucket.floorsCount} Floors
                </span>
              </div>

              {/* Assigned Units List: Allotted Shop Cards with Floor, Shop ID, Area, and Value visible together */}
              <div className="p-2 flex-1 flex flex-col gap-1.5 min-h-[140px] max-h-[220px] overflow-y-auto w-full min-w-0">
                <div className="text-[10px] font-semibold text-gray-500 px-0.5 uppercase tracking-wider flex items-center justify-between">
                  <span>Assigned Units</span>
                  <span className="font-mono tabular-nums">{bucket.shops.length} units</span>
                </div>

                {bucket.shops.map(s => {
                  const isHovered = hoveredShop && hoveredShop.floor === s.floor && hoveredShop.id === s.id;
                  const floorCode = s.floor === 0 ? 'G' : `${s.floor}F`;

                  return (
                    <div
                      key={`${s.floor}_${s.id}`}
                      onMouseEnter={e => {
                        e.stopPropagation();
                        onHoverShop({ floor: s.floor, id: s.id });
                      }}
                      onMouseLeave={e => {
                        e.stopPropagation();
                        onHoverShop(null);
                      }}
                      className={`flex items-center justify-between gap-2 px-2.5 py-1.5 bg-white rounded-lg border text-xs tabular-nums transition-all w-full min-w-0 ${
                        isHovered
                          ? 'border-gray-900 ring-1 ring-gray-900 shadow-2xs font-semibold'
                          : 'border-gray-200 hover:border-gray-400 shadow-2xs'
                      }`}
                      title={`Floor ${floorCode} Unit #${s.id}: ${s.area} sq.ft, ${formatINR(s.value)}`}
                    >
                      {/* Left: Floor code & Unit ID */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-100 text-gray-700 font-medium">
                          {floorCode}
                        </span>
                        <span className="font-semibold text-gray-900">
                          #{s.id}
                        </span>
                      </div>

                      {/* Right: Area and Value visible together */}
                      <div className="flex items-center gap-2 text-right leading-tight whitespace-nowrap shrink-0">
                        <span className="text-gray-600 font-medium">
                          {s.area} sq.ft
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="text-gray-900 font-bold">
                          {formatINR(s.value)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals & Variance Metrics Footer: Each within a single line, stacked one below the other */}
              <div className="p-2 border-t border-gray-200/80 bg-white/95 flex flex-col gap-1 w-full min-w-0 overflow-hidden text-xs">
                {/* 1. Total Area */}
                <div
                  className="flex items-center justify-between gap-2 w-full min-w-0 overflow-hidden whitespace-nowrap px-2 py-1 rounded-md bg-gray-50 border border-gray-200/60 tabular-nums"
                  title={`Total Area: ${bucket.totalArea.toLocaleString()} sq.ft`}
                >
                  <span className="text-gray-500 font-medium shrink-0">Total Area</span>
                  <span className="font-bold text-gray-900 text-right">
                    {bucket.totalArea.toLocaleString()} sq.ft
                  </span>
                </div>

                {/* 2. Total Value */}
                <div
                  className="flex items-center justify-between gap-2 w-full min-w-0 overflow-hidden whitespace-nowrap px-2 py-1 rounded-md bg-gray-50 border border-gray-200/60 tabular-nums"
                  title={`Total Value: ${formatINR(bucket.totalValue)}`}
                >
                  <span className="text-gray-500 font-medium shrink-0">Total Value</span>
                  <span className="font-bold text-gray-900 text-right">
                    {formatINR(bucket.totalValue)}
                  </span>
                </div>

                {/* 3. Variance over Value */}
                <div
                  className={`flex items-center justify-between gap-2 w-full min-w-0 overflow-hidden whitespace-nowrap px-2 py-1 rounded-md border tabular-nums ${valVarStyle.bg}`}
                  title={`Value Deviation: ${formattedValDelta}`}
                >
                  <span className="opacity-80 font-medium shrink-0">Δ Value</span>
                  <span className={`font-semibold text-right ${valVarStyle.text}`}>
                    {formattedValDelta}
                  </span>
                </div>

                {/* 4. Variance over Area */}
                <div
                  className={`flex items-center justify-between gap-2 w-full min-w-0 overflow-hidden whitespace-nowrap px-2 py-1 rounded-md border tabular-nums ${areaVarStyle.bg}`}
                  title={`Area Deviation: ${formattedAreaDelta}`}
                >
                  <span className="opacity-80 font-medium shrink-0">Δ Area</span>
                  <span className={`font-semibold text-right ${areaVarStyle.text}`}>
                    {formattedAreaDelta}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
