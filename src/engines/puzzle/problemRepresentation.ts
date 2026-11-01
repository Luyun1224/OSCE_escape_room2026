import type { ClueDef } from '../../types/game';
import type { SlotDef } from '../../data/level1/puzzle';
import { DX_ANSWER } from '../../data/level1/puzzle';

export interface Placements { [slotId: string]: string[] }
export interface Hypothesis { leading?: string; mustNotMiss: string[] }

export interface SlotResult {
  slotId: string;
  satisfied: boolean;
  requiredCount: number;
  min: number;
  misplaced: string[];   // 不屬於此欄位的卡片
  lowValue: string[];    // 關聯低的卡片
}

export interface PuzzleResult {
  slots: SlotResult[];
  slotsCorrect: number;
  leadingCorrect: boolean;
  mustNotMissCorrect: boolean;
  mustNotMissExtra: string[];
  misplacedTotal: number;
  passed: boolean;
}

/** 規則化評估：每一欄依標籤計數；誤置與低關聯卡片獨立統計 */
export function evaluatePuzzle(slots: SlotDef[], placements: Placements, hyp: Hypothesis, clueMap: Record<string, ClueDef>): PuzzleResult {
  const slotResults = slots.map<SlotResult>((s) => {
    const ids = placements[s.id] ?? [];
    let req = 0;
    const misplaced: string[] = [];
    const lowValue: string[] = [];
    for (const id of ids) {
      const tags = clueMap[id]?.tags ?? [];
      if (tags.includes(s.requiredTag)) req++;
      if (tags.includes('low')) lowValue.push(id);
      else if (!tags.some((t) => s.accepts.includes(t))) misplaced.push(id);
    }
    return { slotId: s.id, satisfied: req >= s.min && misplaced.length === 0, requiredCount: req, min: s.min, misplaced, lowValue };
  });
  const leadingCorrect = hyp.leading === DX_ANSWER.leading;
  const mnm = hyp.mustNotMiss.filter((d) => d !== hyp.leading);
  const mustNotMissCorrect = DX_ANSWER.mustNotMiss.every((d) => mnm.includes(d));
  const mustNotMissExtra = mnm.filter((d) => !DX_ANSWER.mustNotMiss.includes(d));
  const slotsCorrect = slotResults.filter((r) => r.satisfied).length;
  const misplacedTotal = slotResults.reduce((a, r) => a + r.misplaced.length, 0);
  return {
    slots: slotResults, slotsCorrect, leadingCorrect, mustNotMissCorrect, mustNotMissExtra, misplacedTotal,
    passed: slotsCorrect === slots.length && leadingCorrect && mustNotMissCorrect,
  };
}
