/** Shared recharts theme: axes/labels follow black/white theme, accents stay orange. */

export const AXIS = {
  stroke: 'currentColor',
  tickLine: { stroke: 'currentColor' },
} as const

export function tooltipTheme(dark: boolean) {
  return {
    cursor: { fill: 'rgba(249,115,22,0.12)', stroke: '#f97316', strokeOpacity: 0.5 },
    contentStyle: {
      backgroundColor: dark ? '#000000' : '#ffffff',
      color: dark ? '#ffffff' : '#000000',
      border: '1px solid rgba(249,115,22,0.5)',
      borderRadius: '12px',
      fontSize: 12,
    },
    labelStyle: { color: dark ? '#ffffff' : '#000000', fontWeight: 700 },
    itemStyle: { color: dark ? '#ffffff' : '#000000' },
  }
}
