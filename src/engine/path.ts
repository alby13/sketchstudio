/** Lightweight SVG path length + point sampling for draw animation */

export interface PathPoint {
  x: number;
  y: number;
}

const SAMPLE_STEP = 2;

function dist(a: PathPoint, b: PathPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

/** Parse simple SVG path commands used in our asset library into polyline samples */
export function samplePath(d: string): PathPoint[] {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
  const pts: PathPoint[] = [];
  let i = 0;
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;
  let lastCmd = '';

  const num = () => parseFloat(tokens[i++]);

  const pushLine = (x: number, y: number) => {
    const from = { x: cx, y: cy };
    const to = { x, y };
    const len = dist(from, to);
    const steps = Math.max(1, Math.ceil(len / SAMPLE_STEP));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      pts.push({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
    }
    cx = x;
    cy = y;
  };

  const pushCubic = (x1: number, y1: number, x2: number, y2: number, x: number, y: number) => {
    const p0 = { x: cx, y: cy };
    const p1 = { x: x1, y: y1 };
    const p2 = { x: x2, y: y2 };
    const p3 = { x, y };
    // rough length estimate
    const est =
      dist(p0, p1) + dist(p1, p2) + dist(p2, p3);
    const steps = Math.max(4, Math.ceil(est / SAMPLE_STEP));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const u = 1 - t;
      const x =
        u * u * u * p0.x +
        3 * u * u * t * p1.x +
        3 * u * t * t * p2.x +
        t * t * t * p3.x;
      const y =
        u * u * u * p0.y +
        3 * u * u * t * p1.y +
        3 * u * t * t * p2.y +
        t * t * t * p3.y;
      pts.push({ x, y });
    }
    cx = x;
    cy = y;
  };

  const pushQuad = (x1: number, y1: number, x: number, y: number) => {
    const p0 = { x: cx, y: cy };
    const p1 = { x: x1, y: y1 };
    const p2 = { x, y };
    const est = dist(p0, p1) + dist(p1, p2);
    const steps = Math.max(4, Math.ceil(est / SAMPLE_STEP));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const u = 1 - t;
      pts.push({
        x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
        y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
      });
    }
    cx = x;
    cy = y;
  };

  const pushArc = (
    rx: number,
    ry: number,
    _rot: number,
    large: number,
    sweep: number,
    x: number,
    y: number,
  ) => {
    // Approximate elliptical arc as cubic-ish polyline via parametric steps
    // For our assets, arcs are usually full circles (m -r 0 a r r 0 1 0 2r 0 a r r 0 1 0 -2r 0)
    const x0 = cx;
    const y0 = cy;
    rx = Math.abs(rx) || 1;
    ry = Math.abs(ry) || 1;

    // SVG arc endpoint parameterization (simplified)
    const phi = 0;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);
    const dx2 = (x0 - x) / 2;
    const dy2 = (y0 - y) / 2;
    let x1p = cosPhi * dx2 + sinPhi * dy2;
    let y1p = -sinPhi * dx2 + cosPhi * dy2;

    let rxs = rx * rx;
    let rys = ry * ry;
    let x1ps = x1p * x1p;
    let y1ps = y1p * y1p;
    const lambda = x1ps / rxs + y1ps / rys;
    if (lambda > 1) {
      const s = Math.sqrt(lambda);
      rx *= s;
      ry *= s;
      rxs = rx * rx;
      rys = ry * ry;
    }

    const sign = large === sweep ? -1 : 1;
    const nume = rxs * rys - rxs * y1ps - rys * x1ps;
    const den = rxs * y1ps + rys * x1ps;
    let c = den > 0 ? sign * Math.sqrt(Math.max(0, nume / den)) : 0;
    const cxp = (c * rx * y1p) / ry;
    const cyp = (-c * ry * x1p) / rx;
    const cxArc = cosPhi * cxp - sinPhi * cyp + (x0 + x) / 2;
    const cyArc = sinPhi * cxp + cosPhi * cyp + (y0 + y) / 2;

    const angle = (ux: number, uy: number, vx: number, vy: number) => {
      const n = Math.hypot(ux, uy) * Math.hypot(vx, vy);
      if (n === 0) return 0;
      let cos = (ux * vx + uy * vy) / n;
      cos = Math.min(1, Math.max(-1, cos));
      const a = Math.acos(cos);
      return ux * vy - uy * vx < 0 ? -a : a;
    };

    const v1x = (x1p - cxp) / rx;
    const v1y = (y1p - cyp) / ry;
    const v2x = (-x1p - cxp) / rx;
    const v2y = (-y1p - cyp) / ry;
    let theta1 = angle(1, 0, v1x, v1y);
    let dtheta = angle(v1x, v1y, v2x, v2y);
    if (!sweep && dtheta > 0) dtheta -= 2 * Math.PI;
    if (sweep && dtheta < 0) dtheta += 2 * Math.PI;

    const total = Math.abs(dtheta) * Math.max(rx, ry);
    const steps = Math.max(8, Math.ceil(total / SAMPLE_STEP));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const th = theta1 + dtheta * t;
      const cosT = Math.cos(th);
      const sinT = Math.sin(th);
      pts.push({
        x: cosPhi * rx * cosT - sinPhi * ry * sinT + cxArc,
        y: sinPhi * rx * cosT + cosPhi * ry * sinT + cyArc,
      });
    }
    cx = x;
    cy = y;
  };

  while (i < tokens.length) {
    let cmd = tokens[i];
    if (/[a-zA-Z]/.test(cmd)) {
      i++;
      lastCmd = cmd;
    } else {
      cmd = lastCmd;
      // implicit repetition
      if (cmd === 'M') lastCmd = 'L';
      if (cmd === 'm') lastCmd = 'l';
    }

    switch (cmd) {
      case 'M': {
        cx = num();
        cy = num();
        startX = cx;
        startY = cy;
        pts.push({ x: cx, y: cy });
        lastCmd = 'L';
        break;
      }
      case 'm': {
        cx += num();
        cy += num();
        startX = cx;
        startY = cy;
        pts.push({ x: cx, y: cy });
        lastCmd = 'l';
        break;
      }
      case 'L':
        pushLine(num(), num());
        break;
      case 'l':
        pushLine(cx + num(), cy + num());
        break;
      case 'H':
        pushLine(num(), cy);
        break;
      case 'h':
        pushLine(cx + num(), cy);
        break;
      case 'V':
        pushLine(cx, num());
        break;
      case 'v':
        pushLine(cx, cy + num());
        break;
      case 'C': {
        const x1 = num(),
          y1 = num(),
          x2 = num(),
          y2 = num(),
          x = num(),
          y = num();
        pushCubic(x1, y1, x2, y2, x, y);
        break;
      }
      case 'c': {
        const x1 = cx + num(),
          y1 = cy + num(),
          x2 = cx + num(),
          y2 = cy + num(),
          x = cx + num(),
          y = cy + num();
        pushCubic(x1, y1, x2, y2, x, y);
        break;
      }
      case 'Q': {
        const x1 = num(),
          y1 = num(),
          x = num(),
          y = num();
        pushQuad(x1, y1, x, y);
        break;
      }
      case 'q': {
        const x1 = cx + num(),
          y1 = cy + num(),
          x = cx + num(),
          y = cy + num();
        pushQuad(x1, y1, x, y);
        break;
      }
      case 'A': {
        const rx = num(),
          ry = num(),
          rot = num(),
          large = num(),
          sweep = num(),
          x = num(),
          y = num();
        pushArc(rx, ry, rot, large, sweep, x, y);
        break;
      }
      case 'a': {
        const rx = num(),
          ry = num(),
          rot = num(),
          large = num(),
          sweep = num(),
          x = cx + num(),
          y = cy + num();
        pushArc(rx, ry, rot, large, sweep, x, y);
        break;
      }
      case 'Z':
      case 'z':
        pushLine(startX, startY);
        break;
      default:
        // skip unknown number
        if (!/[a-zA-Z]/.test(cmd)) {
          // already consumed poorly — advance
        } else {
          i++;
        }
        break;
    }
  }

  return pts;
}

export function pathLength(d: string): number {
  const pts = samplePath(d);
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += dist(pts[i - 1], pts[i]);
  return len;
}

export function pointAtLength(d: string, length: number): PathPoint | null {
  const pts = samplePath(d);
  if (pts.length === 0) return null;
  if (length <= 0) return pts[0];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = dist(pts[i - 1], pts[i]);
    if (acc + seg >= length) {
      const t = seg === 0 ? 0 : (length - acc) / seg;
      return {
        x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t,
        y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t,
      };
    }
    acc += seg;
  }
  return pts[pts.length - 1];
}

export interface StrokeMeta {
  d: string;
  length: number;
  samples: PathPoint[];
}

const strokeCache = new Map<string, StrokeMeta>();

export function getStrokeMeta(d: string): StrokeMeta {
  let m = strokeCache.get(d);
  if (!m) {
    const samples = samplePath(d);
    let length = 0;
    for (let i = 1; i < samples.length; i++) length += dist(samples[i - 1], samples[i]);
    m = { d, length: Math.max(length, 0.001), samples };
    strokeCache.set(d, m);
  }
  return m;
}

/** Draw a path up to a fraction of its length (0–1) */
export function drawPartialPath(
  ctx: CanvasRenderingContext2D,
  d: string,
  progress: number,
): PathPoint | null {
  const meta = getStrokeMeta(d);
  const target = meta.length * Math.min(1, Math.max(0, progress));
  if (meta.samples.length === 0) return null;

  ctx.beginPath();
  ctx.moveTo(meta.samples[0].x, meta.samples[0].y);
  let acc = 0;
  let tip: PathPoint = meta.samples[0];

  for (let i = 1; i < meta.samples.length; i++) {
    const a = meta.samples[i - 1];
    const b = meta.samples[i];
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
