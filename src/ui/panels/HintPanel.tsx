import { useState } from 'react';
import { Modal } from '../common/Modal';
import { useGame } from '../../store/gameStore';
import { useUI } from '../../store/uiStore';
import { useObjectives } from '../hud/useLevel';
import { hintLimit } from '../../config/modes';
import { sfx } from '../../audio/audioEngine';

const TIER = ['引導觀察', '臨床思考方向', '學習引導'];

export function HintPanel() {
  const open = useUI((s) => s.hintOpen);
  const profile = useGame((s) => s.profile);
  const hints = useGame((s) => s.level1.hints);
  const useHint = useGame((s) => s.useHint);
  const objs = useObjectives();
  const firstOpen = objs.find((o) => !o.done && !o.optional) ?? objs.find((o) => !o.done);
  const [sel, setSel] = useState<string | null>(null);
  if (!open || !profile) return null;
  const target = objs.find((o) => o.id === (sel ?? firstOpen?.id)) ?? objs[0];
  const used = hints.filter((h) => h.objectiveId === target.id).length;
  const limit = hintLimit(profile.mode, profile.difficulty);
  const left = limit === null ? null : limit - hints.length;
  const canMore = used < 3 && (left === null || left > 0) && !target.done;

  return (
    <Modal title="提示系統" subtitle="三階段提示：引導觀察 → 臨床思考方向 → 學習引導" onClose={() => useUI.getState().setHint(false)}>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {objs.map((o) => (
          <button key={o.id} onClick={() => setSel(o.id)} className={`chip ${o.id === target.id ? 'border-teal bg-teal/15 text-white' : o.done ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{o.title}</button>
        ))}
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`rounded-xl border p-3 ${i < used ? 'border-teal/40 bg-teal/5' : 'border-white/10 opacity-50'}`}>
            <div className="text-xs font-semibold text-teal">第 {i + 1} 階段・{TIER[i]}</div>
            <p className="mt-1 text-sm">{i < used ? target.hints[i] : '（尚未開啟）'}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {left === null ? `已使用 ${hints.length} 次提示` : `剩餘 ${left} 次提示`}・提示使用會記錄於學習報告，但不等同臨床能力不足。
        </span>
        <button disabled={!canMore} className="btn btn-primary text-sm" onClick={() => { sfx('click'); useHint(target.id); }}>
          {target.done ? '此任務已完成' : used >= 3 ? '已顯示全部提示' : `開啟第 ${used + 1} 階段`}
        </button>
      </div>
    </Modal>
  );
}
