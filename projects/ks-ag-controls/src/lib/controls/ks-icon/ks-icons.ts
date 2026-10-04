// Material Symbols Outlined, weight 400 (Apache-2.0), @material-symbols/svg-400 0.47.6.
export const KS_ICONS = {
  save: {
    viewBox: '0 -960 960 960',
    path: 'M840-683v503q0 24-18 42t-42 18H180q-24 0-42-18t-18-42v-600q0-24 18-42t42-18h503l157 157Zm-60 27L656-780H180v600h600v-476ZM553.5-275.26q30.5-30.27 30.5-73.5 0-43.24-30.26-73.74-30.27-30.5-73.5-30.5-43.24 0-73.74 30.26-30.5 30.27-30.5 73.5 0 43.24 30.26 73.74 30.27 30.5 73.5 30.5 43.24 0 73.74-30.26ZM233-584h358v-143H233v143Zm-53-72v476-600 124Z',
  },
} as const;

export type KsIconName = keyof typeof KS_ICONS;
