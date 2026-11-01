import type { ConditionContext } from '../../engines/narrative/conditions';

export interface ObjectiveDef {
  id: string;
  title: string;
  detail: string;
  optional?: boolean;
  isDone: (ctx: ConditionContext) => boolean;
  /** 進度（已完成 / 需要） */
  progress?: (ctx: ConditionContext) => [number, number];
  hints: [string, string, string]; // 三階段提示：引導觀察 → 思考方向 → 明確學習引導
}

const countAsked = (ctx: ConditionContext, ids: string[]) => ids.filter((i) => ctx.asked.includes(i)).length;
const HPI = ['q_onset', 'q_location', 'q_quality', 'q_radiation', 'q_severity', 'q_course', 'q_aggravating', 'q_prior'];
const BG = ['q_pmh', 'q_meds', 'q_allergy', 'q_smoking', 'q_family'];

export const OBJECTIVES: ObjectiveDef[] = [
  { id: 'obj_hygiene', title: '接觸病人前完成手部衛生', detail: '感染管制是每一次病人接觸的第一步。', optional: true,
    isDone: (c) => c.flags.includes('hand_hygiene'),
    hints: ['看看門口附近牆上的設備。', '接觸病人「之前」有哪一項感染管制步驟？', '點擊門邊的乾洗手液完成手部衛生（WHO 手部衛生五時機：接觸病人前）。'] },
  { id: 'obj_triage', title: '閱讀檢傷資料', detail: '先掌握病人的主訴與生命徵象。',
    isDone: (c) => c.clueIds.includes('cl_triage'),
    hints: ['工作站的桌上好像有一份夾板文件。', '檢傷單會告訴你到院時間、主訴與生命徵象。', '點擊右側工作桌上的「檢傷單」。'] },
  { id: 'obj_rapport', title: '自我介紹並確認病人身分', detail: '建立關係並以兩種識別資料確認身分。',
    isDone: (c) => c.flags.includes('introduced') && c.flags.includes('identity_confirmed'),
    hints: ['病人還不知道你是誰。', '開場時應做哪兩件事？想想病人辨識的原則。', '在問診的「開場與建立關係」中，完成自我介紹，並以全名＋出生年月日確認身分。'] },
  { id: 'obj_hpi', title: '蒐集現病史（OPQRST）', detail: '完整描述胸痛特徵與病程。',
    isDone: (c) => countAsked(c, HPI) >= 6, progress: (c) => [Math.min(countAsked(c, HPI), 6), 6],
    hints: ['胸痛的描述還不夠完整。', '試著用 OPQRST 架構：Onset、Provocation、Quality、Radiation、Severity、Time。', '在「主訴與現病史」中，至少詢問發作時間、位置、性質、放射、嚴重度、病程，以及過去是否有類似發作。'] },
  { id: 'obj_redflag', title: '篩檢危急鑑別診斷', detail: '不要錯過可能致命的胸痛原因。',
    isDone: (c) => ['q_tearing', 'q_dvt'].every((q) => c.asked.includes(q)) && countAsked(c, ['q_sweat', 'q_dyspnea', 'q_nausea']) >= 2,
    hints: ['除了心臟，還有哪些胸痛原因是「不能錯過」的？', '想想主動脈剝離與肺栓塞各有哪些典型病史線索，以及 ACS 常見的伴隨症狀。', '詢問：撕裂性背痛、下肢腫痛／近期制動，並詢問冒冷汗、喘、噁心等伴隨症狀。'] },
  { id: 'obj_background', title: '完成過去病史、用藥、過敏、社會與家族史', detail: '別忘了所有藥物——包括病人不好意思說的。',
    isDone: (c) => countAsked(c, BG) >= 5 && c.clueIds.includes('cl_sildenafil'),
    progress: (c) => [countAsked(c, BG) + (c.clueIds.includes('cl_sildenafil') ? 1 : 0), 6],
    hints: ['病人的用藥資訊似乎還有缺口。', '病人提過他有帶藥袋；而有些藥物，病人可能不會主動說出口。', '詢問規則用藥後，徵得同意查看藥袋，或以保密說明＋具體詢問 PDE5 抑制劑（如威而鋼）使用。也請完成過敏、吸菸與家族史。'] },
  { id: 'obj_reasoning', title: '於工作站上傳問題表述', detail: '整合線索，解鎖被封鎖的病歷系統。',
    isDone: (c) => c.flags.includes('puzzle_solved'),
    hints: ['工作站需要你整理過的資訊才能解鎖。', '好的問題表述包含：病人背景與危險因子、症狀特徵、重要伴隨症狀、關鍵陰性，以及影響安全的資訊。', '開啟「臨床推理板」，將線索卡放到對應欄位；並選出最可能診斷與不可錯過的危急診斷。'] },
  { id: 'obj_exit', title: '解除門禁，前往下一個區域', detail: '工作站解鎖後，門禁系統將恢復。',
    isDone: (c) => c.flags.includes('level_exit'),
    hints: ['門口的面板好像亮起了綠燈。', '門禁已經解鎖了嗎？', '點擊門口的門禁系統離開診察室。'] },
];
