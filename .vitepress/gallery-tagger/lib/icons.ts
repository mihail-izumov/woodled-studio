// Inline SVG иконки. Используется вместо npm-пакета lucide-vue-next,
// чтобы пакет не добавлял внешних зависимостей в проект.
//
// API совместим с lucide-vue-next: компонент принимает props { size, strokeWidth, color }.
// Path-данные взяты из открытого набора Lucide Icons (ISC License).

import { defineComponent, h, type PropType } from 'vue'

type Node = [string, Record<string, string | number>]

const makeIcon = (name: string, nodes: Node[]) =>
  defineComponent({
    name: `Icon${name}`,
    props: {
      size: { type: [Number, String] as PropType<number | string>, default: 24 },
      strokeWidth: { type: [Number, String] as PropType<number | string>, default: 2 },
      color: { type: String, default: 'currentColor' },
    },
    setup(props, { attrs }) {
      return () =>
        h(
          'svg',
          {
            ...attrs,
            xmlns: 'http://www.w3.org/2000/svg',
            width: props.size,
            height: props.size,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: props.color,
            'stroke-width': props.strokeWidth,
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
          },
          nodes.map(([tag, a]) => h(tag, a)),
        )
    },
  })

export const AlertCircle = makeIcon('AlertCircle', [
  ['circle', { cx: 12, cy: 12, r: 10 }],
  ['line', { x1: 12, y1: 8, x2: 12, y2: 12 }],
  ['line', { x1: 12, y1: 16, x2: 12.01, y2: 16 }],
])

export const Camera = makeIcon('Camera', [
  ['path', { d: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z' }],
  ['circle', { cx: 12, cy: 13, r: 3 }],
])

export const Check = makeIcon('Check', [
  ['polyline', { points: '20 6 9 17 4 12' }],
])

export const ClipboardCopy = makeIcon('ClipboardCopy', [
  ['rect', { x: 8, y: 2, width: 8, height: 4, rx: 1, ry: 1 }],
  ['path', { d: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2' }],
  ['path', { d: 'M16 4h2a2 2 0 0 1 2 2v4' }],
  ['path', { d: 'M21 14H11' }],
  ['path', { d: 'm15 10-4 4 4 4' }],
])

export const Download = makeIcon('Download', [
  ['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }],
  ['polyline', { points: '7 10 12 15 17 10' }],
  ['line', { x1: 12, y1: 15, x2: 12, y2: 3 }],
])

export const ExternalLink = makeIcon('ExternalLink', [
  ['path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }],
  ['polyline', { points: '15 3 21 3 21 9' }],
  ['line', { x1: 10, y1: 14, x2: 21, y2: 3 }],
])

export const FileJson = makeIcon('FileJson', [
  ['path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }],
  ['polyline', { points: '14 2 14 8 20 8' }],
  ['path', { d: 'M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1' }],
  ['path', { d: 'M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1' }],
])

export const FileText = makeIcon('FileText', [
  ['path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }],
  ['polyline', { points: '14 2 14 8 20 8' }],
  ['line', { x1: 16, y1: 13, x2: 8, y2: 13 }],
  ['line', { x1: 16, y1: 17, x2: 8, y2: 17 }],
  ['polyline', { points: '10 9 9 9 8 9' }],
])

export const Filter = makeIcon('Filter', [
  ['polygon', { points: '22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3' }],
])

export const HelpCircle = makeIcon('HelpCircle', [
  ['circle', { cx: 12, cy: 12, r: 10 }],
  ['path', { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' }],
  ['line', { x1: 12, y1: 17, x2: 12.01, y2: 17 }],
])

export const Image = makeIcon('Image', [
  ['rect', { x: 3, y: 3, width: 18, height: 18, rx: 2, ry: 2 }],
  ['circle', { cx: 8.5, cy: 8.5, r: 1.5 }],
  ['polyline', { points: '21 15 16 10 5 21' }],
])

export const LayoutGrid = makeIcon('LayoutGrid', [
  ['rect', { x: 3, y: 3, width: 7, height: 7 }],
  ['rect', { x: 14, y: 3, width: 7, height: 7 }],
  ['rect', { x: 14, y: 14, width: 7, height: 7 }],
  ['rect', { x: 3, y: 14, width: 7, height: 7 }],
])

export const List = makeIcon('List', [
  ['line', { x1: 8, y1: 6, x2: 21, y2: 6 }],
  ['line', { x1: 8, y1: 12, x2: 21, y2: 12 }],
  ['line', { x1: 8, y1: 18, x2: 21, y2: 18 }],
  ['line', { x1: 3, y1: 6, x2: 3.01, y2: 6 }],
  ['line', { x1: 3, y1: 12, x2: 3.01, y2: 12 }],
  ['line', { x1: 3, y1: 18, x2: 3.01, y2: 18 }],
])

export const RefreshCw = makeIcon('RefreshCw', [
  ['path', { d: 'M3 12a9 9 0 0 1 14.85-6.36L21 9' }],
  ['polyline', { points: '21 3 21 9 15 9' }],
  ['path', { d: 'M21 12a9 9 0 0 1-14.85 6.36L3 15' }],
  ['polyline', { points: '3 21 3 15 9 15' }],
])

export const Search = makeIcon('Search', [
  ['circle', { cx: 11, cy: 11, r: 8 }],
  ['line', { x1: 21, y1: 21, x2: 16.65, y2: 16.65 }],
])

export const Tag = makeIcon('Tag', [
  ['path', { d: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z' }],
  ['line', { x1: 7, y1: 7, x2: 7.01, y2: 7 }],
])

export const Trash2 = makeIcon('Trash2', [
  ['polyline', { points: '3 6 5 6 21 6' }],
  ['path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }],
  ['line', { x1: 10, y1: 11, x2: 10, y2: 17 }],
  ['line', { x1: 14, y1: 11, x2: 14, y2: 17 }],
])

export const Upload = makeIcon('Upload', [
  ['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }],
  ['polyline', { points: '17 8 12 3 7 8' }],
  ['line', { x1: 12, y1: 3, x2: 12, y2: 15 }],
])

export const X = makeIcon('X', [
  ['line', { x1: 18, y1: 6, x2: 6, y2: 18 }],
  ['line', { x1: 6, y1: 6, x2: 18, y2: 18 }],
])
