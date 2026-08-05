import { getAsset } from '../assets/library';
import type { HandStyle, Project, RevealStyle, SceneObject, Resolution } from '../types';
import { RESOLUTIONS } from '../types';
import { drawPartialPath, getStrokeMeta, pointAtLength, type PathPoint } from './path';
import { drawHand, smoothHandPose, type HandPose } from './hand';
import { getCachedImage } from './imageCache';
import {
  getRevealPathCached,
  pointAtPolyline,
  strokePolylinePartial,
  tangentAtPolyline,
} from './revealPaths';

export type { HandPose };

export function projectDuration(project: Project): number {
  if (project.objects.length === 0) return 5;
  let max = 0;
  for (const o of project.objects) {
    max = Math.max(max, o.start + o.duration);
  }
  return Math.max(1, max + project.tailPadding);
}

function objectProgress(obj: SceneObject, time: number): number {
  if (time < obj.start) return 0;
  if (obj.duration <= 0) return time >= obj.start ? 1 : 0;
  return Math.min(1, Math.max(0, (time - obj.start) / obj.duration));
}

function resolveCustomImage(project: Project, obj: SceneObject) {
  if (!obj.customImageId) return null;
  return project.customImages?.find((c) => c.id === obj.customImageId) ?? null;
}

function isImageObject(obj: SceneObject): boolean {
  return obj.kind === 'image' || !!obj.customImageId;
}

function isTextObject(obj: SceneObject): boolean {
  if (obj.kind === 'text') return true;
  const asset = getAsset(obj.assetId);
  return !!asset?.isText;
}

function setupObjectTransform(
  ctx: CanvasRenderingContext2D,
  obj: SceneObject,
  assetVbW: number,
  assetVbH: number,
) {
  ctx.translate(obj.x + obj.w / 2, obj.y + obj.h / 2);
  ctx.rotate((obj.rotation * Math.PI) / 180);
  ctx.translate(-obj.w / 2, -obj.h / 2);
  ctx.scale(obj.w / assetVbW, obj.h / assetVbH);
}

function localToStage(obj: SceneObject, lx: number, ly: number): PathPoint {
  // lx, ly in object local 0..w / 0..h
  const cx = lx - obj.w / 2;
  const cy = ly - obj.h / 2;
  const rad = (obj.rotation * Math.PI) / 180;
  const rx = cx * Math.cos(rad) - cy * Math.sin(rad);
  const ry = cx * Math.sin(rad) + cy * Math.cos(rad);
  return { x: obj.x + obj.w / 2 + rx, y: obj.y + obj.h / 2 + ry };
}

function drawTextObject(
  ctx: CanvasRenderingContext2D,
  obj: SceneObject,
  progress: number,
  showFull: boolean,
): HandPose | null {
  const text = obj.text || 'Text';
  const fontSize = obj.fontSize || Math.max(24, obj.h * 0.55);
  ctx.save();
  ctx.translate(obj.x, obj.y);
  ctx.font = `600 ${fontSize}px "DM Sans", system-ui, sans-serif`;
  ctx.fillStyle = obj.color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  if (showFull || progress >= 1) {
    ctx.fillText(text, 4, obj.h / 2);
    ctx.restore();
    return null;
  }

  if (progress <= 0) {
    ctx.restore();
    return null;
  }

  const chars = Math.max(1, Math.floor(text.length * progress));
  const shown = text.slice(0, chars);
  ctx.fillText(shown, 4, obj.h / 2);
  const metrics = ctx.measureText(shown);
  const hand: HandPose = {
    x: obj.x + 4 + metrics.width,
    y: obj.y + obj.h / 2,
    rotation: 0,
    visible: progress > 0 && progress < 1 && obj.showHand !== false,
  };
  ctx.restore();
  return hand;
}

function drawGraphicObject(
  ctx: CanvasRenderingContext2D,
  obj: SceneObject,
  progress: number,
  showFull: boolean,
): HandPose | null {
  const asset = getAsset(obj.assetId);
  if (!asset) return null;

  const strokes = asset.strokes;
  const fills = asset.fills ?? [];
  const metas = strokes.map((d) => getStrokeMeta(d));
  const totalStrokeLen = metas.reduce((s, m) => s + m.length, 0) || 1;
  const hasFill = fills.length > 0;
  const strokePhaseEnd = hasFill ? 0.85 : 1;
  const fillPhaseStart = hasFill ? 0.85 : 1;

  ctx.save();
  setupObjectTransform(ctx, obj, asset.vbW, asset.vbH);

  if (showFull || progress >= 1) {
    if (fills.length) {
      ctx.fillStyle = obj.fill || asset.defaultFill || 'transparent';
      for (const f of fills) ctx.fill(new Path2D(f));
    }
    ctx.strokeStyle = obj.color;
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const d of strokes) ctx.stroke(new Path2D(d));
    ctx.restore();
    return null;
  }

  if (progress <= 0) {
    ctx.restore();
    return null;
  }

  const strokeProgress = Math.min(1, progress / strokePhaseEnd);
  let remaining = strokeProgress * totalStrokeLen;
  let tip: PathPoint | null = null;
  let tipLenOnStroke = 0;
  let tipStrokeD = '';

  ctx.strokeStyle = obj.color;
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = 0; i < strokes.length; i++) {
    const len = metas[i].length;
    if (remaining >= len) {
      ctx.stroke(new Path2D(strokes[i]));
      remaining -= len;
      if (remaining < 0.5) {
        tip = pointAtLength(strokes[i], len);
        tipLenOnStroke = len;
        tipStrokeD = strokes[i];
      }
    } else if (remaining > 0) {
      tip = drawPartialPath(ctx, strokes[i], remaining / len);
      tipLenOnStroke = remaining;
      tipStrokeD = strokes[i];
      remaining = 0;
      break;
    } else {
      break;
    }
  }

  if (hasFill && progress > fillPhaseStart) {
    const fp = (progress - fillPhaseStart) / (1 - fillPhaseStart);
    ctx.globalAlpha = Math.min(1, fp);
    ctx.fillStyle = obj.fill || asset.defaultFill || 'transparent';
    for (const f of fills) ctx.fill(new Path2D(f));
    ctx.globalAlpha = 1;
  }

  let hand: HandPose | null = null;
  if (tip && progress > 0 && progress < strokePhaseEnd && obj.showHand !== false) {
    const sx = obj.w / asset.vbW;
    const sy = obj.h / asset.vbH;
    const lx = tip.x * sx;
    const ly = tip.y * sy;
    const stage = localToStage(obj, lx, ly);

    // Tangent in viewBox → approximate stage rotation
    let rotation = -0.35;
    if (tipStrokeD) {
      const a = pointAtLength(tipStrokeD, Math.max(0, tipLenOnStroke - 3));
      const b = pointAtLength(tipStrokeD, tipLenOnStroke);
      if (a && b) {
        const dx = (b.x - a.x) * sx;
        const dy = (b.y - a.y) * sy;
        const rad = (obj.rotation * Math.PI) / 180;
        const rdx = dx * Math.cos(rad) - dy * Math.sin(rad);
        const rdy = dx * Math.sin(rad) + dy * Math.cos(rad);
        rotation = Math.atan2(rdy, rdx);
      }
    }

    hand = {
      x: stage.x,
      y: stage.y,
      rotation,
      visible: true,
    };
  }

  ctx.restore();
  return hand;
}

/** Offscreen buffers reused for image mask reveals */
let maskCanvas: HTMLCanvasElement | null = null;
let imgCanvas: HTMLCanvasElement | null = null;

function ensureBuffer(c: HTMLCanvasElement | null, w: number, h: number): HTMLCanvasElement {
  if (!c) c = document.createElement('canvas');
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
  return c;
}

function drawImageObject(
  ctx: CanvasRenderingContext2D,
  project: Project,
  obj: SceneObject,
  progress: number,
  showFull: boolean,
): HandPose | null {
  const custom = resolveCustomImage(project, obj);
  if (!custom) {
    // Placeholder if missing
    ctx.save();
    ctx.strokeStyle = '#999';
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
    ctx.fillStyle = '#bbb';
    ctx.font = '16px sans-serif';
    ctx.fillText('Missing image', obj.x + 8, obj.y + 24);
    ctx.restore();
    return null;
  }

  const img = getCachedImage(custom.dataUrl);
  if (!img) {
    // Not loaded yet — faint box
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
    ctx.restore();
    return null;
  }

  const style: RevealStyle = obj.revealStyle || 'scan';
  const brushFrac = obj.brushSize ?? 0.14;
  const brush = Math.max(12, Math.min(obj.w, obj.h) * brushFrac);

  // Render at object pixel size for quality
  const rw = Math.max(1, Math.round(obj.w));
  const rh = Math.max(1, Math.round(obj.h));

  if (showFull || progress >= 1) {
    ctx.save();
    ctx.translate(obj.x + obj.w / 2, obj.y + obj.h / 2);
    ctx.rotate((obj.rotation * Math.PI) / 180);
    ctx.drawImage(img, -obj.w / 2, -obj.h / 2, obj.w, obj.h);
    ctx.restore();
    return null;
  }

  if (progress <= 0) return null;

  imgCanvas = ensureBuffer(imgCanvas, rw, rh);
  maskCanvas = ensureBuffer(maskCanvas, rw, rh);
  const ictx = imgCanvas.getContext('2d')!;
  const mctx = maskCanvas.getContext('2d')!;

  ictx.clearRect(0, 0, rw, rh);
  ictx.drawImage(img, 0, 0, rw, rh);

  mctx.clearRect(0, 0, rw, rh);
  // Soft start: small reveal seed
  const meta = getRevealPathCached(style, rw, rh, brush);
  strokePolylinePartial(mctx, meta, progress, brush);

  // Apply mask
  ictx.globalCompositeOperation = 'destination-in';
  ictx.drawImage(maskCanvas, 0, 0);
  ictx.globalCompositeOperation = 'source-over';

  ctx.save();
  ctx.translate(obj.x + obj.w / 2, obj.y + obj.h / 2);
  ctx.rotate((obj.rotation * Math.PI) / 180);
  ctx.drawImage(imgCanvas, -obj.w / 2, -obj.h / 2, obj.w, obj.h);
  ctx.restore();

  if (progress >= 1 || obj.showHand === false) return null;

  const tipLocal = pointAtPolyline(meta, meta.length * progress);
  const scaleX = obj.w / rw;
  const scaleY = obj.h / rh;
  const stage = localToStage(obj, tipLocal.x * scaleX, tipLocal.y * scaleY);
  const tan = tangentAtPolyline(meta, meta.length * progress);
  // Account for object rotation
  const rot = tan + (obj.rotation * Math.PI) / 180;

  return {
    x: stage.x,
    y: stage.y,
    rotation: rot,
    visible: progress > 0.01 && progress < 0.995,
  };
}

export function drawObject(
  ctx: CanvasRenderingContext2D,
  project: Project,
  obj: SceneObject,
  time: number,
  opts: { showFull: boolean },
): HandPose | null {
  const progress = opts.showFull ? 1 : objectProgress(obj, time);

  if (isTextObject(obj)) {
    return drawTextObject(ctx, obj, progress, opts.showFull);
  }
  if (isImageObject(obj)) {
    return drawImageObject(ctx, project, obj, progress, opts.showFull);
  }
  return drawGraphicObject(ctx, obj, progress, opts.showFull);
}

export function renderStage(
  ctx: CanvasRenderingContext2D,
  project: Project,
  time: number,
  opts: {
    selectedId: string | null;
    layoutMode: boolean;
    showGuides: boolean;
    showHand: boolean;
  },
): void {
  const res: Resolution = RESOLUTIONS[project.resolution];
  const w = res.width;
  const h = res.height;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = project.background;
  ctx.fillRect(0, 0, w, h);

  if (opts.showGuides) {
    ctx.strokeStyle = 'rgba(0,0,0,0.045)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x <= w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  const sorted = [...project.objects].sort((a, b) => a.zIndex - b.zIndex);
  let activeHand: HandPose | null = null;

  for (const obj of sorted) {
    // In layout mode show everything fully; while scrubbing, still show the
    // selected object fully so a just-dropped clip at the playhead is visible.
    const showFull =
      opts.layoutMode || (opts.showGuides && opts.selectedId === obj.id);
    const hand = drawObject(ctx, project, obj, time, { showFull });
    if (hand?.visible) activeHand = hand;

    if (opts.selectedId === obj.id && opts.showGuides) {
      ctx.save();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(obj.x - 2, obj.y - 2, obj.w + 4, obj.h + 4);
      ctx.setLineDash([]);
      const hs = 9;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5;
      const points = [
        [obj.x, obj.y],
        [obj.x + obj.w, obj.y],
        [obj.x, obj.y + obj.h],
        [obj.x + obj.w, obj.y + obj.h],
      ];
      for (const [hx, hy] of points) {
        ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
        ctx.strokeRect(hx - hs / 2, hy - hs / 2, hs, hs);
      }
      ctx.restore();
    }
  }

  const handStyle: HandStyle = project.handStyle ?? 'pen';
  if (opts.showHand && handStyle !== 'none' && activeHand?.visible) {
    const smoothed = smoothHandPose(activeHand);
    if (smoothed) {
      const scale = (project.handScale ?? 1) * 1.45 * (w / 1920);
      drawHand(ctx, smoothed, scale, handStyle, time);
    }
  }
}

export function hitTest(project: Project, x: number, y: number): SceneObject | null {
  const sorted = [...project.objects].sort((a, b) => b.zIndex - a.zIndex);
  for (const obj of sorted) {
    if (x >= obj.x && x <= obj.x + obj.w && y >= obj.y && y <= obj.y + obj.h) {
      return obj;
    }
  }
  return null;
}

export function resizeHandleAt(
  obj: SceneObject,
  x: number,
  y: number,
  pad = 12,
): 'nw' | 'ne' | 'sw' | 'se' | null {
  const corners: { id: 'nw' | 'ne' | 'sw' | 'se'; hx: number; hy: number }[] = [
    { id: 'nw', hx: obj.x, hy: obj.y },
    { id: 'ne', hx: obj.x + obj.w, hy: obj.y },
    { id: 'sw', hx: obj.x, hy: obj.y + obj.h },
    { id: 'se', hx: obj.x + obj.w, hy: obj.y + obj.h },
  ];
  for (const c of corners) {
    if (Math.abs(x - c.hx) <= pad && Math.abs(y - c.hy) <= pad) return c.id;
  }
  return null;
}
