import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useGame } from '../../store/gameStore';
import { MODE_INFO, ROLE_LABEL } from '../../config/modes';
import { sfx } from '../../audio/audioEngine';

const LINES = [
  '02:13 AM　急診部',
  '院內臨床資訊系統發生異常。緊急管制程序已啟動。',
  '多筆病歷、檢查結果與交班資料……遺失或遭鎖定。',
  '診察室 3 有一位胸悶的病人正在等待評估，而他的心電圖紀錄不見了。',
  '你是今晚的值班醫師。',
  '找出線索。照顧好你的病人。解開這個夜晚的謎團。',
];

export function Briefing() {
  const profile = useGame((s) => s.profile);
  const startLevel = useGame((s) => s.startLevel);
  const [n, setN] = useState(0);
  const [chars, setChars] = useState(0);
  const reduced = useGame((s) => s.settings.reducedMotion);

  useEffect(() => {
    if (n >= LINES.length) return;
    if (chars < LINES[n].length) {
      const t = setTimeout(() => setChars((c) => c + 1), reduced ? 0 : 38);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setN((v) => v + 1); setChars(0); }, 650);
    return () => clearTimeout(t);
  }, [n, chars, reduced]);

  const done = n >= LINES.length;
  const skip = () => { setN(LINES.length); };

  return (
    <div className="scanlines absolute inset-0 flex items-center justify-center bg-[#05090e]" onClick={done ? undefined : skip}>
      <div className="w-full max-w-3xl px-8">
        <div className="mb-8 flex items-center gap-3 text-xs tracking-[0.3em] text-crit">
          <span className="h-2 w-2 animate-pulse rounded-full bg-crit" /> EMERGENCY LOCKDOWN PROTOCOL
        </div>
        <div className="min-h-[260px] space-y-4 font-medium">
          {LINES.slice(0, Math.min(n + 1, LINES.length)).map((l, i) => (
            <p key={i} className={`${i === 0 ? 'font-mono text-teal' : 'text-xl text-paper/90'} ${i === n && !done ? 'typing-caret' : ''}`}>
              {i === n && !done ? l.slice(0, chars) : l}
            </p>
          ))}
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: done ? 1 : 0 }} className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-white/10 pt-6">
          <div className="text-sm text-slate-400">
            <div>值班醫師：<span className="text-paper">{profile?.nickname}</span>（{profile && ROLE_LABEL[profile.role]}）</div>
            <div>模式：<span className="text-paper">{profile && MODE_INFO[profile.mode].title}</span></div>
            <div className="mt-2 text-xs">LEVEL 01｜消失的病歷 — 病史詢問</div>
          </div>
          <button disabled={!done} className="btn btn-primary !px-8 !py-3 text-lg" onClick={() => { sfx('door'); startLevel(); }}>進入診察室 3 →</button>
        </motion.div>
        {!done && <p className="mt-6 text-xs text-slate-600">點擊畫面略過</p>}
      </div>
    </div>
  );
}
