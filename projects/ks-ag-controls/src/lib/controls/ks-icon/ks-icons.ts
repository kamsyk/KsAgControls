// Google Material icons (Apache-2.0). Save: Material Symbols Outlined, weight 400,
// @material-symbols/svg-400 0.47.6. Other icons: Material Icons.
export const KS_ICONS = {
  save: {
    viewBox: '0 -960 960 960',
    path: 'M840-683v503q0 24-18 42t-42 18H180q-24 0-42-18t-18-42v-600q0-24 18-42t42-18h503l157 157Zm-60 27L656-780H180v600h600v-476ZM553.5-275.26q30.5-30.27 30.5-73.5 0-43.24-30.26-73.74-30.27-30.5-73.5-30.5-43.24 0-73.74 30.26-30.5 30.27-30.5 73.5 0 43.24 30.26 73.74 30.27 30.5 73.5 30.5 43.24 0 73.74-30.26ZM233-584h358v-143H233v143Zm-53-72v476-600 124Z',
  },
  edit: {
    viewBox: '0 0 24 24',
    path: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  },
  delete: {
    viewBox: '0 0 24 24',
    path: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5-1-1h-5l-1 1H5v2h14V4z',
  },
  check: {
    viewBox: '0 0 24 24',
    path: 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  },
  close: {
    viewBox: '0 0 24 24',
    path: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  },
  add: {
    viewBox: '0 0 24 24',
    path: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z',
  },
  refresh: {
    viewBox: '0 0 24 24',
    path: 'M17.65 6.35A7.958 7.958 0 0 0 12 4a8 8 0 1 0 7.93 9h-2.02A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
  },
} as const;

export type KsIconName = keyof typeof KS_ICONS;
