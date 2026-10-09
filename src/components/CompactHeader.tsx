import React, { useState, useRef, useEffect } from 'react';
import { ColorMode, Theme, Nuclide } from '../types';
import { ALL_NUCLIDES } from '../data/nuclides';
import {
  Sun,
  Moon,
  Search,
  HelpCircle,
  Layers,
  Sparkles
} from 'lucide-react';

interface CompactHeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  colorMode: ColorMode;
  onChangeColorMode: (mode: ColorMode) => void;
  onSelectNuclide: (nuclide: Nuclide) => void;
  onSelectPreset: (key: string) => void;
  onOpenLegend: () => void;
  onOpenPeriodicTable: () => void;
}

export const CompactHeader: React.FC<CompactHeaderProps> = ({
  theme,
  onToggleTheme,
  colorMode,
  onChangeColorMode,
  onSelectNuclide,
  onSelectPreset,
  onOpenLegend,
  onOpenPeriodicTable,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Filter nuclides based on search query
  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    return ALL_NUCLIDES.filter((n) => {
      const matchSymbol = n.symbol.toLowerCase() === q;
      const matchSymbolMass = `${n.symbol.toLowerCase()}-${n.a}` === q || `${n.symbol.toLowerCase()}${n.a}` === q;
      const matchMassSymbol = `${n.a}${n.symbol.toLowerCase()}` === q;
      const matchName = n.elementName.toLowerCase().startsWith(q);
      const matchFullName = `${n.elementName.toLowerCase()}-${n.a}`.startsWith(q);
      const matchNotes = n.notes?.toLowerCase().includes(q);

      return (
        matchSymbol ||
        matchSymbolMass ||
        matchMassSymbol ||
        matchName ||
        matchFullName ||
        matchNotes
      );
    }).slice(0, 8);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-10 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2 sm:px-3 flex items-center justify-between gap-1.5 shrink-0 z-20">
      {/* Zone 1: Wordmark & Periodic Table Button */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-mono font-bold text-[11px] border border-sky-500/30">
            Δ
          </div>
          <span className="font-semibold text-xs sm:text-sm tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
            Nuclide Decay Map
          </span>
        </div>

        {/* 118 Elements Table Launcher */}
        <button
          onClick={onOpenPeriodicTable}
          title="Open Periodic Table (1 to 118 elements)"
          className="px-1.5 py-1 text-[11px] font-mono rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors border border-slate-200 dark:border-slate-700"
        >
          <Layers className="w-3 h-3 text-sky-500" />
          <span className="hidden xs:inline">Elements</span>
          <span className="text-[9px] text-slate-400 font-bold">118</span>
        </button>
      </div>

      {/* Zone 2: Search & Presets & Color Mode */}
      <div className="flex items-center gap-1.5 flex-1 max-w-xl justify-center">
        {/* Isotope Search Input */}
        <div ref={searchContainerRef} className="relative w-32 xs:w-44 sm:w-52">
          <div className="relative flex items-center">
            <Search className="w-3 h-3 absolute left-2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search (U-238, Og)..."
              className="w-full h-7 pl-6 pr-2 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded border border-transparent focus:border-sky-500 dark:focus:border-sky-500 focus:outline-none transition-colors font-mono"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-8 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden z-50 text-xs py-1">
              {searchResults.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    onSelectNuclide(n);
                    setShowSearchResults(false);
                    setSearchQuery('');
                  }}
                  className="w-full px-2.5 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors font-mono"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sky-600 dark:text-sky-400 text-xs">
                      {n.a}
                      {n.symbol}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 text-[10px]">
                      {n.elementName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                    <span className="capitalize">{n.decayMode.replace('_', ' ')}</span>
                    <span>·</span>
                    <span className="text-emerald-500">{n.halfLifeText}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Presets Selector */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              onSelectPreset(e.target.value);
            }
          }}
          defaultValue=""
          className="h-7 px-1.5 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded focus:outline-none focus:border-sky-500 font-mono hidden md:block"
        >
          <option value="" disabled>
            Series Presets...
          </option>
          <option value="u238">U-238 (Radium Series)</option>
          <option value="th232">Th-232 (4n Series)</option>
          <option value="u235">U-235 (Actinium Series)</option>
          <option value="og294">Og-294 (Heaviest Z=118)</option>
          <option value="fl289">Fl-289 (Island of Stability Z=114)</option>
          <option value="c14">C-14 (Radiocarbon)</option>
          <option value="cs137">Cs-137 (Fission)</option>
          <option value="tc99m">Tc-99m (Medical)</option>
          <option value="fe56">Fe-56 (Stability Peak)</option>
        </select>

        {/* Color Mode Tabs */}
        <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => onChangeColorMode('decay_mode')}
            title="Color by decay mode"
            className={`px-1.5 py-0.5 text-[10px] sm:text-[11px] rounded transition-colors font-mono whitespace-nowrap ${
              colorMode === 'decay_mode'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Decay
          </button>
          <button
            onClick={() => onChangeColorMode('half_life')}
            title="Color by half-life"
            className={`px-1.5 py-0.5 text-[10px] sm:text-[11px] rounded transition-colors font-mono whitespace-nowrap ${
              colorMode === 'half_life'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Half-Life
          </button>
          <button
            onClick={() => onChangeColorMode('nz_ratio')}
            title="Color by N/Z"
            className={`px-1.5 py-0.5 text-[10px] sm:text-[11px] rounded transition-colors font-mono whitespace-nowrap hidden sm:inline-block ${
              colorMode === 'nz_ratio'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            N/Z
          </button>
        </div>
      </div>

      {/* Zone 3: Actions & Theme Toggle */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onOpenLegend}
          title="Legend & Guide"
          className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-slate-700" />
          )}
        </button>
      </div>
    </header>
  );
};
