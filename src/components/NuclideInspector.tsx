import React, { useState } from 'react';
import { Nuclide, DecayStep } from '../types';
import { getNuclide } from '../data/nuclides';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Compass,
  Zap,
  Layers
} from 'lucide-react';

interface NuclideInspectorProps {
  selectedNuclide: Nuclide | null;
  onSelectNuclide: (nuclide: Nuclide) => void;
  decaySteps: DecayStep[];
  activeStepIndex: number | null;
  onSetActiveStepIndex: (index: number | null) => void;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  isSimulating: boolean;
  onStepForward: () => void;
  onResetSimulation: () => void;
}

// Quick representative isotopes for empty state
const QUICK_PICKS = [
  { symbol: '¹H', z: 1, n: 0 },
  { symbol: '¹⁴C', z: 6, n: 8 },
  { symbol: '⁶⁰Co', z: 27, n: 33 },
  { symbol: '¹³⁷Cs', z: 55, n: 82 },
  { symbol: '²²⁶Ra', z: 88, n: 138 },
  { symbol: '²³⁵U', z: 92, n: 143 },
  { symbol: '²³⁸U', z: 92, n: 146 },
  { symbol: '²⁴¹Am', z: 95, n: 146 },
  { symbol: '²⁹⁴Og', z: 118, n: 176 },
];

export const NuclideInspector: React.FC<NuclideInspectorProps> = ({
  selectedNuclide,
  onSelectNuclide,
  decaySteps,
  activeStepIndex,
  onSetActiveStepIndex,
  onStartSimulation,
  onStopSimulation,
  isSimulating,
  onStepForward,
  onResetSimulation,
}) => {
  // Mobile minimized state (instant toggle without sliding)
  const [isMobileMinimized, setIsMobileMinimized] = useState(false);
  // Mobile active tab: 'overview' or 'chain'
  const [mobileTab, setMobileTab] = useState<'overview' | 'chain'>('overview');
  // Desktop sidebar collapsed state
  const [isCollapsedDesktop, setIsCollapsedDesktop] = useState(false);

  // Desktop collapsed strip
  if (isCollapsedDesktop) {
    return (
      <aside className="hidden md:flex w-8 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex-col items-center py-2.5 justify-between shrink-0 select-none z-10">
        <button
          onClick={() => setIsCollapsedDesktop(false)}
          title="Expand Isotope Inspector"
          className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="rotate-90 text-[10px] font-mono tracking-wider uppercase text-slate-400 whitespace-nowrap">
          {selectedNuclide ? `${selectedNuclide.a}${selectedNuclide.symbol}` : 'Inspector'}
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
      </aside>
    );
  }

  // Empty state when no nuclide is selected
  if (!selectedNuclide) {
    return (
      <aside className="w-full md:w-72 lg:w-80 bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 shrink-0 z-10 flex flex-col justify-between">
        {/* Mobile: Ultra-compact fixed non-sliding bar */}
        <div className="md:hidden px-3 py-2 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 shrink-0">
            <Compass className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span className="text-[11px] font-medium whitespace-nowrap">Tap an isotope:</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 font-mono text-[11px]">
            {QUICK_PICKS.slice(0, 5).map((p) => (
              <button
                key={p.symbol}
                onClick={() => {
                  const n = getNuclide(p.z, p.n);
                  if (n) onSelectNuclide(n);
                }}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-colors"
              >
                {p.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop: Centered informative empty state */}
        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-4 my-auto relative">
          <button
            onClick={() => setIsCollapsedDesktop(true)}
            title="Collapse Sidebar"
            className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-2.5">
            <Compass className="w-5 h-5 stroke-[1.5]" />
          </div>
          <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
            Select an Isotope
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-3">
            Click any cell on the Segrè chart to view decay paths, half-life, and telemetry.
          </p>
          <div className="flex flex-wrap gap-1 justify-center max-w-xs text-[11px] font-mono">
            {QUICK_PICKS.map((p) => (
              <button
                key={p.symbol}
                onClick={() => {
                  const n = getNuclide(p.z, p.n);
                  if (n) onSelectNuclide(n);
                }}
                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-semibold transition-colors"
              >
                {p.symbol}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden md:flex border-t border-slate-100 dark:border-slate-800/80 p-2 text-[10px] font-mono text-slate-400 justify-between">
          <span>All 118 Elements</span>
          <span>Full Segrè Chart</span>
        </div>
      </aside>
    );
  }

  const daughter =
    selectedNuclide.daughterZ != null && selectedNuclide.daughterN != null
      ? getNuclide(selectedNuclide.daughterZ, selectedNuclide.daughterN)
      : null;

  // Format decay mode label
  const decayModeBadge = selectedNuclide.isStable ? (
    <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0 flex items-center gap-1">
      <ShieldCheck className="w-2.5 h-2.5" />
      Stable
    </span>
  ) : (
    <span
      className={`px-1.5 py-0.5 text-[10px] font-mono font-medium rounded shrink-0 capitalize border ${
        selectedNuclide.decayMode === 'alpha'
          ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
          : selectedNuclide.decayMode === 'beta_minus'
          ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
          : selectedNuclide.decayMode === 'beta_plus'
          ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
          : selectedNuclide.decayMode === 'sf'
          ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
      }`}
    >
      {selectedNuclide.decayMode === 'alpha'
        ? 'α (Alpha)'
        : selectedNuclide.decayMode === 'beta_minus'
        ? 'β⁻ (Beta-)'
        : selectedNuclide.decayMode === 'beta_plus'
        ? 'β⁺ / EC'
        : selectedNuclide.decayMode === 'sf'
        ? 'Fission (SF)'
        : selectedNuclide.decayMode.replace('_', ' ')}
    </span>
  );

  return (
    <aside className="w-full md:w-72 lg:w-80 bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 shrink-0 z-10 flex flex-col">
      {/* ======================================================== */}
      {/* MOBILE BOTTOM PANEL (Non-sliding, fixed, optimized footprint) */}
      {/* ======================================================== */}
      <div className="flex md:hidden flex-col w-full">
        {/* Mobile Compact Header Bar (Always visible) */}
        <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {/* Identity lockup */}
          <div className="flex items-center gap-2">
            <div className="flex items-baseline font-mono">
              <div className="flex flex-col text-[9px] leading-tight text-slate-500 dark:text-slate-400 mr-1 text-right">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedNuclide.a}
                </span>
                <span>{selectedNuclide.z}</span>
              </div>
              <span className="text-base font-bold text-slate-900 dark:text-slate-50">
                {selectedNuclide.symbol}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                {selectedNuclide.elementName}-{selectedNuclide.a}
              </span>
              <span className="text-[9px] font-mono text-slate-400">
                Z={selectedNuclide.z} · N={selectedNuclide.n}
              </span>
            </div>
          </div>

          {/* Badge & Quick Action & Minimize toggle */}
          <div className="flex items-center gap-1.5">
            {decayModeBadge}

            {!selectedNuclide.isStable && daughter && (
              <button
                onClick={() => onSelectNuclide(daughter)}
                title={`Jump to daughter: ${daughter.a}${daughter.symbol}`}
                className="px-1.5 py-0.5 text-[10px] font-mono bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded flex items-center gap-0.5 transition-colors"
              >
                <span>→ {daughter.a}{daughter.symbol}</span>
              </button>
            )}

            {/* Instant collapse/expand toggle button (no sliding) */}
            <button
              onClick={() => setIsMobileMinimized((prev) => !prev)}
              title={isMobileMinimized ? "Expand Inspector" : "Minimize Inspector"}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800"
            >
              {isMobileMinimized ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Expanded Body: Fixed height, zero sliding */}
        {!isMobileMinimized && (
          <div className="p-2 space-y-1.5">
            {/* Tab switch for mobile: Data vs Decay Simulation */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMobileTab('overview')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors ${
                    mobileTab === 'overview'
                      ? 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Physics Data
                </button>
                <button
                  onClick={() => setMobileTab('chain')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors ${
                    mobileTab === 'chain'
                      ? 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Decay Chain ({decaySteps.length})
                </button>
              </div>

              {/* Simulation Quick Bar if radioactive */}
              {!selectedNuclide.isStable && decaySteps.length > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={isSimulating ? onStopSimulation : onStartSimulation}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium flex items-center gap-1 ${
                      isSimulating
                        ? 'bg-amber-500 text-white'
                        : 'bg-sky-600 text-white'
                    }`}
                  >
                    {isSimulating ? (
                      <>
                        <Pause className="w-2.5 h-2.5 fill-current" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Auto</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={onStepForward}
                    title="Step decay forward"
                    className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    <SkipForward className="w-3 h-3" />
                  </button>
                  <button
                    onClick={onResetSimulation}
                    title="Reset chain"
                    className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Tab 1: Physics Telemetry */}
            {mobileTab === 'overview' && (
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                  <div className="p-1 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block text-[9px]">Half-Life (T½)</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">
                      {selectedNuclide.halfLifeText}
                    </span>
                  </div>
                  <div className="p-1 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block text-[9px]">Total Path Q-Energy</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">
                      {decaySteps.reduce((sum, step) => sum + (step.parent.qValueMeV || 0), 0).toFixed(2)} MeV
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-50/60 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40">
                  <span className="text-violet-700 dark:text-violet-300">
                    Constituent Quarks: {selectedNuclide.z * 2 + selectedNuclide.n}u + {selectedNuclide.z + selectedNuclide.n * 2}d
                  </span>
                </div>
              </div>
            )}

            {/* Tab 2: Decay Chain Steps Horizontal Scroll (no vertical sliding) */}
            {mobileTab === 'chain' && (
              <div>
                {selectedNuclide.isStable ? (
                  <div className="p-1.5 bg-slate-50 dark:bg-slate-800/40 rounded text-[10px] text-slate-500 font-mono text-center">
                    Stable nuclide. Does not undergo radioactive decay.
                  </div>
                ) : decaySteps.length === 0 ? (
                  <div className="p-1.5 bg-slate-50 dark:bg-slate-800/40 rounded text-[10px] text-slate-500 font-mono text-center">
                    Terminal nuclide (SF or single transition).
                  </div>
                ) : (
                  <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar font-mono text-[10px]">
                    {decaySteps.map((step, idx) => {
                      const isCurrent = activeStepIndex === idx;
                      const modeLabel =
                        step.mode === 'alpha'
                          ? 'α'
                          : step.mode === 'beta_minus'
                          ? 'β⁻'
                          : step.mode === 'beta_plus'
                          ? 'β⁺'
                          : step.mode;

                      return (
                        <button
                          key={`h-${step.stepNumber}-${step.parent.id}-${step.daughter.id}`}
                          onClick={() => {
                            onSetActiveStepIndex(idx);
                            onSelectNuclide(step.daughter);
                          }}
                          className={`shrink-0 px-2 py-1 rounded border flex items-center gap-1 transition-colors ${
                            isCurrent
                              ? 'bg-sky-50 dark:bg-sky-950/70 border-sky-400 dark:border-sky-700 text-sky-900 dark:text-sky-200'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="text-[9px] text-slate-400">#{step.stepNumber}</span>
                          <span className="font-semibold">{step.parent.a}{step.parent.symbol}</span>
                          <span className="text-amber-500 font-bold">{modeLabel}</span>
                          <ArrowRight className="w-2 h-2 text-slate-400" />
                          <span className="font-bold">{step.daughter.a}{step.daughter.symbol}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* DESKTOP SIDEBAR (Clean, organized scientific layout)       */}
      {/* ======================================================== */}
      <div className="hidden md:flex flex-col flex-1 overflow-y-auto text-xs">
        {/* 1. Header Lockup */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-1.5">
                <div className="flex items-center font-mono">
                  <div className="flex flex-col text-[9px] leading-none text-slate-500 dark:text-slate-400 mr-1 text-right">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {selectedNuclide.a}
                    </span>
                    <span>{selectedNuclide.z}</span>
                  </div>
                  <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    {selectedNuclide.symbol}
                  </span>
                </div>
                <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {selectedNuclide.elementName}-{selectedNuclide.a}
                </h1>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                <span>Z={selectedNuclide.z}</span>
                <span className="mx-1">·</span>
                <span>N={selectedNuclide.n}</span>
                <span className="mx-1">·</span>
                <span>A={selectedNuclide.a}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {decayModeBadge}

              {/* Collapse sidebar button */}
              <button
                onClick={() => setIsCollapsedDesktop(true)}
                title="Collapse Inspector"
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {selectedNuclide.notes && (
            <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded border border-slate-200 dark:border-slate-800/80 leading-snug">
              {selectedNuclide.notes}
            </p>
          )}
        </div>

        {/* 2. Compact Telemetry Parameters */}
        <div className="p-2.5 space-y-1 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px]">
          <div className="flex items-center justify-between py-0.5 px-1.5 rounded bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-500 text-[10px]">Half-Life (T½):</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {selectedNuclide.halfLifeText}
            </span>
          </div>

          <div className="flex items-center justify-between py-0.5 px-1.5 rounded bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-500 text-[10px]">Decay Mode:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 capitalize">
              {selectedNuclide.isStable
                ? 'Stable'
                : selectedNuclide.decayMode === 'alpha'
                ? 'α (Alpha)'
                : selectedNuclide.decayMode === 'beta_minus'
                ? 'β⁻ (Beta-)'
                : selectedNuclide.decayMode === 'beta_plus'
                ? 'β⁺ / EC'
                : selectedNuclide.decayMode === 'sf'
                ? 'Fission (SF)'
                : selectedNuclide.decayMode}
            </span>
          </div>

          <div className="flex items-center justify-between py-0.5 px-1.5 rounded bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-500 text-[10px]">Total Path Q-Energy:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {decaySteps.reduce((sum, step) => sum + (step.parent.qValueMeV || 0), 0).toFixed(3)} MeV
            </span>
          </div>

          <div className="flex items-center justify-between py-0.5 px-1.5 rounded bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-500 text-[10px]">B.E. / Nucleon:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {selectedNuclide.bindingEnergyPerNucleon ? `${selectedNuclide.bindingEnergyPerNucleon.toFixed(3)} MeV/A` : '—'}
            </span>
          </div>

          <div className="flex items-center justify-between py-0.5 px-1.5 rounded bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-500 text-[10px]">N/Z Ratio:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {selectedNuclide.z > 0 ? (selectedNuclide.n / selectedNuclide.z).toFixed(3) : '∞'}
            </span>
          </div>
        </div>

        {/* 2.5 Constituent Quarks */}
        <div className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-violet-50/40 dark:bg-violet-950/20">
          <div className="text-[10px] font-mono">
            <span className="text-slate-400 text-[9px] block">Constituent Quarks:</span>
            <span className="font-semibold text-violet-700 dark:text-violet-300">
              {selectedNuclide.z * 2 + selectedNuclide.n}u + {selectedNuclide.z + selectedNuclide.n * 2}d
            </span>
          </div>
        </div>

        {/* 3. Daughter Nucleus Quick Jump */}
        {!selectedNuclide.isStable && daughter && (
          <div className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-sky-50/40 dark:bg-sky-950/20">
            <div className="text-[11px] font-mono truncate mr-2">
              <span className="text-slate-400 text-[9px] block">Immediate Daughter:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {daughter.a}{daughter.symbol} ({daughter.elementName})
              </span>
            </div>
            <button
              onClick={() => onSelectNuclide(daughter)}
              className="px-2 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 border border-slate-200 dark:border-slate-700 rounded transition-colors flex items-center gap-0.5 shadow-sm"
            >
              <span>Jump</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>
        )}

        {/* 4. Radioactive Decay Simulation Section */}
        <div className="p-3 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1 font-mono">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Decay Chain
                </span>
                <span className="text-[10px] text-slate-400">
                  ({decaySteps.length} {decaySteps.length === 1 ? 'step' : 'steps'})
                </span>
              </div>
            </div>

            {selectedNuclide.isStable ? (
              <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                Inside the nuclear valley of stability. Does not undergo spontaneous decay.
              </div>
            ) : decaySteps.length === 0 ? (
              <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                Terminal nuclide (SF or single transition).
              </div>
            ) : (
              <>
                {/* Simulation Playback Controls Bar */}
                <div className="flex items-center gap-1 mb-2 p-1 bg-slate-100 dark:bg-slate-800 rounded">
                  <button
                    onClick={isSimulating ? onStopSimulation : onStartSimulation}
                    className={`flex-1 py-1 px-2 rounded text-[11px] font-mono font-medium flex items-center justify-center gap-1 transition-colors ${
                      isSimulating
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-sky-600 text-white hover:bg-sky-700'
                    }`}
                  >
                    {isSimulating ? (
                      <>
                        <Pause className="w-3 h-3 fill-current" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Auto</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={onStepForward}
                    title="Next step"
                    className="p-1 bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded transition-colors text-[10px] font-mono flex items-center gap-0.5"
                  >
                    <SkipForward className="w-3 h-3" />
                    <span>Step</span>
                  </button>

                  <button
                    onClick={onResetSimulation}
                    title="Reset to start"
                    className="p-1 bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>

                {/* Step Sequence List */}
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {decaySteps.map((step, idx) => {
                    const isStepActive = activeStepIndex === idx;
                    const modeLabel =
                      step.mode === 'alpha'
                        ? 'α'
                        : step.mode === 'beta_minus'
                        ? 'β⁻'
                        : step.mode === 'beta_plus'
                        ? 'β⁺'
                        : step.mode;

                    return (
                      <div
                        key={`v-${step.stepNumber}-${step.parent.id}-${step.daughter.id}`}
                        onClick={() => {
                          onSetActiveStepIndex(idx);
                          onSelectNuclide(step.daughter);
                        }}
                        className={`p-1.5 rounded text-[10px] font-mono flex items-center justify-between cursor-pointer transition-colors border ${
                          isStepActive
                            ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 dark:border-sky-700 text-sky-900 dark:text-sky-200'
                            : 'bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-400 w-3">
                            #{step.stepNumber}
                          </span>
                          <span className="font-semibold">
                            {step.parent.a}{step.parent.symbol}
                          </span>
                          <span
                            className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                              step.mode === 'alpha'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                : 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                            }`}
                          >
                            {modeLabel}
                          </span>
                          <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {step.daughter.a}{step.daughter.symbol}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400">
                          {step.daughter.isStable ? 'Stable' : step.parent.halfLifeText}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
