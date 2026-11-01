import type { DialogueOption, TopicId } from '../../engines/narrative/types';

/**
 * Level 01 病人分支對話資料庫（虛構病例，待教師審核）
 * - 回應依序比對 when 條件，第一個成立者採用
 * - visibleWhen 控制分支是否解鎖
 * - trust（信任感）影響敏感資訊揭露
 */

export const TOPIC_LABEL: Record<TopicId, string> = {
  opening: '開場與建立關係',
  hpi: '主訴與現病史',
  associated: '伴隨症狀',
  redflag: '危急鑑別篩檢',
  background: '過去病史・用藥・過敏',
  social: '社會史・家族史',
  closing: '同理與說明',
};

export const TOPIC_ORDER: TopicId[] = ['opening', 'hpi', 'associated', 'redflag', 'background', 'social', 'closing'];

const WORRY = '醫師……我是不是心臟出問題了？我太太還在家裡，我是不是會……';

export const DIALOGUE: DialogueOption[] = [
  // ───────── 開場 ─────────
  { id: 'q_intro', topic: 'opening', short: '自我介紹',
    label: '您好，我是今晚值班的醫師，接下來由我為您評估，有任何不舒服都可以告訴我。',
    responses: [{ text: '醫師你好……（按著胸口）拜託快幫我看看，真的很悶。', stage: '病人點頭，表情緊繃', effects: { flags: ['introduced'], trust: 1 } }] },
  { id: 'q_identity', topic: 'opening', short: '身分確認',
    label: '為了確認身分，可以請您告訴我您的全名和出生年月日嗎？',
    responses: [{ text: '林志明……1964 年 3 月 12 號。', stage: '你核對手圈：姓名與出生日期皆相符', effects: { flags: ['identity_confirmed'] } }] },
  { id: 'q_open', topic: 'opening', short: '開放式問題',
    label: '可以從頭跟我說說，這次的不舒服是怎麼開始的嗎？',
    responses: [{ text: '我半夜一點多起來上廁所，走回床上就開始胸口悶……一開始以為躺一下就好，結果越來越不舒服，到現在都沒好。', stage: '病人說話時有些喘',
      effects: { flags: ['open_question'], clues: ['cl_onset'] } }] },

  // ───────── 現病史 OPQRST ─────────
  { id: 'q_onset', topic: 'hpi', short: '發作時間 (O)',
    label: '症狀是幾點開始的？當時您在做什麼？',
    responses: [{ text: '大概凌晨一點二十分吧，我起來上廁所，走回床上就開始了。到現在快一個小時了。', effects: { clues: ['cl_onset'] } }] },
  { id: 'q_location', topic: 'hpi', short: '位置 (Location)',
    label: '最不舒服的位置在哪裡？可以指給我看嗎？',
    responses: [{ text: '就這裡，整個胸口正中間。', stage: '病人握拳放在胸骨正前方', effects: { clues: ['cl_location'] } }] },
  { id: 'q_quality', topic: 'hpi', short: '性質 (Q)',
    label: '那種感覺像什麼？是壓迫、刺痛，還是燒灼感？',
    responses: [{ text: '像有一顆大石頭壓在胸口，很緊、很重。不是刺刺的那種。', effects: { clues: ['cl_quality'] } }] },
  { id: 'q_radiation', topic: 'hpi', short: '放射 (R)',
    label: '這種不舒服會跑到其他地方嗎？例如手臂、下巴或背部？',
    responses: [{ text: '會往左手臂跟下巴那邊跑，手有點痠麻。背是不會。', effects: { clues: ['cl_radiation'] } }] },
  { id: 'q_severity', topic: 'hpi', short: '嚴重度 (S)',
    label: '如果 0 分是完全不痛、10 分是最痛，現在大概幾分？',
    responses: [{ text: `大概……七分吧。${WORRY}`, stage: '病人神情焦慮', effects: { clues: ['cl_severity'], flags: ['patient_worried'], emotion: 'anxious' } }] },
  { id: 'q_course', topic: 'hpi', short: '病程 (T)',
    label: '從開始到現在，是一直持續，還是一陣一陣的？休息之後有好一點嗎？',
    responses: [{ text: '一直都在，躺著休息也沒有比較好。以前那種休息一下就會好，這次完全不一樣。', effects: { clues: ['cl_course'], flags: ['patient_worried'] } }] },
  { id: 'q_aggravating', topic: 'hpi', short: '誘發／緩解 (P)',
    label: '深呼吸、咳嗽，或改變姿勢的時候，會比較痛嗎？',
    responses: [{ text: '好像都差不多……吸氣或翻身都沒有特別變化。', effects: { clues: ['cl_no_pleuritic'] } }] },
  { id: 'q_prior', topic: 'hpi', short: '過去類似發作',
    label: '以前有過類似的不舒服嗎？',
    responses: [{ text: '這兩個禮拜爬樓梯的時候會悶一下，休息幾分鐘就好了。最近好像越來越常……我以為只是太累，就沒去看。', effects: { clues: ['cl_prior_angina'] } }] },
  { id: 'q_food', topic: 'hpi', short: '與進食關係',
    label: '這個不舒服跟吃東西有關係嗎？會火燒心，或吞東西卡卡的嗎？',
    responses: [{ text: '沒有，跟吃東西沒關係。晚餐也吃得很普通。', effects: { clues: ['cl_no_gi'] } }] },

  // ───────── 伴隨症狀 ─────────
  { id: 'q_sweat', topic: 'associated', short: '冒冷汗',
    label: '發作的時候有冒冷汗嗎？',
    responses: [{ text: '有，一直冒冷汗，衣服都濕了。', stage: '你注意到病人額頭與衣領濕潤', effects: { clues: ['cl_diaphoresis'] } }] },
  { id: 'q_dyspnea', topic: 'associated', short: '呼吸喘',
    label: '會喘嗎？躺平的時候會不會更喘？',
    responses: [{ text: '有一點喘……躺平倒是還好，沒有特別更喘。', effects: { clues: ['cl_dyspnea'] } }] },
  { id: 'q_nausea', topic: 'associated', short: '噁心嘔吐',
    label: '有想吐或已經吐過嗎？',
    responses: [{ text: '有點想吐，但沒有吐出來。', effects: { clues: ['cl_nausea'] } }] },
  { id: 'q_syncope', topic: 'associated', short: '暈厥／心悸',
    label: '有頭暈、差點昏倒，或心跳很亂的感覺嗎？',
    responses: [{ text: '頭不會暈，也沒有昏倒。心跳好像有點快，但不會亂跳。', effects: { clues: ['cl_no_syncope'] } }] },
  { id: 'q_fever', topic: 'associated', short: '發燒咳嗽',
    label: '最近有發燒、咳嗽或咳痰嗎？',
    responses: [{ text: '沒有，都沒有。', effects: { clues: ['cl_no_fever'] } }] },

  // ───────── 危急鑑別篩檢 ─────────
  { id: 'q_tearing', topic: 'redflag', short: '撕裂性背痛（主動脈剝離）',
    label: '這個痛是不是突然一下子就到最痛，像撕裂一樣，痛到背後或一路往下移動？',
    responses: [{ text: '不是那樣……是慢慢悶起來的，背也不會痛，沒有那種撕開的感覺。', effects: { clues: ['cl_no_tearing'] } }] },
  { id: 'q_dvt', topic: 'redflag', short: '血栓風險（肺栓塞）',
    label: '最近有沒有單腳腫痛，或剛開過刀、長途搭車搭飛機、長時間躺床？',
    responses: [{ text: '腳不會腫。最近也沒開刀，開計程車是坐很久啦，但每趟都會下車走動。', effects: { clues: ['cl_no_dvt'] } }] },
  { id: 'q_trauma', topic: 'redflag', short: '胸部外傷',
    label: '最近胸口有受傷或撞到嗎？',
    responses: [{ text: '沒有，沒有撞到。', effects: { clues: ['cl_no_trauma'] } }] },

  // ───────── 過去病史・用藥・過敏 ─────────
  { id: 'q_pmh', topic: 'background', short: '過去病史',
    label: '過去有什麼慢性病嗎？例如高血壓、糖尿病、膽固醇、心臟病或中風？',
    responses: [{ text: '高血壓大概十年了，糖尿病五年，膽固醇也有點高。心臟病跟中風是沒有。', effects: { clues: ['cl_pmh'] } }] },
  { id: 'q_bleed', topic: 'background', short: '出血病史',
    label: '以前有沒有胃潰瘍、腸胃道出血，或最近開過刀？',
    responses: [{ text: '沒有，胃還不錯。最近也沒開刀。', effects: { clues: ['cl_no_bleed'] } }] },
  { id: 'q_meds', topic: 'background', short: '規則用藥',
    label: '平常有規則吃哪些藥？',
    responses: [{ text: '血壓藥、糖尿病的藥，還有一顆降膽固醇的。藥袋我有帶來，在旁邊。', effects: { clues: ['cl_meds'], flags: ['meds_asked'] } }] },
  { id: 'q_other_meds', topic: 'background', short: '其他／自費用藥',
    label: '除了這些，最近有沒有吃其他藥？像是自費藥、保健食品或中藥？',
    visibleWhen: { asked: ['q_meds'], notClues: ['cl_sildenafil'] },
    responses: [
      { when: { trustGte: 3 }, text: '嗯……其實，我今天晚上十點左右有吃一顆那個藍色的……威而鋼，50 毫克，診所自費開的。這個……很重要嗎？', stage: '病人壓低聲音，略顯尷尬', effects: { clues: ['cl_sildenafil'], flags: ['sildenafil_known'] } },
      { text: '呃……應該沒有了吧。', stage: '病人眼神迴避，停頓了一下', effects: { flags: ['meds_hesitant'], emotion: 'hesitant' } },
    ] },
  { id: 'q_confidential', topic: 'background', short: '保密說明後再確認用藥',
    label: '林先生，這些資訊我們都會保密。有些藥會影響等一下治療的安全，任何藥物都請讓我知道，好嗎？',
    visibleWhen: { flags: ['meds_hesitant'], notClues: ['cl_sildenafil'] },
    responses: [{ text: '……好啦。其實我今天晚上十點左右有吃一顆威而鋼，50 毫克，是診所自費開的。這個……很重要嗎？', stage: '病人深吸一口氣', effects: { clues: ['cl_sildenafil'], flags: ['sildenafil_known', 'confidentiality_explained'], trust: 1, emotion: 'calmer' } }] },
  { id: 'q_pde5_direct', topic: 'background', short: '直接詢問 PDE5 抑制劑',
    label: '請問過去兩天內，有沒有使用治療勃起功能障礙的藥物，例如威而鋼或犀利士？',
    visibleWhen: { anyFlags: ['meds_asked', 'need_check_pde5'], notClues: ['cl_sildenafil'] },
    responses: [{ text: '……有。今天晚上十點左右吃了一顆威而鋼，50 毫克。', stage: '病人沉默了幾秒才回答', effects: { clues: ['cl_sildenafil'], flags: ['sildenafil_known', 'pde5_asked_direct'] } }] },
  { id: 'q_bag_permission', topic: 'background', short: '徵詢查看藥袋',
    label: '我可以看一下您帶來的藥袋嗎？這可以幫我確認您的用藥。',
    visibleWhen: { anyFlags: ['meds_asked', 'bag_noticed'], notFlags: ['bag_consent'] },
    responses: [{ text: '可以啊，就放在旁邊的小桌子上。', effects: { flags: ['bag_consent'], trust: 1 } }] },
  { id: 'q_selfpay', topic: 'background', short: '詢問自費處方',
    label: '藥袋裡有一張診所的自費處方箋，請問那是什麼藥？最近一次是什麼時候吃的？',
    visibleWhen: { flags: ['bag_viewed'], notClues: ['cl_sildenafil'] },
    responses: [{ text: '啊……那個是威而鋼。今天晚上十點左右吃了一顆，50 毫克。', stage: '病人有點不好意思', effects: { clues: ['cl_sildenafil'], flags: ['sildenafil_known'] } }] },
  { id: 'q_allergy', topic: 'background', short: '過敏史',
    label: '有沒有對任何藥物或食物過敏？',
    responses: [{ text: '盤尼西林會起疹子。其他好像沒有。', effects: { clues: ['cl_allergy'] } }] },

  // ───────── 社會史・家族史 ─────────
  { id: 'q_smoking', topic: 'social', short: '吸菸',
    label: '有抽菸嗎？大概一天幾包、抽多久了？',
    responses: [{ text: '有……一天一包，抽了三十五年了。醫生上次也叫我戒。', effects: { clues: ['cl_smoking'] } }] },
  { id: 'q_alcohol', topic: 'social', short: '飲酒／物質',
    label: '平常有喝酒，或使用其他物質嗎？',
    responses: [{ text: '偶爾應酬喝一點啦，其他的沒有。', effects: { clues: ['cl_alcohol'] } }] },
  { id: 'q_work', topic: 'social', short: '職業與壓力',
    label: '平常做什麼工作？最近作息或壓力怎麼樣？',
    responses: [{ text: '開計程車。最近常跑夜班，睡不太好，壓力是有啦。', effects: { clues: ['cl_stress'] } }] },
  { id: 'q_family', topic: 'social', short: '家族史',
    label: '家人有沒有人有心臟病，或很年輕就心肌梗塞、猝死？',
    responses: [{ text: '我爸爸 52 歲的時候心肌梗塞……那時候也是半夜發作。', stage: '病人的表情更加不安', effects: { clues: ['cl_family'], flags: ['patient_worried'] } }] },

  // ───────── 同理與說明 ─────────
  { id: 'q_empathy', topic: 'closing', short: '同理回應',
    label: '我知道胸口這麼不舒服一定很害怕。我們會一步一步處理，有任何變化請馬上告訴我。',
    visibleWhen: { flags: ['patient_worried'] },
    responses: [{ text: '……好，謝謝醫師。有人在旁邊，我比較不慌了。', stage: '病人的呼吸稍微緩和', effects: { flags: ['empathy_shown'], trust: 1, emotion: 'calmer' } }] },
  { id: 'q_dismiss', topic: 'closing', short: '（安撫）不要想太多',
    label: '先不要想太多，應該沒什麼大問題啦。',
    visibleWhen: { flags: ['patient_worried'] },
    responses: [{ text: '……可是真的很不舒服耶。', stage: '病人皺眉，似乎沒有被說服', effects: { flags: ['false_reassurance'], trust: -1, emotion: 'anxious' } }] },
  { id: 'q_summary', topic: 'closing', short: '摘要並說明下一步',
    label: '我跟您確認一下：您凌晨一點多開始胸悶到現在，接下來我們會先完成心電圖、抽血檢查並持續監測，結果出來我會馬上跟您說明。',
    visibleWhen: { minAsked: 10 },
    responses: [{ text: '好……謝謝醫師，聽你這樣說我比較清楚了。', effects: { flags: ['summarized'], trust: 1, emotion: 'calmer' } }] },
];

export const DIALOGUE_MAP = Object.fromEntries(DIALOGUE.map((d) => [d.id, d]));

/** 尚未自我介紹時的第一次回應前綴 */
export const WHO_ARE_YOU = '（病人疑惑地看著你）……請問，你是哪一位？';
