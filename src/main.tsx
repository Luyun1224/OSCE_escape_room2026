import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

if (import.meta.env.DEV) {
  // 開發／自動化測試用：於瀏覽器 console 存取狀態
  import('./store/gameStore').then((m) => Object.assign(window, { __game: m.useGame }));
  import('./engines/interaction/interactionEngine').then((m) => Object.assign(window, { __interact: m.handleInteraction }));
}
