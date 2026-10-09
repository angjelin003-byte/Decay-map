import React, { useState } from 'react';
import { ELEMENTS, ElementInfo } from '../data/elements';
import { Nuclide } from '../types';
import { NUCLIDE_MAP } from '../data/nuclides';
import { X, Search, Layers } from 'lucide-react';

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
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filteredElements = ELEMENTS.filter((el) => {
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
    // Try stable first, then any isotope in database
    let bestNuclide: Nuclide | undefined;
    for (let n = 0; n <= 185; n++) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-500" />
            <span className="font-semibold text-xs sm:text-sm tracking-tight font-mono">
              Periodic Table of Elements (1 to 118)
            </span>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              · Click to highlight isotopes on Segrè Chart
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters and search toolbar */}
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Category filter pills */}
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

          {/* Quick search */}
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

        {/* Elements Grid */}
        <div className="p-3 overflow-y-auto flex-1">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5">
            {filteredElements.map((el) => {
              const isSelected = selectedElementZ === el.z;
              const catClass = getCategoryColor(el.category);

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
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between shrink-0">
          <span>Showing {filteredElements.length} of 118 elements</span>
          <span>Click any element to jump to its isotopes</span>
        </div>
      </div>
    </div>
  );
};
