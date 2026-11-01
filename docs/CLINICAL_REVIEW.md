# 臨床內容審核清單（Level 01）

> 狀態：**待教師審核（pending_faculty_review）**
> 審核完成後，請更新 `src/engines/case/chestPainCase.ts` 中的 `CASE_META.reviewStatus` 與 `references`，並於本文件記錄審核者與日期。

| # | 內容 | 檔案 | 需確認重點 | 審核結果 |
|---|---|---|---|---|
| 1 | 病例設定（62 歲男性急性胸痛、危險因子、PDE5 抑制劑使用） | `src/engines/case/chestPainCase.ts` | 情境合理性、與 UGY/PGY 程度相符 | ☐ |
| 2 | 檢傷與監視器數值（BP 158/94、HR 102–104、RR 20、SpO₂ 95%） | 同上 | 數值與臨床情境一致；檢傷級數 | ☐ |
| 3 | 病人回應（30+ 題分支對話） | `src/data/level1/dialogue.ts` | 症狀描述用語自然、無誤導；陰性回答正確 | ☐ |
| 4 | 12 導程心電圖 10 分鐘內完成之教學說明 | `src/data/level1/nurseEvents.ts` | 依最新指引與院內流程用語 | ☐ |
| 5 | PDE5 抑制劑與硝酸鹽禁忌（sildenafil/vardenafil 24 小時；tadalafil 48 小時） | 同上 | 時間窗、其他禁忌（低血壓、右心室梗塞）描述 | ☐ |
| 6 | 問題表述欄位與門檻（危險因子 ≥4、症狀特徵 ≥4、伴隨 ≥2、關鍵陰性 ≥2、安全警示 ≥1） | `src/data/level1/puzzle.ts` | 欄位設計與門檻是否恰當 | ☐ |
| 7 | 線索臨床標籤（risk / symptom_char / assoc_pos / pertinent_neg / med_alert / low） | `src/engines/case/chestPainCase.ts` | 每張線索的分類是否正確 | ☐ |
| 8 | 診斷假設標準答案（ACS；不可錯過：主動脈剝離、肺栓塞） | `src/data/level1/puzzle.ts` | 是否應納入其他危急診斷（如張力性氣胸、心包填塞、食道破裂）為可接受答案 | ☐ |
| 9 | 評核規準 35 項與預設權重、關鍵項目 | `src/data/assessment/level1Rubric.ts` | 可觀察性、權重、關鍵項目認定 | ☐ |
| 10 | 示範問題表述與解析文字 | `src/data/level1/puzzle.ts` | 文字正確性 | ☐ |
| 11 | 監視器 Lead II 示意波形（竇性心搏過速） | `src/engines/scene/Screens.tsx` | 僅作節律示意，不得被誤解為 ST 段判讀依據 | ☐ |
| 12 | 手部衛生說明 | `src/data/level1/objects.ts` | 與院內感控規範一致 | ☐ |

## 審核紀錄

| 日期 | 審核者 | 範圍 | 備註 |
|---|---|---|---|
| | | | |
