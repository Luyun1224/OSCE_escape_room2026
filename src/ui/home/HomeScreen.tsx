import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion } from 'motion/react';
import { CorridorScene } from '../../engines/scene/HospitalCorridor';
import { PostFX, QUALITY_DPR } from '../../engines/scene/PostFX';
import { hasSave, useGame } from '../../store/gameStore';
import { useUI } from '../../store/uiStore';
import { setAmbience, sfx, unlockAudio } from '../../audio/audioEngine';
import { Modal, ReviewBadge } from '../common/Modal';
import { LEVELS } from '../../data/levels';
import { MODE_INFO } from '../../config/modes';

export function HomeScreen() {
  const settings = useGame((s) => s.settings);
  const setScreen = useGame((s) => s.setScreen);
  const continueGame = useGame((s) => s.continueGame);
  const completed = useGame((s) => s.completedLevels);
  const profile = useGame((s) => s.profile);
  const [modal, setModal] = useState<'levels' | 'howto' | null>(null);
  const [audioOn, setAudioOn] = useState(false);
  const canContinue = hasSave();

  useEffect(() => () => setAmbience(null), []);
  const enableAudio = () => { if (!audioOn) { unlockAudio(); setAmbience('corridor'); setAudioOn(true); } };
  const go = (fn: () => void) => () => { enableAudio(); sfx('click'); fn(); };

  return (
    <div className="absolute inset-0" onPointerDown={enableAudio}>
      <Canvas dpr={QUALITY_DPR[settings.quality]} camera={{ fov: 55, near: 0.05, far: 60, position: [0, 1.6, 3] }} gl={{ antialias: settings.quality !== 'high' }}>
        <Suspense fallback={null}>
          <CorridorScene quality={settings.quality} reduced={settings.reducedMotion} />
          <PostFX quality={settings.quality} />
        </Suspense>
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(5,10,16,.75)_100%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[52%] bg-gradient-to-r from-[#070d14]/90 via-[#070d14]/55 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-center px-[7vw]">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1.2, delay: 0.3 }}>
          <div className="mb-3 flex items-center gap-3 text-xs tracking-[0.35em] text-teal">
            <span className="inline-block h-px w-10 bg-teal" /> A CLINICAL MYSTERY
          </div>
          <h1 className="title-glow text-6xl font-black tracking-tight md:text-7xl">
            OSCE <span className="text-teal">ESCAPE</span>
          </h1>
          <p className="mt-3 text-2xl font-semibold tracking-wider text-paper/95 md:text-3xl">臨床解碼：最後一班值勤</p>
          <p className="mt-1 text-sm tracking-[0.25em] text-slate-400">THE LAST SHIFT — A CLINICAL MYSTERY</p>
        </motion.div>

        <motion.nav initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.8 }} className="mt-10 flex w-72 flex-col gap-2.5">
          <button className="btn btn-primary justify-start !py-3 text-base" onClick={go(() => setScreen('setup'))}>▶　開始遊戲</button>
          <button className="btn btn-ghost justify-start !py-3" disabled={!canContinue} onClick={go(continueGame)}>
            ⟲　繼續遊戲 {canContinue && profile && <span className="ml-auto text-xs text-slate-400">{profile.nickname}</span>}
          </button>
          <button className="btn btn-ghost justify-start !py-3" onClick={go(() => setModal('levels'))}>▦　關卡選擇</button>
          <button className="btn btn-ghost justify-start !py-3" onClick={go(() => setModal('howto'))}>?　遊戲說明</button>
          <button className="btn btn-ghost justify-start !py-3" onClick={go(() => useUI.getState().setSettings(true))}>⚙　音效與畫質設定</button>
        </motion.nav>
      </div>

      <div className="absolute bottom-5 left-[7vw] right-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <ReviewBadge />
        <span>教學用虛構病例・不含真實病人資料・形成性評量用途</span>
        <span className="ml-auto">{audioOn ? '🔊 環境音已啟用' : '點擊畫面以啟用環境音效'}</span>
      </div>

      {modal === 'levels' && (
        <Modal title="關卡選擇" subtitle="六大關卡 · 對應 OSCE 核心能力" onClose={() => setModal(null)} width="max-w-4xl">
          <div className="grid gap-3 md:grid-cols-2">
            {LEVELS.map((l) => (
              <div key={l.id} className={`relative overflow-hidden rounded-xl border p-4 ${l.playable ? 'border-teal/50 bg-teal/5' : 'border-white/10 opacity-70'}`}>
                <div className="flex items-center justify-between text-xs tracking-widest">
                  <span className="text-teal">{l.code}</span>
                  <span className={`chip ${l.playable ? 'border-teal/60 text-teal' : 'text-slate-400'}`}>{completed.includes(l.id) ? '✓ 已完成' : l.phase}</span>
                </div>
                <div className="mt-2 text-lg font-bold">{l.title}</div>
                <div className="text-sm text-slate-400">{l.subtitle}・{l.scene}</div>
                {l.playable ? (
                  <button className="btn btn-primary mt-3 !py-1.5 text-sm" onClick={go(() => { setModal(null); if (hasSave()) continueGame(); else setScreen('setup'); })}>進入關卡</button>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">🔒 依 Phase 1 共用架構擴充中（不提供未完成的假關卡）</p>
                )}
              </div>
            ))}
          </div>
        </Modal>
      )}
      {modal === 'howto' && <HowToPlay onClose={() => setModal(null)} />}
    </div>
  );
}

function HowToPlay({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="遊戲說明" subtitle="How to Play" onClose={onClose} width="max-w-3xl">
      <div className="space-y-5 text-sm leading-relaxed text-slate-200">
        <section>
          <h3 className="mb-1 font-bold text-teal">故事</h3>
          <p>午夜，醫院啟動緊急管制程序。臨床資訊系統異常，病歷、檢查結果與交班資料遺失。你是值班 PGY 醫師，必須在各臨床區域中探索、問診、整合線索，解開事件背後的謎團。</p>
        </section>
        <section>
          <h3 className="mb-1 font-bold text-teal">操作</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>滑鼠點擊場景中的物件（病人、檢傷單、監視器、工作站、門禁…）進行互動；鏡頭會自動移至合適視角。</li>
            <li>按住 <kbd className="rounded bg-white/10 px-1.5">Space</kbd> 顯示所有可互動物件；左下方可切換固定視角。</li>
            <li>下方工具列：線索背包、病歷筆記、臨床推理板、檢查結果、任務清單。</li>
            <li>右上角「提示」提供三階段提示：引導觀察 → 思考方向 → 學習引導。提示次數會記錄，但不等於能力不足。</li>
          </ul>
        </section>
        <section>
          <h3 className="mb-1 font-bold text-teal">遊戲模式</h3>
          <div className="grid gap-2 md:grid-cols-3">
            {Object.values(MODE_INFO).map((m) => (
              <div key={m.en} className="rounded-lg border border-white/10 p-3">
                <div className="font-semibold">{m.title}</div>
                <div className="mb-1 text-xs text-slate-400">{m.en}</div>
                <ul className="list-disc pl-4 text-xs text-slate-300">{m.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-warn/40 bg-warn/10 p-3 text-warn">
          本遊戲為醫學教育用途之形成性學習工具。所有臨床內容標記為「待教師審核」，正式教學前須完成專業驗證；遊戲分數不等同正式 OSCE 成績，亦不得直接推算 EPA 信賴等級。
        </section>
      </div>
    </Modal>
  );
}
