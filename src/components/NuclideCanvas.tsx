import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Nuclide, ColorMode, Theme, DecayStep } from '../types';
import { ALL_NUCLIDES, NUCLIDE_MAP } from '../data/nuclides';
import { ELEMENT_MAP, MAGIC_NUMBERS } from '../data/elements';
import { ZoomIn, ZoomOut, Maximize2, Crosshair } from 'lucide-react';

interface NuclideCanvasProps {
  theme: Theme;
  colorMode: ColorMode;
  selectedNuclide: Nuclide | null;
  onSelectNuclide: (nuclide: Nuclide) => void;
  hoveredNuclide: Nuclide | null;
  onHoverNuclide: (nuclide: Nuclide | null) => void;
  decaySteps: DecayStep[];
  activeStepIndex: number | null;
  showMagicNumbers: boolean;
  onToggleMagicNumbers: () => void;
  showNzLine: boolean;
  onToggleNzLine: () => void;
  highlightElementZ?: number | null;
}

interface PointerRecord {
  id: number;
  x: number;
  y: number;
}

export const NuclideCanvas: React.FC<NuclideCanvasProps> = ({
  theme,
  colorMode,
  selectedNuclide,
  onSelectNuclide,
  hoveredNuclide,
  onHoverNuclide,
  decaySteps,
  activeStepIndex,
  showMagicNumbers,
  onToggleMagicNumbers,
  showNzLine,
  onToggleNzLine,
  highlightElementZ,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Coordinate transform state
  // World space: N is x (0 to 185), Z is y (0 to 122).
  // Screen space: screenX = originX + n * cellSize; screenY = originY - z * cellSize
  const [cellSize, setCellSize] = useState<number>(6.5);
  const [originX, setOriginX] = useState<number>(45);
  const [originY, setOriginY] = useState<number>(550);

  // Multi-touch 2-finger & pointer state
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
    hasMoved: boolean;
  } | null>(null);
  const hasPinchedRef = useRef(false);

  const [mouseCoord, setMouseCoord] = useState<{ n: number; z: number } | null>(null);

  // Get color for nuclide based on mode and theme
  const getNuclideColor = useCallback(
    (nuc: Nuclide): { fill: string; stroke?: string; text: string } => {
      const isDark = theme === 'dark';

      if (colorMode === 'decay_mode') {
        if (nuc.isStable) {
          return isDark
            ? { fill: '#0f172a', stroke: '#475569', text: '#f8fafc' }
            : { fill: '#0f172a', stroke: '#020617', text: '#ffffff' };
        }
        switch (nuc.decayMode) {
          case 'alpha':
            return isDark
              ? { fill: '#eab308', text: '#713f12' }
              : { fill: '#ca8a04', text: '#ffffff' };
          case 'beta_minus':
            return isDark
              ? { fill: '#0284c7', text: '#082f49' }
              : { fill: '#0284c7', text: '#ffffff' };
          case 'beta_plus':
            return isDark
              ? { fill: '#f97316', text: '#431407' }
              : { fill: '#ea580c', text: '#ffffff' };
          case 'sf':
            return isDark
              ? { fill: '#a855f7', text: '#3b0764' }
              : { fill: '#9333ea', text: '#ffffff' };
          case 'proton':
            return isDark
              ? { fill: '#f43f5e', text: '#4c0519' }
              : { fill: '#e11d48', text: '#ffffff' };
          case 'neutron':
            return isDark
              ? { fill: '#06b6d4', text: '#164e63' }
              : { fill: '#0891b2', text: '#ffffff' };
          default:
            return { fill: '#64748b', text: '#ffffff' };
        }
      }

      if (colorMode === 'half_life') {
        if (nuc.isStable) {
          return isDark
            ? { fill: '#090d16', stroke: '#38bdf8', text: '#38bdf8' }
            : { fill: '#0f172a', stroke: '#0284c7', text: '#ffffff' };
        }
        const s = nuc.halfLifeSeconds;
        if (s >= 3.15e16) return { fill: '#312e81', text: '#e0e7ff' }; // >1 Gy (Deep Indigo)
        if (s >= 3.15e13) return { fill: '#3730a3', text: '#e0e7ff' }; // >1 My
        if (s >= 3.15e7) return { fill: '#2563eb', text: '#eff6ff' };  // >1 y (Blue)
        if (s >= 86400) return { fill: '#0284c7', text: '#f0f9ff' };   // >1 d (Sky)
        if (s >= 3600) return { fill: '#059669', text: '#ecfdf5' };    // >1 h (Emerald)
        if (s >= 60) return { fill: '#d97706', text: '#fffbeb' };      // >1 m (Amber)
        if (s >= 1) return { fill: '#ea580c', text: '#fff7ed' };       // >1 s (Orange)
        return { fill: '#dc2626', text: '#fef2f2' };                    // <1 s (Red)
      }

      // N/Z ratio color mode
      const ratio = nuc.z > 0 ? nuc.n / nuc.z : 1;
      if (ratio < 1.05) return { fill: '#06b6d4', text: '#ffffff' };
      if (ratio < 1.20) return { fill: '#10b981', text: '#ffffff' };
      if (ratio < 1.35) return { fill: '#eab308', text: '#ffffff' };
      if (ratio < 1.50) return { fill: '#f97316', text: '#ffffff' };
      return { fill: '#ef4444', text: '#ffffff' };
    },
    [colorMode, theme]
  );

  // Set initial view centered nicely on stable valley and all 118 elements
  const fitToView = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Bounds: N: 0..185, Z: 0..122
    const totalN = 190;
    const totalZ = 125;

    const scaleX = (width - 60) / totalN;
    const scaleY = (height - 60) / totalZ;
    const newCellSize = Math.max(2.5, Math.min(scaleX, scaleY));

    setCellSize(newCellSize);
    setOriginX(40);
    setOriginY(height - 30);
  }, []);

  // Center on a specific nuclide
  const centerOnNuclide = useCallback((nuc: Nuclide) => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const targetCellSize = Math.max(cellSize, 16);
    setCellSize(targetCellSize);
    setOriginX(width / 2 - nuc.n * targetCellSize);
    setOriginY(height / 2 + nuc.z * targetCellSize);
  }, [cellSize]);

  // Initial fit on mount
  useEffect(() => {
    fitToView();
    const handleResize = () => {
      fitToView();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitToView]);

  // Auto-center when selectedNuclide changes via search or preset
  useEffect(() => {
    if (selectedNuclide) {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      const screenX = originX + selectedNuclide.n * cellSize;
      const screenY = originY - selectedNuclide.z * cellSize;

      if (screenX < 45 || screenX > width - 45 || screenY < 45 || screenY > height - 45) {
        centerOnNuclide(selectedNuclide);
      }
    }
  }, [selectedNuclide, originX, originY, cellSize, centerOnNuclide]);

  // Prevent default touch gestures directly on the canvas element for reliable 2-finger pinch
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventTouch = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        e.preventDefault();
      }
    };

    canvas.addEventListener('touchstart', preventTouch, { passive: false });
    canvas.addEventListener('touchmove', preventTouch, { passive: false });
    return () => {
      canvas.removeEventListener('touchstart', preventTouch);
      canvas.removeEventListener('touchmove', preventTouch);
    };
  }, []);

  // Main canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    const isDark = theme === 'dark';

    // Clear background
    ctx.fillStyle = isDark ? '#07090e' : '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw coordinate axes and reference grid
    ctx.save();

    // Subtle grid lines every 10 N and 10 Z
    ctx.strokeStyle = isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(226, 232, 240, 0.7)';
    ctx.lineWidth = 1;

    for (let n = 0; n <= 185; n += 10) {
      const sx = originX + n * cellSize;
      if (sx >= 0 && sx <= width) {
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, height);
        ctx.stroke();
      }
    }

    for (let z = 0; z <= 122; z += 10) {
      const sy = originY - z * cellSize;
      if (sy >= 0 && sy <= height) {
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(width, sy);
        ctx.stroke();
      }
    }

    // 2. Draw N = Z line if enabled
    if (showNzLine) {
      ctx.save();
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(14, 165, 233, 0.45)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const x0 = originX;
      const y0 = originY;
      const xMax = originX + 120 * cellSize;
      const yMax = originY - 120 * cellSize;
      ctx.moveTo(x0, y0);
      ctx.lineTo(xMax, yMax);
      ctx.stroke();

      if (cellSize >= 4.5) {
        ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.7)' : 'rgba(14, 165, 233, 0.8)';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText('N = Z', originX + 25 * cellSize + 5, originY - 25 * cellSize - 5);
      }
      ctx.restore();
    }

    // 3. Draw Magic Number lines if enabled (Z, N = 2, 8, 20, 28, 50, 82, 126)
    if (showMagicNumbers) {
      ctx.save();
      ctx.strokeStyle = isDark ? 'rgba(234, 179, 8, 0.35)' : 'rgba(202, 138, 4, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);

      MAGIC_NUMBERS.forEach((m) => {
        // Vertical magic N
        const sx = originX + m * cellSize;
        if (sx >= 0 && sx <= width) {
          ctx.beginPath();
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx, height);
          ctx.stroke();

          ctx.fillStyle = isDark ? 'rgba(234, 179, 8, 0.6)' : 'rgba(202, 138, 4, 0.7)';
          ctx.font = '9px JetBrains Mono';
          ctx.fillText(`N=${m}`, sx + 2, height - 16);
        }

        // Horizontal magic Z
        const sy = originY - m * cellSize;
        if (sy >= 0 && sy <= height) {
          ctx.beginPath();
          ctx.moveTo(0, sy);
          ctx.lineTo(width, sy);
          ctx.stroke();

          ctx.fillStyle = isDark ? 'rgba(234, 179, 8, 0.6)' : 'rgba(202, 138, 4, 0.7)';
          ctx.font = '9px JetBrains Mono';
          ctx.fillText(`Z=${m}`, 4, sy - 2);
        }
      });
      ctx.restore();
    }

    // 4. Render all nuclides (including superheavy elements 104-118)
    const gap = cellSize > 12 ? 1 : 0.4;
    const tileWidth = Math.max(1.5, cellSize - gap);

    const decayPathIds = new Set<string>();
    decaySteps.forEach((s) => {
      decayPathIds.add(s.parent.id);
      decayPathIds.add(s.daughter.id);
    });

    ALL_NUCLIDES.forEach((nuc) => {
      const sx = originX + nuc.n * cellSize;
      const sy = originY - (nuc.z + 1) * cellSize;

      if (sx + cellSize < 0 || sx > width || sy + cellSize < 0 || sy > height) {
        return;
      }

      const { fill, stroke, text } = getNuclideColor(nuc);
      const isSelected = selectedNuclide?.id === nuc.id;
      const isInDecayPath = decayPathIds.has(nuc.id);
      const isElementHighlighted = highlightElementZ !== undefined && highlightElementZ !== null && nuc.z === highlightElementZ;

      ctx.fillStyle = fill;
      ctx.fillRect(sx, sy, tileWidth, tileWidth);

      if (stroke && cellSize > 8) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(sx, sy, tileWidth, tileWidth);
      }

      // Highlight selected element's entire isotopic row
      if (isElementHighlighted) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sx - 0.5, sy - 0.5, tileWidth + 1, tileWidth + 1);
        ctx.restore();
      }

      // Highlight if in active decay path
      if (isInDecayPath) {
        ctx.save();
        ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
        ctx.lineWidth = Math.min(2.5, cellSize * 0.25);
        ctx.strokeRect(sx - 0.5, sy - 0.5, tileWidth + 1, tileWidth + 1);
        ctx.restore();
      }

      // Text label when zoomed in
      if (cellSize >= 18) {
        ctx.fillStyle = text;
        ctx.font = `${Math.min(9, Math.floor(cellSize * 0.36))}px JetBrains Mono`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${nuc.a}${nuc.symbol}`, sx + tileWidth / 2, sy + tileWidth / 2);
      }
    });

    // 5. Draw Decay Path Trajectory
    if (decaySteps.length > 0) {
      ctx.save();
      ctx.lineWidth = Math.max(2, cellSize * 0.18);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      decaySteps.forEach((step, idx) => {
        const pSx = originX + step.parent.n * cellSize + tileWidth / 2;
        const pSy = originY - (step.parent.z + 1) * cellSize + tileWidth / 2;
        const dSx = originX + step.daughter.n * cellSize + tileWidth / 2;
        const dSy = originY - (step.daughter.z + 1) * cellSize + tileWidth / 2;

        const isCurrentActive = activeStepIndex !== null && activeStepIndex === idx;

        ctx.strokeStyle = isCurrentActive
          ? isDark ? '#38bdf8' : '#0284c7'
          : isDark ? 'rgba(56, 189, 248, 0.65)' : 'rgba(2, 132, 199, 0.7)';

        ctx.beginPath();
        ctx.moveTo(pSx, pSy);
        ctx.lineTo(dSx, dSy);
        ctx.stroke();

        const angle = Math.atan2(dSy - pSy, dSx - pSx);
        const headlen = Math.max(4, Math.min(12, cellSize * 0.4));
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.moveTo(dSx, dSy);
        ctx.lineTo(
          dSx - headlen * Math.cos(angle - Math.PI / 6),
          dSy - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          dSx - headlen * Math.cos(angle + Math.PI / 6),
          dSy - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        if (isCurrentActive) {
          ctx.beginPath();
          ctx.arc(pSx, pSy, Math.max(3, cellSize * 0.35), 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
        }
      });
      ctx.restore();
    }

    // 6. Selected Nuclide Target Reticle
    if (selectedNuclide) {
      const sx = originX + selectedNuclide.n * cellSize;
      const sy = originY - (selectedNuclide.z + 1) * cellSize;

      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx - 2, sy - 2, tileWidth + 4, tileWidth + 4);

      const bracketLen = Math.max(4, cellSize * 0.4);
      ctx.strokeStyle = isDark ? '#ffffff' : '#0284c7';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(sx - 4, sy - 4 + bracketLen);
      ctx.lineTo(sx - 4, sy - 4);
      ctx.lineTo(sx - 4 + bracketLen, sy - 4);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(sx + tileWidth + 4 - bracketLen, sy - 4);
      ctx.lineTo(sx + tileWidth + 4, sy - 4);
      ctx.lineTo(sx + tileWidth + 4, sy - 4 + bracketLen);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(sx - 4, sy + tileWidth + 4 - bracketLen);
      ctx.lineTo(sx - 4, sy + tileWidth + 4);
      ctx.lineTo(sx - 4 + bracketLen, sy + tileWidth + 4);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(sx + tileWidth + 4 - bracketLen, sy + tileWidth + 4);
      ctx.lineTo(sx + tileWidth + 4, sy + tileWidth + 4);
      ctx.lineTo(sx + tileWidth + 4, sy + tileWidth + 4 - bracketLen);
      ctx.stroke();

      ctx.restore();
    }

    // 7. Hovered Nuclide Halo
    if (hoveredNuclide && hoveredNuclide.id !== selectedNuclide?.id) {
      const sx = originX + hoveredNuclide.n * cellSize;
      const sy = originY - (hoveredNuclide.z + 1) * cellSize;
      ctx.save();
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(15, 23, 42, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx - 1.5, sy - 1.5, tileWidth + 3, tileWidth + 3);
      ctx.restore();
    }

    // 8. Sticky Axis Headers along edges (Compact 28px left, 22px bottom)
    // Z axis along left
    ctx.save();
    ctx.fillStyle = isDark ? '#0b0f19' : '#f1f5f9';
    ctx.fillRect(0, 0, 28, height);
    ctx.strokeStyle = isDark ? '#1e293b' : '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.lineTo(28, height);
    ctx.stroke();

    ctx.save();
    ctx.translate(11, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
    ctx.font = '600 9px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText('Z (Protons)', 0, 0);
    ctx.restore();

    ctx.font = '9px JetBrains Mono';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';

    for (let z = 0; z <= 118; z += 10) {
      const sy = originY - z * cellSize;
      if (sy >= 12 && sy <= height - 25) {
        ctx.fillText(`${z}`, 25, sy);
        ctx.beginPath();
        ctx.moveTo(26, sy);
        ctx.lineTo(28, sy);
        ctx.stroke();
      }
    }
    // Explicit 118 marker
    const s118 = originY - 118 * cellSize;
    if (s118 >= 10 && s118 <= height - 25) {
      ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
      ctx.fillText('118', 25, s118);
    }

    // N axis along bottom
    ctx.fillStyle = isDark ? '#0b0f19' : '#f1f5f9';
    ctx.fillRect(0, height - 22, width, 22);
    ctx.strokeStyle = isDark ? '#1e293b' : '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(0, height - 22);
    ctx.lineTo(width, height - 22);
    ctx.stroke();

    ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
    ctx.font = '600 9px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N (Neutrons)', width / 2, height - 11);

    ctx.font = '9px JetBrains Mono';
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    for (let n = 0; n <= 180; n += 20) {
      const sx = originX + n * cellSize;
      if (sx >= 35 && sx <= width - 25) {
        ctx.fillText(`${n}`, sx, height - 11);
        ctx.beginPath();
        ctx.moveTo(sx, height - 22);
        ctx.lineTo(sx, height - 18);
        ctx.stroke();
      }
    }

    ctx.restore();
  }, [
    cellSize,
    originX,
    originY,
    theme,
    colorMode,
    selectedNuclide,
    hoveredNuclide,
    decaySteps,
    activeStepIndex,
    showMagicNumbers,
    showNzLine,
    highlightElementZ,
    getNuclideColor
  ]);

  // Pointer event handlers with 2-finger pinch zoom and pan
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX;
    const clientY = e.clientY;

    activePointersRef.current.set(e.pointerId, {
      id: e.pointerId,
      x: clientX,
      y: clientY,
    });

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (activePointersRef.current.size === 2) {
      // Transition to 2-finger pinch
      hasPinchedRef.current = true;
      const [p1, p2] = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const midX = (p1.x + p2.x) / 2 - rect.left;
      const midY = (p1.y + p2.y) / 2 - rect.top;

      pinchStartRef.current = {
        dist: Math.max(10, dist),
        cellSize,
        midX,
        midY,
        originX,
        originY,
      };
      singleDragStartRef.current = null;
    } else if (activePointersRef.current.size === 1) {
      // Single finger / mouse drag
      hasPinchedRef.current = false;
      singleDragStartRef.current = {
        startX: clientX,
        startY: clientY,
        originX,
        originY,
        hasMoved: false,
      };
      pinchStartRef.current = null;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
      });
    }

    // 2-FINGER PINCH ZOOM & PAN
    if (activePointersRef.current.size >= 2 && pinchStartRef.current) {
      const [p1, p2] = Array.from(activePointersRef.current.values());
      const currDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const currMidX = (p1.x + p2.x) / 2 - rect.left;
      const currMidY = (p1.y + p2.y) / 2 - rect.top;

      const ratio = currDist / pinchStartRef.current.dist;
      const newCellSize = Math.max(2.5, Math.min(48, pinchStartRef.current.cellSize * ratio));

      // Pin the world coordinate at the initial pinch midpoint
      const worldN = (pinchStartRef.current.midX - pinchStartRef.current.originX) / pinchStartRef.current.cellSize;
      const worldZ = (pinchStartRef.current.originY - pinchStartRef.current.midY) / pinchStartRef.current.cellSize;

      const newOriginX = currMidX - worldN * newCellSize;
      const newOriginY = currMidY + worldZ * newCellSize;

      setCellSize(newCellSize);
      setOriginX(newOriginX);
      setOriginY(newOriginY);
      return;
    }

    // 1-FINGER / MOUSE PAN
    if (singleDragStartRef.current && activePointersRef.current.size === 1) {
      const dx = e.clientX - singleDragStartRef.current.startX;
      const dy = e.clientY - singleDragStartRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        singleDragStartRef.current.hasMoved = true;
      }
      setOriginX(singleDragStartRef.current.originX + dx);
      setOriginY(singleDragStartRef.current.originY + dy);
      return;
    }

    // Hit test nuclide for probe when not dragging
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const n = Math.floor((screenX - originX) / cellSize);
    const z = Math.floor((originY - screenY) / cellSize);

    setMouseCoord({ n, z });

    if (n >= 0 && z >= 0 && n <= 185 && z <= 122) {
      const hit = NUCLIDE_MAP.get(`${z}-${n}`);
      onHoverNuclide(hit || null);
    } else {
      onHoverNuclide(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.delete(e.pointerId);

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (activePointersRef.current.size === 1) {
      // One finger still down after pinch, re-anchor single drag
      const remaining = Array.from(activePointersRef.current.values())[0];
      singleDragStartRef.current = {
        startX: remaining.x,
        startY: remaining.y,
        originX,
        originY,
        hasMoved: true, // prevent click trigger
      };
      pinchStartRef.current = null;
      return;
    }

    if (activePointersRef.current.size === 0) {
      // All fingers lifted
      if (singleDragStartRef.current && !singleDragStartRef.current.hasMoved && !hasPinchedRef.current) {
        // Registered clean tap / click on nuclide
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const screenX = e.clientX - rect.left;
          const screenY = e.clientY - rect.top;
          const n = Math.floor((screenX - originX) / cellSize);
          const z = Math.floor((originY - screenY) / cellSize);
          const hit = NUCLIDE_MAP.get(`${z}-${n}`);
          if (hit) {
            onSelectNuclide(hit);
          }
        }
      }

      singleDragStartRef.current = null;
      pinchStartRef.current = null;
      hasPinchedRef.current = false;
    }
  };

  // Mouse wheel zoom centered on cursor
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newCellSize = Math.max(2.5, Math.min(48, cellSize * zoomFactor));

    if (newCellSize === cellSize) return;

    const nAtCursor = (cursorX - originX) / cellSize;
    const zAtCursor = (originY - cursorY) / cellSize;

    const newOriginX = cursorX - nAtCursor * newCellSize;
    const newOriginY = cursorY + zAtCursor * newCellSize;

    setCellSize(newCellSize);
    setOriginX(newOriginX);
    setOriginY(newOriginY);
  };

  const zoomIn = () => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth / 2;
    const h = containerRef.current.clientHeight / 2;
    const newCellSize = Math.min(48, cellSize * 1.25);
    const nCenter = (w - originX) / cellSize;
    const zCenter = (originY - h) / cellSize;
    setCellSize(newCellSize);
    setOriginX(w - nCenter * newCellSize);
    setOriginY(h + zCenter * newCellSize);
  };

  const zoomOut = () => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth / 2;
    const h = containerRef.current.clientHeight / 2;
    const newCellSize = Math.max(2.5, cellSize * 0.8);
    const nCenter = (w - originX) / cellSize;
    const zCenter = (originY - h) / cellSize;
    setCellSize(newCellSize);
    setOriginX(w - nCenter * newCellSize);
    setOriginY(h + zCenter * newCellSize);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full overflow-hidden select-none touch-none bg-slate-900"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => {
          activePointersRef.current.clear();
          singleDragStartRef.current = null;
          pinchStartRef.current = null;
          onHoverNuclide(null);
        }}
        onWheel={handleWheel}
        className="w-full h-full cursor-crosshair block touch-none"
      />

      {/* Floating Compact HUD Controls: Zoom, Fit, Magic, N=Z, 2-finger zoom indicator */}
      <div className="absolute top-2 left-10 flex items-center gap-1 p-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm text-xs z-10">
        <button
          onClick={zoomIn}
          title="Zoom In (+)"
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={zoomOut}
          title="Zoom Out (-)"
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
        <button
          onClick={fitToView}
          title="Fit whole chart to view"
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-0.5 font-mono text-[10px]"
        >
          <Maximize2 className="w-3 h-3" />
          <span className="hidden sm:inline">Fit</span>
        </button>
        {selectedNuclide && (
          <button
            onClick={() => centerOnNuclide(selectedNuclide)}
            title="Center on selected nuclide"
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-sky-600 dark:text-sky-400 transition-colors flex items-center gap-0.5 font-mono text-[10px]"
          >
            <Crosshair className="w-3 h-3" />
            <span className="hidden sm:inline">Center</span>
          </button>
        )}
        <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
        <button
          onClick={onToggleMagicNumbers}
          title="Toggle Nuclear Shell Magic Numbers"
          className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
            showMagicNumbers
              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Magic
        </button>
        <button
          onClick={onToggleNzLine}
          title="Toggle N=Z symmetry line"
          className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
            showNzLine
              ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          N=Z
        </button>
      </div>

      {/* Floating Coordinate Probe HUD (Top-Right) */}
      <div className="absolute top-2 right-2 pointer-events-none hidden sm:flex items-center gap-2 px-2 py-1 bg-slate-900/90 text-slate-100 backdrop-blur-md rounded text-[10px] font-mono border border-slate-700/60 shadow-lg z-10">
        {hoveredNuclide ? (
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sky-400">
              {hoveredNuclide.a}
              {hoveredNuclide.symbol}
            </span>
            <span className="text-slate-400">·</span>
            <span>
              Z={hoveredNuclide.z} N={hoveredNuclide.n}
            </span>
            <span className="text-slate-400">·</span>
            <span className="capitalize">{hoveredNuclide.decayMode.replace('_', ' ')}</span>
            <span className="text-slate-400">·</span>
            <span className="text-emerald-300">{hoveredNuclide.halfLifeText}</span>
          </div>
        ) : mouseCoord && mouseCoord.n >= 0 && mouseCoord.z >= 0 ? (
          <div className="text-slate-400">
            Probe: N={mouseCoord.n} Z={mouseCoord.z}
          </div>
        ) : (
          <div className="text-slate-400">Pinch/scroll to zoom · Drag to pan</div>
        )}
      </div>

      {/* Mini Displacement Cheat Sheet in bottom corner */}
      <div className="absolute bottom-7 left-9 pointer-events-none hidden lg:flex flex-col gap-0.5 p-1.5 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md rounded border border-slate-200 dark:border-slate-800 text-[9px] font-mono text-slate-600 dark:text-slate-400 z-10">
        <div className="font-semibold text-slate-800 dark:text-slate-200 uppercase">
          Decay Vectors
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-amber-500 font-bold">α:</span>
          <span>ΔZ -2, ΔN -2 (↙)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sky-500 font-bold">β⁻:</span>
          <span>ΔZ +1, ΔN -1 (↖)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-orange-500 font-bold">β⁺:</span>
          <span>ΔZ -1, ΔN +1 (↘)</span>
        </div>
      </div>
    </div>
  );
};
