import React, { useState, useRef, useEffect } from 'react';
import { ColorMode, Theme, Nuclide } from '../types';
import { ALL_NUCLIDES } from '../data/nuclides';
import {
  Sun,
  Moon,
  HelpCircle,
  Layers,
  Sparkles,
  ChevronDown
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
  appViewMode: 'nuclides' | 'particles';
  onChangeAppViewMode: (mode: 'nuclides' | 'particles') => void;
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
  appViewMode,
  onChangeAppViewMode,
}) => {
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const viewDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        viewDropdownRef.current &&
        !viewDropdownRef.current.contains(e.target as Node)
      ) {
        setShowViewDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-auto min-h-[32px] w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-1.5 sm:px-2 flex items-center justify-between gap-1.5 flex-wrap shrink-0 z-20">
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

          {/* Parallel Mode Switcher: Nuclides Map | Particles & Forces Map */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
            <button
              onClick={() => onChangeAppViewMode('nuclides')}
              title="Show Isotope Decay Map (Segrè Chart)"
              className={`px-1.5 py-0.5 rounded transition-colors ${
                appViewMode === 'nuclides'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Nuclides
            </button>
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

        {/* Map Selector Dropdown */}
        <div ref={viewDropdownRef} className="relative">
          <button
            onClick={() => setShowViewDropdown(!showViewDropdown)}
            className="flex items-center gap-1 px-1.5 py-1 text-[11px] font-mono rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <span>{appViewMode === 'nuclides' ? 'Decay Map' : 'Particles Map'}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showViewDropdown && (
            <div className="absolute top-8 left-0 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden z-50 text-xs py-1">
              <button
                onClick={() => { onChangeAppViewMode('nuclides'); setShowViewDropdown(false); }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 font-mono"
              >
                Decay Map
              </button>
              <button
                onClick={() => { onChangeAppViewMode('particles'); setShowViewDropdown(false); }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 font-mono"
              >
                Particles Map
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Zone 2: Color Mode (Only shown for Nuclides / Split view) */}
      {appViewMode !== 'particles' && (
        <div className="flex items-center gap-1.5 flex-1 max-w-xl justify-center">
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
      )}

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
