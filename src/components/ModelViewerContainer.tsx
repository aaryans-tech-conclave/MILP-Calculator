import React, { useState } from 'react';
import { ThreeFloorPlanViewer } from './ThreeFloorPlanViewer';
import { Schematic2DViewer } from './Schematic2DViewer';
import { BucketAllocation, Shop } from '../types/allocation';
import { BUCKET_THEMES } from '../data/initialData';
import { Box, LayoutGrid } from 'lucide-react';

interface ModelViewerContainerProps {
  allocations: BucketAllocation[];
  shops: Shop[];
  rates: Record<number, number>;
  hoveredShop: { floor: number; id: string } | null;
  onHoverShop: (shop: { floor: number; id: string } | null) => void;
  selectedBucketId: number | null;
  onSelectBucketId: (id: number | null) => void;
}

export const ModelViewerContainer: React.FC<ModelViewerContainerProps> = ({
  allocations,
  shops,
  rates,
  hoveredShop,
  onHoverShop,
  selectedBucketId,
  onSelectBucketId,
}) => {
  const [viewType, setViewType] = useState<'3d' | '2d'>('3d');

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl p-3 shadow-xs">
      {/* Top Header & Switcher */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-900 tracking-tight">
            Spatial Floor Plan Model
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">4 Layers (G, 1F, 2F, 4F)</span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
          <button
            onClick={() => setViewType('3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewType === '3d'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-gray-700" />
            3D Stacked View
          </button>
          <button
            onClick={() => setViewType('2d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              viewType === '2d'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-gray-700" />
            2D Schematic Plan
          </button>
        </div>
      </div>

      {/* Interactive Canvas / Visualizer Area */}
      <div className="flex-1 w-full min-h-[460px] relative">
        {viewType === '3d' ? (
          <ThreeFloorPlanViewer
            allocations={allocations}
            shops={shops}
            rates={rates}
            hoveredShop={hoveredShop}
            onHoverShop={onHoverShop}
            selectedBucketId={selectedBucketId}
          />
        ) : (
          <Schematic2DViewer
            allocations={allocations}
            shops={shops}
            rates={rates}
            hoveredShop={hoveredShop}
            onHoverShop={onHoverShop}
            selectedBucketId={selectedBucketId}
          />
        )}
      </div>

      {/* Functional Low-Saturation Color Legend Bar */}
      <div className="mt-2.5 pt-2.5 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-gray-600">
          <span className="font-medium text-gray-700">Filter Bucket:</span>
          {selectedBucketId !== null && (
            <button
              onClick={() => onSelectBucketId(null)}
              className="text-[11px] text-gray-500 hover:text-gray-900 underline ml-1 cursor-pointer"
            >
              Show All
            </button>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-1.5">
          {BUCKET_THEMES.map(theme => {
            const isSelected = selectedBucketId === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => onSelectBucketId(isSelected ? null : theme.id)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all border ${
                  isSelected
                    ? 'ring-2 ring-gray-900 shadow-xs font-semibold'
                    : 'hover:border-gray-400'
                }`}
                style={{
                  backgroundColor: theme.bgLightHex,
                  borderColor: theme.borderHex,
                  color: theme.textHex,
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: theme.hex }}
                />
                <span>B{theme.id}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
