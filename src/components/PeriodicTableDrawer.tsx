import React, { useState } from 'react';
import { ELEMENTS, ElementInfo } from '../data/elements';
import { Nuclide } from '../types';
import { NUCLIDE_MAP } from '../data/nuclides';
import { X, Search, Layers, Grid } from 'lucide-react';

interface PeriodicTableDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedElementZ: number | null;
  onSelectElement: (z: number) => void;
  onSelectNuclide: (nuclide: Nuclide) => void;
}

const CATEGORIES = [
  'All',
  'Alkali Metal',
  'Alkaline Earth',
  'Transition Metal',
  'Post-transition',
  'Metalloid',
  'Nonmetal',
  'Halogen',
  'Noble Gas',
  'Lanthanide',
  'Actinide',
  'Superheavy'
] as const;

export const PeriodicTableDrawer: React.FC<PeriodicTableDrawerProps> = ({
  isOpen,
  onClose,
  selectedElementZ,
  onSelectElement,
  onSelectNuclide,
}) => {
  const [viewMode, setViewMode] = useState<'standard' | 'grid'>('standard');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  // Real 118 IUPAC elements
  const periodicElements = ELEMENTS.filter((el) => el.z >= 1 && el.z <= 118);

  const filteredElements = periodicElements.filter((el) => {
    const matchesCategory =
      filterCategory === 'All' || el.category === filterCategory;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      el.symbol.toLowerCase().includes(q) ||
      el.name.toLowerCase().includes(q) ||
      el.z.toString() === q;
    return matchesCategory && matchesQuery;
  });

  const handleElementClick = (el: ElementInfo) => {
    onSelectElement(el.z);
    // Find representative isotope for this element:
    // Prefer stable isotope first, then any known isotope
    let bestNuclide: Nuclide | undefined;
    for (let n = 0; n <= 196; n++) {
      const nuc = NUCLIDE_MAP.get(`${el.z}-${n}`);
      if (nuc) {
        if (!bestNuclide || (nuc.isStable && !bestNuclide.isStable)) {
          bestNuclide = nuc;
        }
      }
    }
    if (bestNuclide) {
      onSelectNuclide(bestNuclide);
    }
    onClose();
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Alkali Metal':
        return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'Alkaline Earth':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'Transition Metal':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
      case 'Lanthanide':
        return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30';
      case 'Actinide':
        return 'text-purple-500 bg-purple-500/10 border-purple-500/30';
      case 'Superheavy':
        return 'text-pink-500 bg-pink-500/10 border-pink-500/30';
      case 'Metalloid':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
      case 'Nonmetal':
        return 'text-teal-500 bg-teal-500/10 border-teal-500/30';
      case 'Halogen':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
      case 'Noble Gas':
        return 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30';
      default:
        return 'text-slate-500 bg-slate-500/10 border-slate-500/30';
    }
  };

  // Helper map for 18-column standard periodic table layout
  const elementByCoord = new Map<string, ElementInfo>();
  periodicElements.forEach((el) => {
    if (el.period && el.group) {
      elementByCoord.set(`${el.period}-${el.group}`, el);
    }
  });

  const lanthanides = periodicElements.filter((el) => el.z >= 57 && el.z <= 71);
  const actinides = periodicElements.filter((el) => el.z >= 89 && el.z <= 103);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-500" />
            <span className="font-semibold text-xs sm:text-sm tracking-tight font-mono">
              Periodic Table of Elements (1 to 118)
            </span>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              · All 118 Elements
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded border border-slate-200 dark:border-slate-700 text-[10px] font-mono">
              <button
                onClick={() => setViewMode('standard')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  viewMode === 'standard'
                    ? 'bg-sky-600 text-white font-medium shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Table (18 Col)
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-sky-600 text-white font-medium shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Grid / Search
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters and search toolbar (only in grid mode or for search) */}
        {viewMode === 'grid' && (
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar max-w-full">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap transition-colors ${
                    filterCategory === cat
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-36 sm:w-48">
              <Search className="w-3 h-3 absolute left-2 top-2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search (H, Au, 118)..."
                className="w-full h-7 pl-6 pr-2 text-xs bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-3 overflow-y-auto overflow-x-auto flex-1">
          {viewMode === 'standard' ? (
            /* Classic 18-Column Periodic Table layout matching physical charts */
            <div className="min-w-[760px] flex flex-col gap-1 select-none">
              {/* Periods 1 to 7 */}
              {[1, 2, 3, 4, 5, 6, 7].map((period) => (
                <div key={period} className="grid grid-cols-18 gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((group) => {
                    const el = elementByCoord.get(`${period}-${group}`);
                    if (!el) {
                      // Check for Lanthanide/Actinide placeholder marker in column 3
                      if (period === 6 && group === 3) {
                        return (
                          <div
                            key={group}
                            className="p-1 rounded border border-dashed border-indigo-300 dark:border-indigo-800/60 bg-indigo-50/30 dark:bg-indigo-950/20 text-center flex flex-col justify-center text-[9px] font-mono text-indigo-500"
                          >
                            <span>57-71</span>
                            <span className="text-[7.5px] truncate">La-Lu</span>
                          </div>
                        );
                      }
                      if (period === 7 && group === 3) {
                        return (
                          <div
                            key={group}
                            className="p-1 rounded border border-dashed border-purple-300 dark:border-purple-800/60 bg-purple-50/30 dark:bg-purple-950/20 text-center flex flex-col justify-center text-[9px] font-mono text-purple-500"
                          >
                            <span>89-103</span>
                            <span className="text-[7.5px] truncate">Ac-Lr</span>
                          </div>
                        );
                      }
                      return <div key={group} className="min-h-[44px]" />;
                    }

                    const isSelected = selectedElementZ === el.z;
                    return (
                      <button
                        key={el.z}
                        onClick={() => handleElementClick(el)}
                        title={`${el.z} ${el.name} (${el.category})`}
                        className={`p-1 rounded border text-center flex flex-col justify-between transition-all hover:scale-105 active:scale-95 min-h-[46px] ${
                          isSelected
                            ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/80 ring-2 ring-sky-500/40'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800/70'
                        }`}
                      >
                        <span className="text-[8px] font-mono text-slate-400 leading-none">
                          {el.z}
                        </span>
                        <span className="text-xs font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100 my-0.5">
                          {el.symbol}
                        </span>
                        <span className="text-[7.5px] text-slate-500 dark:text-slate-400 truncate leading-none">
                          {el.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* Sub-rows for Lanthanides and Actinides (standard chemistry poster layout) */}
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1">
                {/* Lanthanides 57-71 */}
                <div className="flex items-center gap-1">
                  <div className="w-16 text-[9px] font-mono text-indigo-500 font-semibold text-right pr-1 shrink-0">
                    Lanthanides:
                  </div>
                  <div className="grid grid-cols-15 gap-1 flex-1">
                    {lanthanides.map((el) => {
                      const isSelected = selectedElementZ === el.z;
                      return (
                        <button
                          key={el.z}
                          onClick={() => handleElementClick(el)}
                          title={`${el.z} ${el.name}`}
                          className={`p-1 rounded border text-center flex flex-col justify-between transition-all hover:scale-105 min-h-[42px] ${
                            isSelected
                              ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/80 ring-2 ring-sky-500/40'
                              : 'border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-950/30'
                          }`}
                        >
                          <span className="text-[7.5px] font-mono text-slate-400 leading-none">
                            {el.z}
                          </span>
                          <span className="text-xs font-bold font-mono text-indigo-700 dark:text-indigo-300">
                            {el.symbol}
                          </span>
                          <span className="text-[7px] text-slate-400 truncate leading-none">
                            {el.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actinides 89-103 */}
                <div className="flex items-center gap-1">
                  <div className="w-16 text-[9px] font-mono text-purple-500 font-semibold text-right pr-1 shrink-0">
                    Actinides:
                  </div>
                  <div className="grid grid-cols-15 gap-1 flex-1">
                    {actinides.map((el) => {
                      const isSelected = selectedElementZ === el.z;
                      return (
                        <button
                          key={el.z}
                          onClick={() => handleElementClick(el)}
                          title={`${el.z} ${el.name}`}
                          className={`p-1 rounded border text-center flex flex-col justify-between transition-all hover:scale-105 min-h-[42px] ${
                            isSelected
                              ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/80 ring-2 ring-sky-500/40'
                              : 'border-purple-200 dark:border-purple-900/50 bg-purple-50/20 dark:bg-purple-950/30'
                          }`}
                        >
                          <span className="text-[7.5px] font-mono text-slate-400 leading-none">
                            {el.z}
                          </span>
                          <span className="text-xs font-bold font-mono text-purple-700 dark:text-purple-300">
                            {el.symbol}
                          </span>
                          <span className="text-[7px] text-slate-400 truncate leading-none">
                            {el.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Search / Category Grid View */
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5">
              {filteredElements.map((el) => {
                const isSelected = selectedElementZ === el.z;
                return (
                  <button
                    key={el.z}
                    onClick={() => handleElementClick(el)}
                    className={`p-1.5 rounded border text-left flex flex-col justify-between transition-all hover:scale-105 active:scale-95 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/80 ring-2 ring-sky-500/40'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 leading-none">
                      <span>{el.z}</span>
                      <span className="text-[8px] truncate max-w-[45px] text-right">
                        {el.category?.split(' ')[0]}
                      </span>
                    </div>
                    <div className="my-0.5">
                      <span className="text-sm font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
                        {el.symbol}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate leading-tight">
                      {el.name}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between shrink-0">
          <span>118 Elements (H to Og) · Click any element to highlight on Segrè Map</span>
          <span className="hidden sm:inline">Pan & zoom freely without snapping</span>
        </div>
      </div>
    </div>
  );
};
