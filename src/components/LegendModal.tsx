import React from 'react';
import { X, ShieldCheck, Radio, Atom, Compass, Layers, Zap } from 'lucide-react';
import { MAGIC_NUMBERS } from '../data/elements';

interface LegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegendModal: React.FC<LegendModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Atom className="w-4 h-4 text-sky-500" />
            <h3 className="font-semibold text-sm tracking-tight">
              Segrè Chart of Nuclides · Guide & Legend
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs leading-relaxed">
          {/* Section: Axes */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px] font-mono mb-2">
              Coordinate System
            </h4>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800 font-mono space-y-1">
              <div>
                <span className="font-bold text-sky-600 dark:text-sky-400">Horizontal (X):</span> Neutron number <span className="text-slate-900 dark:text-slate-100 font-semibold">N</span> (0 to 160)
              </div>
              <div>
                <span className="font-bold text-sky-600 dark:text-sky-400">Vertical (Y):</span> Proton number / Atomic number <span className="text-slate-900 dark:text-slate-100 font-semibold">Z</span> (1 to 100)
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                Diagonal dashed line indicates <span className="font-semibold text-sky-400">N = Z</span>. Heavy nuclei curve downward-right into neutron excess due to electrostatic repulsion.
              </div>
            </div>
          </div>

          {/* Section: Primary Decay Modes */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px] font-mono mb-2">
              Primary Decay Modes & Vectors
            </h4>
            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 flex items-start gap-2">
                <span className="w-3.5 h-3.5 rounded-sm bg-slate-900 dark:bg-slate-950 border border-slate-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">Stable Isotope</div>
                  <div className="text-[10px] text-slate-500">T½ = ∞ · No decay</div>
                </div>
              </div>

              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 flex items-start gap-2">
                <span className="w-3.5 h-3.5 rounded-sm bg-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-600 dark:text-amber-400">α (Alpha)</div>
                  <div className="text-[10px] text-slate-500">Emits ⁴He · ΔZ -2, ΔN -2 (↙)</div>
                </div>
              </div>

              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 flex items-start gap-2">
                <span className="w-3.5 h-3.5 rounded-sm bg-sky-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sky-600 dark:text-sky-400">β⁻ (Beta Minus)</div>
                  <div className="text-[10px] text-slate-500">n → p + e⁻ · ΔZ +1, ΔN -1 (↖)</div>
                </div>
              </div>

              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 flex items-start gap-2">
                <span className="w-3.5 h-3.5 rounded-sm bg-orange-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-orange-600 dark:text-orange-400">β⁺ / EC (Beta Plus)</div>
                  <div className="text-[10px] text-slate-500">p → n + e⁺ · ΔZ -1, ΔN +1 (↘)</div>
                </div>
              </div>

              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 flex items-start gap-2">
                <span className="w-3.5 h-3.5 rounded-sm bg-purple-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-purple-600 dark:text-purple-400">SF (Spontaneous Fission)</div>
                  <div className="text-[10px] text-slate-500">Splits into fragments</div>
                </div>
              </div>

              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 flex items-start gap-2">
                <span className="w-3.5 h-3.5 rounded-sm bg-rose-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-600 dark:text-rose-400">p / n Emission</div>
                  <div className="text-[10px] text-slate-500">Beyond drip lines</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Nuclear Shell Closures (Magic Numbers) */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px] font-mono mb-2">
              Magic Numbers (Closed Shells)
            </h4>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
              <div className="font-mono text-amber-600 dark:text-amber-400 font-semibold mb-1">
                2, 8, 20, 28, 50, 82, 126
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Nuclei with magic proton or neutron counts have extraordinarily high binding energy and stability (e.g. ⁴He, ¹⁶O, ⁴⁰Ca, ⁴⁸Ca, and ²⁰⁸Pb are doubly magic).
              </p>
            </div>
          </div>

          {/* Section: Controls & Shortcuts */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px] font-mono mb-2">
              Interactive Controls
            </h4>
            <ul className="space-y-1 font-mono text-slate-600 dark:text-slate-400">
              <li>· <span className="font-semibold text-slate-900 dark:text-slate-200">Pan</span>: Click and drag anywhere on map</li>
              <li>· <span className="font-semibold text-slate-900 dark:text-slate-200">Zoom</span>: Scroll mouse wheel or use +/- buttons</li>
              <li>· <span className="font-semibold text-slate-900 dark:text-slate-200">Inspect</span>: Click any cell to view telemetry & start decay simulation</li>
              <li>· <span className="font-semibold text-slate-900 dark:text-slate-200">Search</span>: Quick jump by symbol (e.g. "U-238", "C14", "Co-60")</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-mono font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
