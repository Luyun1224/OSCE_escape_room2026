import { useMemo } from 'react';
import { useGame } from '../../store/gameStore';
import { toCtx } from '../../engines/narrative/context';
import { OBJECTIVES } from '../../data/level1/objectives';

export function useLevelCtx() {
  const s = useGame((g) => g.level1);
  return useMemo(() => toCtx(s), [s]);
}

export function useObjectives() {
  const ctx = useLevelCtx();
  return useMemo(() => OBJECTIVES.map((o) => ({ ...o, done: o.isDone(ctx), prog: o.progress?.(ctx) })), [ctx]);
}

export const fmtTime = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
