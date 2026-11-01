import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useGame } from './store/gameStore';
import { useUI } from './store/uiStore';
import { setVolumes } from './audio/audioEngine';
import { HomeScreen } from './ui/home/HomeScreen';
import { PlayerSetup } from './ui/home/PlayerSetup';
import { Briefing } from './ui/home/Briefing';
import { SettingsModal } from './ui/common/SettingsModal';

import LevelScreen from './ui/LevelScreen';
import LevelClear from './ui/report/LevelClear';
import ReportScreen from './ui/report/ReportScreen';

export default function App() {
  const screen = useGame((s) => s.screen);
  const settings = useGame((s) => s.settings);
  const settingsOpen = useUI((s) => s.settingsOpen);

  useEffect(() => { setVolumes(settings); }, [settings]);

  return (
    <div className="relative h-full w-full select-none">
      <AnimatePresence mode="wait">
        <motion.div key={screen} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            {screen === 'home' && <HomeScreen />}
            {screen === 'setup' && <PlayerSetup />}
            {screen === 'briefing' && <Briefing />}
            {screen === 'level' && <LevelScreen />}
            {screen === 'levelClear' && <LevelClear />}
            {screen === 'report' && <ReportScreen />}
        </motion.div>
      </AnimatePresence>
      {settingsOpen && <SettingsModal />}
    </div>
  );
}
