/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DEFAULT_SHOPS, DEFAULT_FLOOR_RATES, INITIAL_SOLUTIONS } from './data/initialData';
import { Shop, FloorRates, SolverConfig, SolutionResult } from './types/allocation';
import { solveShopAllocation } from './solver/glpkSolver';
import { ModelViewerContainer } from './components/ModelViewerContainer';
import { SummaryRibbon } from './components/SummaryRibbon';
import { BucketResultsGrid } from './components/BucketResultsGrid';
import { EditVariablesConsole } from './components/EditVariablesConsole';
import { ShopDataTable } from './components/ShopDataTable';
import { ExperimentHistoryModal } from './components/ExperimentHistoryModal';
import { saveExperimentRun } from './services/experimentsService';
import { Play, Loader2, History } from 'lucide-react';

export default function App() {
  // Shops state
  const [shops, setShops] = useState<Shop[]>(DEFAULT_SHOPS);

  // Floor rates state: 1 rate per floor
  const [rates, setRates] = useState<FloorRates>(DEFAULT_FLOOR_RATES);

  // Active floors in allocation split
  const [activeFloors, setActiveFloors] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    4: true,
  });

  // Solver Configuration
  const [config, setConfig] = useState<SolverConfig>({
    D: 2, // minimum floors each bucket must hold
    weight: 0.5, // 50% value weight, 50% area weight
    maxSolutions: 2,
    symmetryBreaking: true,
    normalizeObjective: true,
    timeout: 20,
    mipGap: 0.02,
  });

  // Solver Solutions State initialized with verified baseline solutions
  const [solutions, setSolutions] = useState<SolutionResult[]>(INITIAL_SOLUTIONS);
  const [activeSolutionIdx, setActiveSolutionIdx] = useState<number>(0);
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [solverProgress, setSolverProgress] = useState<string | null>(
    'Active Baseline: Balanced allocation loaded (D = 2, all 7 buckets populated).'
  );

  // Interactive cross-component hover & filter state
  const [hoveredShop, setHoveredShop] = useState<{ floor: number; id: string } | null>(null);
  const [selectedBucketId, setSelectedBucketId] = useState<number | null>(null);

  // Firestore Experiment History state
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isSavingExperiment, setIsSavingExperiment] = useState<boolean>(false);

  // Save current solution to Firestore
  const handleSaveCurrentExperiment = async () => {
    if (!solutions || solutions.length === 0) return;
    setIsSavingExperiment(true);
    try {
      const top = solutions[activeSolutionIdx] || solutions[0];
      const runName = `w=${(config.weight * 100).toFixed(0)}% D=${config.D} (${top.status.toUpperCase()})`;
      await saveExperimentRun(
        runName,
        config,
        rates,
        activeShopsCount,
        totalArea,
        totalValue,
        targetArea,
        targetValue,
        solutions,
        `Timeout: ${config.timeout}s, MIP Gap: ${((config.mipGap ?? 0.02) * 100).toFixed(1)}%`
      );
      setSolverProgress(`Successfully saved run to Firestore (${runName})`);
    } catch (err: any) {
      console.error('Failed to save experiment:', err);
      setSolverProgress(`Error saving run to Firestore: ${err.message || 'Check console'}`);
    } finally {
      setIsSavingExperiment(false);
    }
  };

  // Restore saved run from Firestore
  const handleRestoreExperiment = (
    savedSolutions: SolutionResult[],
    savedConfig: SolverConfig,
    savedRates: FloorRates
  ) => {
    setSolutions(savedSolutions);
    setActiveSolutionIdx(0);
    setConfig(savedConfig);
    setRates(savedRates);
    setSolverProgress(`Loaded test run with ${savedSolutions.length} solution set(s) from Firestore.`);
  };

  // Portfolio Totals & Target Averages
  const { totalValue, totalArea, targetValue, targetArea, activeShopsCount } = useMemo(() => {
    let tVal = 0;
    let tArea = 0;
    let count = 0;

    shops.forEach(s => {
      if (s.active !== false && activeFloors[s.floor]) {
        const floorRate = rates[s.floor] || 0;
        tArea += s.area;
        tVal += s.area * floorRate;
        count++;
      }
    });

    const numBuckets = 7;
    return {
      totalValue: tVal,
      totalArea: tArea,
      targetValue: numBuckets > 0 ? tVal / numBuckets : 0,
      targetArea: numBuckets > 0 ? tArea / numBuckets : 0,
      activeShopsCount: count,
    };
  }, [shops, rates, activeFloors]);

  // Run MILP Solver with glpk.js
  const handleRunSolver = useCallback(async () => {
    setIsSolving(true);
    setSolverProgress('Initializing GLPK WebAssembly Mixed-Integer Solver...');

    // Filter active shops and floor rates
    const effectiveRates: FloorRates = {};
    Object.keys(rates).forEach(fKey => {
      const fNum = Number(fKey);
      if (activeFloors[fNum]) {
        effectiveRates[fNum] = rates[fNum];
      }
    });

    try {
      const results = await solveShopAllocation(
        shops,
        effectiveRates,
        config,
        progressMsg => {
          setSolverProgress(progressMsg);
        }
      );

      if (results && results.length > 0) {
        setSolutions(results);
        setActiveSolutionIdx(0);
        setSolverProgress(
          `Solved in ${results[0].runtimeMs}ms: Generated ${results.length} scenario set(s). All 7 buckets balanced.`
        );
      } else {
        setSolverProgress('Solver returned no feasible solution. Try relaxing diversity D or adjusting active floors.');
      }
    } catch (err: any) {
      console.error('Error running MILP solver:', err);
      setSolverProgress(`Solver error: ${err.message || 'Unknown issue'}`);
    } finally {
      setIsSolving(false);
    }
  }, [shops, rates, activeFloors, config]);

  // Initial automatic solve on mount
  useEffect(() => {
    handleRunSolver();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update shop area inline
  const handleUpdateShopArea = (floor: number, id: string, newArea: number) => {
    setShops(prev =>
      prev.map(s => (s.floor === floor && s.id === id ? { ...s, area: newArea } : s))
    );
  };

  // Toggle active status for single shop
  const handleToggleShopActive = (floor: number, id: string) => {
    setShops(prev =>
      prev.map(s => (s.floor === floor && s.id === id ? { ...s, active: !(s.active !== false) } : s))
    );
  };

  // Add new shop
  const handleAddShop = (newShop: Shop) => {
    setShops(prev => [...prev, newShop]);
  };

  // Delete shop
  const handleDeleteShop = (floor: number, id: string) => {
    setShops(prev => prev.filter(s => !(s.floor === floor && s.id === id)));
  };

  // Update floor rate (single global rate per floor)
  const handleUpdateFloorRate = (floor: number, newRate: number) => {
    setRates(prev => ({ ...prev, [floor]: newRate }));
  };

  // Toggle active floor
  const handleToggleFloor = (floor: number) => {
    setActiveFloors(prev => ({ ...prev, [floor]: !prev[floor] }));
  };

  // Update solver config
  const handleUpdateConfig = (newCfg: Partial<SolverConfig>) => {
    setConfig(prev => ({ ...prev, ...newCfg }));
  };

  // Reset to default dataset
  const handleResetDefaults = () => {
    setShops(DEFAULT_SHOPS);
    setRates(DEFAULT_FLOOR_RATES);
    setActiveFloors({ 0: true, 1: true, 2: true, 4: true });
    setConfig({
      D: 2,
      weight: 0.5,
      maxSolutions: 3,
      symmetryBreaking: true,
      normalizeObjective: true,
      timeout: 20,
      mipGap: 0.02,
    });
    setSelectedBucketId(null);
  };

  const currentBuckets = solutions[activeSolutionIdx]?.buckets || [];

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1F2937] flex flex-col font-sans selection:bg-gray-200">
      {/* 1. Header (Strict Top Bar Contract: Brand · Info Links · Primary Action) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 lg:px-8 py-3 flex items-center justify-between shadow-2xs">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2">
          <span className="text-base font-bold tracking-tight text-gray-900">
            Shop Allocation
          </span>
        </div>

        {/* Zone 2: Navigation / Info */}
        <div className="hidden md:flex items-center gap-4 text-xs font-medium text-gray-600">
          <span>4 Architectural Floors (G, 1F, 2F, 4F)</span>
          <span className="text-gray-300">·</span>
          <span>7 Allocation Buckets</span>
          <span className="text-gray-300">·</span>
          <span>Area & Valuation Goal Programming</span>
        </div>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunSolver}
            disabled={isSolving}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800 disabled:bg-gray-500 rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:cursor-not-allowed"
          >
            {isSolving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Solving...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Run Solver</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. Main Content Body Layout */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-4 lg:p-6 flex flex-col gap-5">
        {/* Top Summary Metrics Ribbon */}
        <SummaryRibbon
          totalValue={totalValue}
          totalArea={totalArea}
          targetValue={targetValue}
          targetArea={targetArea}
          activeShopsCount={activeShopsCount}
          totalShopsCount={shops.length}
        />

        {/* Core Layout Split: Model on the Left, Solutions & Variables on the Right */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN: 3D Stacked View & 2D Floor Plan Schematic Model */}
          <section className="xl:col-span-5 h-[580px] xl:h-[820px] xl:sticky xl:top-20 flex flex-col">
            <ModelViewerContainer
              allocations={currentBuckets}
              shops={shops}
              rates={rates}
              hoveredShop={hoveredShop}
              onHoverShop={setHoveredShop}
              selectedBucketId={selectedBucketId}
              onSelectBucketId={setSelectedBucketId}
            />
          </section>

          {/* RIGHT COLUMN: Upper Solutions with Buckets, Lower Edit Variables & Data Table */}
          <section className="xl:col-span-7 flex flex-col gap-5">
            {/* Upper Right: Solution(s) with the 7 Buckets & Variance Metrics */}
            <BucketResultsGrid
              solutions={solutions}
              activeSolutionIndex={activeSolutionIdx}
              onSelectSolution={setActiveSolutionIdx}
              hoveredShop={hoveredShop}
              onHoverShop={setHoveredShop}
              selectedBucketId={selectedBucketId}
              onSelectBucketId={setSelectedBucketId}
              onSaveExperiment={handleSaveCurrentExperiment}
              onOpenHistory={() => setIsHistoryOpen(true)}
              isSavingExperiment={isSavingExperiment}
            />

            {/* Lower Right Section 1: Edit Variables Console (Floor Rates, w slider, D input) */}
            <EditVariablesConsole
              rates={rates}
              onUpdateRate={handleUpdateFloorRate}
              activeFloors={activeFloors}
              onToggleFloor={handleToggleFloor}
              config={config}
              onUpdateConfig={handleUpdateConfig}
              onRunSolver={handleRunSolver}
              isSolving={isSolving}
              solverProgress={solverProgress}
              onResetDefaults={handleResetDefaults}
            />

            {/* Lower Right Section 2: Shop Inventory Data Table (Area edits, Add, Delete) */}
            <ShopDataTable
              shops={shops}
              rates={rates}
              onUpdateShopArea={handleUpdateShopArea}
              onToggleShopActive={handleToggleShopActive}
              onAddShop={handleAddShop}
              onDeleteShop={handleDeleteShop}
              hoveredShop={hoveredShop}
              onHoverShop={setHoveredShop}
            />
          </section>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 lg:px-8 py-3 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>Mixed-Integer Linear Programming Shop Partitioning</span>
          <span>·</span>
          <span>7-Bucket Goal Programming</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="hover:text-gray-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            <span>Firestore Experiment History</span>
          </button>
        </div>
      </footer>

      {/* 4. Persistent Experiment Runs Modal */}
      <ExperimentHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onRestoreRun={handleRestoreExperiment}
      />
    </div>
  );
}
