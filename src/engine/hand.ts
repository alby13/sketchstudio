import type { HandStyle } from '../types';

export interface HandPose {
  x: number;
  y: number;
  /** Radians — direction of travel along the path */
  rotation: number;
  visible: boolean;
}

/** Smooth hand state across frames for natural motion */
let smoothX = 0;
let smoothY = 0;
let smoothRot = -0.35;
let hasSmooth = false;
let bobPhase = 0;

const SKIN = '#f3c9a3';
const SKIN_DEEP = '#e2a87a';
const SKIN_LINE = '#5a3a26';
const NAIL = '#f8e4d4';

/**
 * Local drawing space for every tool:
 *   (0, 0)  = exact tip that touches the board
 *   +Y      = body of the tool / arm (away from the tip)
 *
 * Tools (pen, marker, pencil, brush) are just the objects — no gripping hand.
 * "hand" is a pointing finger only.
 */
export function resetHandSmoothing() {
  hasSmooth = false;
  bobPhase = 0;
}

export function smoothHandPose(target: HandPose | null, dtHint = 0.05): HandPose | null {
  if (!target?.visible) {
    hasSmooth = false;
    return target;
  }

  if (!hasSmooth) {
    smoothX = target.x;
    smoothY = target.y;
    smoothRot = target.rotation;
    hasSmooth = true;
  } else {
    const k = 1 - Math.exp(-12 * Math.min(dtHint, 0.05));
    smoothX += (target.x - smoothX) * k;
    smoothY += (target.y - smoothY) * k;
    let d = target.rotation - smoothRot;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    smoothRot += d * k;
  }

  bobPhase += 0.35;
  return {
    x: smoothX,
    y: smoothY + Math.sin(bobPhase) * 1.2,
    rotation: smoothRot,
    visible: true,
  };
}

export function drawHand(
  ctx: CanvasRenderingContext2D,
  pose: HandPose,
  scale: number,
  style: HandStyle,
  time = 0,
) {
  if (style === 'none' || !pose.visible) return;

  ctx.save();
  ctx.translate(pose.x, pose.y);
  ctx.scale(scale, scale);
  // Path heading → tip points along motion; +Y trails behind the tip
  ctx.rotate(pose.rotation + Math.PI / 2);

  const wobble = Math.sin(time * 8) * 0.012;
  ctx.rotate(wobble);

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  switch (style) {
    case 'marker':
      drawMarkerOnly(ctx);
      break;
    case 'pencil':
      drawPencilOnly(ctx);
      break;
    case 'hand':
      drawPointingHand(ctx);
      break;
    case 'brush':
      drawBrushOnly(ctx);
      break;
    case 'pen':
    default:
      drawPenOnly(ctx);
      break;
  }

  ctx.restore();
}

function stroke(ctx: CanvasRenderingContext2D, w = 2.2) {
  ctx.lineWidth = w;
  ctx.strokeStyle = SKIN_LINE;
  ctx.stroke();
}

// ── Pen (tool only) ─────────────────────────────────────────

function drawPenOnly(ctx: CanvasRenderingContext2D) {
  // Barrel
  const barrel = ctx.createLinearGradient(0, 8, 0, 90);
  barrel.addColorStop(0, '#475569');
  barrel.addColorStop(0.4, '#94a3b8');
  barrel.addColorStop(0.55, '#64748b');
  barrel.addColorStop(1, '#1e293b');
  ctx.fillStyle = barrel;
  ctx.beginPath();
  ctx.moveTo(1, 12);
  ctx.lineTo(-1, 88);
  ctx.lineTo(13, 88);
  ctx.lineTo(11, 12);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, 2);

  // Clip
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(11, 22);
  ctx.lineTo(17, 22);
  ctx.lineTo(17, 48);
  ctx.stroke();

  // Grip
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(1, 12);
  ctx.lineTo(0.5, 28);
  ctx.lineTo(11.5, 28);
  ctx.lineTo(11, 12);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, 1.4);

  // Metal cone
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(1, 12);
  ctx.lineTo(4.5, 3);
  ctx.lineTo(7.5, 3);
  ctx.lineTo(11, 12);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, 1.6);

  // Tip at origin
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(4, 4);
  ctx.lineTo(6, 0);
  ctx.lineTo(8, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(6, 1.2, 1.3, 0, Math.PI * 2);
  ctx.fill();
}

// ── Marker (tool only) ──────────────────────────────────────

function drawMarkerOnly(ctx: CanvasRenderingContext2D) {
  // Felt tip
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.moveTo(0, 14);
  ctx.lineTo(1.5, 4);
  ctx.lineTo(6, 0);
  ctx.lineTo(10.5, 4);
  ctx.lineTo(12, 14);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, 1.6);

  // Body
  const body = ctx.createLinearGradient(0, 14, 0, 90);
  body.addColorStop(0, '#ef4444');
  body.addColorStop(0.5, '#dc2626');
  body.addColorStop(1, '#991b1b');
  ctx.fillStyle = body;
  roundRect(ctx, 0, 14, 12, 70, 4);
  ctx.fill();
  stroke(ctx, 2.2);

  // Cap ring
  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(0, 14, 12, 8);
  ctx.strokeStyle = SKIN_LINE;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(0, 14, 12, 8);

  // Label
  ctx.fillStyle = '#fef2f2';
  ctx.fillRect(2, 36, 8, 6);

  // Felt highlight
  ctx.strokeStyle = '#4b5563';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(3.5, 8);
  ctx.lineTo(6, 1);
  ctx.lineTo(8.5, 8);
  ctx.stroke();
}

// ── Pencil (tool only) ──────────────────────────────────────

function drawPencilOnly(ctx: CanvasRenderingContext2D) {
  // Graphite
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.moveTo(3, 6);
  ctx.lineTo(6, 0);
  ctx.lineTo(9, 6);
  ctx.closePath();
  ctx.fill();

  // Wood cone
  ctx.fillStyle = '#f5e6c8';
  ctx.beginPath();
  ctx.moveTo(1, 18);
  ctx.lineTo(3, 6);
  ctx.lineTo(9, 6);
  ctx.lineTo(11, 18);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, 1.5);

  // Body
  const wood = ctx.createLinearGradient(0, 18, 0, 95);
  wood.addColorStop(0, '#facc15');
  wood.addColorStop(0.4, '#fde047');
  wood.addColorStop(0.55, '#fef08a');
  wood.addColorStop(1, '#ca8a04');
  ctx.fillStyle = wood;
  ctx.beginPath();
  ctx.moveTo(1, 18);
  ctx.lineTo(-0.5, 88);
  ctx.lineTo(5, 94);
  ctx.lineTo(12.5, 88);
  ctx.lineTo(11, 18);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, 2);

  // Facet
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(6, 20);
  ctx.lineTo(6, 86);
  ctx.stroke();

  // Ferrule
  ctx.fillStyle = '#9ca3af';
  ctx.fillRect(0.5, 88, 11, 7);
  ctx.strokeStyle = SKIN_LINE;
  ctx.lineWidth = 1.4;
  ctx.strokeRect(0.5, 88, 11, 7);

  // Eraser
  ctx.fillStyle = '#f472b6';
  ctx.beginPath();
  ctx.moveTo(0.5, 95);
  ctx.lineTo(1.5, 104);
  ctx.lineTo(10.5, 104);
  ctx.lineTo(11.5, 95);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, 1.4);
}

// ── Paint brush (tool only) ─────────────────────────────────

function drawBrushOnly(ctx: CanvasRenderingContext2D) {
  // Bristles → tip at origin
  const br = ctx.createLinearGradient(6, 0, 6, 24);
  br.addColorStop(0, '#a8a29e');
  br.addColorStop(0.45, '#78716c');
  br.addColorStop(1, '#57534e');
  ctx.fillStyle = br;
  ctx.beginPath();
  ctx.moveTo(6, 0);
  ctx.quadraticCurveTo(-3, 10, 0, 24);
  ctx.lineTo(14, 24);
  ctx.quadraticCurveTo(17, 10, 6, 0);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, 2);

  ctx.strokeStyle = '#44403c';
  ctx.lineWidth = 1.15;
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const x = 1 + t * 10;
    ctx.beginPath();
    ctx.moveTo(6, 1);
    ctx.quadraticCurveTo(x, 12, x, 22);
    ctx.stroke();
  }

  // Wet paint on tip
  const paint = ctx.createRadialGradient(6, 1, 0.2, 6, 2, 6);
  paint.addColorStop(0, '#93c5fd');
  paint.addColorStop(0.55, '#3b82f6');
  paint.addColorStop(1, 'rgba(37,99,235,0)');
  ctx.fillStyle = paint;
  ctx.beginPath();
  ctx.ellipse(6, 2, 5.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ferrule
  const metal = ctx.createLinearGradient(0, 24, 14, 42);
  metal.addColorStop(0, '#d1d5db');
  metal.addColorStop(0.5, '#f3f4f6');
  metal.addColorStop(1, '#6b7280');
  ctx.fillStyle = metal;
  ctx.beginPath();
  ctx.moveTo(0, 24);
  ctx.lineTo(-1, 42);
  ctx.lineTo(15, 42);
  ctx.lineTo(14, 24);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1.2;
  for (const y of [28, 33, 38]) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(14, y);
    ctx.stroke();
  }

  // Handle
  const handle = ctx.createLinearGradient(2, 42, 12, 120);
  handle.addColorStop(0, '#b45309');
  handle.addColorStop(0.4, '#d97706');
  handle.addColorStop(0.7, '#92400e');
  handle.addColorStop(1, '#78350f');
  ctx.fillStyle = handle;
  ctx.beginPath();
  ctx.moveTo(1, 42);
  ctx.quadraticCurveTo(-1, 85, 3, 120);
  ctx.lineTo(13, 118);
  ctx.quadraticCurveTo(15, 84, 13, 42);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, 2.2);

  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(5, 50);
  ctx.lineTo(7, 110);
  ctx.stroke();
}

// ── Pointing hand (finger only — the one “hand” option) ─────

function drawPointingHand(ctx: CanvasRenderingContext2D) {
  // Sleeve
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.moveTo(6, 92);
  ctx.quadraticCurveTo(0, 122, 10, 148);
  ctx.lineTo(52, 142);
  ctx.quadraticCurveTo(56, 112, 46, 90);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, 2.4);

  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.moveTo(4, 86);
  ctx.lineTo(48, 84);
  ctx.lineTo(50, 96);
  ctx.lineTo(6, 98);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, 2);

  const g = ctx.createLinearGradient(0, 20, 50, 100);
  g.addColorStop(0, SKIN);
  g.addColorStop(1, SKIN_DEEP);
  ctx.fillStyle = g;

  // Palm
  ctx.beginPath();
  ctx.moveTo(10, 52);
  ctx.quadraticCurveTo(4, 74, 14, 100);
  ctx.quadraticCurveTo(30, 112, 50, 98);
  ctx.quadraticCurveTo(58, 72, 48, 52);
  ctx.quadraticCurveTo(36, 42, 22, 44);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, 2.6);

  // Index finger pointing — tip pad at origin
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.moveTo(2, 52);
  ctx.quadraticCurveTo(-3, 30, 1, 10);
  ctx.quadraticCurveTo(3, 2, 6, 0);
  ctx.quadraticCurveTo(10, 2, 13, 10);
  ctx.quadraticCurveTo(18, 30, 18, 52);
  ctx.quadraticCurveTo(10, 56, 2, 52);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, 2.2);

  // Joint creases
  ctx.strokeStyle = 'rgba(90,58,38,0.35)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(3, 18);
  ctx.quadraticCurveTo(8, 16, 13, 18);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, 34);
  ctx.quadraticCurveTo(9, 32, 14, 34);
  ctx.stroke();

  // Nail
  ctx.fillStyle = NAIL;
  ctx.beginPath();
  ctx.ellipse(7, 6, 3.6, 4.8, 0.05, 0, Math.PI * 2);
  ctx.fill();
  stroke(ctx, 1.1);

  // Middle (slightly curled)
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.ellipse(26, 34, 8, 18, 0.05, 0, Math.PI * 2);
  ctx.fill();
  stroke(ctx, 2);
  ctx.fillStyle = NAIL;
  ctx.beginPath();
  ctx.ellipse(26, 20, 3.4, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ring
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.ellipse(38, 42, 7, 15, 0.2, 0, Math.PI * 2);
  ctx.fill();
  stroke(ctx, 2);

  // Pinky
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.ellipse(48, 54, 5.5, 12, 0.35, 0, Math.PI * 2);
  ctx.fill();
  stroke(ctx, 1.8);

  // Thumb
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.moveTo(40, 66);
  ctx.quadraticCurveTo(58, 62, 64, 46);
  ctx.quadraticCurveTo(66, 36, 58, 34);
  ctx.quadraticCurveTo(48, 40, 40, 54);
  ctx.closePath();
  ctx.fill();
  stroke(ctx, 2.2);
  ctx.fillStyle = NAIL;
  ctx.beginPath();
  ctx.ellipse(60, 38, 3.5, 4.5, 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Large QA sheet for visual review */
export function renderHandStyleSheet(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const styles: { id: HandStyle; label: string }[] = [
    { id: 'pen', label: 'Pen' },
    { id: 'marker', label: 'Marker' },
    { id: 'pencil', label: 'Pencil' },
    { id: 'hand', label: 'Pointing hand' },
    { id: 'brush', label: 'Paint brush' },
  ];

  ctx.fillStyle = '#f0eeea';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#0f172a';
  ctx.font = '600 28px "DM Sans", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Sketch Studio — Drawing pointers', 40, 48);
  ctx.font = '500 15px "DM Sans", system-ui, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Tools only — except “Pointing hand”. Red crosshair = tip.', 40, 72);

  const n = styles.length;
  const cellW = width / n;

  styles.forEach((s, i) => {
    const cx = cellW * i + cellW / 2;
    const cy = height * 0.38;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    const cardX = cellW * i + 18;
    const cardY = 92;
    const cardW = cellW - 36;
    const cardH = height - 150;
    roundRect(ctx, cardX, cardY, cardW, cardH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(239,68,68,0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx - 36, cy);
    ctx.lineTo(cx + 36, cy);
    ctx.moveTo(cx, cy - 36);
    ctx.lineTo(cx, cy + 36);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(239,68,68,0.85)';
    ctx.beginPath();
    ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
    ctx.fill();

    drawHand(ctx, { x: cx, y: cy, rotation: -Math.PI / 2, visible: true }, 3.15, s.id, 0);

    ctx.fillStyle = '#0f172a';
    ctx.font = '600 20px "DM Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.label, cx, height - 32);
    ctx.textAlign = 'left';
  });
}
