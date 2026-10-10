import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Nuclide, ColorMode, Theme, DecayStep } from './types';
import {
  getNuclide,
  traceDecayPath,
  PRESET_CHAINS,
  ALL_NUCLIDES
} from './data/nuclides';
import { CompactHeader } from './components/CompactHeader';
import { NuclideCanvas } from './components/NuclideCanvas';
import { NuclideInspector } from './components/NuclideInspector';
import { LegendModal } from './components/LegendModal';
import { PeriodicTableDrawer } from './components/PeriodicTableDrawer';
import { ParticlesModal } from './components/ParticlesModal';
import { ParticlesCanvas, ParticleNameVisibility } from './components/ParticlesCanvas';
import { ParticleInspector } from './components/ParticleInspector';
import {
  ELEMENTARY_PARTICLES,
  PARTICLE_MAP,
  ElementaryParticle,
  CompositeHub,
  HUB_MAP
} from './data/particles';

export default function App() {
  // Theme state: defaults to dark for scientific telemetry visual language
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('nuclei_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark';
  });

  // Color mode state
  const [colorMode, setColorMode] = useState<ColorMode>('decay_mode');

  // Currently selected nuclide (initial: Uranium-238)
  const [selectedNuclide, setSelectedNuclide] = useState<Nuclide | null>(() => {
    return getNuclide(92, 146) || null;
  });

  const [hoveredNuclide, setHoveredNuclide] = useState<Nuclide | null>(null);

  // Periodic Table modal & element highlight
  const [isPeriodicTableOpen, setIsPeriodicTableOpen] = useState(false);
  const [highlightElementZ, setHighlightElementZ] = useState<number | null>(92);

  // Shell and reference overlays

  const [showNzLine, setShowNzLine] = useState(true);

  // Guide modal state
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  // Elementary Particles, Antiparticles & Force Fields modal state
  const [isParticlesOpen, setIsParticlesOpen] = useState(false);

  // View mode state: 'nuclides' | 'particles'
  const [appViewMode, setAppViewMode] = useState<'nuclides' | 'particles'>('nuclides');

  // Elementary particles map state
  const [selectedParticle, setSelectedParticle] = useState<ElementaryParticle | null>(() => {
    return PARTICLE_MAP.get('electron') || ELEMENTARY_PARTICLES[0];
  });
  const [selectedHub, setSelectedHub] = useState<CompositeHub | null>(null);
  const [showForceFields, setShowForceFields] = useState(true);
  const [showWeakDoublets, setShowWeakDoublets] = useState(true);
  const [showMassContours, setShowMassContours] = useState(true);
  const [particleNameVisibility, setParticleNameVisibility] = useState<ParticleNameVisibility>('compact');

  // Decay simulation state
  const [decaySteps, setDecaySteps] = useState<DecayStep[]>(() => {
    return traceDecayPath(92, 146);
  });
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationTimerRef = useRef<number | null>(null);

  // Sync theme with HTML root class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('nuclei_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // When selected nuclide changes, compute its radioactive decay path
  const handleSelectNuclide = useCallback((nuclide: Nuclide | null) => {
    setSelectedNuclide(nuclide);
    if (nuclide) setHighlightElementZ(nuclide.z);
    setIsSimulating(false);
    if (simulationTimerRef.current) {
      window.clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }

    if (nuclide) {
      if (nuclide.isStable) {
        setDecaySteps([]);
        setActiveStepIndex(null);
      } else {
        const steps = traceDecayPath(nuclide.z, nuclide.n);
        setDecaySteps(steps);
        setActiveStepIndex(0);

        // Link nuclear decay with subatomic particles and emergence origin
        if (nuclide.decayMode === 'beta_minus') {
          const p = PARTICLE_MAP.get('w-minus');
          if (p) setSelectedParticle(p);
          const hub = HUB_MAP.get('neutron-hub');
          if (hub) setSelectedHub(hub);
        } else if (nuclide.decayMode === 'beta_plus') {
          const p = PARTICLE_MAP.get('positron');
          if (p) setSelectedParticle(p);
          const hub = HUB_MAP.get('proton-hub');
          if (hub) setSelectedHub(hub);
        } else if (nuclide.decayMode === 'alpha') {
          const p = PARTICLE_MAP.get('gluon');
          if (p) setSelectedParticle(p);
          const hub = HUB_MAP.get('proton-hub');
          if (hub) setSelectedHub(hub);
        }
      }
    } else {
      setDecaySteps([]);
      setActiveStepIndex(null);
      setSelectedParticle(null);
      setSelectedHub(null);
    }
  }, []);

  // Preset jumping handler
  const handleSelectPreset = (key: string) => {
    const preset = PRESET_CHAINS[key as keyof typeof PRESET_CHAINS];
    if (preset) {
      const target = getNuclide(preset.z, preset.n);
      if (target) {
        handleSelectNuclide(target);
      }
    }
  };

  // Decay Simulation Stepper
  const handleStepForward = useCallback(() => {
    if (decaySteps.length === 0) return;

    setActiveStepIndex((prev) => {
      const next = prev === null ? 0 : (prev + 1) % decaySteps.length;
      const step = decaySteps[next];
      if (step) {
        setSelectedNuclide(step.daughter);
        setHighlightElementZ(step.daughter.z);
      }
      return next;
    });
  }, [decaySteps]);

  const handleResetSimulation = () => {
    setIsSimulating(false);
    if (simulationTimerRef.current) {
      window.clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    if (decaySteps.length > 0) {
      setActiveStepIndex(0);
      setSelectedNuclide(decaySteps[0].parent);
      setHighlightElementZ(decaySteps[0].parent.z);
    }
  };

  const handleStartSimulation = () => {
    if (decaySteps.length === 0) return;
    setIsSimulating(true);
  };

  const handleStopSimulation = () => {
    setIsSimulating(false);
    if (simulationTimerRef.current) {
      window.clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
  };

  // Simulation playback loop
  useEffect(() => {
    if (isSimulating && decaySteps.length > 0) {
      simulationTimerRef.current = window.setInterval(() => {
        setActiveStepIndex((prev) => {
          const currentIndex = prev === null ? -1 : prev;
          if (currentIndex + 1 >= decaySteps.length) {
            // Reached stability or end of chain
            setIsSimulating(false);
            if (simulationTimerRef.current) {
              window.clearInterval(simulationTimerRef.current);
              simulationTimerRef.current = null;
            }
            return currentIndex;
          }
          const nextIndex = currentIndex + 1;
          const step = decaySteps[nextIndex];
          if (step) {
            setSelectedNuclide(step.daughter);
            setHighlightElementZ(step.daughter.z);
          }
          return nextIndex;
        });
      }, 1200);
    } else {
      if (simulationTimerRef.current) {
        window.clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
      }
    }

    return () => {
      if (simulationTimerRef.current) {
        window.clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
      }
    };
  }, [isSimulating, decaySteps]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* 1. Ultra Compact Top Bar (38px-40px) */}
      <CompactHeader
        theme={theme}
        onToggleTheme={handleToggleTheme}
        colorMode={colorMode}
        onChangeColorMode={setColorMode}
        onSelectNuclide={handleSelectNuclide}
        onSelectPreset={handleSelectPreset}
        onOpenLegend={() => setIsLegendOpen(true)}
        onOpenPeriodicTable={() => setIsPeriodicTableOpen(true)}
        appViewMode={appViewMode}
        onChangeAppViewMode={setAppViewMode}
      />

      {/* 2. Main Workspace: Parallel Panel Architecture */}
      {appViewMode === 'nuclides' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Interactive Segrè Chart Canvas Viewport with 2-finger zoom and pan */}
          <NuclideCanvas
            theme={theme}
            colorMode={colorMode}
            selectedNuclide={selectedNuclide}
            onSelectNuclide={handleSelectNuclide}
            hoveredNuclide={hoveredNuclide}
            onHoverNuclide={setHoveredNuclide}
            decaySteps={decaySteps}
            activeStepIndex={activeStepIndex}

            showNzLine={showNzLine}
            onToggleNzLine={() => setShowNzLine((prev) => !prev)}
            highlightElementZ={highlightElementZ}
          />

          {/* Compact Inspector & Decay Simulator */}
          <NuclideInspector
            selectedNuclide={selectedNuclide}
            onSelectNuclide={handleSelectNuclide}
            decaySteps={decaySteps}
            activeStepIndex={activeStepIndex}
            onSetActiveStepIndex={setActiveStepIndex}
            onStartSimulation={handleStartSimulation}
            onStopSimulation={handleStopSimulation}
            isSimulating={isSimulating}
            onStepForward={handleStepForward}
            onResetSimulation={handleResetSimulation}
          />
        </div>
      )}

      {appViewMode === 'particles' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Parallel Interactive Elementary Particles & Force Fields Canvas */}
          <ParticlesCanvas
            theme={theme}
            colorMode={colorMode}
            selectedParticle={selectedParticle}
            onSelectParticle={(p) => {
              setSelectedParticle(p);
              setSelectedHub(null);
            }}
            showForceFields={showForceFields}
            onToggleForceFields={() => setShowForceFields((prev) => !prev)}
            showWeakDoublets={showWeakDoublets}
            onToggleWeakDoublets={() => setShowWeakDoublets((prev) => !prev)}
            showMassContours={showMassContours}
            onToggleMassContours={() => setShowMassContours((prev) => !prev)}
            selectedHubId={selectedHub?.id || null}
            onSelectHub={setSelectedHub}
            nameVisibility={particleNameVisibility}
            onNameVisibilityChange={setParticleNameVisibility}
          />

          {/* Parallel Particle Inspector */}
          <ParticleInspector
            selectedParticle={selectedParticle}
            onSelectParticle={(p) => {
              setSelectedParticle(p);
              setSelectedHub(null);
            }}
            selectedHub={selectedHub}
            onSelectHub={setSelectedHub}
          />
        </div>
      )}



      {/* 3. Periodic Table Drawer (All 118 Elements) */}
      <PeriodicTableDrawer
        isOpen={isPeriodicTableOpen}
        onClose={() => setIsPeriodicTableOpen(false)}
        selectedElementZ={highlightElementZ}
        onSelectElement={(z) => setHighlightElementZ(z)}
        onSelectNuclide={handleSelectNuclide}
      />

      {/* 4. Legend & Scientific Guide Modal */}
      <LegendModal
        isOpen={isLegendOpen}
        onClose={() => setIsLegendOpen(false)}
      />

      {/* 5. Elementary Particles, Antiparticles & Force Fields Panel */}
      <ParticlesModal
        isOpen={isParticlesOpen}
        onClose={() => setIsParticlesOpen(false)}
      />
    </div>
  );
}
