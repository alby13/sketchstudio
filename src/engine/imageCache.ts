/** Async image loader with in-memory cache for data URLs / remote srcs */

const cache = new Map<string, HTMLImageElement>();
const pending = new Map<string, Promise<HTMLImageElement>>();

export function getCachedImage(src: string): HTMLImageElement | null {
  return cache.get(src) ?? null;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  const hit = cache.get(src);
  if (hit?.complete && hit.naturalWidth > 0) return Promise.resolve(hit);

  const inflight = pending.get(src);
  if (inflight) return inflight;

  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      cache.set(src, img);
      pending.delete(src);
      resolve(img);
    };
    img.onerror = () => {
      pending.delete(src);
      reject(new Error('Failed to load image'));
    };
    img.src = src;
  });
  pending.set(src, p);
  return p;
}

export function preloadImages(srcs: string[]): void {
  for (const s of srcs) {
    if (s) void loadImage(s);
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function loadImageFromFile(file: File): Promise<{
  dataUrl: string;
  width: number;
  height: number;
  name: string;
}> {
  return fileToDataUrl(file).then(async (dataUrl) => {
    const img = await loadImage(dataUrl);
    return {
      dataUrl,
      width: img.naturalWidth,
      height: img.naturalHeight,
      name: file.name.replace(/\.[^.]+$/, '') || 'Upload',
    };
  });
}

/** Downscale large images so projects stay manageable in localStorage */
export async function compressImageDataUrl(
  dataUrl: string,
  maxEdge = 1600,
  quality = 0.85,
): Promise<{ dataUrl: string; width: number; height: number }> {
  const img = await loadImage(dataUrl);
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  w = Math.round(w * scale);
  h = Math.round(h * scale);

  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);

  // Prefer PNG for transparency, JPEG for photos
  const hasAlpha = dataUrl.startsWith('data:image/png') || dataUrl.startsWith('data:image/webp');
  const out = hasAlpha ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', quality);
  // Re-cache under new url
  await loadImage(out);
  return { dataUrl: out, width: w, height: h };
}
