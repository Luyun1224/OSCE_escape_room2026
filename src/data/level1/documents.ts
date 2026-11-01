import { PATIENT, TRIAGE_VITALS } from '../../engines/case/chestPainCase';

export interface DocSection { heading?: string; rows?: [string, string][]; text?: string; redacted?: boolean }
export interface DocumentDef {
  id: string;
  kind: 'paper' | 'screen' | 'board' | 'monitor';
  title: string;
  subtitle?: string;
  sections: DocSection[];
  footnote?: string;
}

export const DOCUMENTS: Record<string, DocumentDef> = {
  doc_triage: {
    id: 'doc_triage', kind: 'paper', title: '急診檢傷分類紀錄', subtitle: `到院時間 ${PATIENT.arrival}｜${PATIENT.bed}`,
    sections: [
      { heading: '病人資料', rows: [['姓名', `${PATIENT.name}（虛構）`], ['性別／年齡', `${PATIENT.sex}／${PATIENT.age} 歲`], ['出生日期', PATIENT.dob], ['病歷號', PATIENT.chartNo]] },
      { heading: `生命徵象（${TRIAGE_VITALS.time}）`, rows: [['血壓', TRIAGE_VITALS.bp], ['心跳', TRIAGE_VITALS.hr], ['呼吸', TRIAGE_VITALS.rr], ['血氧', TRIAGE_VITALS.spo2], ['體溫', TRIAGE_VITALS.bt], ['意識', TRIAGE_VITALS.gcs], ['疼痛', TRIAGE_VITALS.pain]] },
      { heading: '主訴', text: TRIAGE_VITALS.cc },
      { heading: '檢傷級數', text: TRIAGE_VITALS.triageLevel },
      { heading: '備註', text: '過敏史：□無 □有＿＿＿（未填寫）　用藥：（未填寫）', redacted: false },
    ],
    footnote: '檢傷內容為教學虛構資料，數值待教師審核。',
  },
  doc_monitor: {
    id: 'doc_monitor', kind: 'monitor', title: '床邊生命徵象監視器', subtitle: '即時數值',
    sections: [{ text: '監視器顯示竇性心搏過速。注意：監視器之節律導程僅供節律監測，無法取代 12 導程心電圖評估 ST 段變化。' }],
  },
  doc_medbag: {
    id: 'doc_medbag', kind: 'paper', title: '病人自備藥袋', subtitle: '經病人同意後查看',
    sections: [
      { heading: '社區藥局藥袋', rows: [['Amlodipine 5 mg', '每日一次'], ['Metformin 500 mg', '每日兩次，飯後'], ['Atorvastatin 20 mg', '每日一次，睡前']] },
      { heading: '夾在藥袋中的紙張', text: '○○診所 自費處方箋 — 藥名欄被摺起來，只看得到「…50 mg　需要時使用」。' },
    ],
    footnote: '提示：處方內容需直接向病人確認，避免臆測。',
  },
  doc_terminal_locked: {
    id: 'doc_terminal_locked', kind: 'screen', title: 'EMR 工作站｜存取受限', subtitle: '⚠ 緊急管制程序啟動中',
    sections: [
      { heading: '系統訊息', text: '本床病人之檢查與交班資料已被鎖定。請完成足夠的臨床資料蒐集，以啟動「臨床推理板」並上傳問題表述 (Problem Representation)。' },
      { heading: '可讀取之殘存紀錄：兩週前家醫科門診', text: 'Dx：Essential hypertension；Type 2 diabetes mellitus；Hyperlipidemia。\nLDL：█████（檔案損毀）　HbA1c：█████（檔案損毀）\nPlan：建議戒菸，持續藥物治療。' },
    ],
  },
  doc_whiteboard: {
    id: 'doc_whiteboard', kind: 'board', title: '診間白板', subtitle: '夜班留言',
    sections: [
      { text: '床 1：腹痛 → 已會診外科\n床 2：發燒 → 等血液培養\n床 3：胸痛 02:10 — 12-lead ??? 系統異常！檔案被鎖\n\n……（最後一行被擦掉，只剩「先確認用」幾個字）' },
    ],
  },
  doc_handoff: {
    id: 'doc_handoff', kind: 'paper', title: '交班單殘頁', subtitle: '桌下撿到的紙張',
    sections: [{ text: '「……01:58 的心電圖我已經上傳，但系統好像出了問題……\n如果你看到這張，請先確認他的用藥，不要急著——」\n\n（後半頁被撕掉了）' }],
    footnote: '劇情線索：與後續關卡的心電圖謎團相關。',
  },
  doc_ecg_error: {
    id: 'doc_ecg_error', kind: 'screen', title: '12 導程心電圖機', subtitle: '系統狀態',
    sections: [{ heading: '錯誤 E-17', text: '資料存取被鎖定。\n最後一筆紀錄：01:58　病人 ID：███████\n\n奇怪……病人是 02:10 才到院的。' }],
    footnote: '本機暫時無法使用。心電圖之判讀將於 Level 03 展開；操作流程於 Level 05 訓練。',
  },
};
