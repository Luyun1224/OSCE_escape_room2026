# OSCE ESCAPE｜臨床解碼：最後一班值勤

**The Last Shift — A Clinical Mystery**

以瀏覽器遊玩的沉浸式醫學教育遊戲（Medical Mystery × Clinical Simulation × Escape Room），對象為醫學生、UGY 與 PGY 醫師，透過探索、問診、互動解謎與臨床決策練習 OSCE 核心能力。

> ⚠️ **臨床內容待教師審核**：所有病例、對話、教學說明與評核規準皆為教學用虛構內容，正式教學上線前須完成專業驗證（見 [`docs/CLINICAL_REVIEW.md`](docs/CLINICAL_REVIEW.md)）。遊戲分數為形成性回饋，不等同正式 OSCE 成績，亦不得推算 EPA 信賴等級。

## 目前進度（Phase 1）

- ✅ 首頁（3D 夜間走廊、環境音、開始／繼續／關卡選擇／說明／設定）
- ✅ 玩家設定（暱稱、身分、三種模式、三種難度）
- ✅ **LEVEL 01｜消失的病歷（病史詢問）**：可從開始完整玩到結束
  - 3D 夜間急診診察室、固定視角切換、物件探索
  - 分支式病人問診（信任感、情緒、隱藏用藥線索的多條取得路徑）
  - 團隊決策事件（12 導程心電圖、NTG 給藥前禁忌確認），由案例狀態機觸發
  - 線索背包、病歷筆記（自動整理）、檢查結果、任務清單
  - 臨床推理板：問題表述重組（拖曳＋連線視覺化）＋假設形成
  - 三階段提示、計時、存檔、通關劇情
  - 學習報告：六大能力雷達圖、決策歷程、錯誤分析、推理路徑、JSON / CSV 匯出、教師權重調整
- 🔒 LEVEL 02–05、FINAL：Phase 2（關卡選擇中標示為開發中，不提供假關卡）

**待補 3D 模型**（病床、標準化病人、心電圖機、監視器機殼）在場景中以「待補 3D 模型」掃描框明確標示，未以基本幾何體拼湊。詳見 [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md#6-素材清單與待補項目)。

## 開發

```bash
npm install
npm run dev        # http://localhost:5173/OSCE_escape_room2026/
npm run build      # 型別檢查＋產出 dist/
npm run preview
```

技術：React 19、TypeScript、Vite、Three.js、React Three Fiber、Drei、@react-three/postprocessing、Zustand、Tailwind CSS v4、Motion。

## 部署（GitHub Pages）

`.github/workflows/deploy.yml` 會在推送至 `main` 時建置並部署。請於 GitHub 專案 **Settings → Pages → Source** 選擇 **GitHub Actions**。
Vite `base` 預設為 `/OSCE_escape_room2026/`，可用環境變數 `VITE_BASE` 覆寫。遊戲以單頁狀態切換畫面，不依賴伺服器端路由。

## 文件

- [遊戲設計文件：架構、畫面、Level 01 流程、素材、開發階段](docs/GAME_DESIGN.md)
- [臨床內容審核清單](docs/CLINICAL_REVIEW.md)

## 資料與隱私

進度僅以 localStorage 儲存在使用者瀏覽器，不含可識別個資（請勿以真實姓名作為暱稱）。多人資料與教師後台需另建具身分驗證與權限管理之後端（Phase 3）。
