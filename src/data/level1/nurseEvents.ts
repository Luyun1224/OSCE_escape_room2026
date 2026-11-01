import type { NurseEvent } from '../../engines/narrative/types';

/**
 * Level 01 團隊事件（經審核之案例狀態機觸發，非隨機）
 * ⚠️ 待教師審核：教學說明內容需依院內流程與最新指引確認
 */
export const NURSE_NAME = '護理師 陳怡君';

export const NURSE_EVENTS: NurseEvent[] = [
  {
    id: 'ne_ecg',
    title: '12 導程心電圖',
    trigger: { minAsked: 2 },
    prompt: '醫師，床 3 林先生 02:10 到院，胸悶。剛剛那台心電圖機跳出系統錯誤，12 導程還沒做。要怎麼處理？',
    options: [
      { id: 'ecg_now', label: '請立刻換一台心電圖機，在到院 10 分鐘內完成 12 導程心電圖，做完馬上給我判讀；同時接上心臟監視器。',
        outcomes: [{ verdict: 'safe', nurse: '好，我馬上推另一台過來！', effects: { flags: ['ecg_requested'] },
          teaching: '疑似急性冠心症的胸痛病人，應於到院（首次醫療接觸）10 分鐘內完成並判讀 12 導程心電圖。（待教師審核：依最新指引與院內流程）' }] },
      { id: 'ecg_later', label: '等我把病史問完再做。',
        outcomes: [{ verdict: 'suboptimal', nurse: '了解……不過依照胸痛流程，我還是先去推另一台過來，好嗎？', effects: { flags: ['ecg_delayed', 'ecg_requested'] },
          teaching: '病史詢問可以與心電圖同時進行。延後心電圖可能延誤 STEMI 的辨識與再灌流治療時機。本次由護理師依流程補救。' }] },
      { id: 'monitor_only', label: '先接監視器觀察就好，暫時不用做 12 導程。',
        outcomes: [{ verdict: 'unsafe', nurse: '醫師，監視器只有單一導程……依照胸痛流程，我還是建議先做 12 導程，我去推機器。', effects: { flags: ['ecg_omitted', 'ecg_requested'] },
          teaching: '心臟監視器的節律導程無法完整評估 ST 段變化，不能取代 12 導程心電圖。本次由團隊成員提出安全提醒（closed-loop communication）。' }] },
    ],
  },
  {
    id: 'ne_ntg',
    title: '硝化甘油（NTG）給藥',
    trigger: { minAsked: 9, flags: ['ecg_requested'] },
    prompt: '醫師，林先生還是很悶，疼痛 7 分，血壓 156/92。要不要先給 NTG 0.4 mg 舌下？',
    options: [
      { id: 'ntg_give', label: '好，先給一顆 NTG 舌下。',
        outcomes: [
          { when: { clues: ['cl_sildenafil'] }, verdict: 'unsafe',
            nurse: '醫師，等一下——病人今晚 10 點吃過 sildenafil，24 小時內不能給硝酸鹽類。我先不給，好嗎？',
            effects: { flags: ['ntg_ordered_despite_pde5', 'ntg_intercepted'] },
            teaching: 'PDE5 抑制劑（sildenafil、vardenafil 24 小時內；tadalafil 48 小時內）與硝酸鹽類併用可能造成嚴重低血壓，屬禁忌。已取得的用藥資訊必須主動整合進處置決策。（待教師審核）' },
          { verdict: 'unsafe',
            nurse: '好，我去準備……',
            patient: '（病人小聲地說）醫生……我晚上有吃那個藍色的藥……威而鋼……跟這個有關係嗎？',
            effects: { clues: ['cl_sildenafil'], flags: ['ntg_near_miss', 'ntg_intercepted', 'sildenafil_known'] },
            teaching: '近乎失誤（near miss）：給予硝酸鹽前，必須確認 24–48 小時內是否使用 PDE5 抑制劑、收縮壓是否足夠，並考量右心室梗塞等禁忌。本次由病人主動告知而攔截。（待教師審核）' },
        ] },
      { id: 'ntg_hold', label: '先暫緩。我需要先確認他 24–48 小時內有沒有使用 PDE5 抑制劑（例如威而鋼、犀利士），也確認血壓與心電圖。',
        outcomes: [
          { when: { clues: ['cl_sildenafil'] }, verdict: 'safe', nurse: '了解。他今晚用過 sildenafil，我會在給藥紀錄註記暫不使用硝酸鹽類。', effects: { flags: ['ntg_held'] },
            teaching: '正確整合用藥史：PDE5 抑制劑使用後 24–48 小時內避免硝酸鹽類。胸痛緩解需改採其他經評估之處置（於 Level 04 延伸）。（待教師審核）' },
          { verdict: 'safe', nurse: '好，那請您先跟病人確認用藥，我等您指示。', effects: { flags: ['ntg_held', 'need_check_pde5'] },
            teaching: '在給予硝酸鹽前先確認禁忌，是重要的病人安全行為。請記得回到問診中確認 PDE5 抑制劑使用。（待教師審核）' },
        ] },
      { id: 'ntg_wait', label: '先不用處理，等我問完病史再說。',
        outcomes: [{ verdict: 'suboptimal', nurse: '好……但病人還是很不舒服，請您盡快決定。', effects: { flags: ['ntg_deferred', 'need_check_pde5'] },
          teaching: '持續胸痛需及時處理，但處置前須先排除禁忌。較佳做法是明確指示「暫緩並確認 PDE5 抑制劑、血壓」，讓團隊理解原因。' }] },
    ],
  },
  {
    id: 'ne_ecg_missing',
    title: '消失的心電圖',
    trigger: { minAsked: 15, flags: ['ecg_requested'] },
    prompt: '醫師……心電圖做完了，可是上傳時系統又跳出 E-17，檔案被鎖住。印表機那份紙本……也不見了。工作站好像要先送出「問題表述」才能解鎖病歷。',
    options: [
      { id: 'ack', label: '了解。我先完成問題表述解鎖工作站，請持續監測生命徵象，有變化立刻通知我。',
        outcomes: [{ verdict: 'neutral', nurse: '好，我會守在旁邊。', effects: { flags: ['story_ecg_missing'] }, teaching: '' }] },
    ],
  },
];
