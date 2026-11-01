import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useGame } from '../../store/gameStore';
import { useUI } from '../../store/uiStore';
import { CLUE_MAP, MONITOR_VITALS, TRIAGE_VITALS } from '../../engines/case/chestPainCase';
import type { ClueCategory } from '../../types/game';
import { fmtTime, useObjectives } from '../hud/useLevel';
import { ReasoningBoard } from './ReasoningBoard';
import { REASONING_UNLOCK_CLUES } from '../../config/modes';

const TITLES = { inventory: ['線索背包', 'Clinical Evidence Inventory'], notes: ['病歷筆記', 'Clinical Notes（自動整理）'], reasoning: ['臨床推理板', 'Clinical Reasoning Board'], results: ['檢查結果', 'Results'], tasks: ['任務清單', 'Objectives'] } as const;

export function DockPanels() {
  const dock = useUI((s) => s.dock);
  if (!dock) return null;
  const [t, sub] = TITLES[dock];
  const wide = dock === 'reasoning';
  return (
    <motion.section key={dock} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      className={`glass absolute bottom-24 left-1/2 z-[36] flex -translate-x-1/2 flex-col overflow-hidden rounded-2xl ${wide ? 'top-6 w-[min(1280px,96vw)]' : 'max-h-[62vh] w-[min(860px,92vw)]'}`}>
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div><span className="text-lg font-bold">{t}</span><span className="ml-2 text-xs text-slate-400">{sub}</span></div>
        <button className="rounded px-2 py-1 text-slate-400 hover:bg-white/10" onClick={() => useUI.getState().openDock(null)}>✕</button>
      </header>
      <div className="scroll-thin flex-1 overflow-y-auto p-5">
        {dock === 'inventory' && <Inventory />}
        {dock === 'notes' && <Notes />}
        {dock === 'reasoning' && <ReasoningGate />}
        {dock === 'results' && <Results />}
        {dock === 'tasks' && <Tasks />}
      </div>
    </motion.section>
  );
}

function Inventory() {
  const clues = useGame((s) => s.level1.clues);
  const clinical = clues.filter((c) => !CLUE_MAP[c.id]?.narrative);
  const story = clues.filter((c) => CLUE_MAP[c.id]?.narrative);
  const Card = ({ id, at, interpreted }: { id: string; at: number; interpreted: boolean }) => {
    const d = CLUE_MAP[id];
    return (
      <div className={`rounded-xl border p-3 ${d.narrative ? 'border-warn/30 bg-warn/5' : 'border-white/10 bg-white/[0.03]'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold">{d.title}</div>
          {!d.narrative && <span className={`chip shrink-0 ${interpreted ? 'border-teal/60 text-teal' : 'text-slate-500'}`}>{interpreted ? '已判讀' : '未判讀'}</span>}
        </div>
        <div className="mt-0.5 text-[11px] text-slate-400">來源：{d.source}・取得 {fmtTime(at)}</div>
        <p className="mt-1.5 text-sm text-slate-200">{d.summary}</p>
      </div>
    );
  };
  if (clues.length === 0) return <p className="text-center text-slate-500">尚未取得任何線索。探索診察室並與病人對話。</p>;
  return (
    <div className="space-y-5">
      <div>
        <h4 className="mb-2 text-sm font-semibold text-teal">臨床線索（{clinical.length}）</h4>
        <div className="grid gap-2 md:grid-cols-2">{clinical.map((c) => <Card key={c.id} id={c.id} at={c.acquiredAt} interpreted={c.interpreted} />)}</div>
      </div>
      {story.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-warn">劇情線索（{story.length}）</h4>
          <div className="grid gap-2 md:grid-cols-2">{story.map((c) => <Card key={c.id} id={c.id} at={c.acquiredAt} interpreted={c.interpreted} />)}</div>
        </div>
      )}
      <p className="text-xs text-slate-500">「已判讀」表示該線索已在臨床推理板中被歸類使用。</p>
    </div>
  );
}

const NOTE_SECTIONS: [string, ClueCategory[]][] = [
  ['檢傷與生命徵象', ['triage', 'vitals']],
  ['現病史（OPQRST）', ['hpi']],
  ['伴隨症狀（＋）', ['associated']],
  ['重要陰性（−）', ['negative']],
  ['過去病史', ['pmh', 'record']],
  ['用藥', ['meds']],
  ['過敏史', ['allergy']],
  ['社會史', ['social']],
  ['家族史', ['family']],
];

function Notes() {
  const clues = useGame((s) => s.level1.clues);
  const ids = clues.map((c) => c.id);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {NOTE_SECTIONS.map(([title, cats]) => {
        const items = ids.map((i) => CLUE_MAP[i]).filter((d) => d && !d.narrative && cats.includes(d.category));
        return (
          <div key={title} className="rounded-xl border border-white/10 p-3">
            <div className="mb-1 flex justify-between text-sm font-semibold"><span>{title}</span><span className="text-xs text-slate-500">{items.length} 筆</span></div>
            {items.length === 0 ? <p className="text-xs italic text-slate-500">尚未取得資料</p> : (
              <ul className="space-y-1 text-sm text-slate-200">{items.map((d) => <li key={d.id}><span className="text-teal">•</span> {d.summary}</li>)}</ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ReasoningGate() {
  const unlocked = useGame((s) => s.level1.flags.includes('reasoning_unlocked'));
  const n = useGame((s) => s.level1.clues.filter((c) => !CLUE_MAP[c.id]?.narrative).length);
  const triage = useGame((s) => s.level1.clues.some((c) => c.id === 'cl_triage'));
  if (unlocked) return <ReasoningBoard />;
  return (
    <div className="py-16 text-center">
      <div className="text-5xl">🔒</div>
      <p className="mt-4 text-lg font-semibold">臨床推理板尚未啟動</p>
      <p className="mt-1 text-sm text-slate-400">需要閱讀檢傷資料，並蒐集至少 {REASONING_UNLOCK_CLUES} 項臨床線索。</p>
      <div className="mx-auto mt-4 h-2 w-64 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-teal transition-all" style={{ width: `${Math.min(100, (n / REASONING_UNLOCK_CLUES) * 100)}%` }} /></div>
      <p className="mt-2 font-mono text-xs text-slate-400">{n}/{REASONING_UNLOCK_CLUES}　檢傷資料 {triage ? '✓' : '✗'}</p>
    </div>
  );
}

function Results() {
  const clues = useGame((s) => s.level1.clues);
  const has = (id: string) => clues.some((c) => c.id === id);
  const Block = ({ title, children, locked }: { title: string; children?: ReactNode; locked?: string }) => (
    <div className="rounded-xl border border-white/10 p-4">
      <div className="mb-2 font-semibold">{title}</div>
      {locked ? <p className="text-sm text-slate-500">🔒 {locked}</p> : children}
    </div>
  );
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Block title={`檢傷生命徵象（${TRIAGE_VITALS.time}）`} locked={has('cl_triage') ? undefined : '請先閱讀檢傷單'}>
        <div className="grid grid-cols-3 gap-2 text-sm">
          {[['BP', TRIAGE_VITALS.bp], ['HR', TRIAGE_VITALS.hr], ['RR', TRIAGE_VITALS.rr], ['SpO₂', TRIAGE_VITALS.spo2], ['BT', TRIAGE_VITALS.bt], ['Pain', TRIAGE_VITALS.pain]].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-black/25 p-2"><div className="text-[10px] text-slate-400">{k}</div><div className="font-mono">{v}</div></div>
          ))}
        </div>
      </Block>
      <Block title="床邊監視器" locked={has('cl_monitor') ? undefined : '請查看病床旁的監視器'}>
        <p className="font-mono text-sm">HR {MONITOR_VITALS.hr}・BP {MONITOR_VITALS.sys}/{MONITOR_VITALS.dia}・RR {MONITOR_VITALS.rr}・SpO₂ {MONITOR_VITALS.spo2}%</p>
      </Block>
      <Block title="12 導程心電圖" locked="檔案遭系統鎖定（E-17）——將於 LEVEL 03 判讀" />
      <Block title="身體檢查／檢驗／影像" locked="LEVEL 02–03 解鎖（Phase 2 開發中）" />
    </div>
  );
}

function Tasks() {
  const objs = useObjectives();
  return (
    <ul className="space-y-2">
      {objs.map((o) => (
        <li key={o.id} className={`flex items-start gap-3 rounded-xl border p-3 ${o.done ? 'border-teal/30 bg-teal/5' : 'border-white/10'}`}>
          <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${o.done ? 'bg-teal text-navy' : 'border border-white/30'}`}>{o.done ? '✓' : ''}</span>
          <div className="flex-1">
            <div className={`font-semibold ${o.done ? 'text-slate-400 line-through decoration-teal/50' : ''}`}>{o.title}{o.optional && <span className="ml-2 text-xs font-normal text-slate-500">建議</span>}</div>
            <div className="text-xs text-slate-400">{o.detail}</div>
          </div>
          {o.prog && <span className="font-mono text-xs text-teal">{o.prog[0]}/{o.prog[1]}</span>}
        </li>
      ))}
    </ul>
  );
}
