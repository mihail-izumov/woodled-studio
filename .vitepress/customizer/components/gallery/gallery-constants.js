// =============================================================================
// THEME
// =============================================================================
export const T = {
  bg: '#13110E', card: '#1E1B16', cardAlt: '#1A1714', border: '#2E2921',
  text: '#E8E0D4', textSec: '#8B8075', textDim: '#5C544A',
  neutral: '#A89878',
  oak: '#C4A46C', walnut: '#8B6242', black: '#5A4E42',
  dawn: '#D4A88A', noon: '#C9BE8E', clearing: '#A8C49A',
  green: '#7BA05B', red: '#B85C4C',
};

// =============================================================================
// REAL PHOTOS — fixture for lightbox testing
// =============================================================================
export const REAL_PHOTOS = [
  {
    src: '/gallery/a_chandelier_1000_nut_01.jpg',
    aspect: 1.52, zone: 'ceiling',
    label: 'Rotor 1000 nut · bedroom',
    wood: { name: 'орех', color: '#8B6242' }, model: 'Rotor 1000',
  },
  {
    src: '/gallery/a_chandelier_l_black_01.jpg',
    aspect: 0.67, zone: 'ceiling',
    label: 'Rotor L black · living',
    wood: { name: 'чёрный', color: '#5A4E42' }, model: 'Rotor L',
  },
];

export const REAL_ASPECTS = [1.52, 1.0, 0.75, 1.5, 1.33, 0.83, 1.6, 1.0, 0.9, 1.4, 0.7, 1.55, 1.45, 0.85, 1.0];
export const ZONES = ['ceiling', 'wall', 'floor', 'table'];

export const WOODS = [
  { id: 'oak',    name: 'дуб',    color: '#C4A46C' },
  { id: 'walnut', name: 'орех',   color: '#8B6242' },
  { id: 'black',  name: 'чёрный', color: '#5A4E42' },
];

export const MODELS = ['Rotor S', 'Rotor M', 'Rotor L', 'Rotor 1000', 'Spot S', 'Bra H', 'Elliptical S', 'Floor Lamp'];
export const COUNTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15];
export const WIDE_CAP = 2.0;

// =============================================================================
// HELPERS
// =============================================================================
export function objectPositionFor(zone) {
  if (zone === 'ceiling') return 'top';
  if (zone === 'floor')   return 'bottom';
  return 'center';
}

export function genItems(count) {
  return Array.from({ length: count }, (_, i) => ({
    n: i + 1,
    natural: REAL_ASPECTS[i % REAL_ASPECTS.length],
    zone: ZONES[i % ZONES.length],
    wood: WOODS[i % WOODS.length],
    model: MODELS[i % MODELS.length],
  }));
}

export function cellKind(natural) { return natural >= 1.1 ? 'wide' : 'square'; }
export function cellSize(natural) { return cellKind(natural) === 'wide' ? 2 : 1; }

export function realPhotoFor(item) {
  // Production items (from gallery-engine#toDisplayItem) already carry
  // .src, .label, .aspect → return them as-is. Demo items (from genItems)
  // fall back to one of the two REAL_PHOTOS fixtures.
  if (item && item.src) return item;
  return REAL_PHOTOS[item.natural >= 1.1 ? 0 : 1];
}

export function displayAspectFor(item) {
  // wide cells use the actual photo aspect (capped) so there's no horizontal crop
  if (cellKind(item.natural) === 'wide') {
    const photo = realPhotoFor(item);
    return Math.min(photo.aspect, WIDE_CAP);
  }
  return 1.0;
}

// =============================================================================
// TAP-LEAF
// =============================================================================
export const LEAF_REVEALS = [
  { at: 0, text: 'WOODLED\nс вашим дизайном' },
  { at: 1, text: '88% начинают\nс выбора чаши' },
  { at: 2, text: 'Каждый 4-й\nвыбирает орех' },
  { at: 3, text: '97 из 100 —\nза тёплый свет' },
];

export function makeScatterPieces(n) {
  return Array.from({ length: n }, () => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 80;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 20,
      rot: Math.random() * 360,
      dur: 1.6 + Math.random() * 0.6,
      del: Math.random() * 0.2,
      sz: 32 + Math.random() * 24,
    };
  });
}

// =============================================================================
// CONTEXTS + MOODS
// =============================================================================
export const CONTEXTS = {
  home: {
    name: 'Живой дом',
    title: 'Лес шепчет',
    algo: 'random(8) · приоритет a_ → b_',
    why: 'Главная страница с карточками комнат. Внизу — блок «Лес шепчет», случайная подборка. Фиксируется при монтировании.',
  },
  room: {
    name: 'RoomDetail',
    title: 'Ваш свет в интерьере',
    algo: 'byCombined({ room: typeId, models: fixtures.map(f=>f.m) }).slice(0, 8)',
    why: 'Страница комнаты. Если в комнате уже есть свет — фильтр и по моделям. Если пусто — только по типу. Лимит 8.',
  },
  fx: {
    name: 'FxEditor',
    title: 'Rotor 1000 в интерьере',
    algo: 'byModel(model.id) · без лимита',
    why: 'Редактор светильника. Лимита нет — пагинация решает. В заголовке имя текущей модели вместо «Этот светильник».',
  },
};

export const ROOM_MOODS = [
  { name: 'спальня',  color: T.dawn,     label: 'Тёплый рассвет' },
  { name: 'гостиная', color: T.clearing, label: 'Спокойная поляна' },
  { name: 'кухня',    color: T.noon,     label: 'Яркий полдень' },
];

// =============================================================================
// PLANNING (grid pagination)
// =============================================================================
export function planPage(photos, startIdx, includeWidget, target) {
  const cells = [];
  let i = startIdx;
  let cellCount = includeWidget ? 1 : 0;

  while (i < photos.length) {
    cells.push(photos[i]);
    cellCount += cellSize(photos[i].natural);
    i++;
    if (cellCount >= target && cellCount % 2 === 0) break;
  }

  let safetyTries = 0;
  while (cellCount % 2 !== 0 && safetyTries < 6) {
    safetyTries++;
    if (i < photos.length) {
      cells.push(photos[i]);
      cellCount += cellSize(photos[i].natural);
      i++;
    } else if (includeWidget) {
      let removed = false;
      for (let j = cells.length - 1; j >= 0; j--) {
        if (cellKind(cells[j].natural) === 'square') {
          cells.splice(j, 1);
          cellCount -= 1;
          removed = true;
          break;
        }
      }
      if (!removed) break;
    } else {
      break;
    }
  }
  return { cells, cellCount, nextIdx: i };
}

export function planAll(photos, revealedPages, target) {
  if (photos.length === 0) {
    return { pages: [{ cells: [], hasWidget: true, cellCount: 1, nextIdx: 0 }], hasMore: false, totalShown: 0 };
  }
  const pages = [];
  let nextIdx = 0;
  for (let p = 0; p < revealedPages; p++) {
    if (nextIdx >= photos.length) break;
    const page = planPage(photos, nextIdx, p === 0, target);
    if (page.cells.length === 0) break;
    pages.push({ ...page, hasWidget: p === 0 });
    nextIdx = page.nextIdx;
  }
  return { pages, hasMore: nextIdx < photos.length, totalShown: nextIdx };
}

export function previewNextPage(photos, startIdx, target) {
  if (startIdx >= photos.length) return 0;
  const page = planPage(photos, startIdx, false, target);
  return page.cells.length;
}
