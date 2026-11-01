import type { Condition, Effects } from '../../engines/narrative/types';

/** Interaction Engine 物件資料：場景中的可互動物件 */
export type PanelKind = 'dialogue' | 'document' | 'reasoning' | 'door' | 'message';

export interface InteractionRule {
  when?: Condition;
  panel: PanelKind;
  docId?: string;
  message?: string;
  effects?: Effects;
}

export interface SceneObjectDef {
  id: string;
  label: string;
  viewpoint: string;            // 點擊後鏡頭移動的視角
  rules: InteractionRule[];     // 依序比對
}

export const SCENE_OBJECTS: SceneObjectDef[] = [
  { id: 'sanitizer', label: '乾洗手液', viewpoint: 'door',
    rules: [{ panel: 'message', message: '你以乾洗手液完成手部衛生（約 20–30 秒，涵蓋手心、手背、指縫、指尖與拇指）。', effects: { flags: ['hand_hygiene'] } }] },
  { id: 'triage_sheet', label: '檢傷單', viewpoint: 'desk',
    rules: [{ panel: 'document', docId: 'doc_triage', effects: { clues: ['cl_triage', 'cl_age_sex'] } }] },
  { id: 'patient', label: '病人：林先生', viewpoint: 'bed',
    rules: [{ panel: 'dialogue' }] },
  { id: 'monitor', label: '生命徵象監視器', viewpoint: 'bed',
    rules: [{ panel: 'document', docId: 'doc_monitor', effects: { clues: ['cl_monitor'] } }] },
  { id: 'med_bag', label: '病人的藥袋', viewpoint: 'table',
    rules: [
      { when: { flags: ['bag_consent'] }, panel: 'document', docId: 'doc_medbag', effects: { clues: ['cl_med_bag'], flags: ['bag_viewed'] } },
      { panel: 'message', message: '這是病人的個人物品。查看前，應先向病人說明目的並徵得同意。（可在問診中提出）', effects: { flags: ['bag_noticed'] } },
    ] },
  { id: 'terminal', label: '電子病歷工作站', viewpoint: 'desk',
    rules: [
      { when: { flags: ['reasoning_unlocked'] }, panel: 'reasoning', effects: { clues: ['cl_old_record'] } },
      { panel: 'document', docId: 'doc_terminal_locked', effects: { clues: ['cl_old_record'] } },
    ] },
  { id: 'whiteboard', label: '診間白板', viewpoint: 'whiteboard',
    rules: [{ panel: 'document', docId: 'doc_whiteboard', effects: { clues: ['st_whiteboard'] } }] },
  { id: 'handoff', label: '掉落的紙張', viewpoint: 'desk',
    rules: [{ panel: 'document', docId: 'doc_handoff', effects: { clues: ['st_handoff'] } }] },
  { id: 'ecg_machine', label: '心電圖機', viewpoint: 'table',
    rules: [{ panel: 'document', docId: 'doc_ecg_error', effects: { clues: ['st_ecg_error'] } }] },
  { id: 'door', label: '門禁系統', viewpoint: 'door',
    rules: [
      { when: { flags: ['puzzle_solved'] }, panel: 'door' },
      { panel: 'message', message: '門禁面板：「緊急管制中。請於工作站上傳本床病人之問題表述以解除鎖定。」' },
    ] },
];

export const OBJECT_MAP = Object.fromEntries(SCENE_OBJECTS.map((o) => [o.id, o]));

/** 鏡頭固定視角（Scene Engine 使用） */
export const VIEWPOINTS: Record<string, { label: string; pos: [number, number, number]; target: [number, number, number] }> = {
  overview: { label: '全景', pos: [1.9, 1.7, 2.55], target: [-0.6, 1.0, -1.6] },
  bed: { label: '病床', pos: [0.2, 1.6, 0.55], target: [-0.35, 0.92, -2.1] },
  table: { label: '床邊桌', pos: [0.85, 1.45, -0.6], target: [0.35, 0.75, -2.2] },
  desk: { label: '工作站', pos: [1.25, 1.55, 0.2], target: [3.2, 0.95, -0.7] },
  whiteboard: { label: '白板', pos: [-1.0, 1.6, 0.9], target: [-3.4, 1.55, 0.6] },
  door: { label: '門口', pos: [0.6, 1.6, 0.9], target: [2.3, 1.2, 2.95] },
};
