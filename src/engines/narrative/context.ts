import type { Level1State } from '../../store/types';
import type { ConditionContext } from './conditions';

export const toCtx = (s: Level1State): ConditionContext => ({
  flags: s.flags, asked: s.asked, clueIds: s.clues.map((c) => c.id), inspected: s.inspected, trust: s.trust,
});
