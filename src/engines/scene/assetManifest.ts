/**
 * 3D 資產清單（Asset Manifest）
 * ------------------------------------------------------------
 * status = 'pending'   → 尚無經授權之高擬真模型，場景中以「待補模型」掃描框標示（不偽裝為正式成品）
 * status = 'available' → 將 GLB 放入 public/models/ 並填入 license 後改為 available，即自動載入
 *
 * 規範：醫療設備、病床、人體模型不得以基本幾何體拼湊替代。
 */
export interface AssetEntry {
  id: string;
  label: string;
  file: string;               // 相對於 public/
  status: 'pending' | 'available';
  license?: string;
  source?: string;
  requirement: string;        // 規格需求
  scale?: number;
}

export const ASSETS: Record<string, AssetEntry> = {
  hospital_bed: { id: 'hospital_bed', label: '急診診察床（電動病床）', file: 'models/hospital_bed.glb', status: 'pending',
    requirement: 'PBR、≤ 60k tris、含床欄與床頭調整機構、真實尺寸（約 2.1 × 0.95 m）' },
  patient_male_60s: { id: 'patient_male_60s', label: '標準化病人：60 多歲男性（臥姿）', file: 'models/patient_male_60s.glb', status: 'pending',
    requirement: '擬真人體（非卡通／黏土風）、臥姿、病人服、可做呼吸與表情 blendshape；需經臨床教師審核外觀與姿勢' },
  ecg_cart: { id: 'ecg_cart', label: '12 導程心電圖機與推車', file: 'models/ecg_cart.glb', status: 'pending',
    requirement: '含導程線與電極夾、螢幕可替換貼圖；Level 05 技能操作需可分離部件' },
  patient_monitor: { id: 'patient_monitor', label: '生命徵象監視器（壁掛）', file: 'models/patient_monitor.glb', status: 'pending',
    requirement: '機殼 PBR 模型；螢幕區域保留獨立材質以投放即時波形（目前以即時繪製之螢幕面板呈現）' },
};

export const assetUrl = (a: AssetEntry) => `${import.meta.env.BASE_URL}${a.file}`;
