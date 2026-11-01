import type { Domain } from '../types/game';

export interface LevelInfo {
  id: string; code: string; title: string; subtitle: string; scene: string; domain: Domain; playable: boolean; phase: string;
}

export const LEVELS: LevelInfo[] = [
  { id: 'L01', code: 'LEVEL 01', title: '消失的病歷', subtitle: '病史詢問', scene: '夜間急診診察室', domain: 'history', playable: true, phase: 'Phase 1 · 可遊玩' },
  { id: 'L02', code: 'LEVEL 02', title: '身體留下的訊號', subtitle: '身體檢查', scene: '模擬診察室', domain: 'physical', playable: false, phase: 'Phase 2 · 開發中' },
  { id: 'L03', code: 'LEVEL 03', title: '數據背後的秘密', subtitle: '臨床推理', scene: '檢驗與影像判讀室', domain: 'reasoning', playable: false, phase: 'Phase 2 · 開發中' },
  { id: 'L04', code: 'LEVEL 04', title: '危急時刻', subtitle: '臨床決策', scene: '急診急救區', domain: 'safety', playable: false, phase: 'Phase 2 · 開發中' },
  { id: 'L05', code: 'LEVEL 05', title: '關鍵操作', subtitle: '臨床技能（12 導程心電圖）', scene: '臨床技能訓練室', domain: 'procedural', playable: false, phase: 'Phase 2 · 開發中' },
  { id: 'FINAL', code: 'FINAL', title: '最後的交班', subtitle: '資訊整合與醫病溝通', scene: '醫師交班室', domain: 'communication', playable: false, phase: 'Phase 2 · 開發中' },
];
