import { AnimatePresence, motion } from 'motion/react';
import { useGame } from '../../store/gameStore';
import { useUI, type DockPanel } from '../../store/uiStore';
import { fmtTime, useObjectives } from './useLevel';
import { hintLimit, MODE_INFO, timeLimitMs } from '../../config/modes';
import { VIEWPOINTS } from '../../data/level1/objects';
import { CLUE_MAP } from '../../engines/case/chestPainCase';
import { ReviewBadge } from '../common/Modal';
import { sfx } from '../../audio/audioEngine';
import { handleInteraction } from '../../engines/interaction/interactionEngine';

export function HUD() {
  const profile = useGame((s) => s.profile)!;
  const elapsed = useGame((s) => s.level1.elapsedMs);
  const hints = useGame((s) => s.level1.hints.length);
  const clueCount = useGame((s) => s.level1.clues.filter((c) => !CLUE_MAP[c.id]?.narrative).length);
  const reasoning = useGame((s) => s.level1.flags.includes('reasoning_unlocked'));
  const vp = useGame((s) => s.level1.viewpoint);
  const setViewpoint = useGame((s) => s.setViewpoint);
  const setScreen = useGame((s) => s.setScreen);
  const ui = useUI();
  const objectives = useObjectives();
  const current = objectives.find((o) => !o.done && !o.optional) ?? objectives.find((o) => !o.done);
  const doneCount = objectives.filter((o) => o.done && !o.optional).length;
  const required = objectives.filter((o) => !o.optional).length;
  const limit = timeLimitMs(profile.mode, profile.difficulty);
  const hl = hintLimit(profile.mode, profile.difficulty);
  const remaining = limit !== null ? limit - elapsed : null;

  const dock: [DockPanel, string, string, number | string | null][] = [
    ['inventory', '線索背包', '◈', clueCount],
    ['notes', '病歷筆記', '✎', null],
    ['reasoning', '臨床推理板', '⌬', reasoning ? '!' : '🔒'],
    ['results', '檢查結果', '♥', null],
    ['tasks', '任務清單', '☑', `${doneCount}/${required}`],
  ];

  return (
    <>
      {/* 左上：關卡與任務目標 */}
      <div className="pointer-events-none absolute left-5 top-5 z-30 max-w-sm">
        <div className="glass-light pointer-events-auto rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.25em] text-teal">LEVEL 01 · 夜間急診診察室</div>
          <div className="text-lg font-bold">消失的病歷 <span className="text-sm font-medium text-slate-400">病史詢問</span></div>
          <AnimatePresence mode="wait">
            {current && (
              <motion.div key={current.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 border-t border-white/10 pt-2">
                <div className="text-[11px] text-slate-400">目前任務{current.optional && '（建議）'}</div>
                <div className="font-semibold text-paper">{current.title}{current.prog && <span className="ml-2 font-mono text-xs text-teal">{current.prog[0]}/{current.prog[1]}</span>}</div>
                <div className="text-xs text-slate-400">{current.detail}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="mt-2"><ReviewBadge className="pointer-events-auto bg-black/40" /></div>
      </div>

      {/* 右上：計時、提示、設定 */}
      <div className="absolute right-5 top-5 z-30 flex items-center gap-2">
        <div className="glass-light rounded-xl px-3 py-2 text-right">
          <div className="text-[10px] tracking-widest text-slate-400">{MODE_INFO[profile.mode].title}</div>
          {remaining !== null ? (
            <div className={`font-mono text-xl font-bold ${remaining < 120000 ? 'text-crit' : 'text-paper'}`}>{remaining > 0 ? fmtTime(remaining) : `+${fmtTime(-remaining)}`}</div>
          ) : (
            <div className="font-mono text-xl font-bold text-paper/80">{fmtTime(elapsed)}</div>
          )}
        </div>
        <button className="glass-light rounded-xl px-3 py-2 text-sm hover:border-teal" onClick={() => { sfx('click'); ui.setHint(true); }}>
          💡 提示<span className="ml-1 font-mono text-xs text-slate-400">{hl === null ? hints : `${hl - hints}/${hl}`}</span>
        </button>
        <button className="glass-light rounded-xl px-3 py-2 text-sm hover:border-teal" onClick={() => ui.setSettings(true)} aria-label="設定">⚙</button>
        <button className="glass-light rounded-xl px-3 py-2 text-sm hover:border-teal" onClick={() => setScreen('home')} title="返回首頁（進度已自動保存）">⌂</button>
      </div>

      {/* 左下：視角切換 */}
      <div className="absolute bottom-24 left-5 z-30 flex flex-col gap-1">
        {Object.entries(VIEWPOINTS).map(([id, v]) => (
          <button key={id} onClick={() => { sfx('click'); setViewpoint(id); }}
            className={`rounded-lg px-3 py-1 text-left text-xs transition ${vp === id ? 'bg-teal/25 text-white' : 'bg-black/35 text-slate-300 hover:bg-black/55'}`}>
            ◉ {v.label}
          </button>
        ))}
        <div className="mt-1 text-[10px] text-slate-500">按住 Space 顯示互動物件</div>
      </div>

      {/* 下方工具列 */}
      <div className="absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-2">
        {dock.map(([id, label, icon, badge]) => (
          <button key={id} onClick={() => { sfx('click'); ui.setDock(id); }}
            className={`glass-light group relative flex min-w-[96px] flex-col items-center rounded-xl px-4 py-2 transition hover:-translate-y-0.5 ${ui.dock === id ? '!border-teal !bg-teal/20' : ''}`}>
            <span className="text-lg leading-none text-teal">{icon}</span>
            <span className="mt-1 text-xs font-semibold">{label}</span>
            {badge !== null && <span className="absolute -right-1.5 -top-1.5 rounded-full bg-navy-3 px-1.5 text-[10px] font-bold text-teal ring-1 ring-teal/50">{badge}</span>}
          </button>
        ))}
        <button onClick={() => handleInteraction('patient')}
          className="glass-light flex min-w-[96px] flex-col items-center rounded-xl px-4 py-2 transition hover:-translate-y-0.5">
          <span className="text-lg leading-none text-teal">💬</span><span className="mt-1 text-xs font-semibold">與病人對話</span>
        </button>
      </div>

      {/* 通知 */}
      <div className="pointer-events-none absolute left-1/2 top-5 z-[45] flex w-80 -translate-x-1/2 flex-col items-center gap-2">
        <AnimatePresence>
          {ui.toasts.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
              className={`glass rounded-lg border-l-4 px-3 py-2 text-sm ${t.kind === 'clue' ? 'border-l-teal' : t.kind === 'success' ? 'border-l-ok' : t.kind === 'warn' ? 'border-l-warn' : 'border-l-slate-400'}`}>
              {t.kind === 'clue' && <span className="mr-1 text-teal">◈</span>}{t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
