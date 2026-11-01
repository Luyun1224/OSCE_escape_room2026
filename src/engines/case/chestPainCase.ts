import type { ClueDef, ReviewStatus } from '../../types/game';

/**
 * Case Engine — 案例 C-01：急性胸痛（虛構病例）
 * ------------------------------------------------------------
 * ⚠️ 所有臨床內容狀態：待教師審核 (pending_faculty_review)
 * 本病例為教學用虛構情境，未使用任何可識別之真實病人資料。
 * 正式教學上線前，須由臨床教師完成專業驗證並將 reviewStatus 更新。
 */
export const CASE_META = {
  id: 'C01-chest-pain',
  title: '夜間急診：急性胸痛',
  reviewStatus: 'pending_faculty_review' as ReviewStatus,
  version: '0.1.0',
  learningObjectives: [
    '以結構化方式（OPQRST）完成胸痛病史詢問',
    '針對危急鑑別診斷（ACS、主動脈剝離、肺栓塞）詢問重要陽性與陰性',
    '完整詢問過去病史、用藥（含自費／敏感用藥）、過敏、社會與家族史',
    '辨識影響後續處置安全的用藥資訊（PDE5 抑制劑與硝酸鹽類）',
    '於到院 10 分鐘內安排 12 導程心電圖',
    '建立精簡且具鑑別力的問題表述 (problem representation)',
  ],
  references: [
    '待教師補充：急性冠心症照護指引（如 ESC / ACC/AHA 最新版）',
    '待教師補充：PDE5 抑制劑與硝酸鹽併用禁忌之藥物仿單資訊',
  ],
};

export const PATIENT = {
  name: '林志明',
  displayName: '林先生',
  sex: '男',
  age: 62,
  dob: '1964 年 3 月 12 日',
  chartNo: 'ED-0000-1173（虛構）',
  bed: '診察床 3',
  arrival: '02:10',
  occupation: '計程車司機',
};

/** 檢傷生命徵象（待教師審核） */
export const TRIAGE_VITALS = {
  time: '02:12',
  bp: '158/94 mmHg',
  hr: '102 /min',
  rr: '20 /min',
  spo2: '95 %（室內空氣）',
  bt: '36.7 °C',
  pain: '7 / 10',
  gcs: 'E4V5M6',
  triageLevel: '第 2 級（危急）',
  cc: '胸悶約 50 分鐘',
};

/** 床邊監視器即時數值（Level 1 期間穩定，不隨機變化） */
export const MONITOR_VITALS = { hr: 104, sys: 156, dia: 92, rr: 20, spo2: 95 };

/**
 * 線索資料庫
 * tags 說明（問題表述拼圖使用）：
 *  risk            心血管危險因子／背景
 *  symptom_char    胸痛特徵
 *  assoc_pos       重要伴隨症狀（陽性）
 *  pertinent_neg   具鑑別意義之陰性發現
 *  med_alert       影響處置安全之用藥
 *  allergy         過敏史
 *  low             與目前臨床問題關聯較低
 */
export const CLUES: ClueDef[] = [
  // --- 檢傷 / 紀錄 ---
  { id: 'cl_triage', title: '檢傷紀錄', category: 'triage', source: '檢傷單', key: true,
    summary: '02:10 到院，主訴胸悶約 50 分鐘；BP 158/94、HR 102、RR 20、SpO₂ 95%、BT 36.7°C，疼痛 7/10，檢傷第 2 級。', tags: ['triage'] },
  { id: 'cl_monitor', title: '床邊監視器數值', category: 'vitals', source: '生命徵象監視器',
    summary: 'HR 104、BP 156/92、RR 20、SpO₂ 95%；竇性心搏過速（監視器導程僅供節律觀察，不能取代 12 導程心電圖）。', tags: ['vitals'] },
  { id: 'cl_old_record', title: '兩週前門診紀錄（部分）', category: 'record', source: '電子病歷（部分損毀）',
    summary: '家醫科門診：高血壓、第二型糖尿病追蹤；LDL 偏高、HbA1c 偏高（數值檔案損毀，待補）。醫師建議戒菸。', tags: ['risk'] },
  { id: 'cl_med_bag', title: '藥袋內容', category: 'meds', source: '病人藥袋（經同意查看）',
    summary: 'Amlodipine 5 mg QD、Metformin 500 mg BID、Atorvastatin 20 mg QD；另夾有一張診所自費處方箋，藥名欄被摺起。', tags: ['low'] },

  // --- 主訴與現病史 ---
  { id: 'cl_onset', title: '發作時間與情境', category: 'hpi', source: '病人陳述', key: true,
    summary: '約 01:20 起床如廁後開始胸悶，持續至今約 50 分鐘未緩解。', tags: ['symptom_char'] },
  { id: 'cl_location', title: '疼痛位置', category: 'hpi', source: '病人陳述',
    summary: '胸骨後方正中，病人以握拳置於胸前描述。', tags: ['symptom_char'] },
  { id: 'cl_quality', title: '疼痛性質', category: 'hpi', source: '病人陳述', key: true,
    summary: '壓迫感、緊縮感，「像大石頭壓著」；非刺痛。', tags: ['symptom_char'] },
  { id: 'cl_radiation', title: '放射痛', category: 'hpi', source: '病人陳述', key: true,
    summary: '放射至左上臂與下巴。', tags: ['symptom_char'] },
  { id: 'cl_severity', title: '疼痛程度', category: 'hpi', source: '病人陳述',
    summary: '疼痛指數 7/10。', tags: ['symptom_char'] },
  { id: 'cl_course', title: '病程與緩解因子', category: 'hpi', source: '病人陳述', key: true,
    summary: '持續性，休息後未緩解。', tags: ['symptom_char'] },
  { id: 'cl_prior_angina', title: '近兩週類似症狀', category: 'hpi', source: '病人陳述', key: true,
    summary: '近兩週爬樓梯時胸悶，休息數分鐘緩解，頻率增加，未就醫。', tags: ['symptom_char'] },

  // --- 伴隨症狀 ---
  { id: 'cl_diaphoresis', title: '冒冷汗', category: 'associated', source: '病人陳述', key: true,
    summary: '發作時冒冷汗，衣服濕透。', tags: ['assoc_pos'] },
  { id: 'cl_dyspnea', title: '呼吸較喘', category: 'associated', source: '病人陳述', key: true,
    summary: '輕度喘，無端坐呼吸。', tags: ['assoc_pos'] },
  { id: 'cl_nausea', title: '噁心', category: 'associated', source: '病人陳述',
    summary: '噁心但未嘔吐。', tags: ['assoc_pos'] },
  { id: 'cl_no_syncope', title: '無暈厥、無心悸', category: 'negative', source: '病人陳述',
    summary: '否認暈厥；否認明顯心悸。', tags: ['pertinent_neg'] },

  // --- 危急鑑別：陰性 ---
  { id: 'cl_no_tearing', title: '無撕裂性背痛', category: 'negative', source: '病人陳述', key: true,
    summary: '否認撕裂樣疼痛、否認轉移至背部的劇痛、否認突發最劇烈疼痛。', tags: ['pertinent_neg'] },
  { id: 'cl_no_pleuritic', title: '非肋膜性、非姿勢性', category: 'negative', source: '病人陳述', key: true,
    summary: '深呼吸、咳嗽或改變姿勢時疼痛無變化。', tags: ['pertinent_neg'] },
  { id: 'cl_no_dvt', title: '無靜脈血栓風險線索', category: 'negative', source: '病人陳述', key: true,
    summary: '否認單側下肢腫痛；近期無手術、長途旅行或長期臥床。', tags: ['pertinent_neg'] },
  { id: 'cl_no_fever', title: '無發燒咳嗽', category: 'negative', source: '病人陳述',
    summary: '否認發燒、咳嗽、咳痰。', tags: ['pertinent_neg'] },
  { id: 'cl_no_trauma', title: '無外傷', category: 'negative', source: '病人陳述',
    summary: '否認胸部外傷。', tags: ['pertinent_neg'] },
  { id: 'cl_no_gi', title: '與進食無關', category: 'negative', source: '病人陳述',
    summary: '症狀與進食無關，無火燒心或吞嚥困難。', tags: ['pertinent_neg'] },

  // --- 過去病史 / 用藥 / 過敏 ---
  { id: 'cl_pmh', title: '過去病史', category: 'pmh', source: '病人陳述', key: true,
    summary: '高血壓約 10 年、第二型糖尿病約 5 年、高血脂；無心肌梗塞或中風病史。', tags: ['risk'] },
  { id: 'cl_no_bleed', title: '無出血病史', category: 'pmh', source: '病人陳述',
    summary: '否認胃潰瘍、腸胃道出血或近期手術。', tags: ['low'] },
  { id: 'cl_meds', title: '規則用藥', category: 'meds', source: '病人陳述', key: true,
    summary: 'Amlodipine、Metformin、Atorvastatin，自述規則服藥。', tags: ['low'] },
  { id: 'cl_sildenafil', title: 'PDE5 抑制劑使用', category: 'meds', source: '病人陳述', key: true,
    summary: '今晚約 22:00 自行服用 Sildenafil 50 mg（自費處方）。→ 24 小時內禁用硝酸鹽類藥物。', tags: ['med_alert'] },
  { id: 'cl_allergy', title: '藥物過敏', category: 'allergy', source: '病人陳述', key: true,
    summary: 'Penicillin 過敏（皮疹）。無其他已知藥物或食物過敏。', tags: ['allergy'] },

  // --- 社會 / 家族史 ---
  { id: 'cl_smoking', title: '吸菸史', category: 'social', source: '病人陳述', key: true,
    summary: '每天 1 包，已 35 年（約 35 包年），目前仍吸菸。', tags: ['risk'] },
  { id: 'cl_alcohol', title: '飲酒／物質使用', category: 'social', source: '病人陳述',
    summary: '偶爾社交性飲酒；否認使用違法藥物。', tags: ['low'] },
  { id: 'cl_stress', title: '工作壓力', category: 'social', source: '病人陳述',
    summary: '計程車司機，近期常值夜班，自覺壓力大、睡眠不足。', tags: ['low'] },
  { id: 'cl_family', title: '家族史', category: 'family', source: '病人陳述', key: true,
    summary: '父親 52 歲時心肌梗塞（早發性冠心病家族史）。', tags: ['risk'] },
  { id: 'cl_age_sex', title: '基本資料', category: 'triage', source: '病歷首頁', key: true,
    summary: '62 歲男性。', tags: ['risk'] },

  // --- 劇情線索（非臨床評分） ---
  { id: 'st_whiteboard', title: '白板上的交班留言', category: 'story', source: '診間白板', narrative: true,
    summary: '「床3 胸痛 02:10 — 12-lead ? 系統異常！檔案被鎖」字跡潦草，最後一行被擦掉。', tags: [] },
  { id: 'st_handoff', title: '交班單殘頁', category: 'story', source: '桌下的紙張', narrative: true,
    summary: '前一班醫師留下的交班單殘頁：「…01:58 的心電圖我已經上傳，但系統…如果你看到這張，請先確認他的用藥…」', tags: [] },
  { id: 'st_ecg_error', title: '心電圖機錯誤代碼', category: 'story', source: '心電圖機', narrative: true,
    summary: '螢幕顯示「E-17：資料存取被鎖定」。最後一筆紀錄時間 01:58，但病人 02:10 才到院？', tags: [] },
];

export const CLUE_MAP: Record<string, ClueDef> = Object.fromEntries(CLUES.map((c) => [c.id, c]));
