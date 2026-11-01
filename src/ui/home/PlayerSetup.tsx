import { useState } from 'react';
import { motion } from 'motion/react';
import { hasSave, useGame } from '../../store/gameStore';
import type { Difficulty, GameMode, LearnerRole } from '../../types/game';
import { DIFFICULTY_INFO, MODE_INFO, ROLE_LABEL } from '../../config/modes';
import { sfx } from '../../audio/audioEngine';

export function PlayerSetup() {
  const prev = useGame((s) => s.profile);
  const newGame = useGame((s) => s.newGame);
  const setScreen = useGame((s) => s.setScreen);
  const [nickname, setNickname] = useState(prev?.nickname ?? '');
  const [role, setRole] = useState<LearnerRole>(prev?.role ?? 'PGY1');
  const [mode, setMode] = useState<GameMode>(prev?.mode ?? 'story');
  const [difficulty, setDifficulty] = useState<Difficulty>(prev?.difficulty ?? 'basic');
  const overwrite = hasSave();
  const valid = nickname.trim().length > 0;

  return (
    <div className="absolute inset-0 overflow-y-auto bg-[radial-gradient(ellipse_at_top,#1d3249_0%,#0b1420_55%,#070d14_100%)]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <button className="text-sm text-slate-400 hover:text-white" onClick={() => setScreen('home')}>← 返回首頁</button>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-3xl font-bold">值班登錄</motion.h1>
        <p className="text-slate-400">Duty Registration · 進入醫院前，請完成值班資料（第一版不需登入）</p>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="glass rounded-2xl p-5">
            <label className="text-sm font-semibold text-teal">1　暱稱</label>
            <input value={nickname} maxLength={20} onChange={(e) => setNickname(e.target.value)} placeholder="請輸入暱稱（勿使用真實姓名）"
              className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 text-lg outline-none focus:border-teal" />
            <p className="mt-2 text-xs text-slate-500">僅儲存在此瀏覽器，用於報告標示。</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="text-sm font-semibold text-teal">2　學員身分</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(Object.keys(ROLE_LABEL) as LearnerRole[]).map((r) => (
                <button key={r} onClick={() => { sfx('click'); setRole(r); }} className={`rounded-lg border px-3 py-3 text-sm font-semibold transition ${role === r ? 'border-teal bg-teal/15 text-white' : 'border-white/10 text-slate-300 hover:border-white/30'}`}>{ROLE_LABEL[r]}</button>
              ))}
            </div>
          </div>
        </section>

        <section className="glass mt-6 rounded-2xl p-5">
          <div className="text-sm font-semibold text-teal">3　遊戲模式</div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {(Object.keys(MODE_INFO) as GameMode[]).map((m) => {
              const info = MODE_INFO[m];
              return (
                <button key={m} onClick={() => { sfx('click'); setMode(m); }} className={`rounded-xl border p-4 text-left transition ${mode === m ? 'border-teal bg-teal/10 shadow-[0_0_30px_rgba(19,184,176,.2)]' : 'border-white/10 hover:border-white/30'}`}>
                  <div className="text-xs tracking-widest text-slate-400">{info.en}</div>
                  <div className="mt-1 text-lg font-bold">{info.title}</div>
                  <p className="mt-1 text-sm text-slate-300">{info.desc}</p>
                  <ul className="mt-2 space-y-0.5 text-xs text-slate-400">{info.bullets.map((b) => <li key={b}>· {b}</li>)}</ul>
                </button>
              );
            })}
          </div>
        </section>

        <section className="glass mt-6 rounded-2xl p-5">
          <div className="text-sm font-semibold text-teal">4　難度</div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {(Object.keys(DIFFICULTY_INFO) as Difficulty[]).map((d) => (
              <button key={d} onClick={() => { sfx('click'); setDifficulty(d); }} className={`rounded-xl border p-3 text-left transition ${difficulty === d ? 'border-teal bg-teal/10' : 'border-white/10 hover:border-white/30'}`}>
                <div className="font-bold">{DIFFICULTY_INFO[d].title}</div>
                <div className="text-xs text-slate-400">{DIFFICULTY_INFO[d].desc}</div>
              </button>
            ))}
          </div>
          {mode === 'challenge' && <p className="mt-3 text-xs text-warn">極限逃脫時限：基礎 20 分／標準 15 分／進階 12 分；提示上限 3 次（進階 2 次）。</p>}
        </section>

        <div className="mt-8 flex items-center justify-end gap-4">
          {overwrite && <span className="text-sm text-warn">⚠ 開始新遊戲將覆蓋目前的 Level 01 進度</span>}
          <button disabled={!valid} className="btn btn-primary !px-8 !py-3 text-lg"
            onClick={() => { sfx('click'); newGame({ nickname: nickname.trim(), role, mode, difficulty }); }}>
            接受值班任務 →
          </button>
        </div>
      </div>
    </div>
  );
}
