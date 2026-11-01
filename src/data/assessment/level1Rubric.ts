import type { Domain } from '../../types/game';
import type { ConditionContext } from '../../engines/narrative/conditions';
import type { PuzzleResult } from '../../engines/puzzle/problemRepresentation';

/**
 * Assessment Engine 資料：Level 01 評核規準（可觀察指標）
 * - weight 為預設權重，教師可於「設定 → 教師權重」調整
 * - critical：關鍵病人安全項目
 * ⚠️ 待教師審核；本規準為形成性評量用途，不等同正式 OSCE 評分表
 */
export interface RubricContext extends ConditionContext {
  puzzle?: PuzzleResult;
  puzzleAssisted: boolean;
  firstPatientContactBeforeHygiene: boolean;
}

export interface RubricItem {
  id: string;
  domain: Domain;
  label: string;
  criterion: string;     // 可觀察指標
  weight: number;
  critical?: boolean;
  check: (c: RubricContext) => boolean;
  feedback: string;      // 未達成時的學習建議
}

const asked = (c: RubricContext, ...ids: string[]) => ids.every((i) => c.asked.includes(i));
const askedAny = (c: RubricContext, ...ids: string[]) => ids.some((i) => c.asked.includes(i));
const slotOk = (c: RubricContext, id: string) => !!c.puzzle?.slots.find((s) => s.slotId === id)?.satisfied;

export const LEVEL1_RUBRIC: RubricItem[] = [
  // 醫病溝通
  { id: 'C1', domain: 'communication', label: '接觸病人前手部衛生', criterion: '首次與病人互動前完成手部衛生', weight: 1,
    check: (c) => c.flags.includes('hand_hygiene') && !c.firstPatientContactBeforeHygiene, feedback: '依 WHO 手部衛生五時機，接觸病人前應完成手部衛生。' },
  { id: 'C2', domain: 'communication', label: '自我介紹', criterion: '說明身分與角色', weight: 1,
    check: (c) => c.flags.includes('introduced'), feedback: '開場自我介紹有助於建立信任。' },
  { id: 'C3', domain: 'communication', label: '以兩種識別資料確認身分', criterion: '詢問全名與出生日期並核對手圈', weight: 1,
    check: (c) => c.flags.includes('identity_confirmed'), feedback: '病人辨識應使用至少兩種識別資料。' },
  { id: 'C4', domain: 'communication', label: '使用開放式問題', criterion: '以開放式問題引導病人陳述', weight: 1,
    check: (c) => c.flags.includes('open_question'), feedback: '先以開放式問題讓病人敘述，再以封閉式問題補足細節。' },
  { id: 'C5', domain: 'communication', label: '回應病人情緒', criterion: '對病人擔憂給予同理回應，且未給予不實保證', weight: 1,
    check: (c) => c.flags.includes('empathy_shown') && !c.flags.includes('false_reassurance'), feedback: '面對病人恐懼，應予同理（命名情緒、表達支持），避免「沒事啦」等不實保證。' },
  { id: 'C6', domain: 'communication', label: '查看個人物品前徵得同意', criterion: '查看藥袋前先說明並取得同意', weight: 1,
    check: (c) => c.flags.includes('bag_consent') || !c.flags.includes('bag_noticed'), feedback: '查看病人個人物品前，應說明目的並徵得同意。' },
  { id: 'C7', domain: 'communication', label: '摘要與說明下一步', criterion: '向病人摘要病史並說明後續檢查', weight: 1,
    check: (c) => c.flags.includes('summarized'), feedback: '問診結束前摘要重點並說明下一步，可確認資訊正確並降低病人焦慮。' },

  // 病史詢問
  { id: 'H1', domain: 'history', label: '發作時間 (Onset)', criterion: '確認症狀開始的時間點與情境', weight: 2, check: (c) => askedAny(c, 'q_onset', 'q_open'), feedback: '發作時間會影響再灌流治療決策，務必確認明確時間點。' },
  { id: 'H2', domain: 'history', label: '疼痛位置', criterion: '詢問疼痛位置', weight: 1, check: (c) => asked(c, 'q_location'), feedback: '請病人指出疼痛位置。' },
  { id: 'H3', domain: 'history', label: '疼痛性質', criterion: '詢問疼痛性質（壓迫、刺痛、燒灼）', weight: 1, check: (c) => asked(c, 'q_quality'), feedback: '疼痛性質有助於區分心因性與非心因性胸痛。' },
  { id: 'H4', domain: 'history', label: '放射痛', criterion: '詢問是否放射至手臂、下巴或背部', weight: 1, check: (c) => asked(c, 'q_radiation'), feedback: '放射至左臂／下巴支持缺血；放射至背部需警覺主動脈剝離。' },
  { id: 'H5', domain: 'history', label: '嚴重度', criterion: '以疼痛量表評估', weight: 1, check: (c) => asked(c, 'q_severity'), feedback: '以數字量表評估疼痛，利於追蹤處置反應。' },
  { id: 'H6', domain: 'history', label: '病程與緩解因子', criterion: '詢問持續或間歇、休息是否緩解', weight: 1, check: (c) => asked(c, 'q_course'), feedback: '休息不緩解、持續超過 20 分鐘的胸痛需高度警覺。' },
  { id: 'H7', domain: 'history', label: '肋膜性／姿勢性', criterion: '詢問與呼吸、咳嗽、姿勢之關係', weight: 1, check: (c) => asked(c, 'q_aggravating'), feedback: '肋膜性或姿勢性疼痛可提示心包膜炎、肺部或肌肉骨骼問題。' },
  { id: 'H8', domain: 'history', label: '過去類似發作', criterion: '詢問先前類似症狀', weight: 1, check: (c) => asked(c, 'q_prior'), feedback: '近期漸進性勞力型胸悶提示不穩定的冠狀動脈疾病。' },
  { id: 'H9', domain: 'history', label: 'ACS 伴隨症狀', criterion: '詢問冒冷汗、喘、噁心中至少 2 項', weight: 2, check: (c) => ['q_sweat', 'q_dyspnea', 'q_nausea'].filter((q) => c.asked.includes(q)).length >= 2, feedback: '冒冷汗、喘、噁心等伴隨症狀可提高 ACS 的可能性。' },
  { id: 'H10', domain: 'history', label: '主動脈剝離篩檢', criterion: '詢問撕裂性、突發、轉移至背部之疼痛', weight: 2, check: (c) => asked(c, 'q_tearing'), feedback: '給予抗血小板／抗凝血前，必須考量主動脈剝離。' },
  { id: 'H11', domain: 'history', label: '肺栓塞風險篩檢', criterion: '詢問下肢腫痛、近期手術或制動', weight: 2, check: (c) => asked(c, 'q_dvt'), feedback: '肺栓塞是胸痛的致命鑑別之一，需詢問血栓風險因子。' },
  { id: 'H12', domain: 'history', label: '過去病史', criterion: '詢問慢性病與心血管病史', weight: 1, check: (c) => asked(c, 'q_pmh'), feedback: '危險因子是推估事前機率的基礎。' },
  { id: 'H13', domain: 'history', label: '規則用藥', criterion: '詢問目前用藥', weight: 1, check: (c) => asked(c, 'q_meds'), feedback: '完整用藥史是安全處置的前提。' },
  { id: 'H14', domain: 'history', label: '過敏史', criterion: '詢問藥物與食物過敏', weight: 2, check: (c) => asked(c, 'q_allergy'), feedback: '開立任何藥物前必須確認過敏史。' },
  { id: 'H15', domain: 'history', label: '吸菸史', criterion: '詢問吸菸量與年數', weight: 1, check: (c) => asked(c, 'q_smoking'), feedback: '以包年數量化吸菸史。' },
  { id: 'H16', domain: 'history', label: '家族史', criterion: '詢問早發性心血管疾病家族史', weight: 1, check: (c) => asked(c, 'q_family'), feedback: '早發性冠心病家族史是重要危險因子。' },
  { id: 'H17', domain: 'history', label: '出血風險', criterion: '詢問消化道出血或近期手術', weight: 1, check: (c) => asked(c, 'q_bleed'), feedback: '後續抗血栓治療前需了解出血風險。' },
  { id: 'H18', domain: 'history', label: '辨識 PDE5 抑制劑使用', criterion: '透過問診取得 sildenafil 使用資訊（非經由給藥事件被動得知）', weight: 3,
    check: (c) => c.clueIds.includes('cl_sildenafil') && !c.flags.includes('ntg_near_miss'), feedback: '詢問用藥時應包含自費藥、保健食品與敏感藥物，必要時說明保密並具體詢問。' },

  // 病人安全
  { id: 'S1', domain: 'safety', label: '及時安排 12 導程心電圖', criterion: '立即要求 10 分鐘內完成並判讀 12 導程心電圖', weight: 3, critical: true,
    check: (c) => c.flags.includes('ecg_requested') && !c.flags.includes('ecg_delayed') && !c.flags.includes('ecg_omitted'), feedback: '疑似 ACS 應於 10 分鐘內完成 12 導程心電圖，可與問診同時進行。' },
  { id: 'S2', domain: 'safety', label: '給予硝酸鹽前確認禁忌', criterion: 'NTG 決策時暫緩並確認 PDE5 抑制劑使用與血壓', weight: 3, critical: true,
    check: (c) => c.flags.includes('ntg_held'), feedback: 'PDE5 抑制劑使用後 24–48 小時內禁用硝酸鹽類；給藥前務必確認。' },

  // 臨床推理
  { id: 'R1', domain: 'reasoning', label: '整合危險因子', criterion: '問題表述背景欄正確（≥4 項危險因子）', weight: 2, check: (c) => slotOk(c, 'background'), feedback: '問題表述應包含影響事前機率的危險因子。' },
  { id: 'R2', domain: 'reasoning', label: '描述症狀特徵', criterion: '胸痛特徵欄正確（≥4 項）', weight: 2, check: (c) => slotOk(c, 'symptom'), feedback: '使用語意限定詞（semantic qualifiers）精簡描述症狀：急性、持續、壓迫性、放射。' },
  { id: 'R3', domain: 'reasoning', label: '辨識重要伴隨症狀', criterion: '伴隨症狀欄正確（≥2 項）', weight: 1, check: (c) => slotOk(c, 'associated'), feedback: '整合具鑑別意義的伴隨症狀。' },
  { id: 'R4', domain: 'reasoning', label: '運用關鍵陰性', criterion: '關鍵陰性欄正確（≥2 項）', weight: 2, check: (c) => slotOk(c, 'negatives'), feedback: '關鍵陰性（pertinent negatives）是排除危急鑑別的依據。' },
  { id: 'R5', domain: 'reasoning', label: '標註安全警示', criterion: '安全警示欄包含 PDE5 抑制劑', weight: 2, check: (c) => slotOk(c, 'safety'), feedback: '會改變處置的資訊應在問題表述／交班中明確標註。' },
  { id: 'R6', domain: 'reasoning', label: '最可能診斷', criterion: '選擇急性冠心症為主要工作假設', weight: 2, check: (c) => !!c.puzzle?.leadingCorrect, feedback: '依典型症狀與危險因子形成主要工作假設。' },
  { id: 'R7', domain: 'reasoning', label: '不可錯過之診斷', criterion: '同時保留主動脈剝離與肺栓塞', weight: 2, check: (c) => !!c.puzzle?.mustNotMissCorrect, feedback: '即使有主要假設，仍需系統性保留致命鑑別診斷。' },
  { id: 'R8', domain: 'reasoning', label: '資訊精確度', criterion: '無誤置線索、無多餘鑑別', weight: 1, check: (c) => !!c.puzzle && c.puzzle.misplacedTotal === 0 && c.puzzle.mustNotMissExtra.length === 0, feedback: '精簡、正確分類的資訊有助於團隊溝通。' },
];

/** 預設面向權重（教師可調整） */
export const DEFAULT_DOMAIN_WEIGHTS: Record<Domain, number> = {
  history: 30, physical: 0, reasoning: 30, safety: 25, procedural: 0, communication: 15,
};
