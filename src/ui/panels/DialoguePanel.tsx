import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useGame } from '../../store/gameStore';
import { useUI } from '../../store/uiStore';
import { DIALOGUE, TOPIC_LABEL, TOPIC_ORDER } from '../../data/level1/dialogue';
import { evaluateCondition } from '../../engines/narrative/conditions';
import { PATIENT } from '../../engines/case/chestPainCase';
import type { TopicId } from '../../engines/narrative/types';
import { useLevelCtx } from '../hud/useLevel';
import { sfx } from '../../audio/audioEngine';

const EMOTION: Record<string, [string, string]> = {
  pained: ['不適', 'text-warn'], anxious: ['焦慮', 'text-crit'], hesitant: ['猶豫', 'text-warn'], calmer: ['較平穩', 'text-ok'], neutral: ['平穩', 'text-slate-300'],
};

/** 病人分支式問診介面 */
export function DialoguePanel() {
  const open = useUI((s) => s.dialogueOpen);
  const close = () => useUI.getState().openDialogue(false);
  const ask = useGame((s) => s.ask);
  const asked = useGame((s) => s.level1.asked);
  const transcript = useGame((s) => s.level1.transcript);
  const emotion = useGame((s) => s.level1.emotion);
  const nurseActive = useGame((s) => !!s.level1.activeNurse || !!s.level1.lastNurseOutcome);
  const ctx = useLevelCtx();
  const [topic, setTopic] = useState<TopicId>('opening');
  const scroller = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => DIALOGUE.filter((d) => evaluateCondition(d.visibleWhen, ctx)), [ctx]);
  const byTopic = (t: TopicId) => visible.filter((d) => d.topic === t);
  useEffect(() => { scroller.current?.scrollTo({ top: 1e6, behavior: 'smooth' }); }, [transcript.length, open]);
  const isNew = (id: string) => !!DIALOGUE.find((d) => d.id === id)?.visibleWhen;
  if (!open) return null;
  const [emoLabel, emoColor] = EMOTION[emotion] ?? EMOTION.neutral;
  const lines = transcript.filter((l) => l.speaker !== 'system').slice(-30);

  return (
    <motion.aside initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
      className="glass absolute bottom-24 right-5 top-24 z-[35] flex w-[min(560px,46vw)] flex-col overflow-hidden rounded-2xl">
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-lg font-bold">林</div>
        <div className="flex-1">
          <div className="font-bold">{PATIENT.displayName}<span className="ml-2 text-xs font-normal text-slate-400">{PATIENT.sex}・{PATIENT.age} 歲・{PATIENT.bed}</span></div>
          <div className="text-xs text-slate-400">病人狀態：<span className={emoColor}>{emoLabel}</span>・（標準化病人以分支對話呈現；3D 擬真病人模型待補）</div>
        </div>
        <button className="rounded px-2 py-1 text-slate-400 hover:bg-white/10" onClick={close}>✕</button>
      </header>

      <div ref={scroller} className="scroll-thin flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {lines.length === 0 && <p className="py-8 text-center text-sm text-slate-500">病人躺在診察床上，手按著胸口，呼吸有些急促。<br />選擇下方的問題開始問診。</p>}
        {lines.map((l, i) => (
          <div key={i} className={`flex ${l.speaker === 'doctor' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
              l.speaker === 'doctor' ? 'rounded-br-sm bg-teal/20 text-paper' : l.speaker === 'nurse' ? 'rounded-bl-sm border border-warn/30 bg-warn/10' : 'rounded-bl-sm bg-white/[0.07]'}`}>
              {l.speaker !== 'doctor' && <div className="mb-0.5 text-[11px] text-slate-400">{l.speaker === 'nurse' ? '護理師' : '林先生'}</div>}
              {l.stage && <div className="mb-1 text-xs italic text-slate-400">（{l.stage}）</div>}
              <div className="whitespace-pre-line">{l.text}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 bg-black/20">
        <div className="scroll-thin flex gap-1 overflow-x-auto px-3 pt-2">
          {TOPIC_ORDER.map((t) => {
            const opts = byTopic(t);
            const remaining = opts.filter((o) => !asked.includes(o.id)).length;
            return (
              <button key={t} onClick={() => { sfx('click'); setTopic(t); }}
                className={`whitespace-nowrap rounded-t-lg px-3 py-1.5 text-xs font-semibold transition ${topic === t ? 'bg-white/10 text-teal' : 'text-slate-400 hover:text-white'}`}>
                {TOPIC_LABEL[t]}{remaining > 0 && <span className="ml-1 text-[10px] text-slate-500">{remaining}</span>}
              </button>
            );
          })}
        </div>
        <div className="scroll-thin max-h-56 space-y-1.5 overflow-y-auto bg-white/5 p-3">
          {byTopic(topic).length === 0 && <p className="text-xs text-slate-500">此主題目前沒有可詢問的問題。</p>}
          {byTopic(topic).map((o) => {
            const done = asked.includes(o.id);
            return (
              <button key={o.id} disabled={nurseActive} onClick={() => { sfx('click'); ask(o.id); }}
                className={`flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${done ? 'border-transparent text-slate-500' : 'border-white/10 hover:border-teal/60 hover:bg-teal/10'}`}>
                <span className={`mt-0.5 text-xs ${done ? 'text-slate-600' : 'text-teal'}`}>{done ? '✓' : '›'}</span>
                <span className="flex-1">{o.label}</span>
                {!done && isNew(o.id) && <span className="chip border-warn/60 text-[10px] text-warn">新</span>}
              </button>
            );
          })}
        </div>
      </div>
    </motion.aside>
  );
}
