import React, { useState, useMemo } from 'react';
import { Shop, FloorRates } from '../types/allocation';
import { FLOOR_NAMES } from '../data/initialData';
import { formatINR, formatINRLong } from '../utils/formatters';
import { Plus, Trash2, Search, Table as TableIcon } from 'lucide-react';

interface ShopDataTableProps {
  shops: Shop[];
  rates: FloorRates;
  onUpdateShopArea: (floor: number, id: string, newArea: number) => void;
  onToggleShopActive: (floor: number, id: string) => void;
  onAddShop: (shop: Shop) => void;
  onDeleteShop: (floor: number, id: string) => void;
  hoveredShop: { floor: number; id: string } | null;
  onHoverShop: (shop: { floor: number; id: string } | null) => void;
}

export const ShopDataTable: React.FC<ShopDataTableProps> = ({
  shops,
  rates,
  onUpdateShopArea,
  onToggleShopActive,
  onAddShop,
  onDeleteShop,
  hoveredShop,
  onHoverShop,
}) => {
  const [filterFloor, setFilterFloor] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingOpen, setIsAddingOpen] = useState(false);

  // New Shop form state
  const [newFloor, setNewFloor] = useState<number>(0);
  const [newId, setNewId] = useState('');
  const [newArea, setNewArea] = useState<number>(300);

  const filteredShops = useMemo(() => {
    return shops.filter(shop => {
      const matchesFloor = filterFloor === 'all' || shop.floor === filterFloor;
      const matchesSearch =
        searchQuery === '' ||
        shop.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `Floor ${shop.floor}`.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFloor && matchesSearch;
    });
  }, [shops, filterFloor, searchQuery]);

  const handleAddNewShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim() || newArea <= 0) return;

    onAddShop({
      floor: newFloor,
      id: newId.trim(),
      area: newArea,
      active: true,
    });

    setNewId('');
    setNewArea(300);
    setIsAddingOpen(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col gap-3">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-gray-700" />
          <span className="font-semibold text-xs uppercase tracking-wider text-gray-900">
            Shop Inventory & Super Built Area (Editable)
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500 tabular-nums">
            {filteredShops.length} units listed
          </span>
        </div>

        <button
          onClick={() => setIsAddingOpen(!isAddingOpen)}
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Unit
        </button>
      </div>

      {/* Add Shop Form Accordion */}
      {isAddingOpen && (
        <form
          onSubmit={handleAddNewShop}
          className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex flex-wrap items-end gap-3 text-xs"
        >
          <div className="flex flex-col gap-1">
            <label className="font-medium text-gray-700">Floor Level</label>
            <select
              value={newFloor}
              onChange={e => setNewFloor(parseInt(e.target.value, 10))}
              className="py-1 px-2 border border-gray-300 rounded bg-white text-gray-900"
            >
              <option value={0}>Ground Floor (G)</option>
              <option value={1}>1st Floor (1F)</option>
              <option value={2}>2nd Floor (2F)</option>
              <option value={4}>4th Floor (4F)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-medium text-gray-700">Shop ID / Unit No.</label>
            <input
              type="text"
              placeholder="e.g. 15, 7C"
              value={newId}
              onChange={e => setNewId(e.target.value)}
              className="py-1 px-2 border border-gray-300 rounded bg-white text-gray-900 w-28"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-medium text-gray-700">S.B.U Area (sq.ft)</label>
            <input
              type="number"
              min={50}
              step={5}
              value={newArea}
              onChange={e => setNewArea(parseFloat(e.target.value) || 0)}
              className="py-1 px-2 border border-gray-300 rounded bg-white text-gray-900 w-28"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded font-medium cursor-pointer"
            >
              Save Unit
            </button>
            <button
              type="button"
              onClick={() => setIsAddingOpen(false)}
              className="px-2.5 py-1.5 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Floor Filter Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
          <button
            onClick={() => setFilterFloor('all')}
            className={`px-2.5 py-1 font-medium rounded-md transition-all ${
              filterFloor === 'all'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Floors
          </button>
          {[0, 1, 2, 4].map(f => (
            <button
              key={f}
              onClick={() => setFilterFloor(f)}
              className={`px-2.5 py-1 font-medium rounded-md transition-all ${
                filterFloor === f
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {f === 0 ? 'Ground' : `${f}F`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Shop ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 pr-2.5 py-1 text-xs border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 w-36 sm:w-44"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200 sticky top-0 z-10">
            <tr>
              <th className="py-2 px-3 w-10 text-center">Active</th>
              <th className="py-2 px-3">Floor</th>
              <th className="py-2 px-3">Shop / Unit ID</th>
              <th className="py-2 px-3 text-right">Super Built Area</th>
              <th className="py-2 px-3 text-right">Rate (₹/sq.ft)</th>
              <th className="py-2 px-3 text-right">Calculated Value</th>
              <th className="py-2 px-3 text-center w-12">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 font-mono tabular-nums">
            {filteredShops.map(shop => {
              const floorRate = rates[shop.floor] || 0;
              const calculatedValue = shop.area * floorRate;
              const isHovered = hoveredShop && hoveredShop.floor === shop.floor && hoveredShop.id === shop.id;

              return (
                <tr
                  key={`${shop.floor}_${shop.id}`}
                  onMouseEnter={() => onHoverShop({ floor: shop.floor, id: shop.id })}
                  onMouseLeave={() => onHoverShop(null)}
                  className={`transition-colors ${
                    isHovered
                      ? 'bg-amber-50/70 font-semibold text-gray-900'
                      : shop.active === false
                      ? 'bg-gray-50 text-gray-400 opacity-60'
                      : 'bg-white hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  {/* Active Toggle */}
                  <td className="py-1.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={shop.active !== false}
                      onChange={() => onToggleShopActive(shop.floor, shop.id)}
                      className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 accent-gray-900 cursor-pointer"
                    />
                  </td>

                  {/* Floor Level */}
                  <td className="py-1.5 px-3 font-sans font-medium text-gray-700">
                    {FLOOR_NAMES[shop.floor] || `Floor ${shop.floor}`}
                  </td>

                  {/* Shop ID */}
                  <td className="py-1.5 px-3 font-semibold text-gray-900">
                    Unit #{shop.id}
                  </td>

                  {/* Editable Area */}
                  <td className="py-1.5 px-3 text-right">
                    <input
                      type="number"
                      min={10}
                      step={5}
                      value={shop.area}
                      onChange={e => {
                        const val = Math.max(1, parseFloat(e.target.value) || 0);
                        onUpdateShopArea(shop.floor, shop.id, val);
                      }}
                      className="w-20 text-right py-0.5 px-1.5 border border-gray-200 hover:border-gray-400 focus:border-gray-900 rounded bg-white text-gray-900 text-xs focus:outline-none"
                    />
                    <span className="text-gray-400 text-[11px] ml-1 font-sans">sq.ft</span>
                  </td>

                  {/* Single Global Floor Rate (read only here, edited in rate console) */}
                  <td className="py-1.5 px-3 text-right text-gray-600 font-sans">
                    ₹{floorRate.toLocaleString('en-IN')}
                  </td>

                  {/* Calculated Value = Area * Rate */}
                  <td className="py-1.5 px-3 text-right font-semibold text-gray-900">
                    <div className="flex items-baseline justify-end gap-1">
                      <span>{formatINR(calculatedValue)}</span>
                      <span className="text-[10px] text-gray-400 font-normal">({formatINRLong(calculatedValue)})</span>
                    </div>
                  </td>

                  {/* Delete Button */}
                  <td className="py-1.5 px-3 text-center">
                    <button
                      onClick={() => onDeleteShop(shop.floor, shop.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Remove Unit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
