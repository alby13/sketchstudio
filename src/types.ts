export type ResolutionId = '1080p' | '1440p';

export interface Resolution {
  id: ResolutionId;
  label: string;
  width: number;
  height: number;
}

export const RESOLUTIONS: Record<ResolutionId, Resolution> = {
  '1080p': { id: '1080p', label: '1080p (1920×1080)', width: 1920, height: 1080 },
  '1440p': { id: '1440p', label: '1440p (2560×1440)', width: 2560, height: 1440 },
};

export type AssetCategory = 'people' | 'concepts' | 'shapes' | 'arrows' | 'text' | 'uploads';

export interface AssetDef {
  id: string;
  name: string;
  category: AssetCategory;
  vbW: number;
  vbH: number;
  defaultW: number;
  defaultH: number;
  strokes: string[];
  fills?: string[];
  defaultColor?: string;
  defaultFill?: string;
  isText?: boolean;
}

export interface CustomImage {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
}

export type RevealStyle = 'scan' | 'spiral' | 'radial' | 'wipe';
export type HandStyle = 'pen' | 'marker' | 'pencil' | 'hand' | 'brush' | 'none';
export type ObjectKind = 'vector' | 'image' | 'text';

export interface SceneObject {
  id: string;
  assetId: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  color: string;
  fill: string;
  start: number;
  duration: number;
  zIndex: number;
  text?: string;
  fontSize?: number;
  kind?: ObjectKind;
  customImageId?: string;
  revealStyle?: RevealStyle;
  brushSize?: number;
  showHand?: boolean;
}

export interface Project {
  version: 1;
  name: string;
  resolution: ResolutionId;
  background: string;
  objects: SceneObject[];
  tailPadding: number;
  customImages?: CustomImage[];
  handStyle?: HandStyle;
  handScale?: number;
}

export interface PlaybackState {
  playing: boolean;
  currentTime: number;
  recordMode: boolean;
}

export type ToolMode = 'select' | 'pan';

export interface DragState {
  kind: 'move' | 'resize' | 'timeline-move' | 'timeline-resize' | 'scrub' | 'place' | null;
  objectId?: string;
  handle?: ResizeHandle;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
  origStart?: number;
  origDuration?: number;
  assetId?: string;
}

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

export const HAND_STYLE_OPTIONS: { id: HandStyle; label: string }[] = [
  { id: 'pen', label: 'Pen' },
  { id: 'marker', label: 'Marker' },
  { id: 'pencil', label: 'Pencil' },
  { id: 'hand', label: 'Pointing hand' },
  { id: 'brush', label: 'Paint brush' },
  { id: 'none', label: 'Hidden' },
];
