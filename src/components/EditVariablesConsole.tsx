import React, { useState, useEffect } from 'react';
import { FloorRates, SolverConfig } from '../types/allocation';
import { FLOOR_NAMES } from '../data/initialData';
import { Sliders, Play, Loader2, RefreshCw } from 'lucide-react';

interface EditVariablesConsoleProps {
  rates: FloorRates;
  onUpdateRate: (floor: number, newRate: number) => void;
  activeFloors: Record<number, boolean>;
  onToggleFloor: (floor: number) => void;
  config: SolverConfig;
  onUpdateConfig: (newConfig: Partial<SolverConfig>) => void;
  onRunSolver: () => void;
  isSolving: boolean;
  solverProgress: string | null;
  onResetDefaults: () => void;
}

export const EditVariablesConsole: React.FC<EditVariablesConsoleProps> = ({
  rates,
  onUpdateRate,
  activeFloors,
  onToggleFloor,
  config,
  onUpdateConfig,
  onRunSolver,
  isSolving,
  solverProgress,
  onResetDefaults,
}) => {
  const floors = [0, 1, 2, 4];

  // Local state for smooth numeric input editing
  const [timeoutStr, setTimeoutStr] = useState<string>(String(config.timeout ?? 20));
  const [mipGapStr, setMipGapStr] = useState<string>(
    String(Number(((config.mipGap ?? 0.02) * 100).toFixed(2)))
  );

  useEffect(() => {
    setTimeoutStr(String(config.timeout ?? 20));
  }, [config.timeout]);

  useEffect(() => {
    setMipGapStr(String(Number(((config.mipGap ?? 0.02) * 100).toFixed(2))));
  }, [config.mipGap]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col gap-4">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-gray-700" />
          <span className="font-semibold text-xs uppercase tracking-wider text-gray-900">
            Model Parameters & Floor Rates
          </span>
        </div>
        <button
          onClick={onResetDefaults}
          className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Reset Defaults
        </button>
      </div>

      {/* Grid: Left = Floor Rates (1 rate per floor), Right = Constraints (w slider, D input) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Floor Rates Table */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-800">
              Floor Rates (₹ / sq.ft)
            </span>
            <span className="text-[11px] text-gray-500">
              Single global rate per floor
            </span>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-100 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="py-1.5 px-2.5 w-10">Active</th>
                  <th className="py-1.5 px-2.5">Floor Level</th>
                  <th className="py-1.5 px-2.5 text-right">Rate (₹/sq.ft)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {floors.map(floorNum => {
                  const isActive = activeFloors[floorNum] !== false;
                  const rateVal = rates[floorNum] || 0;

                  return (
                    <tr
                      key={floorNum}
                      className={isActive ? 'bg-white' : 'bg-gray-100 text-gray-400'}
                    >
                      <td className="py-1.5 px-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => onToggleFloor(floorNum)}
                          className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 accent-gray-900 cursor-pointer"
                        />
                      </td>
                      <td className="py-1.5 px-2.5 font-medium">
                        {FLOOR_NAMES[floorNum]}
                      </td>
                      <td className="py-1.5 px-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-gray-400">₹</span>
                          <input
                            type="number"
                            min={0}
                            step={250}
                            disabled={!isActive}
                            value={rateVal}
                            onChange={e => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              onUpdateRate(floorNum, val);
                            }}
                            className="w-24 text-right py-1 px-2 border border-gray-300 rounded bg-white text-gray-900 font-mono text-xs focus:ring-1 focus:ring-gray-900 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* MILP Optimization Constraints */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold text-gray-800">
            Goal Programming Constraints
          </span>

          {/* Slider for w (Weight: Area vs Value) */}
          <div className="flex flex-col gap-1.5 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700">Objective Weight Ratio:</span>
              <div className="flex items-center gap-1.5 font-mono text-xs tabular-nums">
                <span className="font-semibold text-gray-900">
                  Value: {(config.weight * 100).toFixed(0)}% (w)
                </span>
                <span className="text-gray-400">·</span>
                <span className="font-semibold text-gray-700">
                  Area: {((1 - config.weight) * 100).toFixed(0)}% (1-w)
                </span>
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={config.weight}
              onChange={e => onUpdateConfig({ weight: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
            />

            <div className="flex justify-between text-[11px] text-gray-400">
              <span>0% (Equal Area Only)</span>
              <span>50% (Balanced Goal)</span>
              <span>100% (Equal Value Only)</span>
            </div>
          </div>

          {/* Diversity Constraint D & Solutions Count */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
              <label className="text-xs font-medium text-gray-700">
                Floor Diversity (D):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={config.D}
                  onChange={e => {
                    const dVal = Math.max(1, Math.min(4, parseInt(e.target.value, 10) || 1));
                    onUpdateConfig({ D: dVal });
                  }}
                  className="w-16 py-1 px-2 border border-gray-300 rounded bg-white text-gray-900 font-mono text-xs text-center focus:ring-1 focus:ring-gray-900 focus:outline-none"
                />
                <span className="text-[11px] text-gray-500 leading-tight">
                  Min floors per bucket (Σ y_fj ≥ D)
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
              <label className="text-xs font-medium text-gray-700">
                Alternative Solutions:
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={config.maxSolutions}
                  onChange={e => onUpdateConfig({ maxSolutions: parseInt(e.target.value, 10) })}
                  className="py-1 px-2 border border-gray-300 rounded bg-white text-gray-900 text-xs focus:ring-1 focus:ring-gray-900 focus:outline-none"
                >
                  <option value={1}>1 Optimum</option>
                  <option value={2}>2 Variations</option>
                  <option value={3}>3 Variations</option>
                  <option value={5}>5 Variations</option>
                </select>
                <span className="text-[11px] text-gray-500 leading-tight">
                  Integer cuts exploration
                </span>
              </div>
            </div>
          </div>

          {/* Model Timeout & MIP Optimality Gap Custom Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">
                  Model Timeout (sec):
                </label>
                <span className="text-[10px] text-gray-400">Default: 20s</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={300}
                  step={1}
                  value={timeoutStr}
                  onChange={e => {
                    setTimeoutStr(e.target.value);
                    const parsed = parseInt(e.target.value, 10);
                    if (!isNaN(parsed) && parsed > 0) {
                      onUpdateConfig({ timeout: parsed });
                    }
                  }}
                  onBlur={() => {
                    if (!timeoutStr || isNaN(parseInt(timeoutStr, 10)) || parseInt(timeoutStr, 10) <= 0) {
                      setTimeoutStr('20');
                      onUpdateConfig({ timeout: 20 });
                    }
                  }}
                  className="w-16 py-1 px-2 border border-gray-300 rounded bg-white text-gray-900 font-mono text-xs text-center focus:ring-1 focus:ring-gray-900 focus:outline-none"
                />
                <span className="text-[11px] text-gray-500 leading-tight">
                  Per-cut runtime budget
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-700">
                  MIP Gap (%):
                </label>
                <span className="text-[10px] text-gray-400">Default: 2%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    step={0.5}
                    value={mipGapStr}
                    onChange={e => {
                      setMipGapStr(e.target.value);
                      const parsed = parseFloat(e.target.value);
                      if (!isNaN(parsed) && parsed >= 0) {
                        onUpdateConfig({ mipGap: parsed / 100 });
                      }
                    }}
                    onBlur={() => {
                      if (!mipGapStr || isNaN(parseFloat(mipGapStr)) || parseFloat(mipGapStr) < 0) {
                        setMipGapStr('2');
                        onUpdateConfig({ mipGap: 0.02 });
                      }
                    }}
                    className="w-16 py-1 px-2 border border-gray-300 rounded bg-white text-gray-900 font-mono text-xs text-center focus:ring-1 focus:ring-gray-900 focus:outline-none"
                  />
                  <span className="ml-1 text-xs text-gray-500 font-medium">%</span>
                </div>
                <span className="text-[11px] text-gray-500 leading-tight">
                  Optimality tolerance stop
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Start Calculation Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-500 tabular-nums">
          {solverProgress ? (
            <span className="text-gray-700 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {solverProgress}
            </span>
          ) : (
            <span>
              Ready to solve · Timeout: {config.timeout ?? 20}s · MIP Gap:{' '}
              {Number(((config.mipGap ?? 0.02) * 100).toFixed(2))}%
            </span>
          )}
        </div>

        <button
          onClick={onRunSolver}
          disabled={isSolving}
          className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:cursor-not-allowed"
        >
          {isSolving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Solving MILP Model...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Start Calculation (Solve Allocation)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
