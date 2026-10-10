import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Theme, ColorMode } from '../types';
import {
  ELEMENTARY_PARTICLES,
  PARTICLE_MAP,
  COMPOSITE_HUBS,
  HUB_MAP,
  CompositeHub,
  ElementaryParticle,
  getParticleShortName,
} from '../data/particles';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Zap,
  Sparkles,
  GitBranch,
  Play,
  Pause,
  Tag,
} from 'lucide-react';

export type ParticleNameVisibility = 'compact' | 'full' | 'none';

interface ParticlesCanvasProps {
  theme: Theme;
  colorMode: ColorMode;
  selectedParticle: ElementaryParticle | null;
  onSelectParticle: (particle: ElementaryParticle | null) => void;
  hoveredParticle?: ElementaryParticle | null;
  onHoverParticle?: (particle: ElementaryParticle | null) => void;
  showForceFields: boolean;
  onToggleForceFields: () => void;
  showWeakDoublets: boolean;
  onToggleWeakDoublets: () => void;
  showMassContours: boolean;
  onToggleMassContours: () => void;
  selectedHubId?: string | null;
  onSelectHub?: (hub: CompositeHub | null) => void;
  nameVisibility?: ParticleNameVisibility;
  onNameVisibilityChange?: (mode: ParticleNameVisibility) => void;
}

interface PointerRecord {
  id: number;
  x: number;
  y: number;
}

export const ParticlesCanvas: React.FC<ParticlesCanvasProps> = ({
  theme,
  colorMode,
  selectedParticle,
  onSelectParticle,
  hoveredParticle: externalHoveredParticle,
  onHoverParticle,
  showForceFields,
  onToggleForceFields,
  showWeakDoublets,
  onToggleWeakDoublets,
  showMassContours,
  onToggleMassContours,
  selectedHubId,
  onSelectHub,
  nameVisibility: externalNameVisibility,
  onNameVisibilityChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cached dimensions to completely eliminate getBoundingClientRect layout thrashing
  const dimRef = useRef<{ w: number; h: number; left: number; top: number; dpr: number }>({
    w: 800,
    h: 600,
    left: 0,
    top: 0,
    dpr: 1,
  });

  // World coordinates stored in refs for instantaneous 60fps drag/pinch with zero React re-render churn
  const coordsRef = useRef({
    cellSize: 36,
    originX: 400,
    originY: 300,
  });

  // Needs redraw flag
  const needsRedrawRef = useRef(true);
  const requestRedraw = useCallback(() => {
    needsRedrawRef.current = true;
  }, []);

  // Multi-touch gestures tracking
  const activePointersRef = useRef<Map<number, PointerRecord>>(new Map());
  const pinchStartRef = useRef<{
    dist: number;
    cellSize: number;
    midX: number;
    midY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const singleDragStartRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    totalMoved: number;
  } | null>(null);

  const hasPinchedRef = useRef(false);

  // Hover state maintained locally to prevent top-level App re-render thrashing
  const [localHoveredParticle, setLocalHoveredParticle] = useState<ElementaryParticle | null>(null);
  const [localHoveredHub, setLocalHoveredHub] = useState<CompositeHub | null>(null);
  const hoveredTargetIdRef = useRef<string | null>(null);

  // Emergence filter: 'all' | 'proton' | 'neutron' | 'electron' | 'anti-nucleus'
  const [originFilter, setOriginFilter] = useState<'all' | 'proton' | 'neutron' | 'electron' | 'anti-nucleus'>('all');
  const [animateFlow, setAnimateFlow] = useState<boolean>(true);
  const animTimeRef = useRef<number>(0);

  // Particle Name Visibility state: 'compact' (default) | 'full' | 'none'
  const [internalNameVisibility, setInternalNameVisibility] = useState<ParticleNameVisibility>('compact');
  const nameVisibility = externalNameVisibility ?? internalNameVisibility;

  const handleSetNameVisibility = useCallback(
    (mode: ParticleNameVisibility) => {
      setInternalNameVisibility(mode);
      if (onNameVisibilityChange) onNameVisibilityChange(mode);
      requestRedraw();
    },
    [onNameVisibilityChange, requestRedraw]
  );

  // All dynamic visual props mirrored into a ref so draw routine is fully decoupled from closures
  const renderPropsRef = useRef({
    theme,
    colorMode,
    selectedParticle,
    localHoveredParticle,
    localHoveredHub,
    showForceFields,
    showWeakDoublets,
    showMassContours,
    selectedHubId,
    originFilter,
    animateFlow,
    nameVisibility,
  });

  useEffect(() => {
    renderPropsRef.current = {
      theme,
      colorMode,
      selectedParticle,
      localHoveredParticle,
      localHoveredHub,
      showForceFields,
      showWeakDoublets,
      showMassContours,
      selectedHubId,
      originFilter,
      animateFlow,
      nameVisibility,
    };
    requestRedraw();
  }, [
    theme,
    colorMode,
    selectedParticle,
    localHoveredParticle,
    localHoveredHub,
    showForceFields,
    showWeakDoublets,
    showMassContours,
    selectedHubId,
    originFilter,
    animateFlow,
    nameVisibility,
    requestRedraw,
  ]);

  // World to screen mapping (pure math, 0 allocations)
  const worldToScreen = (gx: number, gy: number) => {
    const { cellSize: cs, originX: ox, originY: oy } = coordsRef.current;
    const spacing = cs * 1.6;
    return {
      x: ox + gx * spacing,
      y: oy - gy * spacing,
    };
  };

  // Fit emergence particles map into container viewport
  const fitToView = useCallback(() => {
    const { w, h } = dimRef.current;
    if (w <= 0 || h <= 0) return;

    const availW = Math.max(220, w - 90);
    const availH = Math.max(180, h - 80);

    const scaleX = availW / (21 * 1.6);
    const scaleY = availH / (15 * 1.6);
    const targetCellSize = Math.max(16, Math.min(46, Math.min(scaleX, scaleY)));

    coordsRef.current.cellSize = targetCellSize;
    coordsRef.current.originX = Math.round(w / 2);
    coordsRef.current.originY = Math.round(h / 2 + 10);

    requestRedraw();
  }, [requestRedraw]);

  // ResizeObserver for zero-cost cached layout dimensions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x DPR to avoid high-res GPU stalls
      dimRef.current = {
        w: rect.width,
        h: rect.height,
        left: rect.left,
        top: rect.top,
        dpr,
      };

      const canvas = canvasRef.current;
      if (canvas && rect.width > 0 && rect.height > 0) {
        const targetW = Math.round(rect.width * dpr);
        const targetH = Math.round(rect.height * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
      }
      fitToView();
      requestRedraw();
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [fitToView, requestRedraw]);

  const zoomIn = () => {
    const { w, h } = dimRef.current;
    const cx = w / 2;
    const cy = h / 2;
    const current = coordsRef.current;
    const newSize = Math.min(75, current.cellSize * 1.25);
    const factor = newSize / current.cellSize;
    coordsRef.current.cellSize = newSize;
    coordsRef.current.originX = cx - (cx - current.originX) * factor;
    coordsRef.current.originY = cy - (cy - current.originY) * factor;
    requestRedraw();
  };

  const zoomOut = () => {
    const { w, h } = dimRef.current;
    const cx = w / 2;
    const cy = h / 2;
    const current = coordsRef.current;
    const newSize = Math.max(13, current.cellSize * 0.8);
    const factor = newSize / current.cellSize;
    coordsRef.current.cellSize = newSize;
    coordsRef.current.originX = cx - (cx - current.originX) * factor;
    coordsRef.current.originY = cy - (cy - current.originY) * factor;
    requestRedraw();
  };

  // High performance canvas draw procedure
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const { w, h, dpr } = dimRef.current;
    if (w <= 0 || h <= 0) return;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const props = renderPropsRef.current;
    const isDark = props.theme === 'dark';
    const { cellSize: cs } = coordsRef.current;
    const animOffset = (animTimeRef.current * 0.00035) % 1;

    // 1. Clear background
    ctx.fillStyle = isDark ? '#020617' : '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    const centerPos = worldToScreen(0, 0);

    // 2. Background Zone Enclosures
    const matterLeftPos = worldToScreen(-10.5, 0);
    const matterRightPos = worldToScreen(-0.6, 0);
    const antiLeftPos = worldToScreen(0.6, 0);
    const antiRightPos = worldToScreen(10.5, 0);

    // Matter Zone Card
    ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.22)' : 'rgba(241, 245, 249, 0.65)';
    ctx.fillRect(matterLeftPos.x, 28, matterRightPos.x - matterLeftPos.x, h - 38);
    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(matterLeftPos.x, 28, matterRightPos.x - matterLeftPos.x, h - 38);

    // Antimatter Zone Card
    ctx.fillStyle = isDark ? 'rgba(76, 29, 149, 0.14)' : 'rgba(250, 245, 255, 0.65)';
    ctx.fillRect(antiLeftPos.x, 28, antiRightPos.x - antiLeftPos.x, h - 38);
    ctx.strokeStyle = isDark ? 'rgba(236, 72, 153, 0.12)' : 'rgba(219, 39, 119, 0.15)';
    ctx.strokeRect(antiLeftPos.x, 28, antiRightPos.x - antiLeftPos.x, h - 38);

    // Center dividing line (Origin X = 0)
    ctx.strokeStyle = isDark ? 'rgba(51, 65, 85, 0.45)' : 'rgba(203, 213, 225, 0.7)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(centerPos.x, 0);
    ctx.lineTo(centerPos.x, h);
    ctx.stroke();
    ctx.setLineDash([]);



    // 3. Higgs Mass Contours (if toggled)
    if (props.showMassContours) {
      const higgsP = PARTICLE_MAP.get('higgs');
      if (higgsP) {
        const hPos = worldToScreen(higgsP.gridX, higgsP.gridY);
        [45, 110, 190, 290].forEach((r, idx) => {
          const radius = (r * cs) / 36;
          ctx.beginPath();
          ctx.arc(hPos.x, hPos.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = isDark
            ? `rgba(168, 85, 247, ${0.16 - idx * 0.03})`
            : `rgba(147, 51, 234, ${0.18 - idx * 0.035})`;
          ctx.setLineDash([4, 5]);
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
        });

      }
    }

    // 4. Atomic Electron Shell Orbital Ring around Proton & Neutron Nucleus
    const protonHub = HUB_MAP.get('proton-hub');
    const neutronHub = HUB_MAP.get('neutron-hub');
    const electronHub = HUB_MAP.get('electron-hub');
    if (protonHub && neutronHub && electronHub) {
      const pPos = worldToScreen(protonHub.gridX, protonHub.gridY);
      const nPos = worldToScreen(neutronHub.gridX, neutronHub.gridY);
      const nucMidX = (pPos.x + nPos.x) / 2;
      const nucMidY = (pPos.y + nPos.y) / 2;
      const ePos = worldToScreen(electronHub.gridX, electronHub.gridY);
      const rx = Math.abs(ePos.x - nucMidX) + 24;
      const ry = rx * 0.72;

      ctx.beginPath();
      ctx.ellipse(nucMidX, nucMidY, Math.abs(pPos.x - nPos.x) + 48, Math.abs(pPos.y - nPos.y) / 2 + 36, 0, 0, Math.PI * 2);
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.28)' : 'rgba(2, 132, 199, 0.35)';
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.setLineDash([]);

      // Orbital ellipse
      ctx.beginPath();
      ctx.ellipse(nucMidX, nucMidY, rx, ry, -0.08, 0, Math.PI * 2);
      ctx.strokeStyle = isDark ? 'rgba(16, 185, 129, 0.26)' : 'rgba(5, 150, 105, 0.32)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Anti-Atom Positron Orbital Ring around Antiproton & Antineutron
    const antiprotonHub = HUB_MAP.get('antiproton-hub');
    const antineutronHub = HUB_MAP.get('antineutron-hub');
    const positronHub = HUB_MAP.get('positron-hub');
    if (antiprotonHub && antineutronHub && positronHub) {
      const apPos = worldToScreen(antiprotonHub.gridX, antiprotonHub.gridY);
      const anPos = worldToScreen(antineutronHub.gridX, antineutronHub.gridY);
      const antiMidX = (apPos.x + anPos.x) / 2;
      const antiMidY = (apPos.y + anPos.y) / 2;
      const posPos = worldToScreen(positronHub.gridX, positronHub.gridY);
      const rx = Math.abs(posPos.x - antiMidX) + 24;
      const ry = rx * 0.72;

      ctx.beginPath();
      ctx.ellipse(antiMidX, antiMidY, Math.abs(apPos.x - anPos.x) + 48, Math.abs(apPos.y - anPos.y) / 2 + 36, 0, 0, Math.PI * 2);
      ctx.strokeStyle = isDark ? 'rgba(236, 72, 153, 0.28)' : 'rgba(219, 39, 119, 0.35)';
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.setLineDash([]);

      // Positron orbital ellipse
      ctx.beginPath();
      ctx.ellipse(antiMidX, antiMidY, rx, ry, 0.08, 0, Math.PI * 2);
      ctx.strokeStyle = isDark ? 'rgba(20, 184, 166, 0.26)' : 'rgba(13, 148, 136, 0.32)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Residual Strong Force bond between Proton & Neutron
    if (protonHub && neutronHub) {
      const pPos = worldToScreen(protonHub.gridX, protonHub.gridY);
      const nPos = worldToScreen(neutronHub.gridX, neutronHub.gridY);
      ctx.beginPath();
      ctx.moveTo(pPos.x, pPos.y);
      ctx.lineTo(nPos.x, nPos.y);
      ctx.strokeStyle = isDark ? 'rgba(245, 158, 11, 0.45)' : 'rgba(217, 119, 6, 0.55)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Annihilation Line: Electron <-> Positron via 2x Photons (511 keV)
    if (electronHub && positronHub) {
      const ePos = worldToScreen(electronHub.gridX, electronHub.gridY);
      const posPos = worldToScreen(positronHub.gridX, positronHub.gridY);
      ctx.strokeStyle = isDark ? 'rgba(234, 179, 8, 0.4)' : 'rgba(202, 138, 4, 0.5)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ePos.x, ePos.y);
      ctx.lineTo(posPos.x, posPos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5. DRAW EMERGENCE BRANCH CONDUITS
    COMPOSITE_HUBS.forEach((hub) => {
      if (props.originFilter !== 'all' && hub.category !== props.originFilter) {
        return;
      }

      const hubPos = worldToScreen(hub.gridX, hub.gridY);
      const isHubSelected = props.selectedHubId === hub.id;
      const isHubHovered = props.localHoveredHub?.id === hub.id;

      hub.emergentParticleIds.forEach((pid) => {
        const p = PARTICLE_MAP.get(pid);
        if (!p) return;
        const pPos = worldToScreen(p.gridX, p.gridY);

        const isParticleSelected = props.selectedParticle?.id === p.id;
        const isParticleHovered = props.localHoveredParticle?.id === p.id;
        const isHighlighted = isHubSelected || isHubHovered || isParticleSelected || isParticleHovered;

        const branchColor = hub.color;
        const branchAlpha = isHighlighted ? 0.9 : 0.38;
        const lineWidth = isHighlighted ? 2.8 : 1.8;

        ctx.strokeStyle = `${branchColor}${Math.round(branchAlpha * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = lineWidth;

        ctx.beginPath();
        ctx.moveTo(hubPos.x, hubPos.y);
        ctx.lineTo(pPos.x, pPos.y);
        ctx.stroke();

        // Directional pulse arrow
        const angle = Math.atan2(pPos.y - hubPos.y, pPos.x - hubPos.x);
        const arrowLen = isHighlighted ? 7 : 5;

        // Slow, spaced pulses
        const pIdx = hub.emergentParticleIds.indexOf(pid);
        const stagger = pIdx >= 0 ? pIdx / Math.max(1, hub.emergentParticleIds.length) : 0;
        const tVal = props.animateFlow ? (animOffset + stagger) % 1 : 0.55;
        const pulseX = hubPos.x + tVal * (pPos.x - hubPos.x);
        const pulseY = hubPos.y + tVal * (pPos.y - hubPos.y);

        ctx.fillStyle = isHighlighted ? '#38bdf8' : branchColor;
        ctx.beginPath();
        ctx.arc(pulseX, pulseY, isHighlighted ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Arrow head near target particle
        const headT = 0.88;
        const headX = hubPos.x + headT * (pPos.x - hubPos.x);
        const headY = hubPos.y + headT * (pPos.y - hubPos.y);

        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(
          headX - arrowLen * Math.cos(angle - Math.PI / 6),
          headY - arrowLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          headX - arrowLen * Math.cos(angle + Math.PI / 6),
          headY - arrowLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      });
    });

    // 6. Force Field Links
    if (props.showForceFields) {
      const gluon = PARTICLE_MAP.get('gluon');
      if (gluon) {
        const gPos = worldToScreen(gluon.gridX, gluon.gridY);
        ctx.strokeStyle = isDark ? 'rgba(245, 158, 11, 0.32)' : 'rgba(217, 119, 6, 0.4)';
        ctx.lineWidth = 1.3;

        ['up', 'down', 'anti-up', 'anti-down'].forEach((pid) => {
          const q = PARTICLE_MAP.get(pid);
          if (q) {
            const qPos = worldToScreen(q.gridX, q.gridY);
            ctx.beginPath();
            ctx.moveTo(gPos.x, gPos.y);
            ctx.lineTo(qPos.x, qPos.y);
            ctx.stroke();
          }
        });
      }

      const wMinus = PARTICLE_MAP.get('w-minus');
      const electron = PARTICLE_MAP.get('electron');
      const antineutrino = PARTICLE_MAP.get('electron-antineutrino');
      if (wMinus && neutronHub && electron && antineutrino) {
        const nPos = worldToScreen(neutronHub.gridX, neutronHub.gridY);
        const wmPos = worldToScreen(wMinus.gridX, wMinus.gridY);
        const ePos = worldToScreen(electron.gridX, electron.gridY);
        const anPos = worldToScreen(antineutrino.gridX, antineutrino.gridY);

        ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([4, 3]);

        ctx.beginPath();
        ctx.moveTo(nPos.x, nPos.y);
        ctx.lineTo(wmPos.x, wmPos.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(wmPos.x, wmPos.y);
        ctx.lineTo(ePos.x, ePos.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(wmPos.x, wmPos.y);
        ctx.lineTo(anPos.x, anPos.y);
        ctx.stroke();

        ctx.setLineDash([]);
      }
    }

    // 7. Render Composite Hubs
    COMPOSITE_HUBS.forEach((hub) => {
      const { x: sx, y: sy } = worldToScreen(hub.gridX, hub.gridY);
      const isSelected = props.selectedHubId === hub.id;
      const isHovered = props.localHoveredHub?.id === hub.id;
      const isFilteredOut = props.originFilter !== 'all' && hub.category !== props.originFilter;
      const hubRadius = Math.max(24, cs * 1.05);

      ctx.beginPath();
      ctx.arc(sx, sy, hubRadius + (isSelected ? 6 : isHovered ? 4 : 0), 0, Math.PI * 2);
      ctx.fillStyle = isSelected
        ? `${hub.color}40`
        : isHovered
        ? `${hub.color}25`
        : isDark
        ? 'rgba(15, 23, 42, 0.95)'
        : 'rgba(255, 255, 255, 0.95)';
      ctx.fill();

      ctx.lineWidth = isSelected ? 3.5 : isHovered ? 2.5 : 2;
      ctx.strokeStyle = isFilteredOut ? `${hub.color}40` : hub.color;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(sx, sy, hubRadius - 4, 0, Math.PI * 2);
      ctx.fillStyle = isFilteredOut ? `${hub.color}15` : `${hub.color}28`;
      ctx.fill();

      ctx.font = `bold ${Math.max(14, Math.min(20, cs * 0.52))}px monospace`;
      ctx.fillStyle = isFilteredOut ? `${hub.color}60` : hub.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(hub.symbol, sx, sy - 5);

      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.fillText(hub.valenceQuarks.slice(0, 5), sx, sy + 8);



      // Hub Name Badge underneath circle
      const hubLabel =
        hub.type === 'proton'
          ? 'Proton (p⁺)'
          : hub.type === 'neutron'
          ? 'Neutron (n⁰)'
          : hub.type === 'electron'
          ? 'Electron (e⁻)'
          : hub.type === 'antiproton'
          ? 'Antiproton (p̄⁻)'
          : hub.type === 'antineutron'
          ? 'Antineutron (n̄⁰)'
          : hub.type === 'positron'
          ? 'Positron (e⁺)'
          : hub.name;

      const badgeW = Math.max(76, Math.min(128, hubLabel.length * 6.5));
      const badgeH = 16;
      const badgeY = sy + hubRadius + 4;

      ctx.beginPath();
      ctx.roundRect(sx - badgeW / 2, badgeY, badgeW, badgeH, 4);
      ctx.fillStyle = isSelected
        ? `${hub.color}35`
        : isHovered
        ? `${hub.color}20`
        : isDark
        ? 'rgba(15, 23, 42, 0.92)'
        : 'rgba(255, 255, 255, 0.95)';
      ctx.fill();
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeStyle = isSelected ? '#38bdf8' : isFilteredOut ? `${hub.color}40` : `${hub.color}aa`;
      ctx.stroke();

      ctx.font = 'bold 8.5px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = isSelected ? '#38bdf8' : isDark ? '#f8fafc' : '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(hubLabel, sx, badgeY + badgeH / 2);
    });

    // 8. Render Elementary Particles
    const showNames = props.nameVisibility !== 'none';
    const isFullName = props.nameVisibility === 'full';
    const tileW = showNames
      ? (isFullName ? Math.max(68, Math.min(108, cs * 2.85)) : Math.max(54, Math.min(88, cs * 2.35)))
      : Math.max(38, Math.min(62, cs * 1.8));
    const tileH = showNames
      ? (isFullName ? Math.max(46, Math.min(68, cs * 1.95)) : Math.max(42, Math.min(64, cs * 1.8)))
      : Math.max(28, Math.min(46, cs * 1.3));
    const halfW = tileW / 2;
    const halfH = tileH / 2;

    // Pass 1: Render all particle boxes, fills, strokes, charge/spin, and symbols
    ELEMENTARY_PARTICLES.forEach((particle) => {
      const { x: sx, y: sy } = worldToScreen(particle.gridX, particle.gridY);
      if (sx + halfW < 0 || sx - halfW > w || sy + halfH < 0 || sy - halfH > h) return;

      const isSelected = props.selectedParticle?.id === particle.id;
      const isHovered = props.localHoveredParticle?.id === particle.id;
      const isFilteredOut = props.originFilter !== 'all' && particle.primaryOrigin !== props.originFilter && particle.primaryOrigin !== 'fundamental_field';

      let fill = isDark ? '#0f172a' : '#ffffff';
      let stroke = isDark ? '#334155' : '#cbd5e1';
      let symbolColor = isDark ? '#f8fafc' : '#0f172a';

      if (particle.family === 'quark') {
        fill = particle.isAntiparticle
          ? isDark ? '#4a044e' : '#fdf4ff'
          : isDark ? '#2e1065' : '#f5f3ff';
        stroke = particle.isAntiparticle
          ? isDark ? '#a21caf' : '#d946ef'
          : isDark ? '#7c3aed' : '#8b5cf6';
        symbolColor = particle.isAntiparticle ? '#e879f9' : '#a78bfa';
      } else if (particle.family === 'lepton') {
        fill = particle.isAntiparticle
          ? isDark ? '#042f2e' : '#f0fdfa'
          : isDark ? '#022c22' : '#ecfdf5';
        stroke = particle.isAntiparticle
          ? isDark ? '#0f766e' : '#14b8a6'
          : isDark ? '#047857' : '#10b981';
        symbolColor = particle.isAntiparticle ? '#2dd4bf' : '#34d399';
      } else if (particle.family === 'gauge_boson') {
        fill = isDark ? '#451a03' : '#fffbeb';
        stroke = isDark ? '#b45309' : '#f59e0b';
        symbolColor = '#fbbf24';
      } else if (particle.family === 'scalar_boson') {
        fill = isDark ? '#3b0764' : '#faf5ff';
        stroke = isDark ? '#7e22ce' : '#a855f7';
        symbolColor = '#c084fc';
      }

      if (isFilteredOut) {
        stroke = isDark ? '#1e293b' : '#e2e8f0';
        fill = isDark ? '#090d16' : '#f8fafc';
        symbolColor = isDark ? '#475569' : '#94a3b8';
      }

      if (isSelected) {
        stroke = '#38bdf8';
        ctx.lineWidth = 2.8;
      } else if (isHovered) {
        stroke = '#60a5fa';
        ctx.lineWidth = 2.2;
      } else {
        ctx.lineWidth = 1;
      }

      const radius = 0;
      ctx.beginPath();
      ctx.roundRect(sx - halfW, sy - halfH, tileW, tileH, radius);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.stroke();

      // Top row: charge & spin
      if (cs >= 15 && !isFilteredOut) {
        ctx.font = 'bold 7.5px monospace';
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(particle.chargeText, sx - halfW + 4, sy - halfH + 3.5);

        ctx.textAlign = 'right';
        ctx.fillText(particle.spin, sx + halfW - 4, sy - halfH + 3.5);
      }

      // Middle: Quantum Symbol
      const fontSize = Math.max(12, Math.min(19, cs * 0.48));
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.fillStyle = symbolColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const symbolY = showNames ? sy - 2.5 : sy;
      ctx.fillText(particle.symbol, sx, symbolY);
    });

    // Pass 2: Render all particle name label badges and selection highlights ahead of (on top of) all boxes
    ELEMENTARY_PARTICLES.forEach((particle) => {
      const { x: sx, y: sy } = worldToScreen(particle.gridX, particle.gridY);
      if (sx + halfW < 0 || sx - halfW > w || sy + halfH < 0 || sy - halfH > h) return;

      const isSelected = props.selectedParticle?.id === particle.id;
      const isHovered = props.localHoveredParticle?.id === particle.id;
      const isFilteredOut = props.originFilter !== 'all' && particle.primaryOrigin !== props.originFilter && particle.primaryOrigin !== 'fundamental_field';

      // Bottom: Name Label Badge
      if (showNames && !isFilteredOut) {
        const nameText = isFullName ? particle.name : getParticleShortName(particle);
        const nameH = Math.max(14, Math.min(18, cs * 0.52));
        const nameY = sy + halfH - nameH;

        // Dedicated high-contrast name pill background
        ctx.beginPath();
        ctx.roundRect(sx - halfW + 1, nameY, tileW - 2, nameH - 1, [0, 0, 0, 0]);
        ctx.fillStyle = isSelected
          ? (isDark ? 'rgba(14, 165, 233, 0.35)' : 'rgba(224, 242, 254, 0.98)')
          : isHovered
          ? (isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(240, 249, 255, 0.98)')
          : isDark
          ? 'rgba(15, 23, 42, 0.96)'
          : 'rgba(255, 255, 255, 0.96)';
        ctx.fill();

        // Divider line between symbol and name
        ctx.beginPath();
        ctx.moveTo(sx - halfW + 2, nameY);
        ctx.lineTo(sx + halfW - 2, nameY);
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();

        const maxTextW = tileW - 6;
        let nameFontPx = Math.max(9, Math.min(11.5, Math.floor(cs * 0.34)));
        ctx.font = `bold ${nameFontPx}px system-ui, -apple-system, sans-serif`;
        const measured = ctx.measureText(nameText).width;
        if (measured > maxTextW) {
          nameFontPx = Math.max(7.5, Math.floor(nameFontPx * (maxTextW / measured)));
          ctx.font = `bold ${nameFontPx}px system-ui, -apple-system, sans-serif`;
        }

        ctx.fillStyle = isSelected
          ? (isDark ? '#38bdf8' : '#0284c7')
          : isHovered
          ? (isDark ? '#7dd3fc' : '#0369a1')
          : isDark
          ? '#f8fafc'
          : '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(nameText, sx, nameY + nameH / 2);
      }

      if (isSelected) {
        const rLen = 6;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(sx - halfW - 3, sy - halfH + rLen);
        ctx.lineTo(sx - halfW - 3, sy - halfH - 3);
        ctx.lineTo(sx - halfW + rLen, sy - halfH - 3);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(sx + halfW + 3, sy - halfH + rLen);
        ctx.lineTo(sx + halfW + 3, sy - halfH - 3);
        ctx.lineTo(sx + halfW - rLen, sy - halfH - 3);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(sx - halfW - 3, sy + halfH - rLen);
        ctx.lineTo(sx - halfW - 3, sy + halfH + 3);
        ctx.lineTo(sx - halfW + rLen, sy + halfH + 3);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(sx + halfW + 3, sy + halfH - rLen);
        ctx.lineTo(sx + halfW + 3, sy + halfH + 3);
        ctx.lineTo(sx + halfW - rLen, sy + halfH + 3);
        ctx.stroke();
      }
    });

    ctx.restore();
  }, []);

  // Dedicated stable animation loop throttled to ~60fps
  useEffect(() => {
    let animId: number;
    let lastTime = 0;

    const tick = (time: number) => {
      const isFlowActive = renderPropsRef.current.animateFlow;

      if (isFlowActive || needsRedrawRef.current) {
        if (time - lastTime >= 15) {
          lastTime = time;
          animTimeRef.current = time;
          needsRedrawRef.current = false;
          draw();
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [draw]);

  // Fast hit-testing with cached dimensions
  const hitTestAtPoint = useCallback(
    (clientX: number, clientY: number): { type: 'particle'; particle: ElementaryParticle } | { type: 'hub'; hub: CompositeHub } | null => {
      const { left, top } = dimRef.current;
      const px = clientX - left;
      const py = clientY - top;

      const { cellSize: cs } = coordsRef.current;
      const hubRadius = Math.max(24, cs * 1.05) + 6;

      // 1. Check composite hubs (circle + name badge beneath)
      for (const hub of COMPOSITE_HUBS) {
        const pos = worldToScreen(hub.gridX, hub.gridY);
        const dist = Math.hypot(px - pos.x, py - pos.y);
        if (dist <= hubRadius) {
          return { type: 'hub', hub };
        }
        const badgeY = pos.y + hubRadius + 4;
        if (
          px >= pos.x - 65 &&
          px <= pos.x + 65 &&
          py >= badgeY - 2 &&
          py <= badgeY + 20
        ) {
          return { type: 'hub', hub };
        }
      }

      // 2. Check elementary particles matching active nameVisibility mode
      const showNames = renderPropsRef.current.nameVisibility !== 'none';
      const isFullName = renderPropsRef.current.nameVisibility === 'full';
      const tileW = showNames
        ? (isFullName ? Math.max(68, Math.min(108, cs * 2.85)) : Math.max(54, Math.min(88, cs * 2.35)))
        : Math.max(38, Math.min(62, cs * 1.8));
      const tileH = showNames
        ? (isFullName ? Math.max(46, Math.min(68, cs * 1.95)) : Math.max(42, Math.min(64, cs * 1.8)))
        : Math.max(28, Math.min(46, cs * 1.3));
      const halfW = tileW / 2 + 5;
      const halfH = tileH / 2 + 5;

      for (const particle of ELEMENTARY_PARTICLES) {
        const pos = worldToScreen(particle.gridX, particle.gridY);
        if (
          px >= pos.x - halfW &&
          px <= pos.x + halfW &&
          py >= pos.y - halfH &&
          py <= pos.y + halfH
        ) {
          return { type: 'particle', particle };
        }
      }

      return null;
    },
    []
  );

  // Pointer event handlers with instantaneous gesture updates and zero lag
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    activePointersRef.current.set(e.pointerId, {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
    });

    if (activePointersRef.current.size === 2) {
      const ptrs = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(ptrs[0].x - ptrs[1].x, ptrs[0].y - ptrs[1].y);
      const midX = (ptrs[0].x + ptrs[1].x) / 2;
      const midY = (ptrs[0].y + ptrs[1].y) / 2;
      const { cellSize: cs, originX: ox, originY: oy } = coordsRef.current;
      pinchStartRef.current = {
        dist,
        cellSize: cs,
        midX,
        midY,
        originX: ox,
        originY: oy,
      };
      hasPinchedRef.current = true;
      singleDragStartRef.current = null;
    } else if (activePointersRef.current.size === 1) {
      hasPinchedRef.current = false;
      const { originX: ox, originY: oy } = coordsRef.current;
      singleDragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: ox,
        originY: oy,
        totalMoved: 0,
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
      });
    }

    // 2-FINGER PINCH ZOOM
    if (activePointersRef.current.size === 2 && pinchStartRef.current) {
      const ptrs = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(ptrs[0].x - ptrs[1].x, ptrs[0].y - ptrs[1].y);
      const scale = dist / Math.max(1, pinchStartRef.current.dist);
      const newCellSize = Math.max(13, Math.min(80, pinchStartRef.current.cellSize * scale));

      const { left, top } = dimRef.current;
      const midX = (ptrs[0].x + ptrs[1].x) / 2 - left;
      const midY = (ptrs[0].y + ptrs[1].y) / 2 - top;
      const factor = newCellSize / pinchStartRef.current.cellSize;

      coordsRef.current.cellSize = newCellSize;
      coordsRef.current.originX = midX - (midX - pinchStartRef.current.originX) * factor;
      coordsRef.current.originY = midY - (midY - pinchStartRef.current.originY) * factor;

      requestRedraw();
      return;
    }

    // 1-FINGER / MOUSE PAN
    if (activePointersRef.current.size === 1 && singleDragStartRef.current) {
      const dx = e.clientX - singleDragStartRef.current.startX;
      const dy = e.clientY - singleDragStartRef.current.startY;
      singleDragStartRef.current.totalMoved += Math.hypot(dx, dy);

      coordsRef.current.originX = singleDragStartRef.current.originX + dx;
      coordsRef.current.originY = singleDragStartRef.current.originY + dy;

      requestRedraw();
      return;
    }

    // HOVER PROBE (Throttled & de-duplicated to prevent React re-render thrashing)
    if (activePointersRef.current.size === 0) {
      const hit = hitTestAtPoint(e.clientX, e.clientY);
      const newHitId = hit ? (hit.type === 'particle' ? hit.particle.id : hit.hub.id) : null;

      if (newHitId !== hoveredTargetIdRef.current) {
        hoveredTargetIdRef.current = newHitId;

        if (hit?.type === 'particle') {
          setLocalHoveredParticle(hit.particle);
          setLocalHoveredHub(null);
          if (onHoverParticle) onHoverParticle(hit.particle);
        } else if (hit?.type === 'hub') {
          setLocalHoveredHub(hit.hub);
          setLocalHoveredParticle(null);
          if (onHoverParticle) onHoverParticle(null);
        } else {
          setLocalHoveredParticle(null);
          setLocalHoveredHub(null);
          if (onHoverParticle) onHoverParticle(null);
        }
        requestRedraw();
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const moved = singleDragStartRef.current?.totalMoved || 0;
    const wasPinching = hasPinchedRef.current;

    activePointersRef.current.delete(e.pointerId);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (activePointersRef.current.size === 0) {
      pinchStartRef.current = null;
      singleDragStartRef.current = null;

      // Click or tap selection (only if not a pan/drag)
      if (!wasPinching && moved < 6) {
        const hit = hitTestAtPoint(e.clientX, e.clientY);
        if (hit?.type === 'particle') {
          onSelectParticle(hit.particle);
          if (onSelectHub) onSelectHub(null);
        } else if (hit?.type === 'hub') {
          if (onSelectHub) onSelectHub(hit.hub);
          const firstP = PARTICLE_MAP.get(hit.hub.emergentParticleIds[0]);
          if (firstP) onSelectParticle(firstP);
        } else {
          // Tap on empty area -> deselect selected particles and hubs!
          onSelectParticle(null);
          if (onSelectHub) onSelectHub(null);
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const { left, top } = dimRef.current;
    const mx = e.clientX - left;
    const my = e.clientY - top;

    const current = coordsRef.current;
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newCellSize = Math.max(13, Math.min(80, current.cellSize * zoomFactor));

    const factor = newCellSize / current.cellSize;
    coordsRef.current.cellSize = newCellSize;
    coordsRef.current.originX = mx - (mx - current.originX) * factor;
    coordsRef.current.originY = my - (my - current.originY) * factor;

    requestRedraw();
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      className="relative flex-1 h-full w-full overflow-hidden select-none touch-none bg-slate-950"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

      {/* Floating Emergence Origin Filter & Control Toolbar */}
      <div className="absolute top-2 left-2 sm:left-12 flex flex-wrap items-center gap-1.5 z-10 font-mono text-[11px]">
        {/* Origin Filter Selector: All | Proton | Neutron | Electron | Anti-Nucleus */}
        <div className="flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="hidden md:flex items-center gap-1 mr-1 text-[10px] text-slate-400 font-bold border-r border-slate-200 dark:border-slate-800 pr-2">
            <GitBranch className="w-3.5 h-3.5 text-violet-500" />
            <span>Emerges From:</span>
          </div>

          <button
            onClick={() => setOriginFilter('all')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              originFilter === 'all'
                ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            All
          </button>

          <button
            onClick={() => setOriginFilter('proton')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              originFilter === 'proton'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40'
            }`}
            title="Show particles emerging from Proton (u, d, c, s, t, b, gluon)"
          >
            Proton p⁺
          </button>

          <button
            onClick={() => setOriginFilter('neutron')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              originFilter === 'neutron'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40'
            }`}
            title="Show particles emerging from Neutron (beta decay W-, Z0, d, u)"
          >
            Neutron n⁰
          </button>

          <button
            onClick={() => setOriginFilter('electron')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              originFilter === 'electron'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
            title="Show particles emerging from Electron Shell (leptons, neutrinos, photon)"
          >
            Electron e⁻
          </button>

          <button
            onClick={() => setOriginFilter('anti-nucleus')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              originFilter === 'anti-nucleus'
                ? 'bg-pink-500 text-white shadow-sm'
                : 'text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950/40'
            }`}
            title="Show particles emerging from Anti-Nucleus (antiquarks, antileptons, W+)"
          >
            Anti-Nucleus p̄/n̄
          </button>

          {/* Flow Animation Toggle */}
          <div className="border-l border-slate-200 dark:border-slate-800 pl-1.5 ml-1 flex items-center">
            <button
              onClick={() => setAnimateFlow((prev) => !prev)}
              className={`p-1 rounded transition-colors ${
                animateFlow
                  ? 'text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title={animateFlow ? 'Pause Emergence Energy Flow' : 'Animate Emergence Energy Flow'}
            >
              {animateFlow ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Force Fields & Higgs Toggles */}
        <div className="hidden sm:flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-md">
          <button
            onClick={onToggleForceFields}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors flex items-center gap-1 ${
              showForceFields
                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Toggle Force Fields (Strong Gluon flux & EM Coulomb fields)"
          >
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Forces</span>
          </button>

          <button
            onClick={onToggleMassContours}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors flex items-center gap-1 ${
              showMassContours
                ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Toggle Higgs mass field contours"
          >
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span>Higgs VEV</span>
          </button>
        </div>

        {/* Particle Names Visibility Switcher */}
        <div className="flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center gap-1 mr-0.5 text-[10px] text-slate-400 font-bold border-r border-slate-200 dark:border-slate-800 pr-1.5">
            <Tag className="w-3.5 h-3.5 text-sky-500" />
            <span className="hidden md:inline">Names:</span>
          </div>

          <button
            onClick={() => handleSetNameVisibility('compact')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              nameVisibility === 'compact'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Show clean compact particle names (Up, Down, Electron, e-ν, Higgs)"
          >
            Compact
          </button>

          <button
            onClick={() => handleSetNameVisibility('full')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              nameVisibility === 'full'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Show full physics particle names (Up Quark, Anti-Down Quark, Electron Neutrino)"
          >
            Full
          </button>

          <button
            onClick={() => handleSetNameVisibility('none')}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              nameVisibility === 'none'
                ? 'bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
            title="Hide names (Symbols only)"
          >
            Off
          </button>
        </div>
      </div>

      {/* Floating Zoom & Fit Navigation HUD */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
        <button
          onClick={zoomIn}
          title="Zoom in (+)"
          className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-md transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={zoomOut}
          title="Zoom out (-)"
          className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-md transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={fitToView}
          title="Fit emergence map to view"
          className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-md transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Local Hover Info Tooltip (Zero lag) */}
      {(localHoveredParticle || localHoveredHub) && (
        <div className="absolute bottom-4 left-4 z-10 pointer-events-none p-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-lg border border-slate-200 dark:border-slate-800 shadow-lg text-[10px] font-mono flex items-center gap-2.5 max-w-sm">
          {localHoveredParticle && (
            <>
              <div className="text-xl font-bold text-violet-600 dark:text-violet-400">
                {localHoveredParticle.symbol}
              </div>
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {localHoveredParticle.name}
                  {localHoveredParticle.emergenceRole && (
                    <span className="text-[9px] text-sky-500 ml-1.5 block">
                      ↳ {localHoveredParticle.emergenceRole}
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-slate-500">
                  {localHoveredParticle.mass} · Q = {localHoveredParticle.chargeText} · Spin {localHoveredParticle.spin}
                </div>
              </div>
            </>
          )}

          {localHoveredHub && (
            <>
              <div className="text-xl font-bold text-amber-500">
                {localHoveredHub.symbol}
              </div>
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {localHoveredHub.name} ({localHoveredHub.valenceQuarks})
                </div>
                <div className="text-[9px] text-slate-500">
                  {localHoveredHub.massText} · Q = {localHoveredHub.chargeText} · Tap to inspect constituent emergence
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
