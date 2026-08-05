import type { RevealStyle } from '../types';
import type { PathPoint } from './path';

export interface PolylineMeta {
  points: PathPoint[];
  length: number;
  /** Cumulative length at each point */
  cum: number[];
}

function dist(a: PathPoint, b: PathPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function buildPolylineMeta(points: PathPoint[]): PolylineMeta {
  const cum: number[] = [0];
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += dist(points[i - 1], points[i]);
    cum.push(length);
  }
  return { points, length: Math.max(length, 0.001), cum };
}

export function pointAtPolyline(meta: PolylineMeta, targetLen: number): PathPoint {
  const { points, cum, length } = meta;
  if (points.length === 0) return { x: 0, y: 0 };
  if (targetLen <= 0) return points[0];
  if (targetLen >= length) return points[points.length - 1];

  let lo = 0;
  let hi = cum.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] < targetLen) lo = mid + 1;
    else hi = mid;
  }
  const i = Math.max(1, lo);
  const segStart = cum[i - 1];
  const segEnd = cum[i];
  const seg = segEnd - segStart || 1;
  const t = (targetLen - segStart) / seg;
  const a = points[i - 1];
  const b = points[i];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function tangentAtPolyline(meta: PolylineMeta, targetLen: number): number {
  const a = pointAtPolyline(meta, Math.max(0, targetLen - 2));
  const b = pointAtPolyline(meta, Math.min(meta.length, targetLen + 2));
  return Math.atan2(b.y - a.y, b.x - a.x);
}

/**
 * Generate reveal paths in local object space (0..w, 0..h).
 * brush is approximate stroke diameter used to space scan lines.
 */
export function generateRevealPath(
  style: RevealStyle,
  w: number,
  h: number,
  brush: number,
): PolylineMeta {
  const pad = brush * 0.35;
  const points: PathPoint[] = [];

  switch (style) {
    case 'wipe': {
      // Single horizontal wipe left → right with slight vertical coverage via thick brush
      // Multiple overlapping horizontal strokes
      const rows = Math.max(3, Math.ceil(h / (brush * 0.55)));
      for (let r = 0; r < rows; r++) {
        const y = pad + ((h - pad * 2) * (r + 0.5)) / rows;
        if (r % 2 === 0) {
          points.push({ x: pad, y }, { x: w - pad, y });
        } else {
          points.push({ x: w - pad, y }, { x: pad, y });
        }
      }
      break;
    }
    case 'spiral': {
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.hypot(w, h) / 2;
      const spacing = Math.max(brush * 0.45, 8);
      let r = spacing * 0.3;
      let angle = 0;
      const turns = maxR / spacing;
      const steps = Math.max(40, Math.ceil(turns * 28));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        r = t * maxR;
        angle = t * turns * Math.PI * 2;
        points.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r * (h / w || 1) * (w / Math.max(h, 1)),
        });
      }
      // Fix spiral for non-square: use elliptical spiral
      points.length = 0;
      const maxRx = w / 2 + brush;
      const maxRy = h / 2 + brush;
      const nTurns = Math.max(maxRx, maxRy) / spacing;
      const n = Math.max(48, Math.ceil(nTurns * 32));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const a = t * nTurns * Math.PI * 2;
        points.push({
          x: cx + Math.cos(a) * maxRx * t,
          y: cy + Math.sin(a) * maxRy * t,
        });
      }
      break;
    }
    case 'radial': {
      const cx = w / 2;
      const cy = h / 2;
      const rays = Math.max(12, Math.ceil((Math.PI * Math.max(w, h)) / brush));
      const maxR = Math.hypot(w, h) / 2 + brush;
      for (let i = 0; i < rays; i++) {
        const a = (i / rays) * Math.PI * 2;
        if (i % 2 === 0) {
          points.push({ x: cx, y: cy }, { x: cx + Math.cos(a) * maxR, y: cy + Math.sin(a) * maxR });
        } else {
          points.push(
            { x: cx + Math.cos(a) * maxR, y: cy + Math.sin(a) * maxR },
            { x: cx, y: cy },
          );
        }
      }
      break;
    }
    case 'scan':
    default: {
      // Classic doodle scan: horizontal zigzag rows
      const step = Math.max(brush * 0.5, 6);
      let y = pad;
      let row = 0;
      while (y <= h - pad) {
        if (row % 2 === 0) {
          points.push({ x: pad, y }, { x: w - pad, y });
        } else {
          points.push({ x: w - pad, y }, { x: pad, y });
        }
        y += step;
        row++;
      }
      if (points.length < 2) {
        points.push({ x: pad, y: h / 2 }, { x: w - pad, y: h / 2 });
      }
      break;
    }
  }

  return buildPolylineMeta(points);
}

const pathCache = new Map<string, PolylineMeta>();

export function getRevealPathCached(
  style: RevealStyle,
  w: number,
  h: number,
  brush: number,
): PolylineMeta {
  // Quantize dimensions for cache hits
  const key = `${style}|${Math.round(w)}|${Math.round(h)}|${Math.round(brush)}`;
  let m = pathCache.get(key);
  if (!m) {
    m = generateRevealPath(style, w, h, brush);
    pathCache.set(key, m);
  }
  return m;
}

/** Stroke a polyline onto a mask canvas up to progress 0–1 */
export function strokePolylinePartial(
  ctx: CanvasRenderingContext2D,
  meta: PolylineMeta,
  progress: number,
  lineWidth: number,
): PathPoint | null {
  const target = meta.length * Math.min(1, Math.max(0, progress));
  if (meta.points.length === 0) return null;

  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(meta.points[0].x, meta.points[0].y);

  let acc = 0;
  let tip: PathPoint = meta.points[0];
  for (let i = 1; i < meta.points.length; i++) {
    const a = meta.points[i - 1];
    const b = meta.points[i];
    const seg = dist(a, b);
    if (acc + seg <= target) {
      ctx.lineTo(b.x, b.y);
      tip = b;
      acc += seg;
    } else {
      const t = seg === 0 ? 0 : (target - acc) / seg;
      tip = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      ctx.lineTo(tip.x, tip.y);
      break;
    }
  }
  ctx.stroke();
  return tip;
}
