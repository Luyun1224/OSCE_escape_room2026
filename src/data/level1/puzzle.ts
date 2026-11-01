/**
 * Puzzle Engine 資料：問題表述重組 (Problem Representation)
 * 規則化評估：依線索標籤判斷，不依點選順序判定。
 * ⚠️ 待教師審核
 */
export interface SlotDef {
  id: string;
  label: string;
  desc: string;
  requiredTag: string;
  min: number;
  accepts: string[];   // 可接受（不扣分）的標籤
}

export const PR_SLOTS: SlotDef[] = [
  { id: 'background', label: '病人背景與危險因子', desc: '年齡、性別與心血管危險因子（至少 4 項）', requiredTag: 'risk', min: 4, accepts: ['risk'] },
  { id: 'symptom', label: '胸痛特徵與病程', desc: '時間、性質、位置、放射、病程（至少 4 項）', requiredTag: 'symptom_char', min: 4, accepts: ['symptom_char'] },
  { id: 'associated', label: '重要伴隨症狀', desc: '具臨床意義的陽性伴隨症狀（至少 2 項）', requiredTag: 'assoc_pos', min: 2, accepts: ['assoc_pos'] },
  { id: 'negatives', label: '關鍵陰性發現', desc: '有助於排除危急鑑別的陰性（至少 2 項）', requiredTag: 'pertinent_neg', min: 2, accepts: ['pertinent_neg'] },
  { id: 'safety', label: '處置安全警示', desc: '會改變後續處置安全的資訊（至少 1 項）', requiredTag: 'med_alert', min: 1, accepts: ['med_alert', 'allergy'] },
];

export interface DxOption { id: string; label: string; en: string }
export const DX_OPTIONS: DxOption[] = [
  { id: 'acs', label: '急性冠心症', en: 'Acute coronary syndrome' },
  { id: 'dissection', label: '主動脈剝離', en: 'Aortic dissection' },
  { id: 'pe', label: '肺栓塞', en: 'Pulmonary embolism' },
  { id: 'pericarditis', label: '心包膜炎', en: 'Pericarditis' },
  { id: 'gerd', label: '胃食道逆流', en: 'GERD' },
  { id: 'msk', label: '肋軟骨炎／肌肉骨骼痛', en: 'Costochondritis' },
  { id: 'panic', label: '恐慌發作', en: 'Panic attack' },
  { id: 'pneumonia', label: '肺炎', en: 'Pneumonia' },
];

export const DX_ANSWER = {
  leading: 'acs',
  mustNotMiss: ['dissection', 'pe'],   // 除最可能診斷外，仍須評估之危急診斷
  explanation: '典型壓迫性胸骨後疼痛、放射至左臂與下巴、合併冒冷汗與噁心，加上多項危險因子與漸進性勞力型胸悶，最支持急性冠心症；主動脈剝離與肺栓塞屬不可錯過之致命診斷，雖病史線索不支持，仍需於後續檢查中確認排除。（待教師審核）',
};

export const MODEL_PR =
  '62 歲男性，具高血壓、糖尿病、高血脂、吸菸（35 包年）及早發性冠心病家族史；近兩週出現漸進性勞力型胸悶，今晚 01:20 起持續約 50 分鐘、休息不緩解之胸骨後壓迫性胸痛，放射至左臂與下巴，合併冒冷汗、喘與噁心；否認撕裂性背痛、肋膜性疼痛及下肢腫脹。今晚 22:00 曾服用 sildenafil 50 mg。（示範答案，待教師審核）';
