import type { Difficulty, GameMode, LearnerRole } from '../types/game';

export const MODE_INFO: Record<GameMode, { title: string; en: string; desc: string; bullets: string[] }> = {
  story: { title: '故事探索模式', en: 'Story Mode', desc: '第一次體驗推薦。完整劇情、引導提示，可反覆探索。',
    bullets: ['完整劇情與引導', '提示不限次數', '即時學習回饋', '不以計時施壓'] },
  challenge: { title: '極限逃脫模式', en: 'Challenge Mode', desc: '限時挑戰，提示有限，強調決策效率與完整性。',
    bullets: ['倒數計時', '提示次數有限', '減少系統引導', '時間到仍可完成並進入回饋'] },
  assessment: { title: 'OSCE 模擬模式', en: 'Assessment Mode', desc: '考前自主練習。依規準記錄，不即時顯示正確答案。',
    bullets: ['明確評分規準', '不即時顯示對錯', '結構化成績報告', '形成性評量，不等同正式 OSCE'] },
};

export const ROLE_LABEL: Record<LearnerRole, string> = { MS: '醫學生', UGY: 'UGY 實習醫學生', PGY1: 'PGY1', PGY2: 'PGY2' };

export const DIFFICULTY_INFO: Record<Difficulty, { title: string; desc: string }> = {
  basic: { title: '基礎', desc: '互動物件常駐標示' },
  standard: { title: '標準', desc: '滑鼠靠近時才顯示標示' },
  advanced: { title: '進階', desc: '無標示，需自行探索' },
};

export function hintLimit(mode: GameMode, diff: Difficulty): number | null {
  if (mode === 'story') return null;
  if (mode === 'challenge') return diff === 'advanced' ? 2 : 3;
  return 3; // assessment：可用但會記錄
}

export function timeLimitMs(mode: GameMode, diff: Difficulty): number | null {
  if (mode !== 'challenge') return null;
  return { basic: 20, standard: 15, advanced: 12 }[diff] * 60_000;
}

/** 推理板解鎖門檻（臨床線索數） */
export const REASONING_UNLOCK_CLUES = 10;
