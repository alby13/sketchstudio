import './style.css';
import { ASSET_LIBRARY, CATEGORIES, getAsset } from './assets/library';
import { hitTest, projectDuration, renderStage, resizeHandleAt } from './engine/renderer';
import { loadImage, preloadImages } from './engine/imageCache';
import { Store } from './state';
import type { HandStyle, ResizeHandle, ResolutionId, RevealStyle } from './types';
import { RESOLUTIONS } from './types';

const store = new Store();
const app = document.querySelector<HTMLDivElement>('#app')!;

// ── DOM shell ──────────────────────────────────────────────

app.innerHTML = `
  <div class="studio" id="studio">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">✎</div>
        Sketch Studio
      </div>
      <input class="project-name" id="projectName" type="text" spellcheck="false" />
      <div class="seg" id="resSeg">
        <button type="button" data-res="1080p">1080p</button>
        <button type="button" data-res="1440p">1440p</button>
      </div>
      <div class="hand-bar" title="Drawing hand style">
        <span style="font-size:11px;color:var(--text-mute);font-weight:600;text-transform:uppercase">Hand</span>
        <select id="handStyle">
          <option value="pen">Pen</option>
          <option value="marker">Marker</option>
          <option value="pencil">Pencil</option>
          <option value="hand">Pointing hand</option>
          <option value="brush">Paint brush</option>
          <option value="none">Hidden</option>
        </select>
      </div>
      <div class="spacer"></div>
      <button type="button" class="btn" id="btnSave" title="Save to browser">Save</button>
      <button type="button" class="btn" id="btnExport">Export JSON</button>
      <label class="btn" id="btnImportLabel">
        Import
        <input type="file" id="btnImport" accept=".json,application/json" hidden />
      </label>
      <button type="button" class="btn record" id="btnRecord" title="Fullscreen stage for OBS / screen capture">
        ● Record Mode
      </button>
    </header>

    <aside class="panel-left">
      <div class="panel-hd">Assets — drag onto stage</div>
      <div class="upload-bar">
        <label class="btn primary" id="btnUploadLabel">
          ⬆ Upload image
          <input type="file" id="btnUpload" accept="image/*" multiple hidden />
        </label>
      </div>
      <div class="tabs" id="catTabs"></div>
      <div class="asset-grid" id="assetGrid"></div>
    </aside>

    <main class="stage-wrap" id="stageWrap">
      <div class="drop-hint">Drop asset here</div>
      <div class="stage-frame" id="stageFrame">
        <canvas id="stage"></canvas>
      </div>
      <div class="stage-meta" id="stageMeta"></div>
      <div class="record-hud" id="recordHud">
        <div class="timer-big" id="recordTimer">0:00.0</div>
        <div class="hint">Space play/pause · Esc exit · R restart</div>
      </div>
    </main>

    <aside class="panel-right">
      <div class="panel-hd">Inspector</div>
      <div class="props" id="props"></div>
    </aside>

    <footer class="timeline-dock">
      <div class="tl-toolbar">
        <button type="button" class="icon-btn" id="btnStop" title="Stop">⏹</button>
        <button type="button" class="icon-btn play" id="btnPlay" title="Play / Pause (Space)">▶</button>
        <div class="tl-timer" id="tlTimer"><span id="tCur">0:00.0</span> <span class="total">/ <span id="tTotal">0:00.0</span></span></div>
        <button type="button" class="btn" id="btnToStart">⏮ Start</button>
        <div class="spacer"></div>
        <label class="field" style="flex-direction:row;align-items:center;gap:8px;margin:0">
          <span style="font-size:11px;color:var(--text-mute);text-transform:uppercase;font-weight:600">Tail</span>
          <input type="number" id="tailPad" min="0" max="30" step="0.5" style="width:64px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:8px;padding:6px 8px" />
          <span style="font-size:12px;color:var(--text-mute)">s</span>
        </label>
        <label class="field" style="flex-direction:row;align-items:center;gap:8px;margin:0">
          <span style="font-size:11px;color:var(--text-mute);text-transform:uppercase;font-weight:600">Zoom</span>
          <input type="range" id="tlZoom" min="40" max="160" value="80" />
        </label>
      </div>
      <div class="tl-body">
        <div class="tl-labels" id="tlLabels"></div>
        <div class="tl-scroll" id="tlScroll">
          <div id="tlContent" style="position:relative">
            <div class="tl-ruler" id="tlRuler"></div>
            <div class="tl-tracks" id="tlTracks"></div>
            <div class="tl-playhead" id="tlPlayhead"></div>
          </div>
        </div>
      </div>
    </footer>
  </div>
`;

// ── Elements ───────────────────────────────────────────────

const studio = $('#studio');
const canvas = $('#stage') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const stageFrame = $('#stageFrame');
const stageWrap = $('#stageWrap');
const stageMeta = $('#stageMeta');
const propsEl = $('#props');
const assetGrid = $('#assetGrid');
const catTabs = $('#catTabs');
const projectName = $('#projectName') as HTMLInputElement;
const resSeg = $('#resSeg');
const tlLabels = $('#tlLabels');
const tlScroll = $('#tlScroll');
const tlRuler = $('#tlRuler');
const tlTracks = $('#tlTracks');
const tlPlayhead = $('#tlPlayhead');
const tlContent = $('#tlContent');
const tCur = $('#tCur');
const tTotal = $('#tTotal');
const recordTimer = $('#recordTimer');
const btnPlay = $('#btnPlay');
const tailPad = $('#tailPad') as HTMLInputElement;
const tlZoom = $('#tlZoom') as HTMLInputElement;

function $(sel: string): HTMLElement {
  return document.querySelector(sel)!;
}

// ── Library UI ─────────────────────────────────────────────

let activeCategory = 'all';

function renderCategoryTabs() {
  catTabs.innerHTML = '';
  const cats = [{ id: 'all', label: 'All' }, ...CATEGORIES];
  for (const c of cats) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tab' + (activeCategory === c.id ? ' active' : '');
    b.textContent = c.label;
    b.onclick = () => {
      activeCategory = c.id;
      renderCategoryTabs();
      renderAssetGrid();
    };
    catTabs.appendChild(b);
  }
}

function renderAssetGrid() {
  assetGrid.innerHTML = '';

  // Uploaded images
  const showUploads = activeCategory === 'all' || activeCategory === 'uploads';
  if (showUploads) {
    for (const img of store.customImages) {
      const card = document.createElement('div');
      card.className = 'asset-card';
      card.draggable = true;
      card.title = `Drag to stage: ${img.name}`;
      card.innerHTML = `
        <img class="thumb" src="${img.dataUrl}" alt="" draggable="false" />
        <span>${escapeHtml(img.name)}</span>
        <button type="button" class="rm" title="Remove upload">×</button>
      `;
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer?.setData('text/asset-id', `img:${img.id}`);
        e.dataTransfer!.effectAllowed = 'copy';
      });
      card.addEventListener('dblclick', () => {
        const res = RESOLUTIONS[store.state.project.resolution];
        store.addImageObject(img, res.width / 2, res.height / 2);
      });
      card.querySelector('.rm')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Remove “${img.name}” from uploads?`)) {
          store.removeCustomImage(img.id);
          renderAssetGrid();
        }
      });
      assetGrid.appendChild(card);
    }
  }

  if (activeCategory === 'uploads') {
    if (!store.customImages.length) {
      const empty = document.createElement('div');
      empty.className = 'prop-empty';
      empty.style.gridColumn = '1 / -1';
      empty.style.padding = '12px 4px';
      empty.textContent = 'Upload PNG/JPG/WebP images to draw them with a sketch reveal.';
      assetGrid.appendChild(empty);
    }
    return;
  }

  const list = ASSET_LIBRARY.filter(
    (a) => activeCategory === 'all' || a.category === activeCategory,
  );
  for (const asset of list) {
    const card = document.createElement('div');
    card.className = 'asset-card';
    card.draggable = true;
    card.title = `Drag to stage: ${asset.name}`;
    const preview = asset.isText
      ? `<svg viewBox="0 0 80 40"><text x="8" y="28" font-size="18" font-family="DM Sans,sans-serif" font-weight="600" fill="#c8d0e0">Aa</text></svg>`
      : `<svg viewBox="0 0 ${asset.vbW} ${asset.vbH}">${asset.strokes
          .map(
            (d) =>
              `<path d="${d}" fill="none" stroke="${asset.defaultColor || '#c8d0e0'}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
          )
          .join('')}</svg>`;
    card.innerHTML = `${preview}<span>${asset.name}</span>`;
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer?.setData('text/asset-id', asset.id);
      e.dataTransfer!.effectAllowed = 'copy';
    });
    card.addEventListener('dblclick', () => {
      const res = RESOLUTIONS[store.state.project.resolution];
      store.addObject(asset.id, res.width / 2, res.height / 2);
    });
    assetGrid.appendChild(card);
  }
}

// ── Stage layout / coordinate mapping ──────────────────────

function layoutStage() {
  const res = RESOLUTIONS[store.state.project.resolution];
  canvas.width = res.width;
  canvas.height = res.height;

  const wrap = stageWrap.getBoundingClientRect();
  const pad = store.state.recordMode ? 0 : 40;
  const availW = Math.max(100, wrap.width - pad);
  const availH = Math.max(100, wrap.height - pad);
  const scale = Math.min(availW / res.width, availH / res.height);
  store.state.viewScale = scale;

  const dispW = Math.round(res.width * scale);
  const dispH = Math.round(res.height * scale);
  stageFrame.style.width = `${dispW}px`;
  stageFrame.style.height = `${dispH}px`;

  stageMeta.textContent = `${res.width}×${res.height} · ${Math.round(scale * 100)}%`;
}

function clientToStage(clientX: number, clientY: number): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

// ── Render loop ────────────────────────────────────────────

function paint() {
  const { project, currentTime, selectedId, playing, recordMode } = store.state;
  // Layout mode: full artwork + selection chrome (easy positioning)
  // Preview/play: progressive draw + hand
  const layoutMode = !playing && currentTime <= 0.001 && !recordMode;
  const scrubPreview = !playing && currentTime > 0.001 && !recordMode;

  renderStage(ctx, project, currentTime, {
    selectedId: layoutMode || scrubPreview ? selectedId : null,
    layoutMode,
    showGuides: (layoutMode || scrubPreview) && !recordMode,
    showHand: !layoutMode,
  });

  updateTimerLabels();
  updatePlayhead();
  btnPlay.textContent = playing ? '⏸' : '▶';
}

function formatTime(t: number): string {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

function updateTimerLabels() {
  const d = store.duration;
  tCur.textContent = formatTime(store.state.currentTime);
  tTotal.textContent = formatTime(d);
  recordTimer.textContent = formatTime(store.state.currentTime);
}

// ── Inspector ──────────────────────────────────────────────

function renderProps() {
  const obj = store.selected;
  if (!obj) {
    propsEl.innerHTML = `
      <div class="prop-empty">
        Select an object on the stage or timeline to edit it.
      </div>
      <div class="help-box">
        <strong>Custom images</strong>
        Upload PNG/JPG/WebP (button or drop on stage). Images reveal with a brush path while the hand draws. Pick scan / wipe / spiral / radial in the inspector.
      </div>
      <div class="help-box">
        <strong>Recording for screen capture</strong>
        1. Build your scene by dragging assets<br/>
        2. Adjust draw timing on the timeline<br/>
        3. Click <em>Record Mode</em><br/>
        4. Capture this window with OBS / ShareX / etc.<br/>
        5. Press <kbd>Space</kbd> to play the animation
      </div>
      <div class="help-box">
        <strong>Shortcuts</strong>
        <kbd>Space</kbd> play/pause · <kbd>Delete</kbd> remove<br/>
        <kbd>R</kbd> restart · <kbd>Esc</kbd> exit record mode<br/>
        <kbd>Shift</kbd> + resize keeps aspect ratio<br/>
        Double-click asset to place at center
      </div>
    `;
    return;
  }

  const asset = getAsset(obj.assetId);
  const isImage = obj.kind === 'image' || !!obj.customImageId;
  const isText = obj.kind === 'text' || !!asset?.isText;
  const reveal = obj.revealStyle || 'scan';
  const brush = obj.brushSize ?? 0.14;

  propsEl.innerHTML = `
    <div class="field">
      <label>Name</label>
      <input type="text" id="pName" value="${escapeAttr(obj.name)}" />
    </div>
    ${
      isText
        ? `<div class="field">
            <label>Text</label>
            <textarea id="pText" rows="2">${escapeHtml(obj.text || '')}</textarea>
          </div>
          <div class="field">
            <label>Font size</label>
            <input type="number" id="pFont" min="12" max="200" value="${obj.fontSize || 36}" />
          </div>`
        : ''
    }
    ${
      isImage
        ? `<div class="field">
            <label>Reveal style</label>
            <select id="pReveal">
              <option value="scan" ${reveal === 'scan' ? 'selected' : ''}>Scan (zigzag)</option>
              <option value="wipe" ${reveal === 'wipe' ? 'selected' : ''}>Wipe</option>
              <option value="spiral" ${reveal === 'spiral' ? 'selected' : ''}>Spiral</option>
              <option value="radial" ${reveal === 'radial' ? 'selected' : ''}>Radial</option>
            </select>
          </div>
          <div class="field">
            <label>Brush size (${Math.round(brush * 100)}%)</label>
            <input type="range" id="pBrush" min="0.06" max="0.35" step="0.01" value="${brush}" />
          </div>`
        : ''
    }
    <div class="row2">
      <div class="field"><label>X</label><input type="number" id="pX" value="${Math.round(obj.x)}" /></div>
      <div class="field"><label>Y</label><input type="number" id="pY" value="${Math.round(obj.y)}" /></div>
    </div>
    <div class="row2">
      <div class="field"><label>Width</label><input type="number" id="pW" min="20" value="${Math.round(obj.w)}" /></div>
      <div class="field"><label>Height</label><input type="number" id="pH" min="20" value="${Math.round(obj.h)}" /></div>
    </div>
    <div class="row2">
      <div class="field"><label>Draw start (s)</label><input type="number" id="pStart" min="0" step="0.1" value="${obj.start.toFixed(1)}" /></div>
      <div class="field"><label>Draw duration (s)</label><input type="number" id="pDur" min="0.1" step="0.1" value="${obj.duration.toFixed(1)}" /></div>
    </div>
    ${
      !isImage
        ? `<div class="field">
            <label>Stroke color</label>
            <input type="color" id="pColor" value="${toHexColor(obj.color)}" />
          </div>`
        : ''
    }
    <label class="check-row">
      <input type="checkbox" id="pHand" ${obj.showHand !== false ? 'checked' : ''} />
      Show drawing hand
    </label>
    <div class="field">
      <label>Stage background</label>
      <input type="color" id="pBg" value="${toHexColor(store.state.project.background)}" />
    </div>
    <div class="field">
      <label>Hand size</label>
      <input type="range" id="pHandScale" min="0.5" max="2" step="0.05" value="${store.state.project.handScale ?? 1}" />
    </div>
    <button type="button" class="btn danger" id="pDelete" style="margin-top:4px">Delete object</button>
  `;

  const bindNum = (id: string, key: keyof typeof obj) => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    el?.addEventListener('change', () => {
      store.updateObject(obj.id, { [key]: parseFloat(el.value) } as never);
    });
  };

  bindNum('pX', 'x');
  bindNum('pY', 'y');
  bindNum('pW', 'w');
  bindNum('pH', 'h');
  bindNum('pStart', 'start');
  bindNum('pDur', 'duration');

  $('#pName')?.addEventListener('change', (e) => {
    store.updateObject(obj.id, { name: (e.target as HTMLInputElement).value });
  });
  document.getElementById('pText')?.addEventListener('input', (e) => {
    store.updateObject(obj.id, { text: (e.target as HTMLTextAreaElement).value });
  });
  document.getElementById('pFont')?.addEventListener('change', (e) => {
    store.updateObject(obj.id, { fontSize: parseFloat((e.target as HTMLInputElement).value) });
  });
  document.getElementById('pColor')?.addEventListener('input', (e) => {
    store.updateObject(obj.id, { color: (e.target as HTMLInputElement).value });
  });
  document.getElementById('pReveal')?.addEventListener('change', (e) => {
    store.updateObject(obj.id, {
      revealStyle: (e.target as HTMLSelectElement).value as RevealStyle,
    });
  });
  document.getElementById('pBrush')?.addEventListener('input', (e) => {
    const v = parseFloat((e.target as HTMLInputElement).value);
    store.updateObject(obj.id, { brushSize: v });
    const brushLabel = Array.from(propsEl.querySelectorAll('.field label')).find((el) =>
      el.textContent?.startsWith('Brush size'),
    );
    if (brushLabel) brushLabel.textContent = `Brush size (${Math.round(v * 100)}%)`;
  });
  document.getElementById('pHand')?.addEventListener('change', (e) => {
    store.updateObject(obj.id, { showHand: (e.target as HTMLInputElement).checked });
  });
  document.getElementById('pHandScale')?.addEventListener('input', (e) => {
    store.setHandScale(parseFloat((e.target as HTMLInputElement).value));
  });
  $('#pBg')?.addEventListener('input', (e) => {
    store.updateProject({ background: (e.target as HTMLInputElement).value });
  });
  $('#pDelete')?.addEventListener('click', () => store.deleteSelected());
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s: string) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}
function toHexColor(c: string): string {
  if (c.startsWith('#') && c.length >= 7) return c.slice(0, 7);
  // fallback map common
  return '#1a1a1a';
}

// ── Timeline ───────────────────────────────────────────────

function timelineWidth(): number {
  return Math.max(store.duration * store.state.timelineZoom + 80, tlScroll.clientWidth);
}

function renderTimeline() {
  const zoom = store.state.timelineZoom;
  const dur = store.duration;
  const width = timelineWidth();
  tlContent.style.width = `${width}px`;
  tlContent.style.minHeight = '100%';

  // Ruler ticks
  tlRuler.style.width = `${width}px`;
  tlRuler.innerHTML = '';
  const step = zoom >= 100 ? 0.5 : zoom >= 60 ? 1 : 2;
  for (let t = 0; t <= dur + 0.01; t += step) {
    const tick = document.createElement('div');
    tick.className = 'ruler-tick';
    tick.style.left = `${t * zoom}px`;
    tick.textContent = formatTime(t);
    tlRuler.appendChild(tick);
  }

  // Labels + tracks
  const objects = [...store.state.project.objects].sort((a, b) => a.start - b.start);
  tlLabels.innerHTML = '';
  tlTracks.innerHTML = '';
  tlTracks.style.width = `${width}px`;
  tlTracks.style.height = `${Math.max(objects.length, 1) * 36}px`;

  if (objects.length === 0) {
    tlTracks.innerHTML = `<div class="tl-empty">Add assets to see timeline clips</div>`;
  }

  for (const obj of objects) {
    const label = document.createElement('div');
    label.className = 'tl-label' + (obj.id === store.state.selectedId ? ' selected' : '');
    label.textContent = obj.name;
    label.onclick = () => store.select(obj.id);
    tlLabels.appendChild(label);

    const track = document.createElement('div');
    track.className = 'tl-track';
    const clip = document.createElement('div');
    clip.className = 'tl-clip' + (obj.id === store.state.selectedId ? ' selected' : '');
    clip.style.left = `${obj.start * zoom}px`;
    clip.style.width = `${Math.max(obj.duration * zoom, 16)}px`;
    clip.innerHTML = `<span>${obj.duration.toFixed(1)}s</span><div class="resize-e" data-resize="1"></div>`;
    clip.addEventListener('mousedown', (e) => onClipPointerDown(e, obj.id));
    track.appendChild(clip);
    tlTracks.appendChild(track);
  }

  updatePlayhead();
}

function updatePlayhead() {
  const x = store.state.currentTime * store.state.timelineZoom;
  tlPlayhead.style.left = `${x}px`;
  tlPlayhead.style.height = `${tlContent.scrollHeight || 100}px`;
}

function onClipPointerDown(e: MouseEvent, objectId: string) {
  e.preventDefault();
  e.stopPropagation();
  store.select(objectId);
  const obj = store.state.project.objects.find((o) => o.id === objectId);
  if (!obj) return;

  const isResize = (e.target as HTMLElement).dataset.resize === '1';
  const startX = e.clientX;
  const origStart = obj.start;
  const origDur = obj.duration;
  const zoom = store.state.timelineZoom;

  const onMove = (ev: MouseEvent) => {
    const dx = (ev.clientX - startX) / zoom;
    if (isResize) {
      store.updateObject(objectId, { duration: Math.max(0.2, origDur + dx) });
    } else {
      store.updateObject(objectId, { start: Math.max(0, origStart + dx) });
    }
  };
  const onUp = () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

// Scrub on ruler
tlRuler.addEventListener('pointerdown', (e) => {
  const scrub = (ev: PointerEvent) => {
    const rect = tlRuler.getBoundingClientRect();
    const x = ev.clientX - rect.left + tlScroll.scrollLeft;
    store.pause();
    store.setTime(x / store.state.timelineZoom);
  };
  scrub(e);
  const up = () => {
    window.removeEventListener('pointermove', scrub);
    window.removeEventListener('pointerup', up);
  };
  window.addEventListener('pointermove', scrub);
  window.addEventListener('pointerup', up);
});

// ── Stage interaction ──────────────────────────────────────

let dragMode: null | 'move' | 'resize' = null;
let resizeHandle: ResizeHandle | null = null;
let dragObjId: string | null = null;
let dragStart = { x: 0, y: 0 };
let orig = { x: 0, y: 0, w: 0, h: 0 };

canvas.addEventListener('pointerdown', (e) => {
  if (store.state.recordMode || store.state.playing) return;
  // Jump to layout mode for editing if mid-scrub
  if (store.state.currentTime > 0) {
    store.setTime(0);
  }

  const p = clientToStage(e.clientX, e.clientY);
  const selected = store.selected;
  if (selected) {
    const h = resizeHandleAt(selected, p.x, p.y);
    if (h) {
      dragMode = 'resize';
      resizeHandle = h;
      dragObjId = selected.id;
      dragStart = p;
      orig = { x: selected.x, y: selected.y, w: selected.w, h: selected.h };
      canvas.setPointerCapture(e.pointerId);
      return;
    }
  }

  const hit = hitTest(store.state.project, p.x, p.y);
  if (hit) {
    store.select(hit.id);
    dragMode = 'move';
    dragObjId = hit.id;
    dragStart = p;
    orig = { x: hit.x, y: hit.y, w: hit.w, h: hit.h };
    canvas.setPointerCapture(e.pointerId);
  } else {
    store.select(null);
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (!dragMode || !dragObjId) return;
  const p = clientToStage(e.clientX, e.clientY);
  const dx = p.x - dragStart.x;
  const dy = p.y - dragStart.y;
  const res = RESOLUTIONS[store.state.project.resolution];

  if (dragMode === 'move') {
    store.updateObject(dragObjId, {
      x: Math.max(0, Math.min(res.width - orig.w, orig.x + dx)),
      y: Math.max(0, Math.min(res.height - orig.h, orig.y + dy)),
    });
  } else if (dragMode === 'resize' && resizeHandle) {
    const minSize = 30;
    let { x, y, w, h } = orig;
    const aspect = orig.w / Math.max(orig.h, 0.001);
    const lockRatio = e.shiftKey;

    // Free resize first
    if (resizeHandle.includes('e')) w = Math.max(minSize, orig.w + dx);
    if (resizeHandle.includes('s')) h = Math.max(minSize, orig.h + dy);
    if (resizeHandle.includes('w')) {
      w = Math.max(minSize, orig.w - dx);
      x = orig.x + orig.w - w;
    }
    if (resizeHandle.includes('n')) {
      h = Math.max(minSize, orig.h - dy);
      y = orig.y + orig.h - h;
    }

    // Shift: keep original aspect ratio; anchor the opposite corner/edge
    if (lockRatio) {
      const fixedR = orig.x + orig.w;
      const fixedB = orig.y + orig.h;
      const fromW = Math.abs(w - orig.w) >= Math.abs(h - orig.h);

      if (fromW) {
        w = Math.max(minSize, w);
        h = Math.max(minSize, w / aspect);
      } else {
        h = Math.max(minSize, h);
        w = Math.max(minSize, h * aspect);
      }

      // Re-anchor based on which corner is dragged
      if (resizeHandle === 'se') {
        x = orig.x;
        y = orig.y;
      } else if (resizeHandle === 'sw') {
        x = fixedR - w;
        y = orig.y;
      } else if (resizeHandle === 'ne') {
        x = orig.x;
        y = fixedB - h;
      } else if (resizeHandle === 'nw') {
        x = fixedR - w;
        y = fixedB - h;
      }
    }

    store.updateObject(dragObjId, { x, y, w, h });
  }
});

canvas.addEventListener('pointerup', () => {
  dragMode = null;
  dragObjId = null;
  resizeHandle = null;
});

// Drop assets or image files
stageWrap.addEventListener('dragover', (e) => {
  e.preventDefault();
  stageWrap.classList.add('drag-over');
});
stageWrap.addEventListener('dragleave', () => stageWrap.classList.remove('drag-over'));
stageWrap.addEventListener('drop', async (e) => {
  e.preventDefault();
  stageWrap.classList.remove('drag-over');
  const p = clientToStage(e.clientX, e.clientY);

  // OS file drop
  if (e.dataTransfer?.files?.length) {
    const images = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (images.length) {
      await store.uploadImages(images);
      // Reposition last placed (upload centers first image) — place at drop point
      const last = store.state.project.objects[store.state.project.objects.length - 1];
      if (last?.kind === 'image') {
        store.updateObject(last.id, {
          x: Math.max(0, p.x - last.w / 2),
          y: Math.max(0, p.y - last.h / 2),
        });
      }
      renderAssetGrid();
      return;
    }
  }

  const assetId = e.dataTransfer?.getData('text/asset-id');
  if (!assetId) return;
  store.addObject(assetId, p.x, p.y);
});

// ── Top bar / controls ─────────────────────────────────────

projectName.value = store.state.project.name;
projectName.addEventListener('change', () => {
  store.updateProject({ name: projectName.value });
});

function syncResSeg() {
  resSeg.querySelectorAll('button').forEach((b) => {
    b.classList.toggle('active', b.getAttribute('data-res') === store.state.project.resolution);
  });
}
resSeg.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('button');
  const res = btn?.getAttribute('data-res') as ResolutionId | null;
  if (!res) return;
  store.setResolution(res);
  layoutStage();
  syncResSeg();
});

$('#btnSave').onclick = () => {
  store.saveLocal();
  const b = $('#btnSave');
  const t = b.textContent;
  b.textContent = 'Saved ✓';
  setTimeout(() => (b.textContent = t), 1200);
};
$('#btnExport').onclick = () => store.exportJson();
$('#btnImport').addEventListener('change', (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (f) {
    store.importJson(f);
    // re-render library after import loads
    setTimeout(() => {
      renderAssetGrid();
      syncHandSelect();
    }, 50);
  }
  (e.target as HTMLInputElement).value = '';
});

$('#btnUpload').addEventListener('change', async (e) => {
  const input = e.target as HTMLInputElement;
  if (input.files?.length) {
    await store.uploadImages(input.files);
    activeCategory = 'uploads';
    renderCategoryTabs();
    renderAssetGrid();
  }
  input.value = '';
});

const handStyleSel = $('#handStyle') as HTMLSelectElement;
function syncHandSelect() {
  handStyleSel.value = store.state.project.handStyle ?? 'pen';
}
handStyleSel.addEventListener('change', () => {
  store.setHandStyle(handStyleSel.value as HandStyle);
});

$('#btnRecord').onclick = () => {
  store.enterRecordMode();
  studio.classList.add('record-mode');
  layoutStage();
  paint();
};

btnPlay.onclick = () => store.togglePlay();
$('#btnStop').onclick = () => store.stop();
$('#btnToStart').onclick = () => {
  store.pause();
  store.setTime(0);
};

tailPad.value = String(store.state.project.tailPadding);
tailPad.addEventListener('change', () => {
  store.updateProject({ tailPadding: Math.max(0, parseFloat(tailPad.value) || 0) });
  renderTimeline();
});

tlZoom.addEventListener('input', () => {
  store.state.timelineZoom = parseFloat(tlZoom.value);
  renderTimeline();
});

// Keyboard
window.addEventListener('keydown', (e) => {
  const tag = (e.target as HTMLElement)?.tagName;
  const typing = tag === 'INPUT' || tag === 'TEXTAREA';

  if (e.code === 'Space' && !typing) {
    e.preventDefault();
    store.togglePlay();
  }
  if (e.code === 'Escape' && store.state.recordMode) {
    store.exitRecordMode();
    studio.classList.remove('record-mode');
    layoutStage();
  }
  if ((e.key === 'Delete' || e.key === 'Backspace') && !typing && !store.state.recordMode) {
    store.deleteSelected();
  }
  if ((e.key === 'r' || e.key === 'R') && !typing) {
    store.pause();
    store.setTime(0);
    if (store.state.recordMode) {
      // ready for next take
    }
  }
  if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    store.saveLocal();
  }
});

// ── Subscribe & boot ───────────────────────────────────────

let propsDirty = true;
let lastSelected: string | null = null;
let lastObjSig = '';
let lastImgCount = -1;

store.subscribe(() => {
  const s = store.state;
  if (s.recordMode) studio.classList.add('record-mode');
  else studio.classList.remove('record-mode');

  if (projectName.value !== s.project.name && document.activeElement !== projectName) {
    projectName.value = s.project.name;
  }
  if (tailPad.value !== String(s.project.tailPadding) && document.activeElement !== tailPad) {
    tailPad.value = String(s.project.tailPadding);
  }

  const imgCount = s.project.customImages?.length ?? 0;
  if (imgCount !== lastImgCount) {
    lastImgCount = imgCount;
    renderAssetGrid();
    // Ensure images are decoded then repaint
    const urls = (s.project.customImages ?? []).map((c) => c.dataUrl);
    preloadImages(urls);
    Promise.all(urls.map((u) => loadImage(u).catch(() => null))).then(() => paint());
  }

  const sig = s.project.objects
    .map(
      (o) =>
        `${o.id}:${o.start}:${o.duration}:${o.name}:${o.revealStyle}:${o.brushSize}:${o.showHand}`,
    )
    .join('|');
  const selectionChanged = s.selectedId !== lastSelected;
  if (sig !== lastObjSig || selectionChanged) {
    lastObjSig = sig;
    lastSelected = s.selectedId;
    renderTimeline();
    propsDirty = true;
  }
  if (propsDirty) {
    if (selectionChanged || !propsEl.contains(document.activeElement)) {
      renderProps();
      propsDirty = false;
    }
  }

  paint();
});

window.addEventListener('resize', () => {
  layoutStage();
  paint();
  renderTimeline();
});

// Try load saved project
store.loadLocal();

renderCategoryTabs();
renderAssetGrid();
syncResSeg();
syncHandSelect();
layoutStage();
renderTimeline();
renderProps();
paint();

// Preload any restored images then repaint
Promise.all(
  (store.state.project.customImages ?? []).map((c) => loadImage(c.dataUrl).catch(() => null)),
).then(() => paint());

// Auto-save lightly
setInterval(() => store.saveLocal(), 30000);

console.info(
  '%cSketch Studio%c ready — drag assets, set timing, Record Mode for capture.',
  'color:#5b8cff;font-weight:bold',
  'color:inherit',
);

// Export duration helper for debugging
void projectDuration;
