// Типы Gallery Tagger.
//
// Все доменные типы (RoomTypeId, ModelId, Wood, ZoneId) переиспользуем
// из основного customizer/data — единый источник правды.
// Если у тебя в customizer/data/ имена типов отличаются — поправь импорты ниже.

export type { RoomTypeId } from '../../customizer/data/rooms'
export type { ModelId } from '../../customizer/data/catalog'
export type { Wood } from '../../customizer/data/materials'

// ZoneId в customizer обычно живёт в catalog.ts (зоны входят в каталог моделей).
// Если у тебя он в rooms.ts — поменяй путь на '../../customizer/data/rooms'.
export type { ZoneId } from '../../customizer/data/catalog'

// Локальные типы — нужны только тегеру, в customizer их нет.
export type SizeTag = 'S' | 'M' | 'L' | '1000'
export type FilterMode = 'all' | 'untagged' | 'nomodel'
export type ViewMode = 'grid' | 'list'

import type { RoomTypeId } from '../../customizer/data/rooms'
import type { ModelId } from '../../customizer/data/catalog'
import type { Wood } from '../../customizer/data/materials'
import type { ZoneId } from '../../customizer/data/catalog'

export interface GalleryEntry {
  filename: string
  url: string
  rooms: RoomTypeId[]
  models: ModelId[]
  woods: Wood[]
  zones: ZoneId[]
  sizes: SizeTag[]
  note: string
  tagged: boolean
}
