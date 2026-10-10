import React from 'react';
import { formatINR, formatINRLong } from '../utils/formatters';

interface SummaryRibbonProps {
  totalValue: number;
  totalArea: number;
  targetValue: number;
  targetArea: number;
  activeShopsCount: number;
  totalShopsCount: number;
}

export const SummaryRibbon: React.FC<SummaryRibbonProps> = ({
  totalValue,
  totalArea,
  targetValue,
  targetArea,
  activeShopsCount,
  totalShopsCount,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Portfolio Valuation & Target Balance
        </span>
        <span className="text-xs text-gray-500 tabular-nums">
          Active Shops: <strong className="text-gray-900 font-semibold">{activeShopsCount}</strong> of {totalShopsCount}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Valuation */}
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 font-medium">Total Property Valuation</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-lg md:text-xl font-bold text-gray-900 tabular-nums">
              {formatINR(totalValue)}
            </span>
            <span className="text-[11px] text-gray-400 tabular-nums">
              ({formatINRLong(totalValue)})
            </span>
          </div>
        </div>

        {/* Total Super Built Area */}
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 font-medium">Total Super Built Area</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg md:text-xl font-bold text-gray-900 tabular-nums">
              {totalArea.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500 font-normal">sq.ft</span>
          </div>
        </div>

        {/* Target Value per Bucket (mu_V) */}
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 font-medium">Target Value per Bucket (μ_V)</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-lg md:text-xl font-bold text-gray-900 tabular-nums">
              {formatINR(targetValue)}
            </span>
            <span className="text-[11px] text-gray-400 tabular-nums">
              (1/7th share)
            </span>
          </div>
        </div>

        {/* Target Area per Bucket (mu_A) */}
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 font-medium">Target Area per Bucket (μ_A)</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg md:text-xl font-bold text-gray-900 tabular-nums">
              {targetArea.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500 font-normal">sq.ft / party</span>
          </div>
        </div>
      </div>
    </div>
  );
};
