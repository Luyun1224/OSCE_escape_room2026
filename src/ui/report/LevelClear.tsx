import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useGame } from '../../store/gameStore';
import { sfx } from '../../audio/audioEngine';

const STORY = [
  '門禁解除。走廊的燈光閃了一下。',
  '工作站上，剛解鎖的系統紀錄跳出一行字：',
  '「01:58　12 導程心電圖已上傳。上傳者：值班醫師帳號（已登出）」',
  '可是林先生 02:10 才到院。那份 01:58 的心電圖……屬於誰？',
  '護理師遞來一份新的醫囑單：「醫師，請先幫他做身體檢查。」',
];

export default function LevelClear() {
  const setScreen = useGame((s) => s.setScreen);
  const mode = useGame((s) => s.profile?.mode);
  const [n, setN] = useState(0);
  useEffect(() => { sfx('unlock'); }, []);
  useEffect(() => { if (n < STORY.length) { const t = setTimeout(() => setN(n + 1), 1500); return () => clearTimeout(t); } }, [n]);
  return (
    <div className="scanlines absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,#12303a_0%,#070d14_70%)]">
      <div className="max-w-2xl px-8 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}>
          <div className="text-sm tracking-[0.5em] text-teal">LEVEL 01</div>
          <h1 className="title-glow mt-2 text-6xl font-black">{mode === 'assessment' ? 'SUBMITTED' : 'CLEAR'}</h1>
          <p className="mt-2 text-lg text-slate-300">消失的病歷・病史詢問</p>
        </motion.div>
        <div className="mt-10 min-h-[180px] space-y-2 text-left">
          {STORY.slice(0, n).map((s, i) => (
            <motion.p key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={i === 2 ? 'font-mono text-sm text-warn' : 'text-paper/90'}>{s}</motion.p>
          ))}
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: n >= STORY.length ? 1 : 0 }} className="mt-8 flex justify-center gap-3">
          <button className="btn btn-primary !px-8" onClick={() => setScreen('report')}>查看學習回饋報告 →</button>
        </motion.div>
        <p className="mt-6 text-xs text-slate-500">LEVEL 02「身體留下的訊號」將於 Phase 2 開放</p>
      </div>
    </div>
  );
}
