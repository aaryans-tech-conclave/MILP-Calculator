import React, { useState, useMemo } from 'react';
import { ARCHITECTURAL_LAYOUTS, BUCKET_THEMES, FLOOR_NAMES } from '../data/initialData';
import { BucketAllocation, Shop } from '../types/allocation';
import { formatINR } from '../utils/formatters';

interface Schematic2DViewerProps {
  allocations: BucketAllocation[];
  shops: Shop[];
  rates: Record<number, number>;
  hoveredShop: { floor: number; id: string } | null;
  onHoverShop: (shop: { floor: number; id: string } | null) => void;
  selectedBucketId: number | null;
}

export const Schematic2DViewer: React.FC<Schematic2DViewerProps> = ({
  allocations,
  shops,
  rates,
  hoveredShop,
  onHoverShop,
  selectedBucketId,
}) => {
  const [selectedFloor, setSelectedFloor] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'single' | 'quad'>('single');

  // Map each shop to its assigned bucket
  const shopToBucket = useMemo(() => {
    const map = new Map<string, number>();
    allocations.forEach(bucket => {
      bucket.shops.forEach(s => {
        map.set(`${s.floor}_${s.id}`, bucket.bucketId);
      });
    });
    return map;
  }, [allocations]);

  // Lookup shop metadata
  const shopMetaLookup = useMemo(() => {
    const map = new Map<string, Shop>();
    shops.forEach(s => {
      map.set(`${s.floor}_${s.id}`, s);
    });
    return map;
  }, [shops]);

  const floors = [0, 1, 2, 4];

  // Render a floor blueprint schematic box
  const renderFloorBlueprint = (floorNum: number, isCompact = false) => {
    const layoutItems = ARCHITECTURAL_LAYOUTS[floorNum] || [];
    const floorRate = rates[floorNum] || 0;

    return (
      <div className="flex flex-col h-full w-full">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-gray-900 tracking-tight">
              {FLOOR_NAMES[floorNum]}
            </span>
            <span className="text-[11px] text-gray-500 tabular-nums">
              Rate: ₹{floorRate.toLocaleString('en-IN')}/sq.ft
            </span>
          </div>
          <span className="text-[11px] text-gray-400">
            {floorNum === 4 ? 'Flats 01–14' : 'Shops 01–14'}
          </span>
        </div>

        {/* Blueprint Layout Container with exact CAD aspect ratio */}
        <div
          className={`relative w-full ${
            isCompact ? 'h-[360px]' : 'flex-1 min-h-[380px]'
          } bg-white border border-gray-300 rounded-md p-2 overflow-hidden shadow-2xs`}
        >
          {/* Architectural Wall Outlines & Corridor Markings */}
          {/* Central Corridor Guide (North) */}
          <div
            className="absolute bg-gray-50/80 border-x border-dashed border-gray-300 flex items-center justify-center pointer-events-none z-0"
            style={{ left: '44%', top: '5%', width: '12%', height: '44%' }}
          >
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-mono rotate-90 whitespace-nowrap">
              Corridor 7'-0"
            </span>
          </div>

          {/* Cross Corridor (Mid) */}
          <div
            className="absolute bg-gray-50/80 border-y border-dashed border-gray-300 flex items-center justify-center pointer-events-none z-0"
            style={{ left: '6%', top: '44.5%', width: '88%', height: '6.5%' }}
          >
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-mono whitespace-nowrap">
              Cross Corridor 7'-0" Wide
            </span>
          </div>

          {/* Outer Left Passage */}
          <div
            className="absolute border-r border-dashed border-gray-200 pointer-events-none z-0 flex items-center justify-center"
            style={{ left: '0%', top: '0%', width: '6%', height: '100%' }}
          >
            <span className="text-[8px] uppercase tracking-widest text-gray-300 font-mono -rotate-90 whitespace-nowrap">
              Passage 5'
            </span>
          </div>

          {/* Outer Bottom Passage */}
          <div
            className="absolute border-t border-dashed border-gray-200 pointer-events-none z-0 flex items-center justify-center"
            style={{ left: '6%', top: '95%', width: '88%', height: '5%' }}
          >
            <span className="text-[8px] uppercase tracking-widest text-gray-300 font-mono whitespace-nowrap">
              Passage 5'-0" Wide
            </span>
          </div>

          {/* Shop Polygons / Blocks */}
          {layoutItems.map(item => {
            const isAmenity = item.zone === 'amenity';
            const key = `${floorNum}_${item.id}`;
            const bucketId = shopToBucket.get(key);
            const shopMeta = shopMetaLookup.get(key);
            const isHovered = hoveredShop && hoveredShop.floor === floorNum && hoveredShop.id === item.id;
            const isBucketMatch = selectedBucketId === null || bucketId === selectedBucketId;

            let bgColor = '#F3F4F6';
            let borderColor = '#9CA3AF';
            let textColor = '#1F2937';

            if (isAmenity) {
              bgColor = '#E5E7EB';
              borderColor = '#9CA3AF';
              textColor = '#4B5563';
            } else if (bucketId) {
              const theme = BUCKET_THEMES.find(t => t.id === bucketId);
              if (theme) {
                bgColor = theme.hex;
                borderColor = theme.borderHex;
                textColor = theme.textHex;
              }
            }

            return (
              <div
                key={item.id}
                onMouseEnter={() => !isAmenity && onHoverShop({ floor: floorNum, id: item.id })}
                onMouseLeave={() => !isAmenity && onHoverShop(null)}
                className={`absolute transition-all duration-150 rounded-xs flex flex-col justify-between p-1 select-none z-10 ${
                  isAmenity
                    ? 'cursor-default opacity-85'
                    : 'cursor-pointer hover:shadow-md'
                } ${isHovered ? 'ring-2 ring-gray-900 ring-offset-1 z-30 scale-[1.02]' : ''} ${
                  selectedBucketId !== null && !isBucketMatch ? 'opacity-30' : ''
                }`}
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${item.width}%`,
                  height: `${item.height}%`,
                  backgroundColor: bgColor,
                  border: `1.5px solid ${borderColor}`,
                  color: textColor,
                }}
              >
                <div className="flex items-center justify-between gap-1 leading-tight">
                  <span className={`font-semibold tracking-tight ${isCompact ? 'text-[9px]' : 'text-[11px]'}`}>
                    {item.label}
                  </span>
                  {bucketId && !isCompact && (
                    <span className="text-[9px] font-bold px-1 py-0.2 rounded-xs bg-black/10 tabular-nums">
                      B{bucketId}
                    </span>
                  )}
                </div>

                {!isAmenity && shopMeta && (
                  <div className="flex flex-col text-[10px] leading-tight tabular-nums opacity-90">
                    <span className="font-medium">{shopMeta.area} sq.ft</span>
                    {!isCompact && (
                      <span className="text-[9px] opacity-80">
                        {formatINR(shopMeta.area * floorRate)}
                      </span>
                    )}
                  </div>
                )}

                {isAmenity && (
                  <div className="text-[9px] text-gray-500 font-mono uppercase">
                    {item.id === 'STAIRS' ? 'Fire Exit' : item.id === 'LIFT' ? 'Lift 1T' : 'Amenity'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full h-full min-h-[460px] bg-[#F9FAFB] border border-gray-200 rounded-lg p-3">
      {/* 2D Header & Floor Switcher Controls */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-900">Floor Selection:</span>
          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-md">
            {floors.map(f => (
              <button
                key={f}
                onClick={() => {
                  setSelectedFloor(f);
                  setViewMode('single');
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${
                  viewMode === 'single' && selectedFloor === f
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {f === 0 ? 'Ground' : `${f}th Floor`}
              </button>
            ))}
            <button
              onClick={() => setViewMode('quad')}
              className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${
                viewMode === 'quad'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All 4 Floors Grid
            </button>
          </div>
        </div>

        <div className="text-[11px] text-gray-500 flex items-center gap-2">
          <span>Colors = Assigned Buckets</span>
          <span>·</span>
          <span>Hover to highlight</span>
        </div>
      </div>

      {/* Main Floor Plan Surface */}
      <div className="flex-1 w-full overflow-y-auto">
        {viewMode === 'single' ? (
          renderFloorBlueprint(selectedFloor, false)
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            {floors.map(f => (
              <div
                key={f}
                className="flex flex-col bg-gray-50/50 p-2.5 rounded-lg border border-gray-200"
              >
                {renderFloorBlueprint(f, true)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
