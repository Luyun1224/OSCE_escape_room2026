import type { Domain, GameEvent, PlayerProfile } from '../../types/game';
import { DOMAIN_LABEL } from '../../types/game';
import type { RubricContext, RubricItem } from '../../data/assessment/level1Rubric';
import type { PuzzleResult } from '../puzzle/problemRepresentation';

export interface TeacherWeights {
  domains: Partial<Record<Domain, number>>;
  items: Record<string, number>;
}

export interface ItemResult {
  id: string; domain: Domain; label: string; criterion: string;
  weight: number; achieved: boolean; critical: boolean; feedback: string;
}
export interface DomainScore { domain: Domain; label: string; achieved: number; possible: number; pct: number | null; weight: number }
export interface DecisionRecord { eventId: string; title: string; optionId: string; label: string; verdict: string; teaching: string; t: number }

export interface LevelReport {
  schema: 'osce-escape/level-report@1';
  levelId: string; caseId: string; reviewStatus: string;
  player: PlayerProfile; generatedAt: string;
  durationMs: number; timeLimitMs: number | null; overtime: boolean;
  items: ItemResult[]; domains: DomainScore[]; overallPct: number;
  criticalMissed: ItemResult[];
  decisions: DecisionRecord[];
  hints: { total: number; byObjective: Record<string, number> };
  errors: string[];
  safetyBehaviors: string[];
  reasoningPath: { t: number; label: string }[];
  cluesCollected: number; keyCluesCollected: number; keyCluesTotal: number;
  puzzle: { attempts: number; assisted: boolean; result?: PuzzleResult };
  recommendations: string[];
  events: GameEvent[];
  disclaimer: string;
}

export function scoreItems(rubric: RubricItem[], ctx: RubricContext, weights: TeacherWeights): ItemResult[] {
  return rubric.map((r) => ({
    id: r.id, domain: r.domain, label: r.label, criterion: r.criterion,
    weight: weights.items[r.id] ?? r.weight, achieved: r.check(ctx), critical: !!r.critical, feedback: r.feedback,
  }));
}

export function scoreDomains(items: ItemResult[], defaults: Record<Domain, number>, weights: TeacherWeights): { domains: DomainScore[]; overallPct: number } {
  const domains = (Object.keys(DOMAIN_LABEL) as Domain[]).map<DomainScore>((d) => {
    const its = items.filter((i) => i.domain === d);
    const possible = its.reduce((a, i) => a + i.weight, 0);
    const achieved = its.filter((i) => i.achieved).reduce((a, i) => a + i.weight, 0);
    return { domain: d, label: DOMAIN_LABEL[d], achieved, possible, pct: possible > 0 ? Math.round((achieved / possible) * 100) : null, weight: weights.domains[d] ?? defaults[d] };
  });
  const scored = domains.filter((d) => d.pct !== null && d.weight > 0);
  const wsum = scored.reduce((a, d) => a + d.weight, 0);
  const overallPct = wsum > 0 ? Math.round(scored.reduce((a, d) => a + (d.pct as number) * d.weight, 0) / wsum) : 0;
  return { domains, overallPct };
}
