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
  ChevronDown,
  ChevronLeft,
  Zap,
  ShieldCheck,
  Radio,
  Clock,
  Compass,
  ChevronsRight
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
  const [isChainExpanded, setIsChainExpanded] = useState(true);
  const [isCollapsedDesktop, setIsCollapsedDesktop] = useState(false);
  const [isMobileMinimized, setIsMobileMinimized] = useState(false);

  // If collapsed on desktop
  if (isCollapsedDesktop) {
    return (
      <aside className="hidden md:flex w-7 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex-col items-center py-2 justify-between shrink-0 select-none">
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

  if (!selectedNuclide) {
    return (
      <aside className="w-full md:w-72 lg:w-80 bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 p-3 flex flex-col justify-between shrink-0 overflow-y-auto relative">
        <button
          onClick={() => setIsCollapsedDesktop(true)}
          title="Collapse Sidebar"
          className="hidden md:flex absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <div className="flex flex-col items-center justify-center text-center my-auto py-6">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-2">
            <Compass className="w-5 h-5 stroke-[1.5]" />
          </div>
          <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-0.5">
            Select an Isotope
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-3">
            Click any cell on the Segrè chart to view decay paths and telemetry.
          </p>
          <div className="flex flex-wrap gap-1 justify-center max-w-xs text-[11px] font-mono">
            <button
              onClick={() => {
                const u = getNuclide(92, 146);
                if (u) onSelectNuclide(u);
              }}
              className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors"
            >
              ²³⁸U
            </button>
            <button
              onClick={() => {
                const og = getNuclide(118, 176);
                if (og) onSelectNuclide(og);
              }}
              className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors"
            >
              ²⁹⁴Og
            </button>
            <button
              onClick={() => {
                const c = getNuclide(6, 8);
                if (c) onSelectNuclide(c);
              }}
              className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors"
            >
              ¹⁴C
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-2 text-[10px] font-mono text-slate-400 flex justify-between">
          <span>All 118 Elements</span>
          <span>1,200+ Isotopes</span>
        </div>
      </aside>
    );
  }

  const daughter =
    selectedNuclide.daughterZ && selectedNuclide.daughterN
      ? getNuclide(selectedNuclide.daughterZ, selectedNuclide.daughterN)
      : null;

  return (
    <aside className="w-full md:w-72 lg:w-80 bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 overflow-y-auto max-h-[42vh] md:max-h-none text-xs relative">
      {/* 1. Header Lockup */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              {/* Nuclear isotope notation: ^A _Z Symbol */}
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
              <h1 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
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
            {selectedNuclide.isStable ? (
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0 flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5" />
                Stable
              </span>
            ) : (
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800 shrink-0 capitalize">
                {selectedNuclide.decayMode.replace('_', ' ')}
              </span>
            )}

            {/* Collapse sidebar button */}
            <button
              onClick={() => setIsCollapsedDesktop(true)}
              title="Collapse Inspector"
              className="hidden md:flex p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {selectedNuclide.notes && (
          <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded border border-slate-200 dark:border-slate-800/80 leading-snug">
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
          <span className="text-slate-500 text-[10px]">Q-Value / Energy:</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {selectedNuclide.qValueMeV ? `${selectedNuclide.qValueMeV.toFixed(3)} MeV` : '0.00 MeV'}
          </span>
        </div>

        <div className="flex items-center justify-between py-0.5 px-1.5 rounded bg-slate-50 dark:bg-slate-800/40">
          <span className="text-slate-500 text-[10px]">B.E. / Nucleon:</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {selectedNuclide.bindingEnergyPerNucleon?.toFixed(3)} MeV/A
          </span>
        </div>

        <div className="flex items-center justify-between py-0.5 px-1.5 rounded bg-slate-50 dark:bg-slate-800/40">
          <span className="text-slate-500 text-[10px]">N/Z Ratio:</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {(selectedNuclide.n / selectedNuclide.z).toFixed(3)}
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

            {decaySteps.length > 0 && (
              <button
                onClick={() => setIsChainExpanded(!isChainExpanded)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
              >
                {isChainExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            )}
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
              {isChainExpanded && (
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
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
                        key={idx}
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
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
