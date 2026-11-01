import { useGame } from '../../store/gameStore';
import { useUI } from '../../store/uiStore';
import { sfx } from '../../audio/audioEngine';

/**
 * Interaction Engine：將 3D 物件點擊轉換為遊戲事件與介面面板
 * 物件規則資料位於 data/level1/objects.ts
 */
export function handleInteraction(objectId: string) {
  const ui = useUI.getState();
  const game = useGame.getState();
  if (game.level1.activeNurse) { ui.toast('護理師正在等待你的指示', 'warn'); return; }
  const rule = game.interact(objectId);
  if (!rule) return;
  sfx('click');
  ui.closeAll();
  switch (rule.panel) {
    case 'dialogue': ui.openDialogue(true); break;
    case 'document': ui.openDoc(rule.docId ?? null); break;
    case 'reasoning': ui.openDock('reasoning'); break;
    case 'message': ui.showMessage(rule.message ?? ''); break;
    case 'door':
      sfx('door');
      ui.setDoorOpen(true);
      setTimeout(() => { useGame.getState().exitLevel(); ui.setDoorOpen(false); }, 2200);
      break;
  }
}
