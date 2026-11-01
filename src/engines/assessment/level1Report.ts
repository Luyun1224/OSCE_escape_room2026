import type { PlayerProfile } from '../../types/game';
import type { Level1State } from '../../store/types';
import { CASE_META, CLUES, CLUE_MAP } from '../case/chestPainCase';
import { DEFAULT_DOMAIN_WEIGHTS, LEVEL1_RUBRIC } from '../../data/assessment/level1Rubric';
import { OBJECTIVES } from '../../data/level1/objectives';
import { DIALOGUE_MAP } from '../../data/level1/dialogue';
import { scoreDomains, scoreItems, type LevelReport, type TeacherWeights } from './scoring';
import { timeLimitMs } from '../../config/modes';
import { toCtx } from '../narrative/context';

export function buildLevel1Report(s: Level1State, profile: PlayerProfile, weights: TeacherWeights): LevelReport {
  const ctx = { ...toCtx(s), puzzle: s.puzzle.result, puzzleAssisted: s.puzzle.assisted, firstPatientContactBeforeHygiene: s.firstPatientContactBeforeHygiene };
  const items = scoreItems(LEVEL1_RUBRIC, ctx, weights);
  const { domains, overallPct } = scoreDomains(items, DEFAULT_DOMAIN_WEIGHTS, weights);

  const errors: string[] = [];
  for (const d of s.decisions) {
    if (d.verdict === 'unsafe') errors.push(`【不安全決策】${d.title}：${d.label}`);
    if (d.verdict === 'suboptimal') errors.push(`【次佳決策】${d.title}：${d.label}`);
  }
  if (s.flags.includes('false_reassurance')) errors.push('【溝通】對病人擔憂給予不實保證（「應該沒什麼大問題」）');
  if (s.firstPatientContactBeforeHygiene) errors.push('【感控】接觸病人前未完成手部衛生');
  if (s.puzzle.result && s.puzzle.result.misplacedTotal > 0) errors.push(`【推理】問題表述中有 ${s.puzzle.result.misplacedTotal} 張線索放錯欄位`);
  if (s.puzzle.result && s.puzzle.result.mustNotMissExtra.length > 0) errors.push('【推理】危急鑑別中納入了病史不支持的診斷');

  const safety: string[] = [];
  if (s.flags.includes('hand_hygiene')) safety.push('完成手部衛生');
  if (s.flags.includes('identity_confirmed')) safety.push('以兩種識別資料確認病人身分');
  if (s.flags.includes('ecg_requested') && !s.flags.includes('ecg_delayed') && !s.flags.includes('ecg_omitted')) safety.push('立即安排 12 導程心電圖');
  if (s.flags.includes('ntg_held')) safety.push('硝酸鹽給藥前確認 PDE5 抑制劑禁忌');
  if (s.asked.includes('q_allergy')) safety.push('確認藥物過敏史');
  if (s.flags.includes('ntg_intercepted')) safety.push('（近乎失誤）NTG 由團隊／病人攔截');

  const byObjective: Record<string, number> = {};
  for (const h of s.hints) byObjective[h.objectiveId] = (byObjective[h.objectiveId] ?? 0) + 1;

  const reasoningPath = s.events
    .filter((e) => ['clue', 'puzzle_submit', 'decision', 'ask'].includes(e.type))
    .map((e) => ({ t: e.t, label:
      e.type === 'clue' ? `取得線索：${CLUE_MAP[e.ref ?? '']?.title ?? e.ref}` :
      e.type === 'ask' ? `詢問：${DIALOGUE_MAP[e.ref ?? '']?.short ?? e.ref}` :
      e.type === 'decision' ? `決策：${e.detail}` : `提交問題表述：${e.detail}` }));

  const clinical = CLUES.filter((c) => !c.narrative);
  const keyTotal = clinical.filter((c) => c.key).length;
  const have = new Set(s.clues.map((c) => c.id));

  const recs: string[] = [];
  const missed = items.filter((i) => !i.achieved);
  const domainOrder = [...domains].filter((d) => d.pct !== null).sort((a, b) => (a.pct as number) - (b.pct as number));
  for (const d of domainOrder.slice(0, 2)) if ((d.pct as number) < 80) recs.push(`加強「${d.label}」：本關達成 ${d.pct}%。`);
  for (const m of missed.filter((i) => i.critical || i.weight >= 2).slice(0, 5)) recs.push(`${m.label} — ${m.feedback}`);
  if (recs.length === 0) recs.push('表現完整！可嘗試「極限逃脫模式」或「進階」難度挑戰臨床決策效率。');

  const limit = timeLimitMs(profile.mode, profile.difficulty);
  return {
    schema: 'osce-escape/level-report@1', levelId: 'L01', caseId: CASE_META.id, reviewStatus: CASE_META.reviewStatus,
    player: profile, generatedAt: new Date().toISOString(),
    durationMs: s.completedAtMs ?? s.elapsedMs, timeLimitMs: limit, overtime: limit !== null && (s.completedAtMs ?? s.elapsedMs) > limit,
    items, domains, overallPct, criticalMissed: items.filter((i) => i.critical && !i.achieved),
    decisions: s.decisions, hints: { total: s.hints.length, byObjective },
    errors, safetyBehaviors: safety, reasoningPath,
    cluesCollected: clinical.filter((c) => have.has(c.id)).length,
    keyCluesCollected: clinical.filter((c) => c.key && have.has(c.id)).length, keyCluesTotal: keyTotal,
    puzzle: { attempts: s.puzzle.attempts, assisted: s.puzzle.assisted, result: s.puzzle.result },
    recommendations: recs, events: s.events,
    disclaimer: '本報告為形成性學習回饋，臨床內容與評核規準待教師審核；不等同正式 OSCE 成績，亦不得直接推算 EPA 信賴等級。',
  };
}

export const OBJECTIVE_TITLE = Object.fromEntries(OBJECTIVES.map((o) => [o.id, o.title]));
