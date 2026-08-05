import { renderHandStyleSheet } from './engine/hand';

const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
renderHandStyleSheet(ctx, canvas.width, canvas.height);

// Expose for automated screenshot tools
(window as unknown as { __handsReady: boolean }).__handsReady = true;
