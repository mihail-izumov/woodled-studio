/**
 * fx-photos.ts — Размеченный фото-датасет для Hero/Interior галерей в FxEditor.
 *
 * АВТОГЕНЕРАЦИЯ из public/photo-tagging/_seed.js
 * Дата: 2026-06-06
 * Записей: 179 (живых, из 183 в _seed.js)
 *
 * Источник правды для разметки — tagger.html (public/photo-tagging/tagger.html).
 * После любой правки разметки запусти скрипт пересборки.
 */

import type { ModelId } from "./catalog"
import type { Wood } from "./materials"

/** Тип съёмки. studio+detail = clean BG для Hero. interior = нижняя галерея. */
export type FxShot = "studio" | "interior" | "detail"

/** Одна размеченная фотография светильника. Мульти-цвет рендеры → wood как массив. */
export interface FxPhoto {
  /** Абсолютный URL для <img src>: /photo-tagging/COLL/.../file.jpg, URI-encoded. */
  src: string
  /** Модель из catalog.MD (ключи семейств: rotor_s, rotor_l, floor_lamp, …). */
  model: ModelId
  /** Коллекция-семья для матчера: rotor / rotor_x / elliptical / spot / unit / bra_h / bra_v / table_lamp / floor_lamp / floor_lamp_s. */
  collection: string
  /** Цвет дерева на фото. Массив = мульти-цвет рендер. Пусто = wildcard. */
  wood: Wood | Wood[] | ""
  /** Тип крепления как видно на фото: pendant / flush / wall / floor / table / track. Не путать с user-pick mount. */
  mount: string
  /** Видимый рассеиватель (только rotor_x): yes / no. Иначе "". */
  diffuser: "yes" | "no" | ""
  /** Цвет основания торшера (только floor_lamp): white / black. Иначе "". */
  bodyColor: "white" | "black" | ""
  /** Тип съёмки: студия / интерьер / без фона (detail). */
  shot: FxShot
  /** Чаша — пока не размечена ни на одном фото (см. путь B в плане). */
  bowl: string
  /** Цветовая температура на фото (мало данных). */
  btemp: string
}

/* eslint-disable */
export const FX_PHOTOS: readonly FxPhoto[] = [
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%201000/27407160.jpg","model":"rotor_1000","collection":"rotor","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%201000/41560777.jpg","model":"rotor_1000","collection":"rotor","wood":"acryl","mount":"flush","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":"3000"},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%201000/47488971.jpg","model":"rotor_1000","collection":"rotor","wood":"acryl","mount":"flush","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%201000/57636031.jpg","model":"rotor_1000","collection":"rotor","wood":"walnut","mount":"flush","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":"3000"},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%201000/58560928.jpg","model":"rotor_1000","collection":"rotor","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%201000/66977619.jpg","model":"rotor_1000","collection":"rotor","wood":"walnut","mount":"flush","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":"3000"},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%201000/84467024.jpg","model":"rotor_1000","collection":"rotor","wood":"walnut","mount":"flush","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":"3000"},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%201000/96388030.jpg","model":"rotor_1000","collection":"rotor","wood":"black","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%201000/R-01-1000.jpg","model":"rotor_1000","collection":"rotor","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%201000/woodled_rotor_33.jpg","model":"rotor_1000","collection":"rotor","wood":"walnut","mount":"flush","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20L/R-01-L/10420888.jpg","model":"rotor_l","collection":"rotor","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20L/R-01-L/40486054.jpg","model":"rotor_l","collection":"rotor","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20L/R-01-L/R-01-L.jpg","model":"rotor_l","collection":"rotor","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"detail","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20L/R-01-L/R-01-L_2.jpg","model":"rotor_l","collection":"rotor","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20L/R-01-L/R-02-L.jpg","model":"rotor_l","collection":"rotor","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20L/R-02-L/22386543.jpg","model":"rotor_l","collection":"rotor","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20L/R-02-L/65954862.jpg","model":"rotor_l","collection":"rotor","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20L/R-02-L/89809944.jpg","model":"rotor_l","collection":"rotor","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20L/R-03-L/24014461.jpg","model":"rotor_l","collection":"rotor","wood":"black","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20L/R-03-L/98473644.jpg","model":"rotor_l","collection":"rotor","wood":"black","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20L/R-03-L/99281726.jpg","model":"rotor_l","collection":"rotor","wood":"black","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20L/R-03-L/woodled_rotor_37.jpg","model":"rotor_l","collection":"rotor","wood":"black","mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20L/R-04-L/56870909.jpg","model":"rotor_l","collection":"rotor","wood":"acryl","mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20L/R-04-L/98979050.jpg","model":"rotor_l","collection":"rotor","wood":"acryl","mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20L/RC-03-L/12814211.jpg","model":"rotor_l","collection":"rotor","wood":"black","mount":"flush","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20L/RC-03-L/57530029.jpg","model":"rotor_l","collection":"rotor","wood":"black","mount":"flush","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/R-01-M/27950575.jpg","model":"rotor_m","collection":"rotor","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/R-01-M/31417674.jpg","model":"rotor_m","collection":"rotor","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/R-01-M/34105385.jpg","model":"rotor_m","collection":"rotor","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/R-01-M/40486054.jpg","model":"rotor_m","collection":"rotor","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/R-01-M/R-01-M.jpg","model":"rotor_m","collection":"rotor","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"detail","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/R-01-M/bb0c69a85fc6d62ec121bbca0fbf5322.jpg","model":"rotor_m","collection":"rotor","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/R-02-M/10011273.jpg","model":"rotor_m","collection":"rotor","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/R-02-M/27884504.jpg","model":"rotor_m","collection":"rotor","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/R-02-M/36376868.jpg","model":"rotor_m","collection":"rotor","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/R-02-M/57620166.jpg","model":"rotor_m","collection":"rotor","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/R-03-M/35063695.jpg","model":"rotor_m","collection":"rotor","wood":"black","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/R-03-M/48188449.jpg","model":"rotor_m","collection":"rotor","wood":"black","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/R-03-M/55507678.jpg","model":"rotor_m","collection":"rotor","wood":"black","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/R-03-M/68993046.jpg","model":"rotor_m","collection":"rotor","wood":"black","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/R-04-M/23712433.jpg","model":"rotor_m","collection":"rotor","wood":"acryl","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/R-04-M/42166762.jpg","model":"rotor_m","collection":"rotor","wood":"acryl","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/R-04-M/51818381.jpg","model":"rotor_m","collection":"rotor","wood":"acryl","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/R-04-M/79658927.jpg","model":"rotor_m","collection":"rotor","wood":"acryl","mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/R-04-M/90703367.jpg","model":"rotor_m","collection":"rotor","wood":"acryl","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/R-04-M/97360026.jpg","model":"rotor_m","collection":"rotor","wood":"acryl","mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/RC-02-M/90200061.jpg","model":"rotor_m","collection":"rotor","wood":"walnut","mount":"flush","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/RC-02-M/99614763.jpg","model":"rotor_m","collection":"rotor","wood":"walnut","mount":"flush","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/RC-03-M/38271675.jpg","model":"rotor_m","collection":"rotor","wood":"black","mount":"flush","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/RC-03-M/woodled_rotor_51.jpg","model":"rotor_m","collection":"rotor","wood":"black","mount":"flush","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/RC-04-S/20464268.jpg","model":"rotor_m","collection":"rotor","wood":"acryl","mount":"flush","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20M/RC-04-S/81289441.jpg","model":"rotor_m","collection":"rotor","wood":"acryl","mount":"flush","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20S/R-01-S/40486054.jpg","model":"rotor_s","collection":"rotor","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20S/R-01-S/56310244.jpg","model":"rotor_s","collection":"rotor","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20S/R-01-S/R-01-S.jpg","model":"rotor_s","collection":"rotor","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"detail","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20S/R-01-S/woodled_rotor_60.jpg","model":"rotor_s","collection":"rotor","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20S/R-02-S/48885997.jpg","model":"rotor_s","collection":"rotor","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20S/R-02-S/68271544.jpg","model":"rotor_s","collection":"rotor","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20S/R-02-S/71641500.jpg","model":"rotor_s","collection":"rotor","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20S/R-02-S/woodled_rotor_61.jpg","model":"rotor_s","collection":"rotor","wood":"walnut","mount":"","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20S/R-03-S/24014461.jpg","model":"rotor_s","collection":"rotor","wood":"black","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20S/R-03-S/35063695.jpg","model":"rotor_s","collection":"rotor","wood":"black","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20S/R-03-S/77195792.jpg","model":"rotor_s","collection":"rotor","wood":"black","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20S/R-04-S/31195006.jpg","model":"rotor_s","collection":"rotor","wood":"acryl","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20S/R-04-S/31518385.jpg","model":"rotor_s","collection":"rotor","wood":"acryl","mount":"pendant","diffuser":"","bodyColor":"","shot":"detail","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20S/RC-01-S/14083743.jpg","model":"rotor_s","collection":"rotor","wood":"oak","mount":"flush","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20S/RC-01-S/68430770.jpg","model":"rotor_s","collection":"rotor","wood":"oak","mount":"flush","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20S/RC-03-S/30140343.jpg","model":"rotor_s","collection":"rotor","wood":"black","mount":"flush","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20S/RC-03-S/64869783.jpg","model":"rotor_s","collection":"rotor","wood":"black","mount":"flush","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20S/RC-04-S/57800499.jpg","model":"rotor_s","collection":"rotor","wood":"acryl","mount":"flush","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20S/RC-04-S/93739546.jpg","model":"rotor_s","collection":"rotor","wood":"acryl","mount":"flush","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20X/005e08f847d983e08693268eb9cacf87.jpg","model":"rotor_x_l","collection":"rotor_x","wood":"walnut","mount":"pendant","diffuser":"no","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20X/66379377.jpg","model":"rotor_x_l","collection":"rotor_x","wood":"walnut","mount":"pendant","diffuser":"no","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20X/81883227.jpg","model":"rotor_x_l","collection":"rotor_x","wood":"black","mount":"pendant","diffuser":"yes","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20X/89446375.jpg","model":"rotor_x_l","collection":"rotor_x","wood":"walnut","mount":"pendant","diffuser":"no","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20X/RX-01-M_05.jpg","model":"rotor_x_m","collection":"rotor_x","wood":"oak","mount":"pendant","diffuser":"no","bodyColor":"","shot":"detail","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20X/cd3f1495b0b306d947db1c0ccce657db.jpg","model":"rotor_x_l","collection":"rotor_x","wood":"walnut","mount":"pendant","diffuser":"no","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20X/woodled_rotor_28.jpg","model":"rotor_x_l","collection":"rotor_x","wood":"oak","mount":"flush","diffuser":"yes","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20X/woodled_rotor_29.jpg","model":"rotor_x_l","collection":"rotor_x","wood":"oak","mount":"flush","diffuser":"yes","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20X/woodled_rotor_30.jpg","model":"rotor_x_l","collection":"rotor_x","wood":"walnut","mount":"pendant","diffuser":"no","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Chandelier/ROTOR%20Chandelier%20X/woodled_rotor_31.jpg","model":"rotor_x_l","collection":"rotor_x","wood":"walnut","mount":"pendant","diffuser":"no","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Elliptical/13378639.jpg","model":"elliptical_s","collection":"elliptical","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":"3000"},
  {"src":"/photo-tagging/ROTOR%20Elliptical/22663617.jpg","model":"elliptical_l","collection":"elliptical","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":"3000"},
  {"src":"/photo-tagging/ROTOR%20Elliptical/25965623.jpg","model":"elliptical_l","collection":"elliptical","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Elliptical/33405896.jpg","model":"elliptical_l","collection":"elliptical","wood":"oak","mount":"flush","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Elliptical/34446483.jpg","model":"elliptical_l","collection":"elliptical","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Elliptical/44037826.jpg","model":"elliptical_l","collection":"elliptical","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":"3000"},
  {"src":"/photo-tagging/ROTOR%20Elliptical/4ebfc8f71ed6485bedd56b1f13535c6b.jpg","model":"elliptical_l","collection":"elliptical","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Elliptical/50367177.jpg","model":"elliptical_l","collection":"elliptical","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Elliptical/54863012.jpg","model":"elliptical_l","collection":"elliptical","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":"3000"},
  {"src":"/photo-tagging/ROTOR%20Elliptical/66741203.jpg","model":"elliptical_l","collection":"elliptical","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Elliptical/71212849.jpg","model":"elliptical_l","collection":"elliptical","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":"3000"},
  {"src":"/photo-tagging/ROTOR%20Elliptical/71992421.jpg","model":"elliptical_l","collection":"elliptical","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"detail","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Elliptical/92667080.jpg","model":"elliptical_l","collection":"elliptical","wood":"walnut","mount":"flush","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Elliptical/d7dcb22fa8060cc7ba5266a12747945e.jpg","model":"elliptical_l","collection":"elliptical","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp%20S/24446668.jpg","model":"floor_lamp_s","collection":"floor_lamp_s","wood":"oak","mount":"floor","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp%20S/24921166.jpg","model":"floor_lamp_s","collection":"floor_lamp_s","wood":"oak","mount":"floor","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp%20S/34770107.jpg","model":"floor_lamp_s","collection":"floor_lamp_s","wood":"walnut","mount":"floor","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp%20S/44835700.jpg","model":"floor_lamp_s","collection":"floor_lamp_s","wood":"walnut","mount":"floor","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp%20S/47316182.jpg","model":"floor_lamp_s","collection":"floor_lamp_s","wood":"walnut","mount":"floor","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp%20S/51019340.jpg","model":"floor_lamp_s","collection":"floor_lamp_s","wood":"oak","mount":"floor","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp%20S/65143174.jpg","model":"floor_lamp_s","collection":"floor_lamp_s","wood":"oak","mount":"floor","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp%20S/69974196.jpg","model":"floor_lamp_s","collection":"floor_lamp_s","wood":"walnut","mount":"floor","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp/16728668.jpg","model":"floor_lamp","collection":"floor_lamp","wood":"acryl","mount":"floor","diffuser":"","bodyColor":"white","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp/18969455.jpg","model":"floor_lamp","collection":"floor_lamp","wood":"oak","mount":"floor","diffuser":"","bodyColor":"white","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp/25690448.jpg","model":"floor_lamp","collection":"floor_lamp","wood":"oak","mount":"floor","diffuser":"","bodyColor":"black","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp/26754762.jpg","model":"floor_lamp","collection":"floor_lamp","wood":"acryl","mount":"floor","diffuser":"","bodyColor":"white","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp/32110479.jpg","model":"floor_lamp","collection":"floor_lamp","wood":"acryl","mount":"floor","diffuser":"","bodyColor":"white","shot":"detail","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp/36936058.jpg","model":"floor_lamp","collection":"floor_lamp","wood":"acryl","mount":"floor","diffuser":"","bodyColor":"white","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp/50063682.jpg","model":"floor_lamp","collection":"floor_lamp","wood":"oak","mount":"floor","diffuser":"","bodyColor":"white","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp/52967447.jpg","model":"floor_lamp","collection":"floor_lamp","wood":"walnut","mount":"floor","diffuser":"","bodyColor":"white","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp/73611388.jpg","model":"floor_lamp","collection":"floor_lamp","wood":"walnut","mount":"floor","diffuser":"","bodyColor":"black","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp/R-T-01-01.jpg","model":"floor_lamp","collection":"floor_lamp","wood":"oak","mount":"floor","diffuser":"","bodyColor":"white","shot":"detail","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp/R-T-01_01.jpg","model":"floor_lamp","collection":"floor_lamp","wood":"oak","mount":"floor","diffuser":"","bodyColor":"black","shot":"detail","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp/R-T-02-01.jpg","model":"floor_lamp","collection":"floor_lamp","wood":"walnut","mount":"floor","diffuser":"","bodyColor":"white","shot":"detail","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp/R-T-02.jpg","model":"floor_lamp","collection":"floor_lamp","wood":"walnut","mount":"floor","diffuser":"","bodyColor":"black","shot":"detail","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp/R-T-02_11.jpg","model":"floor_lamp","collection":"floor_lamp","wood":"walnut","mount":"floor","diffuser":"","bodyColor":"black","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp/R-T-03-01.jpg","model":"floor_lamp","collection":"floor_lamp","wood":"black","mount":"floor","diffuser":"","bodyColor":"white","shot":"detail","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp/R-T-03_.jpg","model":"floor_lamp","collection":"floor_lamp","wood":"black","mount":"floor","diffuser":"","bodyColor":"black","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp/R-T-03_01.jpg","model":"floor_lamp","collection":"floor_lamp","wood":"black","mount":"floor","diffuser":"","bodyColor":"black","shot":"detail","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp/R-T-03_3.jpg","model":"floor_lamp","collection":"floor_lamp","wood":"black","mount":"floor","diffuser":"","bodyColor":"black","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp/woodled_rotor_22.jpg","model":"floor_lamp","collection":"floor_lamp","wood":"black","mount":"floor","diffuser":"","bodyColor":"black","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Floor%20Lamp/ROTOR%20Floor%20Lamp/woodled_rotor_24.jpg","model":"floor_lamp","collection":"floor_lamp","wood":"walnut","mount":"floor","diffuser":"","bodyColor":"black","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Spot/Rotor%20Spot%20L/56856410.jpg","model":"spot_l","collection":"spot","wood":"oak","mount":"","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Spot/Rotor%20Spot%20L/74310298.jpg","model":"spot_l","collection":"spot","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Spot/Rotor%20Spot%20L/77820810.jpg","model":"spot_l","collection":"spot","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Spot/Rotor%20Spot%20L/86362800.jpg","model":"spot_l","collection":"spot","wood":["oak","walnut","black"],"mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Spot/Rotor%20Spot%20L/90829850.jpg","model":"spot_l","collection":"spot","wood":"black","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Spot/Rotor%20Spot%20L/R-S-01-02-03.jpg","model":"spot_l","collection":"spot","wood":["oak","walnut","black"],"mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Spot/Rotor%20Spot%20L/R-S-01-1.jpg","model":"spot_l","collection":"spot","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"detail","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Spot/Rotor%20Spot%20L/R-S-01.jpg","model":"spot_l","collection":"spot","wood":"oak","mount":"","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Spot/Rotor%20Spot%20L/woodled_rotor_15.jpg","model":"spot_l","collection":"spot","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Spot/Rotor%20Spot%20L/woodled_rotor_16.jpg","model":"spot_l","collection":"spot","wood":"black","mount":"track","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Spot/Rotor%20Spot%20L/woodled_rotor_17.jpg","model":"spot_l","collection":"spot","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Spot/Rotor%20Spot%20L/woodled_rotor_18.jpg","model":"spot_l","collection":"spot","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Spot/Rotor%20Spot%20L/woodled_rotor_20.jpg","model":"spot_l","collection":"spot","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Spot/Rotor%20Spot%20S/12413807.jpg","model":"spot_s","collection":"spot","wood":"black","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Spot/Rotor%20Spot%20S/40793065.jpg","model":"spot_s","collection":"spot","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Spot/Rotor%20Spot%20S/55734039.jpg","model":"spot_s","collection":"spot","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"detail","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Spot/Rotor%20Spot%20S/80475979.jpg","model":"spot_s","collection":"spot","wood":"walnut","mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Spot/Rotor%20Spot%20S/819389595fb9a3de8578db9b511913c9.jpg","model":"spot_s","collection":"spot","wood":"oak","mount":"pendant","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Table%20Lamp/123.jpg","model":"table_lamp","collection":"table_lamp","wood":"walnut","mount":"table","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Table%20Lamp/16599353.jpg","model":"table_lamp","collection":"table_lamp","wood":"black","mount":"table","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Table%20Lamp/22387162.jpg","model":"table_lamp","collection":"table_lamp","wood":"walnut","mount":"table","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Table%20Lamp/26517139.jpg","model":"table_lamp","collection":"table_lamp","wood":"black","mount":"table","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Table%20Lamp/27332968.jpg","model":"table_lamp","collection":"table_lamp","wood":"walnut","mount":"table","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Table%20Lamp/46867269.jpg","model":"table_lamp","collection":"table_lamp","wood":"oak","mount":"table","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Table%20Lamp/61271080.jpg","model":"table_lamp","collection":"table_lamp","wood":"black","mount":"table","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Table%20Lamp/woodled_rotor_1.jpg","model":"table_lamp","collection":"table_lamp","wood":"walnut","mount":"table","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Unit/18903666.jpg","model":"unit","collection":"unit","wood":"walnut","mount":"wall","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Unit/21824076.jpg","model":"unit","collection":"unit","wood":"black","mount":"wall","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Unit/28674164.jpg","model":"unit","collection":"unit","wood":"black","mount":"wall","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Unit/34510347.jpg","model":"unit","collection":"unit","wood":["oak","black","walnut"],"mount":"wall","diffuser":"","bodyColor":"","shot":"detail","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Unit/65168124.jpg","model":"unit","collection":"unit","wood":"walnut","mount":"wall","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Unit/7d8cf0cbf083fc89f89edb3cbebeed21.jpg","model":"unit","collection":"unit","wood":"oak","mount":"wall","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Unit/woodled_rotor_12.jpg","model":"unit","collection":"unit","wood":"oak","mount":"wall","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Unit/woodled_rotor_13.jpg","model":"unit","collection":"unit","wood":"walnut","mount":"wall","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Wall%20Lamp/ROTOR%20Wall%20Lamp%20Horizontal/33766538.jpg","model":"bra_h","collection":"bra_h","wood":"oak","mount":"wall","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Wall%20Lamp/ROTOR%20Wall%20Lamp%20Horizontal/37548852.jpg","model":"bra_h","collection":"bra_h","wood":"walnut","mount":"wall","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Wall%20Lamp/ROTOR%20Wall%20Lamp%20Horizontal/41037540.jpg","model":"bra_h","collection":"bra_h","wood":"walnut","mount":"wall","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Wall%20Lamp/ROTOR%20Wall%20Lamp%20Horizontal/49886947.jpg","model":"bra_h","collection":"bra_h","wood":"walnut","mount":"wall","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Wall%20Lamp/ROTOR%20Wall%20Lamp%20Horizontal/52332382.jpg","model":"bra_h","collection":"bra_h","wood":"oak","mount":"wall","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Wall%20Lamp/ROTOR%20Wall%20Lamp%20Horizontal/91593819.jpg","model":"bra_h","collection":"bra_h","wood":"walnut","mount":"wall","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Wall%20Lamp/ROTOR%20Wall%20Lamp%20Horizontal/98492557.jpg","model":"bra_h","collection":"bra_h","wood":"oak","mount":"wall","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Wall%20Lamp/ROTOR%20Wall%20Lamp%20Horizontal/R-B-01_01.jpg","model":"bra_h","collection":"bra_h","wood":"oak","mount":"wall","diffuser":"","bodyColor":"","shot":"detail","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Wall%20Lamp/ROTOR%20Wall%20Lamp%20Horizontal/R-B-02.jpg","model":"bra_h","collection":"bra_h","wood":"walnut","mount":"wall","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Wall%20Lamp/ROTOR%20Wall%20Lamp%20Horizontal/R-B-03.jpg","model":"bra_h","collection":"bra_h","wood":"black","mount":"wall","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Wall%20Lamp/ROTOR%20Wall%20Lamp%20Horizontal/R-B-03_01.jpg","model":"bra_h","collection":"bra_h","wood":"black","mount":"wall","diffuser":"","bodyColor":"","shot":"detail","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Wall%20Lamp/ROTOR%20Wall%20Lamp%20Horizontal/R-B-03_04.jpg","model":"bra_h","collection":"bra_h","wood":"black","mount":"wall","diffuser":"","bodyColor":"","shot":"detail","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Wall%20Lamp/ROTOR%20Wall%20Lamp%20Vertical%20L/42054539.jpg","model":"bra_v_l","collection":"bra_v","wood":"walnut","mount":"wall","diffuser":"","bodyColor":"","shot":"detail","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Wall%20Lamp/ROTOR%20Wall%20Lamp%20Vertical%20L/80924459.jpg","model":"bra_v_l","collection":"bra_v","wood":"walnut","mount":"wall","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Wall%20Lamp/ROTOR%20Wall%20Lamp%20Vertical%20L/93339029.jpg","model":"bra_v_l","collection":"bra_v","wood":"walnut","mount":"wall","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Wall%20Lamp/ROTOR%20Wall%20Lamp%20Vertical%20L/R-BV-01_int_1.jpg","model":"bra_v_l","collection":"bra_v","wood":"oak","mount":"wall","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Wall%20Lamp/ROTOR%20Wall%20Lamp%20Vertical%20L/R-BV-02_.jpg","model":"bra_v_l","collection":"bra_v","wood":"walnut","mount":"wall","diffuser":"","bodyColor":"","shot":"detail","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Wall%20Lamp/ROTOR%20Wall%20Lamp%20Vertical%20L/R-BV-03.jpg","model":"bra_v_l","collection":"bra_v","wood":"black","mount":"wall","diffuser":"","bodyColor":"","shot":"detail","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Wall%20Lamp/ROTOR%20Wall%20Lamp%20Vertical%20S/33329550.jpg","model":"bra_v_s","collection":"bra_v","wood":"walnut","mount":"wall","diffuser":"","bodyColor":"","shot":"studio","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Wall%20Lamp/ROTOR%20Wall%20Lamp%20Vertical%20S/65184633.jpg","model":"bra_v_s","collection":"bra_v","wood":"walnut","mount":"wall","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Wall%20Lamp/ROTOR%20Wall%20Lamp%20Vertical%20S/80828040.jpg","model":"bra_v_s","collection":"bra_v","wood":"oak","mount":"wall","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
  {"src":"/photo-tagging/ROTOR%20Wall%20Lamp/ROTOR%20Wall%20Lamp%20Vertical%20S/81449662.jpg","model":"bra_v_s","collection":"bra_v","wood":"oak","mount":"wall","diffuser":"","bodyColor":"","shot":"interior","bowl":"","btemp":""},
] as const
