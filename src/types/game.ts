// ===== 共用型別定義 =====

export type GameMode = 'story' | 'challenge' | 'assessment';
export type Difficulty = 'basic' | 'standard' | 'advanced';
export type LearnerRole = 'MS' | 'UGY' | 'PGY1' | 'PGY2';

export type Screen = 'home' | 'setup' | 'briefing' | 'level' | 'levelClear' | 'report';

export interface PlayerProfile {
  nickname: string;
  role: LearnerRole;
  mode: GameMode;
  difficulty: Difficulty;
}

/** 六大學習分析面向 */
export type Domain =
  | 'history'        // 病史詢問能力
  | 'physical'       // 身體檢查能力
  | 'reasoning'      // 臨床推理能力
  | 'safety'         // 臨床決策與病人安全
  | 'procedural'     // 臨床技能流程認知
  | 'communication'; // 醫病溝通與資訊整合

export const DOMAIN_LABEL: Record<Domain, string> = {
  history: '病史詢問',
  physical: '身體檢查',
  reasoning: '臨床推理',
  safety: '決策與病人安全',
  procedural: '技能流程認知',
  communication: '醫病溝通與資訊整合',
};

/** 臨床內容審核狀態：所有臨床內容皆須標記 */
export type ReviewStatus = 'pending_faculty_review' | 'faculty_reviewed';

// ===== 線索 =====
export type ClueCategory =
  | 'triage' | 'cc' | 'hpi' | 'associated' | 'negative'
  | 'pmh' | 'meds' | 'allergy' | 'social' | 'family' | 'record' | 'story' | 'vitals';

export interface ClueDef {
  id: string;
  title: string;
  category: ClueCategory;
  source: string;        // 來源描述（例：病人陳述、檢傷單）
  summary: string;       // 內容摘要
  /** 用於問題表述拼圖之規則標籤 */
  tags: string[];
  /** 是否為關鍵線索（影響評量） */
  key?: boolean;
  /** 是否為劇情線索（非臨床） */
  narrative?: boolean;
}

export interface CollectedClue {
  id: string;
  acquiredAt: number;    // ms since level start
  interpreted: boolean;  // 是否已進行臨床判讀（放入推理板）
}

// ===== 事件紀錄（學習分析原始資料） =====
export interface GameEvent {
  t: number;          // ms since level start
  type: string;       // e.g. 'ask', 'inspect', 'clue', 'hint', 'decision', 'puzzle_submit'
  ref?: string;       // 相關 id
  detail?: string;
}
