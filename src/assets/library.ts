import type { AssetCategory, AssetDef } from '../types';
import { ASSET_PACK } from './library-pack';

/** Built-in doodle-style SVG path library for whiteboard scenes */
export const ASSET_LIBRARY: AssetDef[] = [
  // —— People ——
  {
    id: 'person-stick',
    name: 'Stick Person',
    category: 'people',
    vbW: 100,
    vbH: 160,
    defaultW: 120,
    defaultH: 192,
    strokes: [
      'M 50 22 m -16 0 a 16 16 0 1 0 32 0 a 16 16 0 1 0 -32 0',
      'M 50 40 L 50 100',
      'M 50 55 L 22 80',
      'M 50 55 L 78 80',
      'M 50 100 L 28 145',
      'M 50 100 L 72 145',
    ],
    defaultColor: '#1a1a1a',
  },
  {
    id: 'person-wave',
    name: 'Person Waving',
    category: 'people',
    vbW: 120,
    vbH: 160,
    defaultW: 140,
    defaultH: 186,
    strokes: [
      'M 50 22 m -16 0 a 16 16 0 1 0 32 0 a 16 16 0 1 0 -32 0',
      'M 50 40 L 50 100',
      'M 50 55 L 22 85',
      'M 50 55 L 78 40 L 95 22',
      'M 50 100 L 28 145',
      'M 50 100 L 72 145',
    ],
    defaultColor: '#1a1a1a',
  },
  {
    id: 'person-think',
    name: 'Person Thinking',
    category: 'people',
    vbW: 120,
    vbH: 160,
    defaultW: 140,
    defaultH: 186,
    strokes: [
      'M 50 22 m -16 0 a 16 16 0 1 0 32 0 a 16 16 0 1 0 -32 0',
      'M 50 40 L 50 100',
      'M 50 55 L 28 78',
      'M 50 55 L 80 48 L 92 28',
      'M 50 100 L 28 145',
      'M 50 100 L 72 145',
      'M 100 18 Q 108 10 116 18',
      'M 108 28 Q 116 22 122 30',
    ],
    defaultColor: '#1a1a1a',
  },
  {
    id: 'group-two',
    name: 'Two People',
    category: 'people',
    vbW: 140,
    vbH: 140,
    defaultW: 200,
    defaultH: 200,
    strokes: [
      'M 40 28 m -12 0 a 12 12 0 1 0 24 0 a 12 12 0 1 0 -24 0',
      'M 40 42 L 40 90',
      'M 40 55 L 20 75',
      'M 40 55 L 58 72',
      'M 40 90 L 25 125',
      'M 40 90 L 55 125',
      'M 100 28 m -12 0 a 12 12 0 1 0 24 0 a 12 12 0 1 0 -24 0',
      'M 100 42 L 100 90',
      'M 100 55 L 82 72',
      'M 100 55 L 120 75',
      'M 100 90 L 85 125',
      'M 100 90 L 115 125',
    ],
    defaultColor: '#1a1a1a',
  },
  {
    id: 'person-desk',
    name: 'Person at Desk',
    category: 'people',
    vbW: 160,
    vbH: 140,
    defaultW: 260,
    defaultH: 228,
    strokes: [
      // Head
      'M 55 18 m -12 0 a 12 12 0 1 0 24 0 a 12 12 0 1 0 -24 0',
      // Torso
      'M 55 30 L 55 62',
      // Arms to keyboard
      'M 55 42 L 32 58 L 28 72',
      'M 55 42 L 78 58 L 88 70',
      // Chair seat + back
      'M 28 78 L 82 78',
      'M 30 78 L 30 108',
      'M 28 78 L 22 108',
      'M 82 78 L 88 108',
      // Legs under desk
      'M 48 78 L 42 108',
      'M 62 78 L 68 108',
      // Desk top
      'M 8 72 L 152 72',
      // Desk legs
      'M 14 72 L 14 128',
      'M 146 72 L 146 128',
      // Monitor
      'M 95 28 L 145 28 L 145 62 L 95 62 Z',
      'M 120 62 L 120 72',
      'M 108 72 L 132 72',
      // Screen line
      'M 102 38 L 138 38',
      'M 102 48 L 130 48',
      // Keyboard
      'M 35 68 L 85 68 L 85 74 L 35 74 Z',
      // Mouse
      'M 92 70 m -4 0 a 4 3 0 1 0 8 0 a 4 3 0 1 0 -8 0',
    ],
    defaultColor: '#1a1a1a',
  },
  {
    id: 'fox-male',
    name: 'Male Fox',
    category: 'people',
    vbW: 120,
    vbH: 150,
    defaultW: 160,
    defaultH: 200,
    strokes: [
      // Head
      'M 60 28 m -20 0 a 20 18 0 1 0 40 0 a 20 18 0 1 0 -40 0',
      // Ears (pointy)
      'M 42 18 L 36 2 L 52 14',
      'M 78 18 L 84 2 L 68 14',
      // Inner ears
      'M 42 14 L 40 6 L 48 12',
      'M 78 14 L 80 6 L 72 12',
      // Snout
      'M 60 32 L 52 42 L 60 46 L 68 42 Z',
      // Nose
      'M 60 42 m -3 0 a 3 2.5 0 1 0 6 0 a 3 2.5 0 1 0 -6 0',
      // Eyes
      'M 50 26 m -3 0 a 3 3.5 0 1 0 6 0 a 3 3.5 0 1 0 -6 0',
      'M 70 26 m -3 0 a 3 3.5 0 1 0 6 0 a 3 3.5 0 1 0 -6 0',
      // Smile
      'M 52 48 Q 60 54 68 48',
      // Body
      'M 60 46 L 60 95',
      // Arms
      'M 60 58 L 38 78',
      'M 60 58 L 82 78',
      // Legs
      'M 60 95 L 42 130',
      'M 60 95 L 78 130',
      // Feet
      'M 36 130 L 48 130',
      'M 72 130 L 84 130',
      // Bushy tail
      'M 60 88 Q 95 70 105 45 Q 100 75 85 95 Q 70 105 60 95',
      // Chest fluff
      'M 54 55 Q 60 62 66 55',
    ],
    defaultColor: '#c45c26',
  },

  // —— Concepts ——
  {
    id: 'lightbulb',
    name: 'Idea / Bulb',
    category: 'concepts',
    vbW: 80,
    vbH: 110,
    defaultW: 110,
    defaultH: 150,
    strokes: [
      'M 40 8 C 22 8 12 24 12 40 C 12 52 18 60 26 66 L 26 78 L 54 78 L 54 66 C 62 60 68 52 68 40 C 68 24 58 8 40 8 Z',
      'M 30 86 L 50 86',
      'M 32 94 L 48 94',
      'M 34 102 L 46 102',
      'M 40 8 L 40 0',
      'M 58 14 L 68 4',
      'M 68 40 L 78 40',
      'M 22 14 L 12 4',
      'M 12 40 L 2 40',
    ],
    defaultColor: '#c9a227',
  },
  {
    id: 'heart',
    name: 'Heart',
    category: 'concepts',
    vbW: 100,
    vbH: 90,
    defaultW: 130,
    defaultH: 117,
    strokes: [
      'M 50 80 C 20 55 8 35 20 20 C 30 8 45 12 50 28 C 55 12 70 8 80 20 C 92 35 80 55 50 80 Z',
    ],
    fills: ['M 50 80 C 20 55 8 35 20 20 C 30 8 45 12 50 28 C 55 12 70 8 80 20 C 92 35 80 55 50 80 Z'],
    defaultColor: '#c0392b',
    defaultFill: 'rgba(231, 76, 60, 0.25)',
  },
  {
    id: 'star',
    name: 'Star',
    category: 'concepts',
    vbW: 100,
    vbH: 100,
    defaultW: 120,
    defaultH: 120,
    strokes: [
      'M 50 5 L 61 38 L 95 38 L 68 58 L 78 92 L 50 72 L 22 92 L 32 58 L 5 38 L 39 38 Z',
    ],
    fills: ['M 50 5 L 61 38 L 95 38 L 68 58 L 78 92 L 50 72 L 22 92 L 32 58 L 5 38 L 39 38 Z'],
    defaultColor: '#d4a017',
    defaultFill: 'rgba(241, 196, 15, 0.3)',
  },
  {
    id: 'cloud',
    name: 'Cloud',
    category: 'concepts',
    vbW: 140,
    vbH: 80,
    defaultW: 200,
    defaultH: 114,
    strokes: [
      'M 35 60 C 15 60 8 45 18 32 C 12 18 28 8 42 16 C 50 6 70 6 80 18 C 95 12 115 20 112 40 C 128 42 132 60 115 65 L 40 65 C 38 65 36 63 35 60 Z',
    ],
    defaultColor: '#2c3e50',
  },
  {
    id: 'gear',
    name: 'Gear / Process',
    category: 'concepts',
    vbW: 100,
    vbH: 100,
    defaultW: 130,
    defaultH: 130,
    strokes: [
      'M 50 12 L 56 22 L 68 18 L 72 30 L 84 32 L 82 44 L 92 50 L 82 56 L 84 68 L 72 70 L 68 82 L 56 78 L 50 88 L 44 78 L 32 82 L 28 70 L 16 68 L 18 56 L 8 50 L 18 44 L 16 32 L 28 30 L 32 18 L 44 22 Z',
      'M 50 50 m -14 0 a 14 14 0 1 0 28 0 a 14 14 0 1 0 -28 0',
    ],
    defaultColor: '#34495e',
  },
  {
    id: 'chat',
    name: 'Chat Bubble',
    category: 'concepts',
    vbW: 120,
    vbH: 100,
    defaultW: 170,
    defaultH: 140,
    strokes: [
      'M 20 15 L 100 15 Q 110 15 110 25 L 110 55 Q 110 65 100 65 L 45 65 L 28 85 L 32 65 L 20 65 Q 10 65 10 55 L 10 25 Q 10 15 20 15 Z',
      'M 30 35 L 70 35',
      'M 30 48 L 55 48',
    ],
    defaultColor: '#2980b9',
  },
  {
    id: 'target',
    name: 'Target / Goal',
    category: 'concepts',
    vbW: 100,
    vbH: 100,
    defaultW: 140,
    defaultH: 140,
    strokes: [
      'M 50 8 m -42 0 a 42 42 0 1 0 84 0 a 42 42 0 1 0 -84 0',
      'M 50 22 m -28 0 a 28 28 0 1 0 56 0 a 28 28 0 1 0 -56 0',
      'M 50 36 m -14 0 a 14 14 0 1 0 28 0 a 14 14 0 1 0 -28 0',
      'M 50 50 L 88 18',
    ],
    defaultColor: '#c0392b',
  },
  {
    id: 'money',
    name: 'Money Bill',
    category: 'concepts',
    vbW: 120,
    vbH: 70,
    defaultW: 180,
    defaultH: 105,
    strokes: [
      'M 10 10 L 110 10 L 110 60 L 10 60 Z',
      'M 60 20 m -12 0 a 12 12 0 1 0 24 0 a 12 12 0 1 0 -24 0',
      'M 60 28 L 60 42',
      'M 54 32 Q 60 28 66 32',
      'M 54 40 Q 60 44 66 40',
    ],
    defaultColor: '#27ae60',
  },
  {
    id: 'money-stack',
    name: 'Money Stack',
    category: 'concepts',
    vbW: 130,
    vbH: 90,
    defaultW: 190,
    defaultH: 132,
    strokes: [
      // Bottom bill
      'M 15 55 L 115 55 L 115 80 L 15 80 Z',
      // Middle bill
      'M 12 38 L 112 38 L 112 63 L 12 63 Z',
      // Top bill
      'M 10 20 L 110 20 L 110 48 L 10 48 Z',
      // $ on top
      'M 60 28 L 60 40',
      'M 54 31 Q 60 26 66 31',
      'M 54 37 Q 60 42 66 37',
      // Corner marks
      'M 18 26 L 28 26 L 28 36',
      'M 102 26 L 92 26 L 92 36',
    ],
    defaultColor: '#219a52',
  },
  {
    id: 'gold-bar',
    name: 'Gold Bar',
    category: 'concepts',
    vbW: 130,
    vbH: 80,
    defaultW: 200,
    defaultH: 123,
    strokes: [
      // Top face
      'M 25 22 L 95 22 L 115 38 L 45 38 Z',
      // Front face
      'M 25 22 L 45 38 L 45 68 L 25 52 Z',
      // Side face
      'M 45 38 L 115 38 L 115 68 L 45 68 Z',
      // Ingot stamp
      'M 58 48 L 100 48 L 100 58 L 58 58 Z',
      'M 70 50 L 70 56',
      'M 78 50 L 78 56',
      'M 86 50 L 86 56',
    ],
    fills: [
      'M 25 22 L 95 22 L 115 38 L 45 38 Z',
      'M 45 38 L 115 38 L 115 68 L 45 68 Z',
    ],
    defaultColor: '#b8860b',
    defaultFill: 'rgba(241, 196, 15, 0.28)',
  },
  {
    id: 'silver-bar',
    name: 'Silver Bar',
    category: 'concepts',
    vbW: 130,
    vbH: 80,
    defaultW: 200,
    defaultH: 123,
    strokes: [
      // Top face
      'M 25 22 L 95 22 L 115 38 L 45 38 Z',
      // Front face
      'M 25 22 L 45 38 L 45 68 L 25 52 Z',
      // Side face
      'M 45 38 L 115 38 L 115 68 L 45 68 Z',
      // Ingot stamp
      'M 58 48 L 100 48 L 100 58 L 58 58 Z',
      'M 68 53 L 90 53',
      // Shine lines on top
      'M 40 28 L 70 28',
      'M 50 32 L 85 32',
    ],
    fills: [
      'M 25 22 L 95 22 L 115 38 L 45 38 Z',
      'M 45 38 L 115 38 L 115 68 L 45 68 Z',
    ],
    defaultColor: '#5d6d7e',
    defaultFill: 'rgba(189, 195, 199, 0.35)',
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    category: 'concepts',
    vbW: 100,
    vbH: 100,
    defaultW: 140,
    defaultH: 140,
    strokes: [
      // Circle
      'M 50 8 m -38 0 a 38 38 0 1 0 76 0 a 38 38 0 1 0 -76 0',
      // Outer ring hint
      'M 50 14 m -32 0 a 32 32 0 1 0 64 0 a 32 32 0 1 0 -64 0',
      // B vertical
      'M 40 30 L 40 70',
      // B top bowl
      'M 40 30 L 55 30 Q 68 30 68 40 Q 68 50 55 50 L 40 50',
      // B bottom bowl
      'M 40 50 L 58 50 Q 72 50 72 60 Q 72 70 58 70 L 40 70',
      // Top serifs / ticks
      'M 46 24 L 46 30',
      'M 54 24 L 54 30',
      // Bottom serifs
      'M 46 70 L 46 76',
      'M 54 70 L 54 76',
    ],
    defaultColor: '#f7931a',
  },
  {
    id: 'rocket',
    name: 'Rocket / Launch',
    category: 'concepts',
    vbW: 80,
    vbH: 120,
    defaultW: 100,
    defaultH: 150,
    strokes: [
      'M 40 8 C 55 30 58 55 55 80 L 25 80 C 22 55 25 30 40 8 Z',
      'M 40 45 m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0',
      'M 25 70 L 12 95 L 28 85',
      'M 55 70 L 68 95 L 52 85',
      'M 32 80 L 28 105 L 40 92 L 52 105 L 48 80',
    ],
    defaultColor: '#8e44ad',
  },
  {
    id: 'check',
    name: 'Checkmark',
    category: 'concepts',
    vbW: 100,
    vbH: 100,
    defaultW: 100,
    defaultH: 100,
    strokes: [
      'M 50 8 m -40 0 a 40 40 0 1 0 80 0 a 40 40 0 1 0 -80 0',
      'M 28 50 L 44 66 L 74 34',
    ],
    defaultColor: '#27ae60',
  },
  {
    id: 'cross',
    name: 'Cross / No',
    category: 'concepts',
    vbW: 100,
    vbH: 100,
    defaultW: 100,
    defaultH: 100,
    strokes: [
      'M 50 8 m -40 0 a 40 40 0 1 0 80 0 a 40 40 0 1 0 -80 0',
      'M 32 32 L 68 68',
      'M 68 32 L 32 68',
    ],
    defaultColor: '#c0392b',
  },

  // —— Shapes ——
  {
    id: 'rect',
    name: 'Rectangle',
    category: 'shapes',
    vbW: 120,
    vbH: 80,
    defaultW: 200,
    defaultH: 130,
    strokes: ['M 8 8 L 112 8 L 112 72 L 8 72 Z'],
    fills: ['M 8 8 L 112 8 L 112 72 L 8 72 Z'],
    defaultColor: '#2c3e50',
    defaultFill: 'rgba(52, 152, 219, 0.12)',
  },
  {
    id: 'circle',
    name: 'Circle',
    category: 'shapes',
    vbW: 100,
    vbH: 100,
    defaultW: 140,
    defaultH: 140,
    strokes: ['M 50 8 m -40 0 a 40 40 0 1 0 80 0 a 40 40 0 1 0 -80 0'],
    fills: ['M 50 8 m -40 0 a 40 40 0 1 0 80 0 a 40 40 0 1 0 -80 0'],
    defaultColor: '#2c3e50',
    defaultFill: 'rgba(155, 89, 182, 0.12)',
  },
  {
    id: 'triangle',
    name: 'Triangle',
    category: 'shapes',
    vbW: 100,
    vbH: 90,
    defaultW: 140,
    defaultH: 126,
    strokes: ['M 50 8 L 92 82 L 8 82 Z'],
    fills: ['M 50 8 L 92 82 L 8 82 Z'],
    defaultColor: '#2c3e50',
    defaultFill: 'rgba(46, 204, 113, 0.12)',
  },
  {
    id: 'rounded-box',
    name: 'Rounded Box',
    category: 'shapes',
    vbW: 140,
    vbH: 90,
    defaultW: 220,
    defaultH: 140,
    strokes: [
      'M 20 8 L 120 8 Q 132 8 132 20 L 132 70 Q 132 82 120 82 L 20 82 Q 8 82 8 70 L 8 20 Q 8 8 20 8 Z',
    ],
    fills: [
      'M 20 8 L 120 8 Q 132 8 132 20 L 132 70 Q 132 82 120 82 L 20 82 Q 8 82 8 70 L 8 20 Q 8 8 20 8 Z',
    ],
    defaultColor: '#2c3e50',
    defaultFill: 'rgba(241, 196, 15, 0.1)',
  },
  {
    id: 'line',
    name: 'Line',
    category: 'shapes',
    vbW: 120,
    vbH: 20,
    defaultW: 240,
    defaultH: 40,
    strokes: ['M 8 10 L 112 10'],
    defaultColor: '#1a1a1a',
  },

  // —— Arrows ——
  {
    id: 'arrow-right',
    name: 'Arrow Right',
    category: 'arrows',
    vbW: 120,
    vbH: 40,
    defaultW: 200,
    defaultH: 66,
    strokes: ['M 8 20 L 95 20', 'M 80 8 L 112 20 L 80 32'],
    defaultColor: '#1a1a1a',
  },
  {
    id: 'arrow-down',
    name: 'Arrow Down',
    category: 'arrows',
    vbW: 40,
    vbH: 120,
    defaultW: 66,
    defaultH: 200,
    strokes: ['M 20 8 L 20 95', 'M 8 80 L 20 112 L 32 80'],
    defaultColor: '#1a1a1a',
  },
  {
    id: 'arrow-bidir',
    name: 'Double Arrow',
    category: 'arrows',
    vbW: 140,
    vbH: 40,
    defaultW: 220,
    defaultH: 62,
    strokes: ['M 25 20 L 115 20', 'M 25 8 L 8 20 L 25 32', 'M 115 8 L 132 20 L 115 32'],
    defaultColor: '#1a1a1a',
  },
  {
    id: 'curved-arrow',
    name: 'Curved Arrow',
    category: 'arrows',
    vbW: 100,
    vbH: 80,
    defaultW: 160,
    defaultH: 128,
    strokes: ['M 15 65 Q 15 15 70 15', 'M 55 5 L 78 15 L 55 28'],
    defaultColor: '#1a1a1a',
  },

  // —— Text ——
  {
    id: 'text-label',
    name: 'Text Label',
    category: 'text',
    vbW: 200,
    vbH: 50,
    defaultW: 280,
    defaultH: 70,
    strokes: [],
    isText: true,
    defaultColor: '#1a1a1a',
  },
  {
    id: 'text-title',
    name: 'Title Text',
    category: 'text',
    vbW: 300,
    vbH: 70,
    defaultW: 480,
    defaultH: 100,
    strokes: [],
    isText: true,
    defaultColor: '#1a1a1a',
  },

  // Expanded pack (people, business, tech, finance, education, arrows…)
  ...ASSET_PACK,
];

export function getAsset(id: string): AssetDef | undefined {
  return ASSET_LIBRARY.find((a) => a.id === id);
}

export const CATEGORIES: { id: AssetCategory; label: string }[] = [
  { id: 'people', label: 'People' },
  { id: 'concepts', label: 'Concepts' },
  { id: 'shapes', label: 'Shapes' },
  { id: 'arrows', label: 'Arrows' },
  { id: 'text', label: 'Text' },
  { id: 'uploads', label: 'Uploads' },
];
