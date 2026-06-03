<script setup lang="ts">
/**
 * FxEditor.vue — Страница светильника.
 *
 * Fix 6: Патроны — repeat(3, 1fr).
 * Fix 7: Хедер заменён на NavHeader (единый стиль).
 *
 * batch7 #2: «Смарт-подбор» → «WOODLED Smart» (заголовок секции в шаге size,
 *            заголовок help-модалки).
 *
 * batch11 #1: Иконка в summary-карточке — fxIcName(model.type) вместо
 *             захардкоженного "ceiling". Теперь бра, торшер, настольная
 *             и спот показывают свою иконку.
 */

import { computed, ref, watch, onUnmounted } from 'vue'
import { T, WCOL } from '../theme/tokens'
import { MD, FAMILIES, fxNav, fxTitle, fxLine, fxSizeChip, SIZE_WORD, type Fixture, type ModelId } from '../data/catalog'
import { MATS, BOWLS as ALL_BOWLS, BTEMPS, DEF_OPT, OPT_PRICE, WOOD_TIPS, OPT_TIPS, type Wood, type Bowl } from '../data/materials'
import { getBright } from '../data/moods'
import { buildSizeRecommendation, type AreaFit, type SizeCandidate } from '../engine/autosize'
/* batch11 #1: добавлен fxIcName для динамической иконки типа светильника */
import Icon, { fxIcName, type IconName } from './ui/Icons.vue'
import NavHeader from './ui/NavHeader.vue'
import SmartHelpModal from './ui/SmartHelpModal.vue'
import LeaveConfirmModal from './ui/LeaveConfirmModal.vue'
import { buildFixtureShareUrl } from '../engine/share'
import ShareModal from './ShareModal.vue'

/* Фотогалерея «{Model} в интерьере» — под чек-листом */
import GallerySection from './gallery/GallerySection.vue'
import { byModel, toDisplayItem, preloadAspects } from '../engine/gallery-engine'
import { useConfigurator } from '../store/configurator'

interface Props {
  item: Fixture; defWood?: Wood; skipSize?: boolean; backLabel?: string
  roomArea?: number; roomBaseLm?: number; roomCurrentLmWithoutThis?: number
  roomName?: string; roomTint?: string; isProvisional?: boolean
}
const props = withDefaults(defineProps<Props>(), { skipSize: false, backLabel: '← Назад', isProvisional: false })
const emit = defineEmits<{ (e: 'save', fx: Fixture): void; (e: 'delete'): void; (e: 'close'): void; (e: 'feedback', msg: string): void }>()

const cfg = useConfigurator()

/* «+3000₽ на свет» в галерее: в App.vue BuyModal живёт внутри
   v-if="!activeFxData" — пока мы на странице светильника, модалка
   ФИЗИЧЕСКИ не отрендерена. Сначала закрываем FxEditor (activeFxData → null),
   потом ставим showBuy=true — App.vue рендерит ветку с BuyModal. */
function onGalleryGift() {
  cfg.showBuy.value = true
  emit('close')
}

type StepId = 'size'|'wood'|'mount'|'bowl'|'temp'|'patrons'|'diffuser'|'wire'|'base'|'bulbs'
type StepStatus = 'default'|'chosen'
const SM: Record<StepId, {name:string;desc:string;icon:IconName}> = {
  size:{name:'Размер',desc:'Подберите размер под комнату',icon:'fxSize'},
  wood:{name:'Дерево',desc:'Три породы — три характера',icon:'leafy'},
  mount:{name:'Крепление',desc:'Как светильник крепится к потолку',icon:'fxMount'},
  bowl:{name:'Чаша',desc:'Декоративная накладка на потолке',icon:'fxBowl'},
  temp:{name:'Температура',desc:'Оттенок света',icon:'thermo'},
  patrons:{name:'Патроны',desc:'Больше патронов — ярче свет',icon:'sun'},
  diffuser:{name:'Рассеиватель',desc:'Мягкий свет без бликов',icon:'fxDiffuser'},
  wire:{name:'Подключение',desc:'Как подать электричество',icon:'fxWire'},
  base:{name:'Основание',desc:'Цвет ножки торшера',icon:'dotDashed'},
  bulbs:{name:'Лампочки',desc:'Включить в комплект?',icon:'bulb'},
}
const SIM_MOUNTS = [{id:'pendant',name:'На подвесе',tip:'Потолок >2.7м — больше света'},{id:'flush',name:'Вплотную',tip:'Потолок <2.7м — минимум зазора'}] as const
const BASE_COLORS = {white:{name:'Белое',color:'#E8E0D4'},black:{name:'Чёрное',color:'#3A3530'}} as const

const mid = ref<ModelId>(props.item.m)
const stepIdx = ref(0)
const hasExistingOpts = !!(props.item.opts && Object.keys(props.item.opts).length > 0)
/* Есть ли массив done (новый формат). buildFixture всегда пишет done — даже
   пустой [] для несобранного светильника. Поэтому легаси (старые данные без
   done) определяем именно по ОТСУТСТВИЮ поля, а не по пустому массиву —
   иначе сохранённый несобранный светильник ошибочно помечался как «всё Готово». */
const hasDoneField = Array.isArray(props.item.done)
const existingDone = props.item.done ?? []
const legacyAllDone = hasExistingOpts && !hasDoneField
const isNewFixture = !hasExistingOpts && !hasDoneField
/* Быстрое добавление: новый светильник открывается СРАЗУ на сводке (дефолты
   уже применены), а не в принудительном пошаговом онбординге. Пошаговый «Гид
   по сборке» доступен по кнопке внутри блока «Комплектация» (launchGuided). */
const inOnboarding = ref(false)
const view = ref<'steps'|'summary'>('summary')
const showHelp = ref(false)
const showDeleteConfirm = ref(false)
const touched = ref(new Set<StepId>())
const priceOpen = ref(false)

interface Build { m:ModelId;wood:Wood;mount:string;bowl:string;btemp:string;lamps:number;diffuser:boolean;moisture:boolean;bulbs:boolean;wire:string;baseColor:string;bulbOpt:string;steps:Record<string,StepStatus> }

function getSteps(modelId:ModelId):StepId[] {
  const m=MD[modelId]; const s:StepId[]=[]; const fam=m.family?FAMILIES[m.family]:null
  if(!props.skipSize&&fam&&fam.length>1)s.push('size')
  s.push('wood'); if(m.hasMount)s.push('mount'); if(m.avBowls.length>0)s.push('bowl')
  s.push('temp'); if(m.minL!==m.maxL)s.push('patrons'); if(m.hasDiffuser)s.push('diffuser')
  if(m.wireOpts)s.push('wire'); if(m.baseColors)s.push('base')
  if(!m.bulbsIn&&(m.bulbPrice||m.bulbOpts))s.push('bulbs'); return s
}

const build = ref<Build>((()=>{
  const m=MD[props.item.m]; const o=props.item.opts??{}; const stps=getSteps(props.item.m)
  return {m:props.item.m,wood:props.item.wood??props.defWood??'oak',mount:o.mount??DEF_OPT.mount,
    bowl:o.bowl??DEF_OPT.bowl,btemp:o.btemp??DEF_OPT.btemp,lamps:props.item.l??m.lamps,
    diffuser:o.diffuser??DEF_OPT.diffuser,moisture:o.moisture??DEF_OPT.moisture,bulbs:o.bulbs??DEF_OPT.bulbs,
    wire:o.wire??DEF_OPT.wire,baseColor:o.baseColor??'white',bulbOpt:o.bulbOpt??'none',
    steps:Object.fromEntries(stps.map(s=>{
      let isDone:boolean; if(existingDone.length>0)isDone=existingDone.includes(s)
      else if(legacyAllDone)isDone=true; else isDone=false
      return[s,isDone?'chosen' as StepStatus:'default' as StepStatus]}))}
})())

/* Снимок начального состояния — для определения «есть несохранённые изменения».
   build инициализируется синхронно выше, поэтому snapshot валиден сразу. */
const initialBuildSnapshot = JSON.stringify(build.value)
const isDirty = computed(() => JSON.stringify(build.value) !== initialBuildSnapshot)
const showLeaveConfirm = ref(false)
/* Выход со сводки: если есть изменения — спросить подтверждение, иначе закрыть.
   Для провизорного нового светильника close в App.vue его удалит. */
/* Провизорный (только что добавленный) светильник спрашиваем ВСЕГДА — даже без
   правок: иначе пользователь может уйти, думая что «добавил», и потерять его. */
function requestClose(){ if(isDirty.value||props.isProvisional){ showLeaveConfirm.value=true } else { emit('close') } }
function confirmLeave(){ showLeaveConfirm.value=false; emit('close') }
/* iOS large-title pattern: на summary заголовок навбара пустой, пока видна
   плашка с именем; когда плашка ушла вверх — fxNav плавно появляется в
   навбаре. На step view заголовок показываем всегда (плашки там нет). */
const plateEl = ref<HTMLDivElement|null>(null)
const plateScrolledOut = ref(false)
let plateObserver: IntersectionObserver|null = null
watch(plateEl, (el) => {
  plateObserver?.disconnect(); plateObserver = null
  if (!el) { plateScrolledOut.value = false; return }
  plateObserver = new IntersectionObserver(
    ([entry]) => { plateScrolledOut.value = !entry.isIntersecting },
    { rootMargin: '-44px 0px 0px 0px', threshold: 0 },
  )
  plateObserver.observe(el)
})
const navTitleVisible = computed(() => view.value === 'steps' || plateScrolledOut.value)

/* Плашка «несохранённые изменения» скроллит к нижней кнопке «Сохранить»
   (единая логика с RoomSettings). Нижняя кнопка — единственная точка сохранения. */
const saveBtnEl = ref<HTMLButtonElement|null>(null)
/* Спотлайт: при тапе по плашке затемняем экран и подсвечиваем нижнюю кнопку ~2с. */
const highlightSave = ref(false)
let highlightTimer: ReturnType<typeof setTimeout>|null = null
function scrollToSave(){
  /* behavior:'auto' (мгновенно) — иначе smooth-скролл двигает кнопку под пальцем
     и тап попадает на «Поделиться» ниже. */
  saveBtnEl.value?.scrollIntoView({behavior:'auto',block:'center'})
  highlightSave.value=true
  if(highlightTimer)clearTimeout(highlightTimer)
  highlightTimer=setTimeout(()=>{highlightSave.value=false},2000)
}
onUnmounted(()=>{ if(highlightTimer)clearTimeout(highlightTimer); plateObserver?.disconnect() })

const model=computed(()=>MD[mid.value]); const steps=computed(()=>getSteps(mid.value))
const curStep=computed(()=>steps.value[stepIdx.value]); const meta=computed(()=>SM[curStep.value]||{name:'',desc:''})
const isTouched=computed(()=>touched.value.has(curStep.value))
const canAdvance=computed(()=>inOnboarding.value&&stepIdx.value<steps.value.length-1)
const families=computed(()=>{const m=model.value;return m.family?[...FAMILIES[m.family]].reverse():null})
const availBowls=computed(()=>model.value.avBowls.map(id=>ALL_BOWLS.find(b=>b.id===id)).filter(Boolean) as Bowl[])
const freeBowls=computed(()=>availBowls.value.filter(b=>b.price===0))
const paidBowls=computed(()=>availBowls.value.filter(b=>b.price>0))
const simMats=computed(()=>MATS.map(m=>({id:m.id as Wood,name:m.name,color:m.color||WCOL[m.id as Wood],tip:WOOD_TIPS[m.id as Wood]??''})))

interface PriceRow{label:string;amount:number}
const priceBreakdown=computed<PriceRow[]>(()=>{
  const m=model.value,b=build.value; const items:PriceRow[]=[]
  const wn=simMats.value.find(x=>x.id===b.wood)?.name??'Дуб'; items.push({label:`Базовая (${wn})`,amount:m.p[b.wood]||0})
  const extra=Math.max(0,b.lamps-m.lamps); if(extra>0)items.push({label:`+${extra} ${spw(extra)}`,amount:extra*m.sur})
  if(m.avBowls.length>0&&b.bowl){const bowl=ALL_BOWLS.find(x=>x.id===b.bowl);if(bowl&&bowl.price>0)items.push({label:`Чаша «${bowl.name}»`,amount:bowl.price})}
  if(b.diffuser&&m.hasDiffuser)items.push({label:'Рассеиватель',amount:OPT_PRICE.diffuser})
  if(b.moisture)items.push({label:'Влагозащита',amount:OPT_PRICE.moisture})
  if(m.bulbOpts){const bo=m.bulbOpts.find(x=>x.id===b.bulbOpt);if(bo&&bo.price>0)items.push({label:bo.label,amount:bo.price})}
  else if(!m.bulbsIn&&b.bulbs&&m.bulbPrice)items.push({label:`Лампочки ${b.lamps} шт`,amount:Math.round((m.bulbPrice*b.lamps)/m.lamps)})
  if(m.wireOpts){const wo=m.wireOpts.find(x=>x.id===b.wire);if(wo&&wo.price>0)items.push({label:wo.label,amount:wo.price})}
  return items
})
const price=computed(()=>priceBreakdown.value.reduce((s,r)=>s+r.amount,0))
const progress=computed(()=>{const t=steps.value.length;const d=steps.value.filter(s=>build.value.steps[s]==='chosen').length;return{total:t,done:d,pct:t?Math.round((d/t)*100):0}})
const status=computed(()=>{const c=steps.value.filter(s=>build.value.steps[s]==='chosen').length;if(c===steps.value.length)return'Собран';return c>0?'В сборке':'Новый'})
const sc=computed(()=>status.value==='Собран'?T.green:status.value==='В сборке'?T.neutral:T.textDim)
const isDone=computed(()=>status.value==='Собран')

/* ──────────── Фотогалерея модели ──────────── */
const galleryItems = computed(() => byModel(mid.value))
const galleryDisplayItems = computed(() => galleryItems.value.map(toDisplayItem))
watch(galleryItems, items => { if (items.length) preloadAspects(items) }, { immediate: true })

const myChoices=computed<[string,string][]>(()=>{
  const m=model.value,b=build.value
  const list:([string,string]|null)[]=[
    ['Свет',`${b.lamps} п. · ${fmt(Math.round(b.lamps*m.lmPer*diffMult()))} лм · ${btempK()}`],
    m.hasMount?['Крепление',b.mount==='pendant'?'На подвесе':'Вплотную']:null,
    m.avBowls.length>0?['Чаша',bowlName()]:null,
    m.hasDiffuser?['Рассеиватель',b.diffuser?'Да':'Нет']:null,
    m.wireOpts?['Подключение',m.wireOpts.find(x=>x.id===b.wire)?.label||'—']:null,
    m.baseColors?['Основание',BASE_COLORS[b.baseColor as keyof typeof BASE_COLORS]?.name||'—']:null,
    (m.bulbPrice||m.bulbOpts)?['Лампочки',m.bulbOpts?(m.bulbOpts.find(x=>x.id===b.bulbOpt)?.label??'—'):(b.bulbs?`${b.lamps} шт в комплекте`:'Свои')]:null,
  ];return list.filter(Boolean) as [string,string][]
})
const myChoicesNoLight=computed(()=>myChoices.value.filter(([k])=>k!=='Свет'))

const hasRoomContext=computed(()=>props.roomArea!=null&&props.roomBaseLm!=null&&props.roomCurrentLmWithoutThis!=null)
const sizeRecs=computed<SizeCandidate[]|null>(()=>{
  if(!hasRoomContext.value||!families.value)return null
  return buildSizeRecommendation(families.value,props.roomArea!,props.roomBaseLm!,props.roomCurrentLmWithoutThis!,props.item.q??1)
})
const recommendedMid=computed<ModelId|null>(()=>sizeRecs.value?.find(r=>r.recommended)?.mid??null)
function getRecFor(fid:ModelId):SizeCandidate|null{return sizeRecs.value?.find(r=>r.mid===fid)??null}
function brightLabel(fid:ModelId):string{const rec=getRecFor(fid);if(!rec)return'';return getBright(rec.projectedRatio).name}
function brightColor(fid:ModelId):string{const rec=getRecFor(fid);if(!rec)return T.textDim;return getBright(rec.projectedRatio).color}
const roomLabel=computed(()=>{if(!hasRoomContext.value)return null;const name=props.roomName??'Комната';return `${name} · ${props.roomArea} м²`})

interface SizeAdvice{text:string;tone:'good'|'warn'|'bad'|'neutral'}
const sizeAdvice=computed<SizeAdvice|null>(()=>{
  if(!sizeRecs.value||!hasRoomContext.value)return null
  const recs=sizeRecs.value;const sel=recs.find(r=>r.mid===build.value.m);const rec=recs.find(r=>r.recommended)
  if(!sel)return null;const selBright=getBright(sel.projectedRatio).name
  const cats=recs.map(r=>getBright(r.projectedRatio).name);const uniqueCats=[...new Set(cats)]
  const comfCount=recs.filter(r=>r.projectedRatio>=0.8&&r.projectedRatio<=2.0).length
  if(rec&&rec.mid===sel.mid){if(comfCount>1)return{text:`${fxNav(rec.mid)} — лучший баланс яркости и размера для вашей комнаты. Остальные «комфортные» тоже подойдут — выбирайте по диаметру под потолок и стиль интерьера.`,tone:'good'};return{text:`${fxNav(rec.mid)} — оптимальный выбор для этой комнаты. Ровно столько света, сколько нужно.`,tone:'good'}}
  if(uniqueCats.length===1){if(selBright==='Не хватает'||selBright==='Приглушённо')return{text:`Ни один размер этой коллекции не осветит ${props.roomArea} м² самостоятельно. Выберите крупнейший — он даст максимум, а остальной свет добавьте бра, торшером или спотами.`,tone:'bad'};if(selBright==='Избыточно')return{text:`Все размеры дают слишком много света для этой комнаты. Возьмите наименьший и обязательно поставьте диммер — будете управлять яркостью.`,tone:'warn'};if(selBright==='С запасом')return{text:`Все размеры дают запас яркости. Крупный — для выразительного потолка, компактный — если хотите минимализм. Диммер пригодится в любом случае.`,tone:'neutral'};return{text:`Все размеры подходят по яркости — свет одинаковый. Крупнее — выразительнее на потолке, компактнее — деликатнее. Выбирайте по диаметру под высоту потолка и стиль.`,tone:'neutral'}}
  if(rec&&sel){const recName=fxNav(rec.mid);if(sel.modelLm<rec.modelLm){if(selBright==='Не хватает')return{text:`Этого размера не хватит — будет темно. Рекомендуем ${recName} или добавьте дополнительные светильники (бра, торшер).`,tone:'bad'};if(selBright==='Приглушённо')return{text:`Получится приглушённый свет — для атмосферы хорошо, для работы мало. Хотите ярче — возьмите ${recName}.`,tone:'warn'};return{text:`Чуть меньше рекомендуемого, но всё равно комфортно. Если любите яркость — возьмите ${recName}.`,tone:'neutral'}};if(selBright==='Избыточно')return{text:`Этот размер даст слишком много света. Возьмите ${recName} — он идеально балансирует, или поставьте диммер.`,tone:'warn'};if(selBright==='С запасом')return{text:`Будет с запасом — хорошо для рабочей зоны или если в комнате тёмные стены. Поставьте диммер для вечернего режима.`,tone:'neutral'};return{text:`Хороший выбор. Рекомендация — ${recName}, но ваш вариант тоже в комфортном диапазоне.`,tone:'good'}}
  if(selBright==='Не хватает')return{text:`Для ${props.roomArea} м² этого мало. Возьмите крупнее или добавьте другие светильники — бра, торшер, споты.`,tone:'bad'};if(selBright==='Приглушённо')return{text:`Приглушённый свет — создаст атмосферу, но для постоянного использования мало. Добавьте бра или возьмите размер крупнее.`,tone:'warn'};if(selBright==='Избыточно')return{text:`Много света для этой комнаты. Возьмите размер поменьше или установите диммер.`,tone:'warn'};if(selBright==='С запасом')return{text:`С запасом яркости — комфортно днём, а вечером приглушите диммером. Хороший вариант для светлых комнат и рабочих зон.`,tone:'neutral'};return{text:`Комфортный уровень света для вашей комнаты.`,tone:'good'}
})
function adviceColor(tone:'good'|'warn'|'bad'|'neutral'):string{if(tone==='good')return T.green;if(tone==='warn')return T.yellow;if(tone==='bad')return T.red;return T.neutral}
function selectBestForMe(){const best=recommendedMid.value;if(!best)return;mid.value=best;upBuild({m:best,lamps:MD[best].lamps})}

function upBuild(patch:Partial<Build>){const cur=build.value;const isNoChange=Object.entries(patch).every(([k,v])=>cur[k as keyof Build]===v);build.value={...cur,...patch};const cs=curStep.value;if(isNoChange&&touched.value.has(cs)){const next=new Set(touched.value);next.delete(cs);touched.value=next}else{touched.value=new Set([...touched.value,cs])}}
function doCommit(isChoice:boolean){build.value={...build.value,steps:{...build.value.steps,[curStep.value]:isChoice?'chosen':'default'}};touched.value=new Set([...touched.value].filter(x=>x!==curStep.value));if(canAdvance.value){stepIdx.value++}else{view.value='summary';inOnboarding.value=false}}
function goToStep(i:number){stepIdx.value=i;view.value='steps'}
/* Запуск пошагового гида с самого начала (последовательный walk-through). */
function launchGuided(){cfg.markOnboardedOnce();stepIdx.value=0;inOnboarding.value=true;view.value='steps'}
/* Заметная плашка-CTA гида — только на самом первом новом светильнике. */
const showGuidedCTA=computed(()=>!cfg.onboardedOnce.value&&isNewFixture)
function backFromStep(){if(inOnboarding.value&&stepIdx.value>0){stepIdx.value--}else{view.value='summary';inOnboarding.value=false}}
function lampOpts():number[]{const r:number[]=[];for(let i=model.value.minL;i<=model.value.maxL;i++)r.push(i);return r}
function diffMult():number{return build.value.diffuser&&model.value.diffLoss?1-model.value.diffLoss:1}
function buildFixture():Fixture{const b=build.value;const done=(Object.entries(b.steps) as [StepId,StepStatus][]).filter(([,st])=>st==='chosen').map(([s])=>s as string);return{m:b.m,q:props.item.q??1,wood:b.wood,zone:props.item.zone,l:b.lamps,opts:{bowl:b.bowl,mount:b.mount,wire:b.wire,btemp:b.btemp,diffuser:b.diffuser,moisture:b.moisture,bulbs:b.bulbs,bulbOpt:b.bulbOpt,baseColor:b.baseColor},done}}
function doSave(){cfg.markOnboardedOnce();emit('save',buildFixture())}

/* ─────────── stage3-shortener: единая модалка ShareModal ───────────
   Кнопка «Поделиться» открывает модалку — там встроены prefetch, ClipboardItem,
   navigator.share и UI с гарантией короткой ссылки. */
const showShare = ref(false)
const fixtureLongUrl = computed(() => buildFixtureShareUrl(buildFixture()))

const fmt=(n:number)=>n.toLocaleString('ru-RU')
function spw(n:number){const a=Math.abs(n),l=a%10,t=a%100;if(t>=11&&t<=19)return'патронов';if(l===1)return'патрон';if(l>=2&&l<=4)return'патрона';return'патронов'}
function slw(n:number){const a=Math.abs(n),l=a%10,t=a%100;if(t>=11&&t<=19)return'лампочек';if(l===1)return'лампочка';if(l>=2&&l<=4)return'лампочки';return'лампочек'}
function bowlName(){return ALL_BOWLS.find(x=>x.id===build.value.bowl)?.name??'—'}
function btempK(){const bt=BTEMPS.find(x=>x.id===build.value.btemp);return bt?bt.kelvin+'К':'—'}
function bulbTotal(){const bp=model.value.bulbPrice??OPT_PRICE.bulbsPerLamp*model.value.lamps;return Math.round((bp*build.value.lamps)/model.value.lamps)}
function bulbPer(){return model.value.bulbPrice?Math.round(model.value.bulbPrice/model.value.lamps):OPT_PRICE.bulbsPerLamp}
</script>

<template>
  <div :style="{position:'fixed',inset:0,background:T.bg,overflow:showLeaveConfirm?'hidden':'auto'}">
    <NavHeader
      title=""
      :back="view==='summary' ? (props.roomName || 'Назад') : 'Назад'"
      @back="view==='summary'?requestClose():backFromStep()"
    >
      <template #title>
        <span :style="{ opacity: navTitleVisible ? 1 : 0, transition: 'opacity 0.2s ease' }">{{ fxNav(build.m) }}</span>
      </template>
    </NavHeader>

    <!-- Плашка «несохранённые изменения» — только на сводке -->
    <div
      v-if="isDirty&&view==='summary'"
      :style="{position:'sticky',top:'44px',zIndex:9,background:props.roomTint??T.neutral,color:T.bg,padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px',boxShadow:'0 2px 12px rgba(0,0,0,0.4)'}"
    >
      <span :style="{display:'flex',alignItems:'center',gap:'8px',flex:1,minWidth:0}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :style="{flexShrink:0}"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span :style="{fontSize:'13px',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}">Есть несохранённые изменения</span>
      </span>
      <span :style="{display:'flex',alignItems:'center',gap:'5px',flexShrink:0,background:T.text,color:T.bg,padding:'6px 12px',borderRadius:'8px',fontSize:'13px',fontWeight:700,cursor:'pointer'}" @click="scrollToSave">{{ props.isProvisional?'Добавить':'Сохранить' }}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg></span>
    </div>

    <div :style="{maxWidth:'480px',margin:'0 auto',padding:'16px 20px',fontFamily:`'Segoe UI', system-ui, sans-serif`,color:T.text,boxSizing:'border-box'}">

      <!-- SUMMARY -->
      <template v-if="view==='summary'">
        <div ref="plateEl" :style="{background:T.card,border:`1px solid ${isDone?sc+'44':T.border}`,borderRadius:'14px',padding:'14px',marginBottom:'16px'}">
          <div :style="{display:'flex',alignItems:'center',gap:'12px'}">
            <!-- batch11 #1: fxIcName(model.type) вместо захардкоженного "ceiling" -->
            <div :style="{width:'52px',height:'52px',borderRadius:'12px',background:WCOL[build.wood]+'22',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}"><Icon :name="fxIcName(model.type)" :color="WCOL[build.wood]" :size="26"/></div>
            <div :style="{flex:1,minWidth:0}">
              <div :style="{fontSize:'17px',fontWeight:600,color:T.text,lineHeight:1.2}">{{ fxTitle(build.m) }}</div>
              <div :style="{fontSize:'10px',fontWeight:700,color:props.roomTint||T.neutral,marginTop:'3px',marginBottom:'7px',textTransform:'uppercase',letterSpacing:'0.6px'}">{{ fxLine(build.m) }}</div>
              <div :style="{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}">
                <span :style="{display:'inline-flex',alignItems:'center',gap:'5px',padding:'2px 10px 2px 4px',borderRadius:'12px',background:WCOL[build.wood]+'22',fontSize:'11px',fontWeight:600,color:T.text}"><span :style="{width:'14px',height:'14px',borderRadius:'50%',background:WCOL[build.wood],flexShrink:0}"/>{{ simMats.find(x=>x.id===build.wood)?.name }}</span>
                <span :style="{display:'inline-block',padding:'2px 10px',borderRadius:'12px',border:`1px solid ${sc}55`,background:'transparent',fontSize:'11px',fontWeight:600,color:sc}">{{ status }}</span>
              </div>
            </div>
            <button :style="{background:'none',border:'none',cursor:'pointer',padding:'4px',display:'flex',flexDirection:'column',alignItems:'flex-end',color:T.neutral,flexShrink:0}" @click="priceOpen=!priceOpen">
              <span :style="{fontSize:'15px',fontWeight:800,fontVariantNumeric:'tabular-nums'}">{{ fmt(price) }} ₽</span>
              <span :style="{fontSize:'12px',color:T.textSec,display:'flex',alignItems:'center',gap:'4px',marginTop:'2px',fontWeight:500}">{{ priceOpen?'Скрыть':'Детали' }}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :style="{transform:priceOpen?'rotate(180deg)':'none',transition:'transform .2s'}"><polyline points="6 9 12 15 18 9"/></svg></span>
            </button>
          </div>
          <div v-if="priceOpen" :style="{marginTop:'12px',paddingTop:'12px',borderTop:`1px solid ${T.border}`}">
            <div v-for="(row,i) in priceBreakdown" :key="i" :style="{display:'flex',justifyContent:'space-between',alignItems:'baseline',fontSize:'12px',padding:'3px 0'}"><span :style="{color:T.textSec}">{{ row.label }}</span><span :style="{color:i===0?T.text:T.yellow,fontWeight:600,fontVariantNumeric:'tabular-nums'}">{{ i===0?'':'+' }}{{ fmt(row.amount) }} ₽</span></div>
            <div :style="{display:'flex',justifyContent:'space-between',alignItems:'baseline',fontSize:'13px',fontWeight:800,color:T.text,marginTop:'6px',paddingTop:'8px',borderTop:`1px solid ${T.border}`}"><span>Итого</span><span :style="{color:T.neutral,fontVariantNumeric:'tabular-nums'}">{{ fmt(price) }} ₽</span></div>
          </div>
          <div :style="{borderTop:`1px solid ${T.border}`,marginTop:'12px',paddingTop:'10px'}">
            <div :style="{fontSize:'10px',fontWeight:700,color:T.neutral,textTransform:'uppercase',letterSpacing:'.8px',marginBottom:'8px'}">Мой выбор</div>
            <div :style="{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'10px'}">
              <span :style="{padding:'4px 10px',borderRadius:'6px',background:T.neutral+'18',fontSize:'11px',fontWeight:600,color:T.text}">{{ build.lamps }} {{ spw(build.lamps) }}</span>
              <span :style="{padding:'4px 10px',borderRadius:'6px',background:T.neutral+'18',fontSize:'11px',fontWeight:600,color:T.text}">{{ fmt(Math.round(build.lamps*model.lmPer*diffMult())) }} лм</span>
              <span :style="{padding:'4px 10px',borderRadius:'6px',background:T.neutral+'18',fontSize:'11px',fontWeight:600,color:T.text}">{{ btempK() }}</span>
            </div>
            <div :style="{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'3px'}">
              <div v-for="([k,v]) in myChoicesNoLight" :key="k" :style="{padding:'3px 8px 4px',background:T.cardAlt,borderRadius:'5px'}">
                <div :style="{fontSize:'10px',color:T.textDim,lineHeight:1.2}">{{ k }}</div>
                <div :style="{fontSize:'12px',fontWeight:600,color:T.text,lineHeight:1.2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}">{{ v }}</div>
              </div>
            </div>
          </div>
        </div>
        <div :style="{background:T.card,border:`1px solid ${T.border}`,borderRadius:'16px',padding:'16px',marginBottom:'16px'}">
          <div :style="{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}"><span :style="{fontSize:'17px',fontWeight:600,color:T.text}">Комплектация</span><span :style="{fontSize:'13px',fontWeight:600,color:isDone?T.green:T.textSec}">{{ isDone?'Готово':`${progress.done} из ${progress.total}` }}</span></div>
          <div :style="{height:'5px',background:T.border,borderRadius:'4px',overflow:'hidden',marginBottom:'14px'}"><div :style="{height:'100%',width:progress.pct+'%',background:isDone?T.green:T.text,borderRadius:'4px',transition:'width .3s'}"/></div>

          <!-- Гид по сборке: заметная плашка на первом новом светильнике -->
          <button v-if="showGuidedCTA" :style="{display:'flex',alignItems:'center',gap:'12px',width:'100%',padding:'13px 14px',marginBottom:'14px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.18)',borderRadius:'12px',cursor:'pointer',textAlign:'left',fontFamily:'inherit'}" @click="launchGuided">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{color:T.text,flexShrink:0}"><circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 18h6a3 3 0 0 0 0-6h-2a3 3 0 0 1 0-6h6"/></svg>
            <span :style="{flex:1,minWidth:0}">
              <span :style="{display:'block',fontSize:'15px',fontWeight:700,color:T.text}">Гид по сборке</span>
              <span :style="{display:'block',fontSize:'12px',color:T.textSec,lineHeight:1.35,marginTop:'2px'}">Проведём по каждому параметру и подскажем</span>
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" :style="{color:T.textDim,flexShrink:0}"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          <button v-for="(s,i) in steps" :key="s" :style="{display:'flex',alignItems:'center',gap:'12px',width:'100%',padding:'12px 0',background:'none',border:'none',cursor:'pointer',borderBottom:i<steps.length-1?`1px solid ${T.border}`:'none',textAlign:'left',fontFamily:'inherit'}" @click="goToStep(i)">
            <Icon :name="SM[s]?.icon??'sun'" :size="20" :color="build.steps[s]==='chosen'?T.green:T.textDim"/>
            <span :style="{flex:1,fontSize:'15px',color:T.text}">{{ SM[s]?.name }}</span>
            <span :style="{fontSize:'12px',padding:'6px 12px',borderRadius:'8px',fontWeight:600,background:build.steps[s]==='chosen'?T.green+'22':'transparent',border:build.steps[s]==='chosen'?'1px solid transparent':`1px solid ${T.border}`,color:build.steps[s]==='chosen'?T.green:T.textSec}">{{ build.steps[s]==='chosen'?'Готово':'Выбрать' }}</span>
          </button>

          <!-- Тихая ссылка на гид — когда плашки нет и сборка не завершена -->
          <button v-if="!showGuidedCTA&&!isDone" :style="{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',width:'100%',marginTop:'4px',paddingTop:'14px',background:'none',border:'none',borderTop:`1px solid ${T.border}`,cursor:'pointer',fontFamily:'inherit'}" @click="launchGuided">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{color:T.textSec,flexShrink:0}"><circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 18h6a3 3 0 0 0 0-6h-2a3 3 0 0 1 0-6h6"/></svg>
            <span :style="{fontSize:'15px',color:T.textSec}">Собрать с гидом по шагам</span>
          </button>
        </div>

        <button ref="saveBtnEl" :class="{'fx-save-glow':highlightSave}" :style="{position:'relative',zIndex:highlightSave?49:'auto',width:'100%',padding:'14px',background:T.text,color:T.bg,border:'none',borderRadius:'10px',cursor:'pointer',fontSize:'17px',fontWeight:600,marginBottom:'8px'}" @click="doSave">{{ props.isProvisional?'Добавить':'Сохранить' }}</button>
        <button :style="{width:'100%',padding:'14px',background:'none',border:`2px solid ${T.text}`,borderRadius:'10px',color:T.text,cursor:'pointer',fontSize:'17px',fontWeight:600,display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'8px',marginBottom:'20px'}" @click="showShare=true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>Поделиться</button>

        <!-- Фотогалерея «{Model} в интерьере» — после Сохранить и Поделиться, с воздухом -->
        <div :style="{marginTop:'24px'}">
          <GallerySection
            v-if="galleryDisplayItems.length > 0"
            :items="galleryDisplayItems"
            :title="fxTitle(build.m) + ' в интерьере'"
            context="fx"
            :accent="sc"
            @gift-click="onGalleryGift"
          />
        </div>

        <div :style="{background:T.red+'14',border:`1px solid ${T.red}33`,borderRadius:'10px',padding:'14px',marginTop:'12px'}">
          <div :style="{fontSize:'12px',color:T.textSec,marginBottom:'10px',lineHeight:1.5}">Светильник будет удалён из комнаты. Настройки не сохранятся — при повторном добавлении нужно будет собрать заново.</div>
          <button :style="{width:'100%',padding:'10px',background:'none',border:`1px solid ${T.red}44`,borderRadius:'8px',color:T.red,cursor:'pointer',fontSize:'17px',fontWeight:600}" @click="showDeleteConfirm=true">Удалить светильник</button>
        </div>
      </template>

      <!-- STEP -->
      <template v-if="view==='steps'">
        <div :style="{marginBottom:'16px',paddingTop:'8px'}">
          <div :style="{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}">
            <Icon :name="meta.icon" :color="T.neutral" :size="18"/>
            <span :style="{fontSize:'16px',fontWeight:700}">{{ meta.name }}</span>
            <span :style="{flex:1}"/>
            <span :style="{padding:'3px 10px',borderRadius:'10px',background:T.neutral+'18',fontSize:'10px',color:T.textSec,fontWeight:600,letterSpacing:'.3px'}">{{ stepIdx+1 }}/{{ steps.length }}</span>
          </div>
          <div v-if="curStep!=='size'" :style="{fontSize:'12px',color:T.textSec}">{{ curStep==='bulbs'?`${build.lamps} ${spw(build.lamps)}`:meta.desc }}</div>
        </div>

        <div v-if="curStep==='size'&&roomLabel" :style="{textAlign:'center',marginBottom:'12px'}">
          <div :style="{display:'inline-block',padding:'7px 16px',borderRadius:'20px',background:`linear-gradient(135deg, ${(props.roomTint??T.neutral)}33, ${(props.roomTint??T.neutral)}10)`,border:`1px solid ${(props.roomTint??T.neutral)}55`,fontSize:'13px',fontWeight:600,color:T.text,letterSpacing:'.2px'}">{{ roomLabel }}</div>
        </div>

        <div :style="{background:T.card,border:`1px solid ${T.border}`,borderRadius:'12px',padding:'16px'}">
          <div v-if="curStep==='size'&&families">
            <div v-if="hasRoomContext" :style="{textAlign:'center',marginBottom:'14px'}">
              <div :style="{fontSize:'18px',fontWeight:800,color:T.text,letterSpacing:'.3px',marginBottom:'6px'}">WOODLED Smart</div>
              <div v-if="recommendedMid" :style="{fontSize:'13px',color:T.textSec,fontWeight:500,marginBottom:'8px'}">Рекомендация — <span :style="{fontWeight:700,color:T.text}">{{ fxNav(recommendedMid) }}</span></div>
              <button :style="{display:'inline-flex',alignItems:'center',gap:'6px',padding:'6px 14px',borderRadius:'14px',background:T.neutral+'22',border:`1px solid ${T.neutral}55`,color:T.text,cursor:'pointer',fontSize:'12px',fontWeight:500}" @click="showHelp=true"><span :style="{width:'16px',height:'16px',borderRadius:'50%',background:T.neutral,color:T.bg,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:800}">?</span><span>Как подбирается размер</span></button>
            </div>
            <div :style="{fontSize:'13px',fontWeight:600,color:T.textSec,marginBottom:'10px'}">Сравните размеры:</div>
            <div :style="{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'14px'}">
              <button v-for="fid in families" :key="fid" :style="{padding:'14px 10px',borderRadius:'10px',cursor:'pointer',textAlign:'center',border:build.m===fid?`2px solid ${recommendedMid===fid?T.green:T.neutral}`:`1px solid ${T.border}`,background:build.m===fid?(recommendedMid===fid?T.green+'10':T.neutral+'10'):T.cardAlt,position:'relative',display:'flex',flexDirection:'column',alignItems:'center',gap:'8px'}" @click="()=>{mid=fid;upBuild({m:fid,lamps:MD[fid].lamps})}">
                <div :style="{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',gap:'6px'}"><span :style="{fontSize:'18px',fontWeight:800,color:build.m===fid?T.text:T.textSec,textAlign:'center',lineHeight:1.1}">{{ SIZE_WORD[MD[fid].letter] ?? MD[fid].letter }}</span><span v-if="recommendedMid===fid" :style="{width:'20px',height:'20px',borderRadius:'50%',background:T.green,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',color:T.bg,fontWeight:700,flexShrink:0}">✓</span></div>
                <div v-if="hasRoomContext" :style="{padding:'6px 14px',borderRadius:'7px',background:brightColor(fid)+'22',color:brightColor(fid),fontSize:'13px',fontWeight:700,whiteSpace:'nowrap'}">{{ brightLabel(fid) }}</div>
                <div :style="{padding:'5px 12px',borderRadius:'7px',border:`1px solid ${T.border}`,background:T.card,color:T.text,fontSize:'13px',fontWeight:700,whiteSpace:'nowrap'}">{{ MD[fid].dimD }} см</div>
                <div :style="{fontSize:'11px',color:T.textSec,lineHeight:'1.5'}"><div>{{ fmt(MD[fid].lmPer*MD[fid].lamps) }} лм</div><div>{{ MD[fid].sqMin }}–{{ MD[fid].sqMax }} м²</div></div>
              </button>
            </div>
            <button v-if="recommendedMid&&build.m!==recommendedMid" :style="{width:'100%',padding:'12px',marginBottom:'14px',borderRadius:'10px',cursor:'pointer',border:`1px solid ${T.green}55`,background:T.green+'12',color:T.green,fontSize:'13px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}" @click="selectBestForMe"><span :style="{width:'20px',height:'20px',borderRadius:'50%',background:T.green,color:T.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:700}">✓</span>Выбери за меня</button>
            <div v-if="sizeAdvice" :style="{padding:'12px 14px',background:`linear-gradient(135deg, ${(props.roomTint??T.neutral)}26, ${(props.roomTint??T.neutral)}10)`,border:`1px solid ${(props.roomTint??T.neutral)}44`,borderRadius:'10px',display:'flex',gap:'12px',alignItems:'flex-start'}">
              <div class="rotor-mini" aria-hidden="true"><div v-for="i in 12" :key="i" class="rotor-mini-l" :style="{'--rot': ((i-1)/12*360)+'deg', animationDelay: ((i-1)*30)+'ms'}" /></div>
              <div :style="{fontSize:'12px',lineHeight:1.6,color:T.text,flex:1}">{{ sizeAdvice.text }}</div>
            </div>
          </div>

          <div v-else-if="curStep==='wood'" :style="{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}"><button v-for="mt in simMats" :key="mt.id" :style="{padding:'16px 8px',borderRadius:'10px',cursor:'pointer',border:build.wood===mt.id?(isTouched?'2px solid #fff':`2px solid ${T.neutral}`):`1px solid ${T.border}`,background:build.wood===mt.id?T.neutral+'18':T.card,textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center'}" @click="upBuild({wood:mt.id})"><div :style="{width:'40px',height:'40px',borderRadius:'50%',background:mt.color,border:mt.id==='black'?`2px solid ${T.textDim}`:'none'}"/><div :style="{fontSize:'14px',fontWeight:700,color:build.wood===mt.id?T.text:T.textSec,marginTop:'10px'}">{{ mt.name }}</div><div v-if="mt.tip" :style="{fontSize:'11px',color:T.textDim,marginTop:'6px',lineHeight:'1.4'}">{{ mt.tip }}</div></button></div>
          <div v-else-if="curStep==='mount'" :style="{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}"><button v-for="mt in SIM_MOUNTS" :key="mt.id" :style="{padding:'18px 12px',borderRadius:'8px',cursor:'pointer',textAlign:'center',border:build.mount===mt.id?(isTouched?'2px solid #fff':`2px solid ${T.neutral}`):`1px solid ${T.border}`,background:build.mount===mt.id?T.neutral+'18':T.card,color:build.mount===mt.id?T.text:T.textSec}" @click="upBuild({mount:mt.id})"><div :style="{marginBottom:'8px',display:'flex',justifyContent:'center'}"><Icon :name="mt.id==='pendant'?'fxPendant':'fxFlush'" :size="28" :color="build.mount===mt.id?T.neutral:T.textDim"/></div><div :style="{fontSize:'13px',fontWeight:600}">{{ mt.name }}</div><div :style="{fontSize:'10px',color:T.textDim,marginTop:'6px'}">{{ mt.tip }}</div></button></div>
          <div v-else-if="curStep==='bowl'"><div v-if="freeBowls.length>0"><div :style="{fontSize:'10px',fontWeight:700,color:T.textDim,textTransform:'uppercase',letterSpacing:'.8px',marginBottom:'6px'}">{{ paidBowls.length>0?'Стандарт · входит в цену':'Выберите чашу' }}</div><div :style="{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))',gap:'6px'}"><button v-for="b in freeBowls" :key="b.id" :style="{padding:'10px 8px',borderRadius:'8px',cursor:'pointer',textAlign:'center',border:build.bowl===b.id?(isTouched?'2px solid #fff':`2px solid ${T.neutral}`):`1px solid ${T.border}`,background:build.bowl===b.id?T.neutral+'18':T.card,color:build.bowl===b.id?T.text:T.textSec}" @click="upBuild({bowl:b.id})"><div :style="{fontSize:'12px',fontWeight:600}">{{ b.name }}</div></button></div></div><div v-if="paidBowls.length>0" :style="{marginTop:freeBowls.length>0?'12px':'0'}"><div :style="{fontSize:'10px',fontWeight:700,color:T.yellow,textTransform:'uppercase',letterSpacing:'.8px',marginBottom:'6px'}">С доплатой</div><div :style="{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))',gap:'6px'}"><button v-for="b in paidBowls" :key="b.id" :style="{padding:'10px 8px',borderRadius:'8px',cursor:'pointer',textAlign:'center',border:build.bowl===b.id?(isTouched?'2px solid #fff':`2px solid ${T.neutral}`):`1px solid ${T.border}`,background:build.bowl===b.id?T.neutral+'18':T.card,color:build.bowl===b.id?T.text:T.textSec}" @click="upBuild({bowl:b.id})"><div :style="{fontSize:'12px',fontWeight:600}">{{ b.name }}</div><div :style="{fontSize:'11px',color:T.yellow,marginTop:'3px'}">+{{ fmt(b.price) }} ₽</div></button></div></div></div>
          <div v-else-if="curStep==='temp'" :style="{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'6px'}"><button v-for="bt in BTEMPS" :key="bt.id" :style="{padding:'12px 6px',borderRadius:'8px',cursor:'pointer',textAlign:'center',border:build.btemp===bt.id?(isTouched?'2px solid #fff':`2px solid ${T.neutral}`):`1px solid ${T.border}`,background:build.btemp===bt.id?T.neutral+'18':T.card,color:build.btemp===bt.id?T.text:T.textSec}" @click="upBuild({btemp:bt.id})"><div :style="{fontSize:'13px',fontWeight:700}">{{ bt.label }}</div><div :style="{fontSize:'11px',color:T.textDim,marginTop:'2px'}">{{ bt.kelvin }}К</div><div v-if="bt.tip" :style="{fontSize:'10px',color:T.textSec,marginTop:'6px',lineHeight:'1.3'}">{{ bt.tip }}</div></button></div>
          <div v-else-if="curStep==='patrons'"><div :style="{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:'8px'}"><button v-for="v in lampOpts()" :key="v" :style="{padding:'14px 6px',borderRadius:'10px',cursor:'pointer',textAlign:'center',border:build.lamps===v?(isTouched?'2px solid #fff':`2px solid ${T.neutral}`):`1px solid ${T.border}`,background:build.lamps===v?T.neutral+'18':T.card,transition:'all .15s'}" @click="upBuild({lamps:v})"><div :style="{display:'inline-block',padding:'2px 8px',borderRadius:'4px',background:T.neutral+'22',fontSize:'11px',fontWeight:700,color:T.neutral,marginBottom:'8px'}">{{ v }} {{ spw(v) }}</div><div :style="{fontSize:'20px',fontWeight:800,color:build.lamps===v?T.yellow:T.text}">{{ fmt(Math.round(v*model.lmPer*diffMult())) }} <span :style="{fontSize:'12px',fontWeight:400,color:T.textDim}">лм</span></div><div v-if="v===model.lamps" :style="{fontSize:'10px',color:T.neutral,marginTop:'6px'}">стандарт</div><div v-if="(v-model.lamps)*model.sur>0" :style="{fontSize:'11px',color:T.yellow,marginTop:'4px',fontWeight:700}">+{{ fmt((v-model.lamps)*model.sur) }} ₽</div></button></div></div>
          <div v-else-if="curStep==='diffuser'" :style="{display:'flex',flexDirection:'column',gap:'8px'}"><button :style="{width:'100%',padding:'14px 16px',borderRadius:'10px',cursor:'pointer',textAlign:'left',border:build.diffuser?(isTouched?'2px solid #fff':`2px solid ${T.neutral}`):`1px solid ${T.border}`,background:build.diffuser?T.neutral+'12':T.cardAlt,color:T.text,display:'flex',alignItems:'center',justifyContent:'space-between'}" @click="upBuild({diffuser:true})"><div><div :style="{fontSize:'14px',fontWeight:700}">Добавить рассеиватель</div><div :style="{fontSize:'11px',color:T.textDim,marginTop:'4px'}">{{ OPT_TIPS.diffuser.on }}</div></div><span :style="{fontSize:'14px',fontWeight:700,color:T.yellow,flexShrink:0}">+{{ fmt(OPT_PRICE.diffuser) }} ₽</span></button><button :style="{width:'100%',padding:'14px 16px',borderRadius:'10px',cursor:'pointer',textAlign:'left',border:!build.diffuser?(isTouched?'2px solid #fff':`2px solid ${T.neutral}`):`1px solid ${T.border}`,background:!build.diffuser?T.neutral+'12':T.cardAlt,color:T.textSec,fontSize:'13px'}" @click="upBuild({diffuser:false})">{{ OPT_TIPS.diffuser.off }}</button></div>
          <div v-else-if="curStep==='wire'&&model.wireOpts" :style="{display:'flex',flexDirection:'column',gap:'6px'}"><button v-for="w in model.wireOpts" :key="w.id" :style="{textAlign:'left',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',borderRadius:'8px',cursor:'pointer',border:build.wire===w.id?(isTouched?'2px solid #fff':`2px solid ${T.neutral}`):`1px solid ${T.border}`,background:build.wire===w.id?T.neutral+'18':T.card,color:build.wire===w.id?T.text:T.textSec}" @click="upBuild({wire:w.id})"><div><div :style="{fontSize:'13px',fontWeight:600}">{{ w.label }}</div><div v-if="w.tip" :style="{fontSize:'10px',color:T.textDim,marginTop:'2px'}">{{ w.tip }}</div></div><span v-if="w.price>0" :style="{fontSize:'12px',fontWeight:700,color:T.yellow,flexShrink:0}">+{{ fmt(w.price) }} ₽</span><span v-else :style="{fontSize:'10px',color:T.green,flexShrink:0}">стандарт</span></button></div>
          <div v-else-if="curStep==='base'" :style="{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}"><button v-for="(bc,bcId) in BASE_COLORS" :key="bcId" :style="{padding:'20px 10px',borderRadius:'8px',cursor:'pointer',textAlign:'center',border:build.baseColor===bcId?(isTouched?'2px solid #fff':`2px solid ${T.neutral}`):`1px solid ${T.border}`,background:build.baseColor===bcId?T.neutral+'18':T.card,color:build.baseColor===bcId?T.text:T.textSec}" @click="upBuild({baseColor:String(bcId)})"><div :style="{width:'36px',height:'36px',borderRadius:'50%',background:bc.color,margin:'0 auto 8px',border:`1px solid ${T.border}`}"/><div :style="{fontSize:'14px',fontWeight:700}">{{ bc.name }}</div></button></div>
          <div v-else-if="curStep==='bulbs'&&model.bulbOpts" :style="{display:'flex',flexDirection:'column',gap:'6px'}"><div :style="{fontSize:'12px',color:T.textSec,marginBottom:'2px'}">Включить в комплект?</div><button v-for="bo in model.bulbOpts" :key="bo.id" :style="{textAlign:'left',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 16px',borderRadius:'8px',cursor:'pointer',border:build.bulbOpt===bo.id?(isTouched?'2px solid #fff':`2px solid ${T.neutral}`):`1px solid ${T.border}`,background:build.bulbOpt===bo.id?T.neutral+'18':T.card,color:build.bulbOpt===bo.id?T.text:T.textSec,fontSize:'14px'}" @click="upBuild({bulbOpt:bo.id})"><span :style="{fontWeight:600}">{{ bo.label }}</span><span v-if="bo.price>0" :style="{fontWeight:700,color:T.yellow}">+{{ fmt(bo.price) }} ₽</span></button></div>
          <div v-else-if="curStep==='bulbs'" :style="{display:'flex',flexDirection:'column',gap:'8px'}"><button :style="{width:'100%',padding:'14px 16px',borderRadius:'10px',cursor:'pointer',textAlign:'left',border:build.bulbs?(isTouched?'2px solid #fff':`2px solid ${T.neutral}`):`1px solid ${T.border}`,background:build.bulbs?T.neutral+'12':T.cardAlt,color:T.text,display:'flex',alignItems:'center',justifyContent:'space-between'}" @click="upBuild({bulbs:true})"><div><div :style="{fontSize:'14px',fontWeight:700}">Да, {{ build.lamps }} {{ slw(build.lamps) }} в комплекте</div><div :style="{fontSize:'11px',color:T.textDim,marginTop:'4px'}">{{ build.lamps }} {{ spw(build.lamps) }} × {{ fmt(bulbPer()) }} ₽</div></div><span :style="{fontSize:'14px',fontWeight:700,color:T.yellow,flexShrink:0}">+{{ fmt(bulbTotal()) }} ₽</span></button><button :style="{width:'100%',padding:'14px 16px',borderRadius:'10px',cursor:'pointer',textAlign:'left',border:!build.bulbs?(isTouched?'2px solid #fff':`2px solid ${T.neutral}`):`1px solid ${T.border}`,background:!build.bulbs?T.neutral+'12':T.cardAlt,color:T.textSec,fontSize:'13px'}" @click="upBuild({bulbs:false})">Подберу свои лампочки</button></div>
        </div>
        <button :style="{width:'100%',marginTop:'14px',padding:'14px',border:'none',borderRadius:'10px',cursor:'pointer',fontWeight:700,fontSize:'14px',background:isTouched?T.text:T.neutral+'33',color:isTouched?T.bg:T.neutral}" @click="doCommit(isTouched)">{{ isTouched?'Готово':'Пропустить' }}</button>
      </template>
    </div>

    <div v-if="showDeleteConfirm" :style="{position:'fixed',inset:0,zIndex:60,background:'rgba(0,0,0,.7)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}" @click.self="showDeleteConfirm=false">
      <div :style="{width:'100%',maxWidth:'340px',background:T.bg,borderRadius:'16px',border:`1px solid ${T.border}`,padding:'24px 20px',textAlign:'center'}">
        <div :style="{fontSize:'16px',fontWeight:700,color:T.text,marginBottom:'8px'}">Удалить светильник?</div>
        <div :style="{fontSize:'13px',color:T.textSec,lineHeight:1.5,marginBottom:'20px'}">{{ fxTitle(build.m) }} будет удалён из комнаты. Все настройки потеряются.</div>
        <div :style="{display:'flex',gap:'8px'}">
          <button :style="{flex:1,padding:'12px',borderRadius:'10px',border:`1px solid ${T.border}`,background:T.card,color:T.textSec,cursor:'pointer',fontSize:'13px',fontWeight:600}" @click="showDeleteConfirm=false">Отмена</button>
          <button :style="{flex:1,padding:'12px',borderRadius:'10px',border:'none',background:T.red,color:'#fff',cursor:'pointer',fontSize:'13px',fontWeight:700}" @click="showDeleteConfirm=false;emit('delete')">Удалить</button>
        </div>
      </div>
    </div>

    <!-- Спотлайт-затемнение при тапе по плашке «Сохранить» (кнопка всплывает выше) -->
    <div :style="{position:'fixed',inset:0,zIndex:48,background:'rgba(0,0,0,0.55)',pointerEvents:'none',opacity:highlightSave?1:0,transition:'opacity .45s ease'}" />

    <LeaveConfirmModal
      v-if="showLeaveConfirm"
      :title="props.isProvisional ? 'Светильник\nне добавлен' : 'Изменения\nне сохранятся'"
      :save-label="props.isProvisional ? 'Добавить' : 'Сохранить'"
      @save="doSave" @discard="confirmLeave" @cancel="showLeaveConfirm=false"
    />

    <SmartHelpModal v-if="showHelp" @close="showHelp=false" />

    <ShareModal
      v-if="showShare"
      :longUrl="fixtureLongUrl"
      subtitle="Поделитесь светильником WOODLED"
      :shareTitle="fxTitle(build.m)"
      :shareText="`Посмотрите светильник ${fxTitle(build.m)} WOODLED`"
      @close="showShare=false"
      @feedback="(msg) => emit('feedback', msg)"
    />
  </div>
</template>

<style scoped>
/* FIX-2026-05-09-deploy — если этой строки нет в репо после загрузки, значит залился старый файл */
/* Спотлайт-подсветка нижней кнопки «Сохранить» (пульс поверх затемнения) */
.fx-save-glow { animation: fxSavePulse 0.9s ease-in-out infinite; }
@keyframes fxSavePulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(255,255,255,0.18), 0 0 22px rgba(255,255,255,0.25); }
  50%      { box-shadow: 0 0 0 5px rgba(255,255,255,0.30), 0 0 34px rgba(255,255,255,0.45); }
}
.rotor-mini { width: 32px; height: 32px; position: relative; flex-shrink: 0; }
.rotor-mini-l {
  position: absolute; top: 50%; left: 50%;
  width: 2px; height: 8px; margin: -4px 0 0 -1px;
  border-radius: 1px;
  background: linear-gradient(to bottom, #d4b87a, #b4915a, #8a6e3e);
  transform-origin: 50% 50%;
  animation: rotorMiniCycle 5000ms ease-in-out infinite;
  opacity: 0;
}
@keyframes rotorMiniCycle {
  0%   { transform: rotate(var(--rot)) translateY(-22px) scale(0.3); opacity: 0; }
  5%   { transform: rotate(var(--rot)) translateY(-10px) scale(1);   opacity: 0.95; }
  80%  { transform: rotate(var(--rot)) translateY(-10px) scale(1);   opacity: 0.95; }
  90%  { transform: rotate(var(--rot)) translateY(-22px) scale(0.3); opacity: 0; }
  100% { transform: rotate(var(--rot)) translateY(-22px) scale(0.3); opacity: 0; }
}
</style>
