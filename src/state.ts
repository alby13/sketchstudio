import { getAsset } from './assets/library';
import type {
  Project,
  SceneObject,
  ResolutionId,
  DragState,
  CustomImage,
  RevealStyle,
  HandStyle,
} from './types';
import { RESOLUTIONS } from './types';
import { projectDuration } from './engine/renderer';
import { compressImageDataUrl, loadImageFromFile, preloadImages } from './engine/imageCache';
import { resetHandSmoothing } from './engine/hand';

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function createEmptyProject(): Project {
  return {
    version: 1,
    name: 'Untitled Scene',
    resolution: '1080p',
    background: '#f7f5f0',
    objects: [],
    tailPadding: 1.5,
    customImages: [],
    handStyle: 'pen',
    handScale: 1,
  };
}

export function createDemoProject(): Project {
  const p = createEmptyProject();
  p.name = 'Demo Explainer';
  p.objects = [
    createObjectFromAsset('text-title', 200, 120, 0, {
      text: 'How Sketch Videos Work',
      fontSize: 56,
      duration: 2.2,
      start: 0.2,
    }),
    createObjectFromAsset('person-stick', 280, 380, 1, { start: 2.5, duration: 2.5 }),
    createObjectFromAsset('arrow-right', 480, 480, 2, { start: 5.2, duration: 1.2 }),
    createObjectFromAsset('lightbulb', 760, 360, 3, { start: 6.6, duration: 2 }),
    createObjectFromAsset('chat', 1050, 420, 4, { start: 8.8, duration: 1.8 }),
    createObjectFromAsset('check', 1400, 450, 5, { start: 10.8, duration: 1.5 }),
  ];
  return p;
}

export function createObjectFromAsset(
  assetId: string,
  x: number,
  y: number,
  zIndex: number,
  overrides: Partial<SceneObject> = {},
): SceneObject {
  const asset = getAsset(assetId);
  if (!asset) throw new Error(`Unknown asset ${assetId}`);
  return {
    id: overrides.id || uid(),
    assetId,
    name: overrides.name ?? asset.name,
    x: overrides.x ?? x,
    y: overrides.y ?? y,
    w: overrides.w ?? asset.defaultW,
    h: overrides.h ?? asset.defaultH,
    rotation: overrides.rotation ?? 0,
    color: overrides.color ?? asset.defaultColor ?? '#1a1a1a',
    fill: overrides.fill ?? asset.defaultFill ?? 'transparent',
    start: overrides.start ?? 0,
    duration: overrides.duration ?? (asset.isText ? 1.5 : 2),
    zIndex: overrides.zIndex ?? zIndex,
    kind: asset.isText ? 'text' : 'vector',
    text: asset.isText ? overrides.text || asset.name : undefined,
    fontSize: asset.isText
      ? overrides.fontSize || (assetId === 'text-title' ? 64 : 36)
      : undefined,
    showHand: overrides.showHand ?? true,
  };
}

export function createImageObject(
  image: CustomImage,
  x: number,
  y: number,
  zIndex: number,
  overrides: Partial<SceneObject> = {},
): SceneObject {
  // Fit reasonably on a 1080p stage
  const maxW = 480;
  const maxH = 480;
  const scale = Math.min(1, maxW / image.width, maxH / image.height);
  const w = Math.round(image.width * scale);
  const h = Math.round(image.height * scale);
  return {
    id: overrides.id || uid(),
    assetId: 'custom-image',
    name: overrides.name ?? image.name,
    x,
    y,
    w: overrides.w ?? w,
    h: overrides.h ?? h,
    rotation: 0,
    color: '#1a1a1a',
    fill: 'transparent',
    start: overrides.start ?? 0,
    duration: overrides.duration ?? 3,
    zIndex,
    kind: 'image',
    customImageId: image.id,
    revealStyle: overrides.revealStyle ?? 'scan',
    brushSize: overrides.brushSize ?? 0.14,
    showHand: overrides.showHand ?? true,
  };
}

function nextZ(objects: SceneObject[]): number {
  return objects.reduce((m, o) => Math.max(m, o.zIndex), 0) + 1;
}

export interface AppState {
  project: Project;
  selectedId: string | null;
  currentTime: number;
  playing: boolean;
  recordMode: boolean;
  categoryFilter: string;
  drag: DragState;
  viewScale: number;
  timelineZoom: number;
}

type Listener = () => void;

export class Store {
  state: AppState;
  private listeners = new Set<Listener>();
  private raf = 0;
  private lastTs = 0;

  constructor(project?: Project) {
    this.state = {
      project: project || createDemoProject(),
      selectedId: null,
      currentTime: 0,
      playing: false,
      recordMode: false,
      categoryFilter: 'all',
      drag: { kind: null, startX: 0, startY: 0, origX: 0, origY: 0, origW: 0, origH: 0 },
      viewScale: 0.5,
      timelineZoom: 80,
    };
    this.preloadProjectImages();
  }

  private preloadProjectImages() {
    const urls = (this.state.project.customImages ?? []).map((c) => c.dataUrl);
    preloadImages(urls);
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    for (const fn of this.listeners) fn();
  }

  set(partial: Partial<AppState>) {
    Object.assign(this.state, partial);
    this.emit();
  }

  updateProject(partial: Partial<Project>) {
    this.state.project = { ...this.state.project, ...partial };
    this.emit();
  }

  get duration() {
    return projectDuration(this.state.project);
  }

  get selected(): SceneObject | null {
    return this.state.project.objects.find((o) => o.id === this.state.selectedId) ?? null;
  }

  get customImages(): CustomImage[] {
    return this.state.project.customImages ?? [];
  }

  select(id: string | null) {
    this.state.selectedId = id;
    this.emit();
  }

  updateObject(id: string, partial: Partial<SceneObject>) {
    const objects = this.state.project.objects.map((o) =>
      o.id === id ? { ...o, ...partial } : o,
    );
    this.state.project = { ...this.state.project, objects };
    this.emit();
  }

  deleteSelected() {
    if (!this.state.selectedId) return;
    const objects = this.state.project.objects.filter((o) => o.id !== this.state.selectedId);
    this.state.project = { ...this.state.project, objects };
    this.state.selectedId = null;
    this.emit();
  }

  addObject(assetId: string, stageX: number, stageY: number) {
    // Custom image placed from library
    if (assetId.startsWith('img:')) {
      const imageId = assetId.slice(4);
      const image = this.customImages.find((c) => c.id === imageId);
      if (image) this.addImageObject(image, stageX, stageY);
      return;
    }

    const asset = getAsset(assetId);
    if (!asset) return;
    const res = RESOLUTIONS[this.state.project.resolution];
    const w = asset.defaultW;
    const h = asset.defaultH;
    const x = Math.max(0, Math.min(res.width - w, stageX - w / 2));
    const y = Math.max(0, Math.min(res.height - h, stageY - h / 2));
    const zIndex = nextZ(this.state.project.objects);
    // Place clip at current playhead time
    const start = Math.max(0, this.state.currentTime);

    const obj = createObjectFromAsset(assetId, x, y, zIndex, {
      start,
      duration: asset.isText ? 1.6 : 2,
      text: asset.isText ? (asset.id === 'text-title' ? 'Your Title' : 'Label') : undefined,
    });
    this.state.project = {
      ...this.state.project,
      objects: [...this.state.project.objects, obj],
    };
    this.state.selectedId = obj.id;
    this.emit();
  }

  addImageObject(image: CustomImage, stageX: number, stageY: number) {
    const res = RESOLUTIONS[this.state.project.resolution];
    const zIndex = nextZ(this.state.project.objects);
    const start = Math.max(0, this.state.currentTime);
    const draft = createImageObject(image, 0, 0, zIndex, { start, duration: 3 });
    const x = Math.max(0, Math.min(res.width - draft.w, stageX - draft.w / 2));
    const y = Math.max(0, Math.min(res.height - draft.h, stageY - draft.h / 2));
    const obj = { ...draft, x, y };
    this.state.project = {
      ...this.state.project,
      objects: [...this.state.project.objects, obj],
    };
    this.state.selectedId = obj.id;
    this.emit();
  }

  async uploadImages(files: FileList | File[]): Promise<void> {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!list.length) {
      alert('Please choose image files (PNG, JPG, WebP, SVG, GIF).');
      return;
    }

    const added: CustomImage[] = [];
    for (const file of list) {
      try {
        const raw = await loadImageFromFile(file);
        const compressed = await compressImageDataUrl(raw.dataUrl, 1600, 0.88);
        const img: CustomImage = {
          id: uid(),
          name: raw.name,
          dataUrl: compressed.dataUrl,
          width: compressed.width,
          height: compressed.height,
        };
        added.push(img);
      } catch {
        console.warn('Failed to load', file.name);
      }
    }

    if (!added.length) {
      alert('Could not load the selected images.');
      return;
    }

    const customImages = [...(this.state.project.customImages ?? []), ...added];
    this.state.project = { ...this.state.project, customImages };

    // Place first image on stage centered
    const res = RESOLUTIONS[this.state.project.resolution];
    this.addImageObject(added[0], res.width / 2, res.height / 2);
    // addImageObject already emits; if more uploaded, just keep in library
    if (added.length > 1) this.emit();
  }

  removeCustomImage(imageId: string) {
    const customImages = (this.state.project.customImages ?? []).filter((c) => c.id !== imageId);
    const objects = this.state.project.objects.filter((o) => o.customImageId !== imageId);
    this.state.project = { ...this.state.project, customImages, objects };
    if (this.state.selectedId && !objects.find((o) => o.id === this.state.selectedId)) {
      this.state.selectedId = null;
    }
    this.emit();
  }

  setHandStyle(style: HandStyle) {
    this.updateProject({ handStyle: style });
  }

  setHandScale(scale: number) {
    this.updateProject({ handScale: scale });
  }

  setResolution(id: ResolutionId) {
    const old = RESOLUTIONS[this.state.project.resolution];
    const next = RESOLUTIONS[id];
    const sx = next.width / old.width;
    const sy = next.height / old.height;
    const objects = this.state.project.objects.map((o) => ({
      ...o,
      x: o.x * sx,
      y: o.y * sy,
      w: o.w * sx,
      h: o.h * sy,
      fontSize: o.fontSize ? o.fontSize * sy : undefined,
    }));
    this.state.project = { ...this.state.project, resolution: id, objects };
    this.emit();
  }

  setTime(t: number) {
    this.state.currentTime = Math.max(0, Math.min(this.duration, t));
    this.emit();
  }

  play() {
    if (this.state.playing) return;
    if (this.state.currentTime >= this.duration - 0.01) {
      this.state.currentTime = 0;
    }
    resetHandSmoothing();
    this.state.playing = true;
    this.lastTs = 0;
    this.emit();
    const tick = (ts: number) => {
      if (!this.state.playing) return;
      if (!this.lastTs) this.lastTs = ts;
      const dt = (ts - this.lastTs) / 1000;
      this.lastTs = ts;
      this.state.currentTime += dt;
      if (this.state.currentTime >= this.duration) {
        this.state.currentTime = this.duration;
        this.state.playing = false;
        this.emit();
        return;
      }
      this.emit();
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  pause() {
    this.state.playing = false;
    cancelAnimationFrame(this.raf);
    this.emit();
  }

  togglePlay() {
    if (this.state.playing) this.pause();
    else this.play();
  }

  stop() {
    this.pause();
    this.state.currentTime = 0;
    resetHandSmoothing();
    this.emit();
  }

  enterRecordMode() {
    this.state.recordMode = true;
    this.state.currentTime = 0;
    this.state.playing = false;
    this.state.selectedId = null;
    resetHandSmoothing();
    this.emit();
  }

  exitRecordMode() {
    this.state.recordMode = false;
    this.pause();
    this.state.currentTime = 0;
    this.emit();
  }

  saveLocal() {
    try {
      localStorage.setItem('sketch-studio-project', JSON.stringify(this.state.project));
    } catch (e) {
      console.warn('Save failed (likely storage quota for large images)', e);
      alert(
        'Could not save to browser storage (images may be too large). Use Export JSON instead.',
      );
    }
  }

  loadLocal(): boolean {
    const raw =
      localStorage.getItem('sketch-studio-project') ||
      localStorage.getItem('whiteboard-studio-project');
    if (!raw) return false;
    try {
      const p = JSON.parse(raw) as Project;
      if (p.version !== 1) return false;
      p.customImages = p.customImages ?? [];
      p.handStyle = p.handStyle ?? 'pen';
      p.handScale = p.handScale ?? 1;
      this.state.project = p;
      this.state.selectedId = null;
      this.state.currentTime = 0;
      this.preloadProjectImages();
      this.emit();
      return true;
    } catch {
      return false;
    }
  }

  exportJson() {
    const blob = new Blob([JSON.stringify(this.state.project, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${this.state.project.name.replace(/\s+/g, '-').toLowerCase()}.sketchstudio.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  importJson(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const p = JSON.parse(String(reader.result)) as Project;
        if (p.version !== 1 || !Array.isArray(p.objects)) throw new Error('bad');
        p.customImages = p.customImages ?? [];
        p.handStyle = p.handStyle ?? 'pen';
        p.handScale = p.handScale ?? 1;
        this.state.project = p;
        this.state.selectedId = null;
        this.state.currentTime = 0;
        this.preloadProjectImages();
        this.emit();
      } catch {
        alert('Could not load project file.');
      }
    };
    reader.readAsText(file);
  }
}

export type { RevealStyle };
