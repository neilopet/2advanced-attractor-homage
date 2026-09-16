import { withBasePath } from './base-path.ts';

export const worlds = [
  {
    id: 'blue',
    scene: {
      src: withBasePath('/scenes/blue-remaster.webp'),
      width: 1954,
      height: 805,
    },
    name: 'Blue Aztec',
    title: 'The arrival',
    accent: '#51bcec',
    rgb: '81,188,236',
    code: '01',
    description:
      'A luminous stepped pyramid across a moonlit lake, surrounded by mountains and a distant city.',
  },
  {
    id: 'green',
    scene: {
      src: withBasePath('/scenes/green-remaster.webp'),
      width: 2027,
      height: 776,
    },
    name: 'Green Aztec',
    title: 'The living world',
    accent: '#a4c778',
    rgb: '164,199,120',
    code: '02',
    description:
      'Sunlight over a green valley, ancient stone temples, and a winding river.',
  },
  {
    id: 'yellow',
    scene: {
      src: withBasePath('/scenes/yellow-remaster.webp'),
      width: 2001,
      height: 786,
    },
    name: 'Yellow Aztec',
    title: 'The golden age',
    accent: '#eac17b',
    rgb: '234,193,123',
    code: '03',
    description:
      'A monumental industrial skyline in golden haze beneath an amber sky.',
  },
  {
    id: 'red',
    scene: {
      src: withBasePath('/scenes/red-remaster.webp'),
      width: 2008,
      height: 783,
    },
    name: 'Red Aztec',
    title: 'The furnace',
    accent: '#ec6840',
    rgb: '236,104,64',
    code: '04',
    description:
      'Dark volcanic mountains, glowing lava, and a stepped temple in a fiery landscape.',
  },
  {
    id: 'pink',
    scene: {
      src: withBasePath('/scenes/pink-remaster.webp'),
      width: 1954,
      height: 805,
    },
    name: 'Pink Aztec',
    title: 'The quiet garden',
    accent: '#dc97ca',
    rgb: '220,151,202',
    code: '05',
    description:
      'A tranquil Japanese garden, cherry blossoms, water, and a distant mountain.',
  },
  {
    id: 'white',
    scene: {
      src: withBasePath('/scenes/white-remaster.webp'),
      width: 1954,
      height: 805,
    },
    name: 'White Aztec',
    title: 'The silent frontier',
    accent: '#d3e8ee',
    rgb: '211,232,238',
    code: '06',
    description:
      'An icy mountain valley and futuristic architecture surrounded by snowy evergreens.',
  },
] as const;
export type WorldId = (typeof worlds)[number]['id'];
export type Journey = {
  current: WorldId;
  target: WorldId | null;
  phase: 'idle' | 'closing' | 'covered' | 'opening';
};
export type JourneyAction =
  | { type: 'select'; target: WorldId; immediate?: boolean }
  | { type: 'closed' | 'reveal' | 'opened' | 'recover' };
export const initialJourney: Journey = {
  current: 'blue',
  target: null,
  phase: 'idle',
};
export function journeyReducer(state: Journey, action: JourneyAction): Journey {
  switch (action.type) {
    case 'select':
      if (state.phase !== 'idle' || state.current === action.target)
        return state;
      return action.immediate
        ? { current: action.target, target: null, phase: 'idle' }
        : { ...state, target: action.target, phase: 'closing' };
    case 'closed':
      return state.phase === 'closing' && state.target
        ? { ...state, current: state.target, phase: 'covered' }
        : state;
    case 'reveal':
      return state.phase === 'covered' ? { ...state, phase: 'opening' } : state;
    case 'opened':
      return state.phase === 'opening'
        ? { ...state, target: null, phase: 'idle' }
        : state;
    case 'recover':
      return { ...state, target: null, phase: 'idle' };
  }
}
