import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
}

export interface SignaturePadRef {
  isEmpty: () => boolean;
  toDataURL: () => string | null;
  clear: () => void;
}

interface SignaturePadProps {
  onSignatureChange?: (isEmpty: boolean, dataUrl: string | null) => void;
  height?: number;
  minPointsRequired?: number;
}

export const SignaturePad = React.forwardRef<SignaturePadRef, SignaturePadProps>(({
  onSignatureChange,
  height = 180,
  minPointsRequired = 15,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasValidSignature, setHasValidSignature] = useState(false);

  // Resize canvas according to device pixel ratio
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    redrawStrokes(strokes, ctx);
  }, [height, strokes]);

  useEffect(() => {
    setupCanvas();
    const handleResize = () => setupCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setupCanvas]);

  const redrawStrokes = (strokeList: Stroke[], customCtx?: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = customCtx || canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    // Styling
    ctx.strokeStyle = '#090a0f';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokeList.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });

    ctx.restore();
  };

  const calculateTotalPoints = (strokeList: Stroke[]) => {
    return strokeList.reduce((acc, curr) => acc + curr.points.length, 0);
  };

  const notifyChange = (strokeList: Stroke[]) => {
    const totalPoints = calculateTotalPoints(strokeList);
    const valid = totalPoints >= minPointsRequired;
    setHasValidSignature(valid);

    if (onSignatureChange) {
      const dataUrl = valid ? exportDataURL() : null;
      onSignatureChange(!valid, dataUrl);
    }
  };

  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    setIsDrawing(true);
    const point = getCanvasCoordinates(e);
    setCurrentStroke([point]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const point = getCanvasCoordinates(e);
    const updated = [...currentStroke, point];
    setCurrentStroke(updated);

    // Realtime stroke render
    const ctx = canvas.getContext('2d');
    if (ctx && updated.length >= 2) {
      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = '#090a0f';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const p1 = updated[updated.length - 2];
      const p2 = updated[updated.length - 1];
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.restore();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);

    if (currentStroke.length > 1) {
      const nextStrokes = [...strokes, { points: currentStroke }];
      setStrokes(nextStrokes);
      notifyChange(nextStrokes);
    }
    setCurrentStroke([]);
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke([]);
    setHasValidSignature(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    if (onSignatureChange) {
      onSignatureChange(true, null);
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const nextStrokes = strokes.slice(0, -1);
    setStrokes(nextStrokes);
    redrawStrokes(nextStrokes);
    notifyChange(nextStrokes);
  };

  const exportDataURL = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  };

  React.useImperativeHandle(ref, () => ({
    isEmpty: () => !hasValidSignature,
    toDataURL: exportDataURL,
    clear: handleClear,
  }));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="flex items-center gap-1.5 text-zinc-300">
          Draw Signature <span className="text-signature font-mono">*</span>
        </span>
        <div className="flex items-center gap-2">
          {hasValidSignature ? (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Signature Captured
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
              <AlertCircle className="h-3.5 w-3.5" />
              Draw using mouse or touch
            </span>
          )}
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="flex items-center gap-1 px-2 py-1 rounded bg-white/[0.05] hover:bg-white/10 disabled:opacity-40 text-zinc-300 text-[11px] transition-colors"
            title="Undo last stroke"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Undo</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={strokes.length === 0}
            className="flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-40 text-rose-300 text-[11px] transition-colors"
            title="Clear canvas"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full rounded-xl overflow-hidden border border-white/20 bg-[#fdfbf7] shadow-inner touch-none cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full block select-none"
        />

        {strokes.length === 0 && !isDrawing && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="text-zinc-400/80 text-xs font-serif italic select-none">
              Sign here with finger, stylus, or cursor...
            </p>
          </div>
        )}

        {/* Signature Line baseline indicator */}
        <div className="pointer-events-none absolute bottom-5 left-8 right-8 border-b border-zinc-300/80 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
          <span>✕ SIGN HERE</span>
          <span>TPF DIGITAL DEED</span>
        </div>
      </div>
    </div>
  );
});

SignaturePad.displayName = 'SignaturePad';
