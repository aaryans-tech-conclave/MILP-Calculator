import React, { useState, useEffect } from 'react';
import {
  ExperimentRunRecord,
  loadExperimentRuns,
  deleteExperimentRun,
} from '../services/experimentsService';
import { SolutionResult, SolverConfig, FloorRates } from '../types/allocation';
import { formatINR, formatArea } from '../utils/formatters';
import {
  History,
  X,
  Play,
  Trash2,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ExperimentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreRun: (
    solutions: SolutionResult[],
    config: SolverConfig,
    rates: FloorRates
  ) => void;
}

export const ExperimentHistoryModal: React.FC<ExperimentHistoryModalProps> = ({
  isOpen,
  onClose,
  onRestoreRun,
}) => {
  const [runs, setRuns] = useState<ExperimentRunRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const fetchRuns = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await loadExperimentRuns(30);
      setRuns(data);
      if (data.length > 0 && !selectedRunId) {
        setSelectedRunId(data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load runs:', err);
      setErrorMsg('Could not fetch runs from Firestore. Verify connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRuns();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeRun = runs.find(r => r.id === selectedRunId) || runs[0];

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this experiment run from Firestore?')) return;
    try {
      await deleteExperimentRun(id);
      setRuns(prev => prev.filter(r => r.id !== id));
      if (selectedRunId === id) {
        setSelectedRunId(null);
      }
    } catch (err) {
      console.error('Failed to delete run:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-5xl w-full h-[85vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center shadow-xs">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Firestore Test Suite & Experiment Runs
              </h2>
              <p className="text-xs text-gray-500">
                Persistent benchmark runs stored in Cloud Firestore (Spark Free Tier)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRuns}
              disabled={isLoading}
              title="Refresh runs"
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Left = Runs List, Right = Detailed Run Analytics */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {/* Left Column: Runs Master List */}
          <div className="w-full md:w-80 flex flex-col bg-gray-50/40">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <span>Saved Runs ({runs.length})</span>
              <span className="text-[11px] font-normal text-gray-400">Click to inspect</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {isLoading && runs.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-gray-400" />
                  Loading runs from Firestore...
                </div>
              ) : runs.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500 px-4">
                  <Layers className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  No experiment runs saved yet.
                  <div className="mt-1 text-[11px] text-gray-400">
                    Run the solver and click &ldquo;Save to Firestore&rdquo; to record benchmarks!
                  </div>
                </div>
              ) : (
                runs.map(run => {
                  const isSelected = run.id === selectedRunId;
                  const dateStr = new Date(run.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <div
                      key={run.id}
                      onClick={() => setSelectedRunId(run.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer group flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-white border-gray-900 shadow-xs ring-1 ring-gray-900'
                          : 'bg-white/80 hover:bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {run.name}
                        </span>
                        <button
                          onClick={e => handleDelete(run.id, e)}
                          title="Delete run"
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-600 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
                        <span>w={run.config?.weight?.toFixed(2)} · D={run.config?.D}</span>
                        <span>{run.runtimeMs}ms</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-100">
                        <span>{dateStr}</span>
                        <span
                          className={`font-semibold uppercase tracking-wider ${
                            run.status === 'optimal' ? 'text-emerald-600' : 'text-blue-600'
                          }`}
                        >
                          {run.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Run Detail & Comparison Inspection */}
          <div className="flex-1 flex flex-col overflow-y-auto p-6 bg-white">
            {activeRun ? (
              <div className="space-y-6">
                {/* Run Title and Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{activeRun.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {activeRun.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">
                      Recorded on {new Date(activeRun.createdAt).toLocaleString()} · ID: {activeRun.id}
                    </p>
                    {activeRun.notes && (
                      <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                        {activeRun.notes}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      onRestoreRun(
                        activeRun.solutions,
                        activeRun.config,
                        activeRun.floorRates
                      );
                      onClose();
                    }}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Load This Solution Into Visualizer
                  </button>
                </div>

                {/* Configuration Matrix */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2.5 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    Model Hyperparameters Tested
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] text-gray-500 block">Weight Ratio</span>
                      <span className="font-bold text-gray-900 mt-0.5 block font-mono">
                        Val: {((activeRun.config?.weight ?? 0.5) * 100).toFixed(0)}% / Area:{' '}
                        {((1 - (activeRun.config?.weight ?? 0.5)) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] text-gray-500 block">Floor Diversity (D)</span>
                      <span className="font-bold text-gray-900 mt-0.5 block font-mono">
                        ≥ {activeRun.config?.D ?? 2} floors/bucket
                      </span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] text-gray-500 block">Timeout Limit</span>
                      <span className="font-bold text-gray-900 mt-0.5 block font-mono">
                        {activeRun.config?.timeout ?? 20} seconds
                      </span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] text-gray-500 block">MIP Optimality Gap</span>
                      <span className="font-bold text-gray-900 mt-0.5 block font-mono">
                        {((activeRun.config?.mipGap ?? 0.02) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance Analytics */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Variance & Dispersion Outcome
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                      <span className="text-[11px] text-blue-700 block">Solver Runtime</span>
                      <span className="font-bold text-blue-950 mt-0.5 block font-mono text-sm">
                        {activeRun.runtimeMs} ms
                      </span>
                    </div>
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                      <span className="text-[11px] text-emerald-700 block">Total Area Deviation</span>
                      <span className="font-bold text-emerald-950 mt-0.5 block font-mono text-sm">
                        {formatArea(activeRun.summary?.totalAreaDeviation || 0)}
                      </span>
                    </div>
                    <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200">
                      <span className="text-[11px] text-purple-700 block">Total Value Deviation</span>
                      <span className="font-bold text-purple-950 mt-0.5 block font-mono text-sm">
                        {formatINR(activeRun.summary?.totalValueDeviation || 0)}
                      </span>
                    </div>
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                      <span className="text-[11px] text-amber-700 block">Max Single Deviation</span>
                      <span className="font-bold text-amber-950 mt-0.5 block font-mono text-sm">
                        {formatArea(activeRun.summary?.maxAreaDeviation || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bucket Breakdown Table */}
                {activeRun.solutions && activeRun.solutions[0] && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                      7-Bucket Distribution Snapshot (Best Optimum)
                    </h4>
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                          <tr>
                            <th className="p-2.5">Bucket</th>
                            <th className="p-2.5">Shops</th>
                            <th className="p-2.5">Total Area</th>
                            <th className="p-2.5">Δ Area</th>
                            <th className="p-2.5">Total Value</th>
                            <th className="p-2.5">Δ Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                          {activeRun.solutions[0].buckets.map(b => (
                            <tr key={b.bucketId} className="hover:bg-gray-50/60">
                              <td className="p-2.5 font-sans font-medium text-gray-900">
                                Bucket {b.bucketId}
                              </td>
                              <td className="p-2.5 text-gray-600">{b.shops.length} units</td>
                              <td className="p-2.5 font-medium">{formatArea(b.totalArea)}</td>
                              <td className={`p-2.5 ${b.areaDiff >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                                {b.areaDiff >= 0 ? '+' : ''}{b.areaDiff.toFixed(0)} sq.ft
                              </td>
                              <td className="p-2.5 font-medium">{formatINR(b.totalValue)}</td>
                              <td className={`p-2.5 ${b.valueDiff >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                                {b.valueDiff >= 0 ? '+' : ''}{formatINR(b.valueDiff)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-24 text-center text-xs text-gray-400">
                Select a test run from the left panel to inspect its metrics.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Connected to Cloud Firestore Database: <code className="font-mono text-gray-700">mystic-sled-9zbz0</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
