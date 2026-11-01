import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useGame } from '../../store/gameStore';
import { CLUE_MAP } from '../../engines/case/chestPainCase';
import { DX_ANSWER, DX_OPTIONS, MODEL_PR, PR_SLOTS } from '../../data/level1/puzzle';
import type { Placements } from '../../engines/puzzle/problemRepresentation';
import { sfx } from '../../audio/audioEngine';

interface Line { id: string; d: string; ok?: boolean }

/**
 * 臨床推理板：問題表述重組（拖曳或點選放置）＋ 假設形成
 * 連線視覺化：線索卡 → 問題表述欄位
 */
export function ReasoningBoard() {
  const mode = useGame((s) => s.profile!.mode);
  const clues = useGame((s) => s.level1.clues);
  const puzzle = useGame((s) => s.level1.puzzle);
  const solved = useGame((s) => s.level1.flags.includes('puzzle_solved'));
  const setPlacements = useGame((s) => s.setPlacements);
  const setHypothesis = useGame((s) => s.setHypothesis);
  const submit = useGame((s) => s.submitPuzzle);
  const assist = useGame((s) => s.assistPuzzle);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const pool = useRef<HTMLDivElement>(null);

  const pl = puzzle.placements;
  const hyp = puzzle.hypothesis;
  const cards = clues.map((c) => CLUE_MAP[c.id]).filter((d) => d && !d.narrative);
  const slotOf = (id: string) => Object.entries(pl).find(([, ids]) => ids.includes(id))?.[0];
  const result = puzzle.result;
  const showDetail = mode === 'story' && !!result && !solved;
  const locked = solved;

  const place = (clueId: string, slotId: string | null) => {
    if (locked) return;
    const next: Placements = {};
    for (const s of PR_SLOTS) next[s.id] = (pl[s.id] ?? []).filter((x) => x !== clueId);
    if (slotId) next[slotId] = [...next[slotId], clueId];
    setPlacements(next);
    sfx('click');
    setSelected(null);
  };

  const measure = useCallback(() => {
    const r = root.current;
    if (!r) return;
    const box = r.getBoundingClientRect();
    const out: Line[] = [];
    for (const s of PR_SLOTS) {
      const slotEl = r.querySelector<HTMLElement>(`[data-slot="${s.id}"]`);
      if (!slotEl) continue;
      const sb = slotEl.getBoundingClientRect();
      for (const id of pl[s.id] ?? []) {
        const cEl = r.querySelector<HTMLElement>(`[data-card="${id}"]`);
        if (!cEl) continue;
        const cb = cEl.getBoundingClientRect();
        const poolBox = pool.current?.getBoundingClientRect();
        const cy = Math.min(Math.max(cb.top + cb.height / 2, poolBox?.top ?? 0), poolBox?.bottom ?? 1e5) - box.top;
        const x1 = cb.right - box.left, y1 = cy, x2 = sb.left - box.left, y2 = sb.top + 22 - box.top;
        const mx = (x1 + x2) / 2;
        out.push({ id: `${id}-${s.id}`, d: `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}` });
      }
    }
    setLines(out);
  }, [pl]);

  useLayoutEffect(() => {
    measure();
    const p = pool.current;
    window.addEventListener('resize', measure);
    p?.addEventListener('scroll', measure);
    return () => { window.removeEventListener('resize', measure); p?.removeEventListener('scroll', measure); };
  }, [measure, cards.length]);

  const onSubmit = () => {
    if (mode === 'assessment' && !confirm) { setConfirm(true); return; }
    setConfirm(false);
    submit();
  };
  const totalPlaced = Object.values(pl).reduce((a, x) => a + x.length, 0);
  const canSubmit = totalPlaced > 0 && !!hyp.leading;

  return (
    <div ref={root} className="relative">
      <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
        {lines.map((l) => <path key={l.id} d={l.d} fill="none" stroke="#13B8B0" strokeOpacity={0.55} strokeWidth={1.6} strokeDasharray="5 4" />)}
      </svg>
      <p className="mb-3 text-sm text-slate-300">
        將線索卡<strong className="text-teal">拖曳</strong>（或點選後再點欄位）到對應的問題表述欄位，再形成你的診斷假設。評估依據線索的臨床屬性，而非放置順序。
      </p>
      <div className="grid gap-5 lg:grid-cols-[minmax(240px,1fr)_minmax(380px,1.5fr)]">
        {/* 線索池 */}
        <div>
          <div className="mb-2 text-xs font-semibold tracking-widest text-slate-400">已蒐集線索（{cards.length}）</div>
          <div ref={pool} className="scroll-thin max-h-[58vh] space-y-1.5 overflow-y-auto pr-3">
            {cards.map((c) => {
              const at = slotOf(c.id);
              const mis = showDetail && result?.slots.some((s) => s.misplaced.includes(c.id));
              return (
                <div key={c.id} data-card={c.id} draggable={!locked}
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', c.id)}
                  onClick={() => !locked && setSelected(selected === c.id ? null : c.id)}
                  className={`cursor-grab rounded-lg border px-3 py-2 text-sm transition active:cursor-grabbing ${selected === c.id ? 'border-teal bg-teal/20' : at ? 'border-teal/30 bg-teal/5 opacity-70' : 'border-white/10 bg-white/[0.04] hover:border-white/30'} ${mis ? '!border-crit' : ''}`}>
                  <div className="flex items-center justify-between gap-2"><span className="font-semibold">{c.title}</span>{at && <span className="text-[10px] text-teal">→ {PR_SLOTS.find((s) => s.id === at)?.label.slice(0, 6)}</span>}</div>
                  <div className="line-clamp-2 text-xs text-slate-400">{c.summary}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 欄位與假設 */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold tracking-widest text-slate-400">問題表述 PROBLEM REPRESENTATION</div>
          {PR_SLOTS.map((s) => {
            const r = result?.slots.find((x) => x.slotId === s.id);
            return (
              <div key={s.id} data-slot={s.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); place(e.dataTransfer.getData('text/plain'), s.id); }}
                onClick={() => selected && place(selected, s.id)}
                className={`rounded-xl border-2 border-dashed p-2.5 transition ${selected ? 'border-teal/70 bg-teal/5' : 'border-white/15'} ${showDetail && r ? (r.satisfied ? '!border-ok/60' : '!border-crit/60') : ''}`}>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold">{s.label}</span>
                  <span className="text-[11px] text-slate-400">{s.desc}</span>
                </div>
                <div className="mt-1.5 flex min-h-[30px] flex-wrap gap-1.5">
                  {(pl[s.id] ?? []).map((id) => (
                    <span key={id} className={`chip bg-navy-3 ${showDetail && r?.misplaced.includes(id) ? 'border-crit text-crit' : 'border-teal/50'}`}>
                      {CLUE_MAP[id]?.title}
                      {!locked && <button className="ml-0.5 text-slate-400 hover:text-white" onClick={(e) => { e.stopPropagation(); place(id, null); }}>×</button>}
                    </span>
                  ))}
                </div>
                {showDetail && r && !r.satisfied && (
                  <div className="mt-1 text-[11px] text-crit">
                    {r.requiredCount < r.min && `尚需 ${r.min - r.requiredCount} 項符合此欄位的線索。`}{r.misplaced.length > 0 && ` 有 ${r.misplaced.length} 張卡片不屬於此欄位。`}
                  </div>
                )}
                {showDetail && r && r.lowValue.length > 0 && <div className="mt-1 text-[11px] text-warn">提醒：{r.lowValue.map((x) => CLUE_MAP[x]?.title).join('、')} 與此問題關聯較低。</div>}
              </div>
            );
          })}

          <div className="rounded-xl border border-white/10 p-3">
            <div className="text-sm font-semibold">假設形成</div>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              <div>
                <div className="mb-1 text-xs text-slate-400">最可能的工作診斷（擇一）</div>
                {DX_OPTIONS.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 py-0.5 text-sm">
                    <input type="radio" disabled={locked} checked={hyp.leading === d.id} onChange={() => setHypothesis({ ...hyp, leading: d.id })} className="accent-[#13B8B0]" />
                    {d.label}<span className="text-[10px] text-slate-500">{d.en}</span>
                  </label>
                ))}
              </div>
              <div>
                <div className="mb-1 text-xs text-slate-400">仍需評估、不可錯過的危急診斷（可複選）</div>
                {DX_OPTIONS.filter((d) => d.id !== hyp.leading).map((d) => (
                  <label key={d.id} className="flex items-center gap-2 py-0.5 text-sm">
                    <input type="checkbox" disabled={locked} checked={hyp.mustNotMiss.includes(d.id)}
                      onChange={(e) => setHypothesis({ ...hyp, mustNotMiss: e.target.checked ? [...hyp.mustNotMiss, d.id] : hyp.mustNotMiss.filter((x) => x !== d.id) })} className="accent-[#13B8B0]" />
                    {d.label}
                  </label>
                ))}
              </div>
            </div>
            {showDetail && result && (
              <p className="mt-2 text-xs">
                <span className={result.leadingCorrect ? 'text-ok' : 'text-crit'}>主要診斷 {result.leadingCorrect ? '✓' : '✗ 請重新檢視症狀特徵與危險因子'}</span>　
                <span className={result.mustNotMissCorrect && result.mustNotMissExtra.length === 0 ? 'text-ok' : 'text-crit'}>
                  危急鑑別 {result.mustNotMissCorrect ? (result.mustNotMissExtra.length ? '△ 包含病史不支持的選項' : '✓') : '✗ 仍有致命診斷未保留'}
                </span>
              </p>
            )}
          </div>

          {/* 提交區 */}
          {!solved ? (
            <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
              {mode === 'challenge' && result && <span className="text-sm text-warn">上次提交：{result.slotsCorrect}/{PR_SLOTS.length} 欄位正確・診斷 {result.leadingCorrect && result.mustNotMissCorrect ? '✓' : '✗'}</span>}
              {mode !== 'assessment' && puzzle.attempts >= 3 && (
                <button className="btn btn-ghost text-sm" onClick={assist}>顯示學習引導並繼續（將記錄為輔助完成）</button>
              )}
              {confirm && <span className="text-sm text-warn">OSCE 模擬模式：提交後無法修改，確定？</span>}
              <button disabled={!canSubmit} className="btn btn-primary" onClick={onSubmit}>{confirm ? '確定提交' : '上傳問題表述'}</button>
            </div>
          ) : (
            <div className="rounded-xl border border-ok/40 bg-ok/10 p-4 text-sm">
              <div className="font-bold text-ok">✓ 問題表述已上傳，工作站與門禁系統已解鎖</div>
              {mode !== 'assessment' ? (
                <>
                  <p className="mt-2 text-xs text-slate-400">示範問題表述：</p>
                  <p className="mt-1 leading-relaxed">{MODEL_PR}</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">{DX_ANSWER.explanation}</p>
                </>
              ) : <p className="mt-1 text-slate-300">完整解析將於評核報告中提供。</p>}
              <p className="mt-2 text-teal">前往門口的門禁系統，離開診察室。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
