/** Narrative Engine — 條件與效果的資料化定義 */

export interface Condition {
  flags?: string[];       // 全部需成立
  notFlags?: string[];    // 全部需不成立
  anyFlags?: string[];    // 任一成立即可
  asked?: string[];       // 已問過的問題 id
  clues?: string[];       // 已取得的線索
  notClues?: string[];
  inspected?: string[];   // 已檢視的物件
  trustGte?: number;
  minAsked?: number;      // 已問問題數量
}

export interface Effects {
  clues?: string[];
  flags?: string[];
  trust?: number;
  emotion?: PatientEmotion;
}

export type PatientEmotion = 'anxious' | 'pained' | 'hesitant' | 'calmer' | 'neutral';

export interface DialogueResponse {
  when?: Condition;
  text: string;
  /** 舞台指示（動作、表情） */
  stage?: string;
  effects?: Effects;
}

export type TopicId = 'opening' | 'hpi' | 'associated' | 'redflag' | 'background' | 'social' | 'closing';

export interface DialogueOption {
  id: string;
  topic: TopicId;
  label: string;           // 玩家（醫師）說的話
  short: string;           // 筆記中的簡稱
  visibleWhen?: Condition; // 不符合時隱藏（分支解鎖）
  responses: DialogueResponse[]; // 依序比對，第一個符合者為準
  /** 再次詢問時的回應 */
  repeatText?: string;
}

export interface NurseOption {
  id: string;
  label: string;
  /** 依條件決定後果 */
  outcomes: { when?: Condition; nurse: string; patient?: string; effects?: Effects; verdict: 'safe' | 'suboptimal' | 'unsafe' | 'neutral'; teaching: string }[];
}

export interface NurseEvent {
  id: string;
  title: string;
  trigger: Condition;
  prompt: string;
  options: NurseOption[];
}
