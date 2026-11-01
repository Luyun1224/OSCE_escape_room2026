import { useState } from 'react';
import { Modal } from './Modal';
import { useGame, type Quality } from '../../store/gameStore';
import { useUI } from '../../store/uiStore';
import { DOMAIN_LABEL, type Domain } from '../../types/game';
import { DEFAULT_DOMAIN_WEIGHTS, LEVEL1_RUBRIC } from '../../data/assessment/level1Rubric';
import { sfx, unlockAudio } from '../../audio/audioEngine';

type Tab = 'audio' | 'video' | 'teacher' | 'save';

export function SettingsModal() {
  const close = () => useUI.getState().setSettings(false);
  const [tab, setTab] = useState<Tab>('audio');
  const tabs: [Tab, string][] = [['audio', '音效'], ['video', '畫質'], ['teacher', '教師權重'], ['save', '存檔']];
  return (
    <Modal title="設定" subtitle="Settings" onClose={close} width="max-w-3xl">
      <div className="mb-5 flex gap-2">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`btn !py-1.5 text-sm ${tab === k ? 'btn-primary' : 'btn-ghost'}`}>{l}</button>
        ))}
      </div>
      {tab === 'audio' && <AudioTab />}
      {tab === 'video' && <VideoTab />}
      {tab === 'teacher' && <TeacherTab />}
      {tab === 'save' && <SaveTab />}
    </Modal>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="mb-4 block">
      <div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className="font-mono text-teal">{Math.round(value * 100)}</span></div>
      <input type="range" min={0} max={1} step={0.05} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[#13B8B0]" />
    </label>
  );
}

function AudioTab() {
  const s = useGame((g) => g.settings);
  const up = useGame((g) => g.updateSettings);
  return (
    <div>
      <Slider label="主音量" value={s.master} onChange={(master) => up({ master })} />
      <Slider label="環境音" value={s.ambience} onChange={(ambience) => up({ ambience })} />
      <Slider label="音效" value={s.sfx} onChange={(v) => { up({ sfx: v }); unlockAudio(); sfx('click'); }} />
      <p className="text-xs text-slate-400">環境音以 Web Audio 程序化生成（空調、設備嗡鳴、監視器心跳音）。待補素材：經授權之真實醫院環境錄音。</p>
    </div>
  );
}

function VideoTab() {
  const s = useGame((g) => g.settings);
  const up = useGame((g) => g.updateSettings);
  const opts: [Quality, string, string][] = [
    ['low', '低', '無後製、低解析度陰影；適合平板與內顯'],
    ['medium', '中（建議）', '環境光遮蔽、柔和泛光、軟陰影'],
    ['high', '高', '全解析 AO、反射地板、2K 陰影、SMAA 抗鋸齒'],
  ];
  return (
    <div className="space-y-3">
      {opts.map(([q, l, d]) => (
        <button key={q} onClick={() => up({ quality: q })} className={`w-full rounded-xl border p-4 text-left transition ${s.quality === q ? 'border-teal bg-teal/10' : 'border-white/10 hover:border-white/30'}`}>
          <div className="font-semibold">{l}</div><div className="text-sm text-slate-400">{d}</div>
        </button>
      ))}
      <label className="flex items-center gap-3 pt-2 text-sm">
        <input type="checkbox" checked={s.reducedMotion} onChange={(e) => up({ reducedMotion: e.target.checked })} className="accent-[#13B8B0]" />
        減少動態效果（停止首頁鏡頭移動）
      </label>
    </div>
  );
}

function TeacherTab() {
  const weights = useGame((g) => g.weights);
  const setWeights = useGame((g) => g.setWeights);
  const domains = Object.keys(DOMAIN_LABEL) as Domain[];
  return (
    <div>
      <p className="mb-4 rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-warn">
        權重調整會即時套用於學習報告計分。本版本設定僅存於此瀏覽器（localStorage）；正式多人評量請另行建置具身分驗證之後端（Phase 3）。
      </p>
      <h3 className="mb-2 font-semibold">六大面向權重</h3>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        {domains.map((d) => (
          <label key={d} className="rounded-lg border border-white/10 p-3 text-sm">
            <div className="mb-1 text-slate-300">{DOMAIN_LABEL[d]}</div>
            <input type="number" min={0} max={100} value={weights.domains[d] ?? DEFAULT_DOMAIN_WEIGHTS[d]}
              onChange={(e) => setWeights({ ...weights, domains: { ...weights.domains, [d]: Math.max(0, +e.target.value) } })}
              className="w-full rounded-md bg-black/30 px-2 py-1 font-mono" />
          </label>
        ))}
      </div>
      <h3 className="mb-2 font-semibold">Level 01 評核項目權重</h3>
      <div className="overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-slate-400"><tr><th className="px-3 py-2">ID</th><th>項目</th><th>面向</th><th className="w-24">權重</th></tr></thead>
          <tbody>
            {LEVEL1_RUBRIC.map((r) => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="px-3 py-1.5 font-mono text-xs text-slate-400">{r.id}</td>
                <td>{r.label}{r.critical && <span className="ml-2 text-xs text-crit">關鍵</span>}</td>
                <td className="text-slate-400">{DOMAIN_LABEL[r.domain]}</td>
                <td className="pr-3"><input type="number" min={0} max={10} value={weights.items[r.id] ?? r.weight}
                  onChange={(e) => setWeights({ ...weights, items: { ...weights.items, [r.id]: Math.max(0, +e.target.value) } })}
                  className="w-full rounded bg-black/30 px-2 py-0.5 font-mono" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn btn-ghost mt-4 text-sm" onClick={() => setWeights({ domains: {}, items: {} })}>恢復預設權重</button>
    </div>
  );
}

function SaveTab() {
  const resetAll = useGame((g) => g.resetAll);
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="space-y-4 text-sm">
      <p className="text-slate-300">遊戲會自動將進度保存在此瀏覽器（localStorage）：目前關卡、已探索物件、線索、任務、提示使用與事件紀錄。不含可識別個資，請勿以真實姓名作為暱稱。</p>
      {!confirm ? (
        <button className="btn btn-ghost border-crit/60 text-crit" onClick={() => setConfirm(true)}>刪除存檔並重新開始</button>
      ) : (
        <div className="flex items-center gap-3">
          <span>確定要刪除所有進度與報告？</span>
          <button className="btn bg-crit text-white" onClick={() => { resetAll(); useUI.getState().setSettings(false); }}>確定刪除</button>
          <button className="btn btn-ghost" onClick={() => setConfirm(false)}>取消</button>
        </div>
      )}
    </div>
  );
}
