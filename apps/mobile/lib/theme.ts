export const lightTheme = {
  scheme: 'light' as const,
  statusBar: 'dark' as const,

  // Backgrounds
  background:    '#f7f9fb',
  surface:       '#f0f4f7',
  card:          '#ffffff',
  overlay:       '#e8eff3',
  inputBg:       '#f0f4f7',
  tabBar:        '#ffffff',
  headerBg:      'rgba(255,255,255,0.92)',
  modalBg:       '#ffffff',
  modalOverlay:  'rgba(42,52,57,0.4)',

  // Text
  text:          '#2a3439',
  textMuted:     '#566166',
  textSubtle:    '#a9b4b9',
  textOnPrimary: '#ffffff',

  // Primary
  primary:          '#4d44e3',
  primaryDim:       '#4034d7',
  primaryContainer: '#e2dfff',
  textOnPrimaryContainer: '#3f33d6',

  // Status chips
  todoBg:        '#f0f4f7',
  todoText:      '#566166',
  inProgressBg:  '#e2dfff',
  inProgressText:'#4d44e3',
  doneBg:        '#d9e4ea',
  doneText:      '#2a3439',

  // Misc
  divider:       '#f0f4f7',
  danger:        '#9e3f4e',
  dangerBg:      '#fff0f2',
  chipBg:        '#e2dfff',
  chipText:      '#4d44e3',

  // Shadows
  shadow:        '#2a3439',
};

export const darkTheme = {
  scheme: 'dark' as const,
  statusBar: 'light' as const,

  background:    '#0f0e17',
  surface:       '#1a1928',
  card:          '#22213a',
  overlay:       '#2c2b47',
  inputBg:       '#2c2b47',
  tabBar:        '#16152a',
  headerBg:      'rgba(22,21,42,0.92)',
  modalBg:       '#1a1928',
  modalOverlay:  'rgba(0,0,0,0.6)',

  text:          '#f0effe',
  textMuted:     '#9895c8',
  textSubtle:    '#5e5a8a',
  textOnPrimary: '#ffffff',

  primary:          '#6c64f5',
  primaryDim:       '#4d44e3',
  primaryContainer: '#2a2660',
  textOnPrimaryContainer: '#c4bfff',

  todoBg:        '#2c2b47',
  todoText:      '#9895c8',
  inProgressBg:  '#2a2660',
  inProgressText:'#8582ff',
  doneBg:        '#1e2a30',
  doneText:      '#9895c8',

  divider:       '#2c2b47',
  danger:        '#f87171',
  dangerBg:      '#2d1a1a',
  chipBg:        '#2a2660',
  chipText:      '#8582ff',

  shadow:        '#000000',
};

export type Theme = typeof lightTheme;
