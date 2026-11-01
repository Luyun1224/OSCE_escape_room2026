import { motion } from 'motion/react';
import { useGame } from '../../store/gameStore';
import { NURSE_EVENTS, NURSE_NAME } from '../../data/level1/nurseEvents';
import { sfx } from '../../audio/audioEngine';

const VERDICT: Record<string, [string, string]> = {
  safe: ['安全的決策', 'border-ok/60 text-ok'], suboptimal: ['次佳決策', 'border-warn/60 text-warn'], unsafe: ['病人安全風險', 'border-crit/60 text-crit'], neutral: ['', ''],
};

/** 團隊事件：護理師請求醫囑（決策點） */
export function NursePanel() {
  const activeId = useGame((s) => s.level1.activeNurse);
  const outcome = useGame((s) => s.level1.lastNurseOutcome);
  const mode = useGame((s) => s.profile?.mode);
  const choose = useGame((s) => s.chooseNurse);
  const dismiss = useGame((s) => s.dismissNurseOutcome);
  const ev = NURSE_EVENTS.find((n) => n.id === (activeId ?? outcome?.eventId));
  if (!ev || (!activeId && !outcome)) return null;
  const showVerdict = mode !== 'assessment';

  return (
    <div className="absolute inset-0 z-[42] flex items-end justify-center bg-gradient-to-t from-black/70 via-black/30 to-transparent pb-28">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass w-[min(720px,92vw)] rounded-2xl border-l-4 border-l-warn p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warn/20 text-warn">RN</div>
          <div>
            <div className="text-xs tracking-widest text-warn">團隊事件 · {ev.title}</div>
            <div className="font-semibold">{NURSE_NAME}</div>
          </div>
        </div>
        {activeId && !outcome && (
          <>
            <p className="mt-3 leading-relaxed">「{ev.prompt}」</p>
            <div className="mt-4 space-y-2">
              {ev.options.map((o) => (
                <button key={o.id} onClick={() => { sfx('click'); choose(ev.id, o.id); }}
                  className="w-full rounded-lg border border-white/10 px-4 py-2.5 text-left text-sm transition hover:border-teal/70 hover:bg-teal/10">
                  › {o.label}
                </button>
              ))}
            </div>
          </>
        )}
        {outcome && (
          <>
            <p className="mt-3 leading-relaxed">「{outcome.nurse}」</p>
            {outcome.patient && <p className="mt-2 rounded-lg bg-white/5 px-3 py-2 text-sm italic text-slate-300">{outcome.patient}</p>}
            {showVerdict && outcome.verdict !== 'neutral' && (
              <div className={`mt-4 rounded-lg border p-3 text-sm ${VERDICT[outcome.verdict][1]}`}>
                <div className="font-bold">{VERDICT[outcome.verdict][0]}</div>
                <p className="mt-1 text-paper/90">{outcome.teaching}</p>
              </div>
            )}
            {!showVerdict && outcome.verdict !== 'neutral' && <p className="mt-3 text-xs text-slate-500">（OSCE 模擬模式：決策已記錄，解析於評核結束後提供）</p>}
            <div className="mt-4 text-right"><button className="btn btn-primary" onClick={() => { sfx('click'); dismiss(); }}>繼續</button></div>
          </>
        )}
      </motion.div>
    </div>
  );
}
