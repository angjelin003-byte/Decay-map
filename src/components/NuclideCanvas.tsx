import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Nuclide, ColorMode, Theme, DecayStep } from '../types';
import { ALL_NUCLIDES, NUCLIDE_MAP } from '../data/nuclides';
import { ELEMENT_MAP, MAGIC_NUMBERS } from '../data/elements';
import { ZoomIn, ZoomOut, Maximize2, Crosshair } from 'lucide-react';

interface NuclideCanvasProps {
  theme: Theme;
  colorMode: ColorMode;
  selectedNuclide: Nuclide | null;
  onSelectNuclide: (nuclide: Nuclide | null) => void;
  hoveredNuclide: Nuclide | null;
  onHoverNuclide: (nuclide: Nuclide | null) => void;
  decaySteps: DecayStep[];
  activeStepIndex: number | null;
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
  showNzLine,
  onToggleNzLine,
  highlightElementZ,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Coordinate transform state & synchronized ref to guarantee zero stale closures
  // World space: N is x (0 to 196), Z is y (0 to 126).
  // Screen space: screenX = originX + n * cellSize; screenY = originY - (z + 1) * cellSize
  const [cellSize, setCellSize] = useState<number>(6.5);
  const [originX, setOriginX] = useState<number>(55);
  const [originY, setOriginY] = useState<number>(550);
  const [, setRenderTrigger] = useState<number>(0);

  const coordsRef = useRef({
    cellSize: 6.5,
    originX: 55,
    originY: 550,
  });

  const updateCoords = useCallback((newCellSize: number, newOriginX: number, newOriginY: number) => {
    coordsRef.current.cellSize = newCellSize;
    coordsRef.current.originX = newOriginX;
    coordsRef.current.originY = newOriginY;
    setCellSize(newCellSize);
    setOriginX(newOriginX);
    setOriginY(newOriginY);
  }, []);

  // Multi-touch 2-finger pinch & 1-finger pan gesture tracking
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
  const hasMountedRef = useRef(false);

  const [mouseCoord, setMouseCoord] = useState<{ n: number; z: number } | null>(null);

  // Get color for nuclide based on mode and theme
  const getNuclideColor = useCallback(
    (nuc: Nuclide): { fill: string; stroke?: string; text: string } => {
      const isDark = theme === 'dark';

      if (colorMode === 'decay_mode') {
        if (nuc.isStable) {
          return isDark
            ? { fill: '#050811', stroke: '#334155', text: '#f8fafc' }
            : { fill: '#000000', stroke: '#1e293b', text: '#ffffff' };
        }
        if (nuc.decayMode === 'predicted') {
          return isDark
            ? { fill: '#334155', stroke: '#1e293b', text: '#94a3b8' }
            : { fill: '#cbd5e1', stroke: '#94a3b8', text: '#64748b' };
        }
        switch (nuc.decayMode) {
          case 'alpha':
            return isDark
              ? { fill: '#eab308', text: '#713f12' }
              : { fill: '#facc15', text: '#713f12' }; // Yellow in photo
          case 'beta_minus':
            return isDark
              ? { fill: '#2563eb', text: '#ffffff' }
              : { fill: '#3b82f6', text: '#ffffff' }; // Blue in photo
          case 'beta_plus':
            return isDark
              ? { fill: '#e11d48', text: '#ffffff' }
              : { fill: '#f43f5e', text: '#ffffff' }; // Red/Magenta in photo
          case 'sf':
            return isDark
              ? { fill: '#9333ea', text: '#ffffff' }
              : { fill: '#a855f7', text: '#ffffff' }; // Purple in photo
          case 'proton':
            return isDark
              ? { fill: '#f97316', text: '#ffffff' }
              : { fill: '#ea580c', text: '#ffffff' }; // Orange in photo
          case 'neutron':
            return isDark
              ? { fill: '#06b6d4', text: '#164e63' }
              : { fill: '#0891b2', text: '#ffffff' };
          default:
            return { fill: '#94a3b8', text: '#ffffff' };
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

  // Set initial view centered nicely on full Chart of Nuclides
  const fitToView = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const totalN = 205;
    const totalZ = 135;

    const scaleX = (width - 65) / totalN;
    const scaleY = (height - 60) / totalZ;
    const newCellSize = Math.max(2.2, Math.min(scaleX, scaleY));

    updateCoords(newCellSize, 52, height - 28);
  }, [updateCoords]);

  // Center on a specific nuclide (ONLY invoked on explicit "Center" button click)
  const centerOnNuclide = useCallback((nuc: Nuclide) => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const curSize = coordsRef.current.cellSize;
    const targetCellSize = Math.max(curSize, 16);
    const newOx = width / 2 - nuc.n * targetCellSize;
    const newOy = height / 2 + (nuc.z + 1) * targetCellSize;

    updateCoords(targetCellSize, newOx, newOy);
  }, [updateCoords]);

  // Initial fit on mount only - NEVER reset or snap on subsequent resizes!
  useEffect(() => {
    if (!hasMountedRef.current) {
      fitToView();
      hasMountedRef.current = true;
    }

    const handleResize = () => {
      // Re-render canvas without resetting pan coordinates or zoom
      setRenderTrigger((prev) => prev + 1);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitToView]);

  // Prevent default native gestures on the canvas element for complete control over pinch and pan
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventTouch = (e: TouchEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener('touchstart', preventTouch, { passive: false });
    canvas.addEventListener('touchmove', preventTouch, { passive: false });
    canvas.addEventListener('touchend', preventTouch, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', preventTouch);
      canvas.removeEventListener('touchmove', preventTouch);
      canvas.removeEventListener('touchend', preventTouch);
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
    const curSize = coordsRef.current.cellSize;
    const curOx = coordsRef.current.originX;
    const curOy = coordsRef.current.originY;

    // Clear background
    ctx.fillStyle = isDark ? '#07090e' : '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw coordinate axes and reference grid
    ctx.save();

    // Subtle grid lines every 10 N and 10 Z
    ctx.strokeStyle = isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(226, 232, 240, 0.7)';
    ctx.lineWidth = 1;

    for (let n = 0; n <= 190; n += 10) {
      const sx = curOx + n * curSize;
      if (sx >= 0 && sx <= width) {
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, height);
        ctx.stroke();
      }
    }

    for (let z = 0; z <= 126; z += 10) {
      const sy = curOy - (z + 1) * curSize;
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
      const x0 = curOx;
      const y0 = curOy - curSize;
      const xMax = curOx + 120 * curSize;
      const yMax = curOy - (120 + 1) * curSize;
      ctx.moveTo(x0, y0);
      ctx.lineTo(xMax, yMax);
      ctx.stroke();

      if (curSize >= 4.5) {
        ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.7)' : 'rgba(14, 165, 233, 0.8)';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText('N = Z', curOx + 25 * curSize + 5, curOy - (25 + 1) * curSize - 5);
      }
      ctx.restore();
    }

    // 3. Draw Magic Number lines if enabled
    if (false) {
      ctx.save();
      const magicColor = isDark ? '#f87171' : '#ef4444'; // Red matching Segrè chart standards
      ctx.strokeStyle = magicColor;
      ctx.lineWidth = 1;

      // Solid magic numbers
      const classicMagic = [2, 8, 20, 28, 50, 82, 126];
      classicMagic.forEach((m) => {
        // Vertical magic N
        const sx = curOx + m * curSize;
        if (sx >= 0 && sx <= width) {
          ctx.beginPath();
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx, height - 22);
          ctx.stroke();

          ctx.fillStyle = magicColor;
          ctx.font = 'bold 9px JetBrains Mono';
          ctx.fillText(`N=${m}`, sx - 1, height - 26);
        }

        // Horizontal magic Z
        const sy = curOy - (m + 1) * curSize;
        if (sy >= 0 && sy <= height) {
          ctx.beginPath();
          ctx.moveTo(44, sy);
          ctx.lineTo(width, sy);
          ctx.stroke();

          ctx.fillStyle = magicColor;
          ctx.font = 'bold 9px JetBrains Mono';
          ctx.fillText(`Z=${m}`, 48, sy - 2);
        }
      });

      // Predicted magic numbers (dotted lines for 114, 184)
      ctx.setLineDash([2, 2]);
      const sy114 = curOy - (114 + 1) * curSize;
      if (sy114 >= 0 && sy114 <= height) {
        ctx.beginPath();
        ctx.moveTo(44, sy114);
        ctx.lineTo(width, sy114);
        ctx.stroke();
        ctx.fillStyle = magicColor;
        ctx.font = 'bold 8px JetBrains Mono';
        ctx.fillText('Z=114...', width - 44, sy114 - 2);
      }

      const sx184 = curOx + 184 * curSize;
      if (sx184 >= 0 && sx184 <= width) {
        ctx.beginPath();
        ctx.moveTo(sx184, 0);
        ctx.lineTo(sx184, height - 22);
        ctx.stroke();
        ctx.fillStyle = magicColor;
        ctx.font = 'bold 8px JetBrains Mono';
        ctx.fillText('N=184', sx184 - 4, 16);
      }
      ctx.setLineDash([]);

      // Highlight Doubly Magic Nuclei Intersections (⁴He, ¹⁶O, ⁴⁰Ca, ⁴⁸Ca, ⁵⁶Ni, ²⁰⁸Pb)
      const doublyMagic: [number, number, string][] = [
        [2, 2, '⁴He'],
        [8, 8, '¹⁶O'],
        [20, 20, '⁴⁰Ca'],
        [20, 28, '⁴⁸Ca'],
        [28, 28, '⁵⁶Ni'],
        [28, 50, '⁷⁸Ni'],
        [50, 50, '¹⁰⁰Sn'],
        [50, 82, '¹³²Sn'],
        [82, 126, '²⁰⁸Pb'],
      ];

      doublyMagic.forEach(([z, n, label]) => {
        const sx = curOx + n * curSize;
        const sy = curOy - (z + 1) * curSize;
        if (sx >= 0 && sx <= width && sy >= 0 && sy <= height) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(sx - 2, sy - 2, curSize + 4, curSize + 4);

          if (curSize >= 9) {
            ctx.fillStyle = isDark ? '#fbbf24' : '#b45309';
            ctx.font = 'bold 8px JetBrains Mono';
            ctx.fillText(label, sx + curSize + 2, sy + curSize * 0.7);
          }
        }
      });

      ctx.restore();
    }

    // 4. Render all nuclides (covering all elements 0-118 and drip lines)
    const gap = curSize > 12 ? 1 : 0.4;
    const tileWidth = Math.max(1.5, curSize - gap);

    const decayPathIds = new Set<string>();
    decaySteps.forEach((s) => {
      decayPathIds.add(s.parent.id);
      decayPathIds.add(s.daughter.id);
    });

    ALL_NUCLIDES.forEach((nuc) => {
      const sx = curOx + nuc.n * curSize;
      const sy = curOy - (nuc.z + 1) * curSize;

      if (sx + curSize < 0 || sx > width || sy + curSize < 0 || sy > height) {
        return;
      }

      const { fill, stroke, text } = getNuclideColor(nuc);
      const isInDecayPath = decayPathIds.has(nuc.id);
      const isElementHighlighted =
        highlightElementZ !== undefined &&
        highlightElementZ !== null &&
        nuc.z === highlightElementZ;

      ctx.fillStyle = fill;
      ctx.fillRect(sx, sy, tileWidth, tileWidth);

      if (stroke && curSize > 8) {
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
        ctx.lineWidth = Math.min(2.5, curSize * 0.25);
        ctx.strokeRect(sx - 0.5, sy - 0.5, tileWidth + 1, tileWidth + 1);
        ctx.restore();
      }

      // Text label when zoomed in
      if (curSize >= 18) {
        ctx.fillStyle = text;
        ctx.font = `${Math.min(9, Math.floor(curSize * 0.36))}px JetBrains Mono`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${nuc.a}${nuc.symbol}`, sx + tileWidth / 2, sy + tileWidth / 2);
      }
    });

    // 5. Draw Decay Path Trajectory
    if (decaySteps.length > 0) {
      ctx.save();
      ctx.lineWidth = Math.max(2, curSize * 0.18);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      decaySteps.forEach((step, idx) => {
        const pSx = curOx + step.parent.n * curSize + tileWidth / 2;
        const pSy = curOy - (step.parent.z + 1) * curSize + tileWidth / 2;
        const dSx = curOx + step.daughter.n * curSize + tileWidth / 2;
        const dSy = curOy - (step.daughter.z + 1) * curSize + tileWidth / 2;

        const isCurrentActive = activeStepIndex !== null && activeStepIndex === idx;

        ctx.strokeStyle = isCurrentActive
          ? isDark ? '#38bdf8' : '#0284c7'
          : isDark ? 'rgba(56, 189, 248, 0.65)' : 'rgba(2, 132, 199, 0.7)';

        ctx.beginPath();
        ctx.moveTo(pSx, pSy);
        ctx.lineTo(dSx, dSy);
        ctx.stroke();

        const angle = Math.atan2(dSy - pSy, dSx - pSx);
        const headlen = Math.max(4, Math.min(12, curSize * 0.4));
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

        if (idx === 0) {
          ctx.beginPath();
          ctx.arc(pSx, pSy, Math.max(3, curSize * 0.35), 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
        }
      });
      ctx.restore();
    }

    // 6. Selected Nuclide Target Reticle
    if (selectedNuclide) {
      const sx = curOx + selectedNuclide.n * curSize;
      const sy = curOy - (selectedNuclide.z + 1) * curSize;

      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx - 2, sy - 2, tileWidth + 4, tileWidth + 4);

      const bracketLen = Math.max(4, curSize * 0.4);
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
      const sx = curOx + hoveredNuclide.n * curSize;
      const sy = curOy - (hoveredNuclide.z + 1) * curSize;
      ctx.save();
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(15, 23, 42, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx - 1.5, sy - 1.5, tileWidth + 3, tileWidth + 3);
      ctx.restore();
    }

    // 8. Sticky Axis Headers along edges (44px left with element symbols like the photo, 22px bottom)
    const axisGutterLeft = 44;
    const axisGutterBottom = 22;

    // Z axis along left with ALL elements and symbols
    ctx.save();
    ctx.fillStyle = isDark ? '#0b0f19' : '#f1f5f9';
    ctx.fillRect(0, 0, axisGutterLeft, height);
    ctx.strokeStyle = isDark ? '#1e293b' : '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(axisGutterLeft, 0);
    ctx.lineTo(axisGutterLeft, height);
    ctx.stroke();

    // Rotated axis title
    ctx.save();
    ctx.translate(9, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
    ctx.font = 'bold 8px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText('Z proton', 0, 0);
    ctx.restore();

    ctx.font = '9px JetBrains Mono';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    // Draw element rows and symbols
    for (let z = 0; z <= 126; z++) {
      const sy = curOy - (z + 0.5) * curSize;
      if (sy < 8 || sy > height - axisGutterBottom) continue;

      const el = ELEMENT_MAP.get(z);
      const isMagic = MAGIC_NUMBERS.includes(z as any);
      const isLandmark = [1, 2, 6, 8, 14, 20, 26, 28, 50, 79, 82, 92, 94, 100, 114, 118].includes(z);
      const isHighlighted = highlightElementZ === z || selectedNuclide?.z === z;
      const shouldDraw =
        curSize >= 7.5 ||
        isMagic ||
        isLandmark ||
        isHighlighted ||
        (curSize >= 4.5 && z % 5 === 0) ||
        z % 10 === 0;

      if (!shouldDraw) continue;

      if (isHighlighted) {
        // Highlight active element badge
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.fillText(`${z} ${el?.symbol || ''}`, axisGutterLeft - 3, sy);

        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(axisGutterLeft - 2, sy);
        ctx.lineTo(axisGutterLeft, sy);
        ctx.stroke();
      } else if (isMagic) {
        ctx.fillStyle = isDark ? '#f87171' : '#ef4444';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.fillText(`${z} ${el?.symbol || ''}`, axisGutterLeft - 3, sy);
      } else {
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.font = curSize >= 7.5 ? '8.5px JetBrains Mono' : '8px JetBrains Mono';
        const label = curSize >= 6 ? `${z} ${el?.symbol || ''}` : `${z}`;
        ctx.fillText(label, axisGutterLeft - 3, sy);
      }

      // Small tick mark
      ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(axisGutterLeft - 2, sy);
      ctx.lineTo(axisGutterLeft, sy);
      ctx.stroke();
    }

    // N axis along bottom
    ctx.fillStyle = isDark ? '#0b0f19' : '#f1f5f9';
    ctx.fillRect(0, height - axisGutterBottom, width, axisGutterBottom);
    ctx.strokeStyle = isDark ? '#1e293b' : '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(0, height - axisGutterBottom);
    ctx.lineTo(width, height - axisGutterBottom);
    ctx.stroke();

    ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
    ctx.font = 'bold 9px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N neutron number →', width / 2, height - 11);

    ctx.font = '9px JetBrains Mono';
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    for (let n = 0; n <= 190; n += 20) {
      const sx = curOx + n * curSize;
      if (sx >= axisGutterLeft + 5 && sx <= width - 25) {
        ctx.fillText(`${n}`, sx, height - 11);
        ctx.beginPath();
        ctx.moveTo(sx, height - axisGutterBottom);
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
    showNzLine,
    highlightElementZ,
    getNuclideColor,
  ]);

  // Pointer event handlers with rock-solid, non-snapping 2-finger pinch zoom and 1-finger pan
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

    const curSize = coordsRef.current.cellSize;
    const curOx = coordsRef.current.originX;
    const curOy = coordsRef.current.originY;

    if (activePointersRef.current.size === 2) {
      // Transition to 2-finger pinch
      hasPinchedRef.current = true;
      const [p1, p2] = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const midX = (p1.x + p2.x) / 2 - rect.left;
      const midY = (p1.y + p2.y) / 2 - rect.top;

      pinchStartRef.current = {
        dist: Math.max(10, dist),
        cellSize: curSize,
        midX,
        midY,
        originX: curOx,
        originY: curOy,
      };
      singleDragStartRef.current = null;
    } else if (activePointersRef.current.size === 1) {
      // Single finger / mouse drag
      hasPinchedRef.current = false;
      singleDragStartRef.current = {
        startX: clientX,
        startY: clientY,
        originX: curOx,
        originY: curOy,
        totalMoved: 0,
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
      const newCellSize = Math.max(1.8, Math.min(48, pinchStartRef.current.cellSize * ratio));

      // Pin the world coordinate at the initial pinch midpoint
      const worldN = (pinchStartRef.current.midX - pinchStartRef.current.originX) / pinchStartRef.current.cellSize;
      const worldZ = (pinchStartRef.current.originY - pinchStartRef.current.midY) / pinchStartRef.current.cellSize;

      const newOriginX = currMidX - worldN * newCellSize;
      const newOriginY = currMidY + worldZ * newCellSize;

      updateCoords(newCellSize, newOriginX, newOriginY);
      return;
    }

    // 1-FINGER / MOUSE PAN
    if (singleDragStartRef.current && activePointersRef.current.size === 1) {
      const dx = e.clientX - singleDragStartRef.current.startX;
      const dy = e.clientY - singleDragStartRef.current.startY;
      singleDragStartRef.current.totalMoved = Math.hypot(dx, dy);

      const newOriginX = singleDragStartRef.current.originX + dx;
      const newOriginY = singleDragStartRef.current.originY + dy;

      updateCoords(coordsRef.current.cellSize, newOriginX, newOriginY);
      return;
    }

    // Probe nuclide when not dragging
    const curSize = coordsRef.current.cellSize;
    const curOx = coordsRef.current.originX;
    const curOy = coordsRef.current.originY;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const n = Math.floor((screenX - curOx) / curSize);
    const z = Math.floor((curOy - screenY) / curSize);

    setMouseCoord({ n, z });

    if (n >= 0 && z >= 0 && n <= 196 && z <= 126) {
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
      // One finger still down after pinch: smoothly transition to single finger drag from CURRENT position
      const remaining = Array.from(activePointersRef.current.values())[0];
      singleDragStartRef.current = {
        startX: remaining.x,
        startY: remaining.y,
        originX: coordsRef.current.originX,
        originY: coordsRef.current.originY,
        totalMoved: 999, // Prevent click trigger
      };
      pinchStartRef.current = null;
      return;
    }

    if (activePointersRef.current.size === 0) {
      // All fingers lifted: check if clean tap/click
      const wasTap =
        singleDragStartRef.current &&
        singleDragStartRef.current.totalMoved < 5 &&
        !hasPinchedRef.current;

      if (wasTap) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const curSize = coordsRef.current.cellSize;
          const curOx = coordsRef.current.originX;
          const curOy = coordsRef.current.originY;

          const screenX = e.clientX - rect.left;
          const screenY = e.clientY - rect.top;
          const n = Math.floor((screenX - curOx) / curSize);
          const z = Math.floor((curOy - screenY) / curSize);
          const hit = NUCLIDE_MAP.get(`${z}-${n}`);
          if (hit) {
            onSelectNuclide(hit);
          } else {
            // Tap outside / empty area: deselect!
            onSelectNuclide(null);
          }
        }
      }

      singleDragStartRef.current = null;
      pinchStartRef.current = null;
      hasPinchedRef.current = false;
    }
  };

  // Mouse wheel zoom centered on cursor without any autosnapping
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const curSize = coordsRef.current.cellSize;
    const curOx = coordsRef.current.originX;
    const curOy = coordsRef.current.originY;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newCellSize = Math.max(1.8, Math.min(48, curSize * zoomFactor));

    if (newCellSize === curSize) return;

    const nAtCursor = (cursorX - curOx) / curSize;
    const zAtCursor = (curOy - cursorY) / curSize;

    const newOriginX = cursorX - nAtCursor * newCellSize;
    const newOriginY = cursorY + zAtCursor * newCellSize;

    updateCoords(newCellSize, newOriginX, newOriginY);
  };

  // Zoom In button (centered on current screen center)
  const zoomIn = () => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth / 2;
    const h = containerRef.current.clientHeight / 2;
    const curSize = coordsRef.current.cellSize;
    const curOx = coordsRef.current.originX;
    const curOy = coordsRef.current.originY;

    const newCellSize = Math.min(48, curSize * 1.25);
    const nCenter = (w - curOx) / curSize;
    const zCenter = (curOy - h) / curSize;

    const newOx = w - nCenter * newCellSize;
    const newOy = h + zCenter * newCellSize;

    updateCoords(newCellSize, newOx, newOy);
  };

  // Zoom Out button (centered on current screen center)
  const zoomOut = () => {
    if (!containerRef.current) return;
    const w = containerRef.current.clientWidth / 2;
    const h = containerRef.current.clientHeight / 2;
    const curSize = coordsRef.current.cellSize;
    const curOx = coordsRef.current.originX;
    const curOy = coordsRef.current.originY;

    const newCellSize = Math.max(1.8, curSize * 0.8);
    const nCenter = (w - curOx) / curSize;
    const zCenter = (curOy - h) / curSize;

    const newOx = w - nCenter * newCellSize;
    const newOy = h + zCenter * newCellSize;

    updateCoords(newCellSize, newOx, newOy);
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

      {/* Floating Compact HUD Controls: Zoom, Fit, Center, Magic, N=Z */}
      <div className="absolute top-2 left-12 flex items-center gap-1 flex-wrap p-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm text-xs z-10">
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
          <div className="text-slate-400">2-Finger Pinch / Drag to Pan · Tap to Select</div>
        )}
      </div>

      {/* Mini Displacement Cheat Sheet in bottom corner */}
      <div className="absolute bottom-7 left-12 pointer-events-none hidden lg:flex flex-col gap-0.5 p-1.5 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md rounded border border-slate-200 dark:border-slate-800 text-[9px] font-mono text-slate-600 dark:text-slate-400 z-10">
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
