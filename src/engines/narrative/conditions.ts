import type { Condition } from './types';

export interface ConditionContext {
  flags: string[];
  asked: string[];
  clueIds: string[];
  inspected: string[];
  trust: number;
}

export function evaluateCondition(cond: Condition | undefined, ctx: ConditionContext): boolean {
  if (!cond) return true;
  const has = (arr: string[], v: string) => arr.includes(v);
  if (cond.flags && !cond.flags.every((f) => has(ctx.flags, f))) return false;
  if (cond.notFlags && cond.notFlags.some((f) => has(ctx.flags, f))) return false;
  if (cond.anyFlags && !cond.anyFlags.some((f) => has(ctx.flags, f))) return false;
  if (cond.asked && !cond.asked.every((a) => has(ctx.asked, a))) return false;
  if (cond.clues && !cond.clues.every((c) => has(ctx.clueIds, c))) return false;
  if (cond.notClues && cond.notClues.some((c) => has(ctx.clueIds, c))) return false;
  if (cond.inspected && !cond.inspected.every((o) => has(ctx.inspected, o))) return false;
  if (cond.trustGte !== undefined && ctx.trust < cond.trustGte) return false;
  if (cond.minAsked !== undefined && ctx.asked.length < cond.minAsked) return false;
  return true;
}
